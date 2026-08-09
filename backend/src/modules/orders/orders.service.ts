import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { interpretOrderMessage, type CatalogEntry } from "./orderInterpreter.js";

/** Catálogo de productos vendibles (no pausados/sin stock) — usado tanto por
 * el parser viejo de un solo mensaje como por el motor conversacional nuevo. */
export async function getCatalog(tenantId: string): Promise<CatalogEntry[]> {
  const products = await prisma.product.findMany({
    where: { tenantId, stockStatus: "DISPONIBLE" },
    include: { aliases: true },
  });
  return products.map((p) => ({
    productId: p.id,
    name: p.name,
    aliases: p.aliases.map((a) => a.alias),
  }));
}

function buildReplyText(
  items: { rawFragment: string; quantity: number; matched: boolean; productName: string | null }[],
  clarificationNeeded: string | null,
): string {
  const matchedLines = items
    .filter((i) => i.matched)
    .map((i) => `- ${i.quantity}x ${i.productName}`);
  const unmatched = items.filter((i) => !i.matched);

  const parts: string[] = [];
  if (matchedLines.length > 0) {
    parts.push(`Pedido recibido:\n${matchedLines.join("\n")}`);
  }
  if (unmatched.length > 0) {
    parts.push(
      `No pude identificar bien: ${unmatched.map((i) => `"${i.rawFragment}"`).join(", ")} — te lo confirmamos a la brevedad.`,
    );
  }
  if (clarificationNeeded) {
    parts.push(clarificationNeeded);
  }
  if (parts.length === 0) {
    parts.push("No pude entender tu pedido, ¿lo podés reformular?");
  }

  return parts.join("\n\n");
}

export interface CreateOrderFromWhatsappInput {
  tenantId: string;
  customerPhone: string;
  rawMessage: string;
  waMessageId?: string;
  receivedAt: Date;
}

export async function createOrderFromWhatsapp(input: CreateOrderFromWhatsappInput) {
  const catalog = await getCatalog(input.tenantId);
  const interpretation = await interpretOrderMessage(input.rawMessage, catalog);

  const catalogById = new Map(catalog.map((c) => [c.productId, c]));

  const order = await prisma.order.create({
    data: {
      tenantId: input.tenantId,
      customerPhone: input.customerPhone,
      rawMessage: input.rawMessage,
      receivedAt: input.receivedAt,
      aiConfidence: interpretation.confidence,
      items: {
        create: interpretation.items.map((item) => ({
          productId: item.productId,
          rawFragment: item.rawFragment,
          quantity: item.quantity,
          matched: item.matched,
        })),
      },
    },
    include: { items: true },
  });

  const replyText = buildReplyText(
    interpretation.items.map((i) => ({
      ...i,
      productName: i.productId ? (catalogById.get(i.productId)?.name ?? null) : null,
    })),
    interpretation.clarificationNeeded,
  );

  return { order, replyText };
}

export interface DraftOrderItem {
  productId: string | null;
  rawFragment: string;
  quantity: number;
  matched: boolean;
}

/** Crea el Order definitivo recién cuando el cliente confirmó explícitamente
 * el carrito armado en la conversación — nunca antes. Baja confianza entra
 * directo en REQUIERE_REVISION en vez de NUEVO. */
export async function createOrderFromDraft(input: {
  tenantId: string;
  customerPhone: string;
  rawMessage: string;
  receivedAt: Date;
  items: DraftOrderItem[];
  confidence: number;
}) {
  const lowConfidence = input.confidence < 0.7 || input.items.some((i) => !i.matched);

  return prisma.order.create({
    data: {
      tenantId: input.tenantId,
      customerPhone: input.customerPhone,
      rawMessage: input.rawMessage,
      receivedAt: input.receivedAt,
      aiConfidence: input.confidence,
      status: lowConfidence ? "REQUIERE_REVISION" : "NUEVO",
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          rawFragment: item.rawFragment,
          quantity: item.quantity,
          matched: item.matched,
        })),
      },
    },
    include: { items: true },
  });
}

export async function listOrders(tenantId: string) {
  return prisma.order.findMany({
    where: { tenantId },
    include: { items: { include: { product: true } }, assignedDriver: true },
    orderBy: { receivedAt: "desc" },
  });
}

export async function getOrderById(tenantId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: {
      items: { include: { product: true } },
      assignedDriver: true,
      conversation: { include: { messages: { orderBy: { createdAt: "asc" } } } },
    },
  });
  if (!order) throw new HttpError(404, "Pedido no encontrado");
  return order;
}

/** Pedidos activos (no entregados/cancelados) asignados a este repartidor. */
export async function listOrdersForDriver(tenantId: string, driverId: string) {
  return prisma.order.findMany({
    where: { tenantId, assignedDriverId: driverId, status: { in: ["EN_PROCESO", "EN_CAMINO"] } },
    include: { items: { include: { product: true } } },
    orderBy: { receivedAt: "asc" },
  });
}

export async function getDriverSummary(tenantId: string, driverId: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const [deliveredToday, deliveredThisWeek] = await Promise.all([
    prisma.order.count({
      where: { tenantId, assignedDriverId: driverId, status: "ENTREGADO", deliveredAt: { gte: startOfToday } },
    }),
    prisma.order.count({
      where: { tenantId, assignedDriverId: driverId, status: "ENTREGADO", deliveredAt: { gte: startOfWeek } },
    }),
  ]);

  return { deliveredToday, deliveredThisWeek };
}

export async function updateOrderDetails(
  tenantId: string,
  orderId: string,
  input: { paymentMethod: "CASH" | "TRANSFER" | "OTHER" | null },
) {
  const order = await prisma.order.findFirst({ where: { id: orderId, tenantId } });
  if (!order) throw new HttpError(404, "Pedido no encontrado");

  return prisma.order.update({ where: { id: orderId }, data: input });
}

const TERMINAL_STATUSES = ["ENTREGADO", "CANCELADO"] as const;

async function getActiveOrder(tenantId: string, orderId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, tenantId } });
  if (!order) throw new HttpError(404, "Pedido no encontrado");
  if (TERMINAL_STATUSES.includes(order.status as (typeof TERMINAL_STATUSES)[number])) {
    throw new HttpError(400, `El pedido ya está en estado ${order.status}`);
  }
  return order;
}

/** NUEVO → EN_PROCESO al asignar un repartidor (o vuelve a NUEVO si se desasigna). */
export async function assignDriver(tenantId: string, orderId: string, driverId: string | null) {
  const order = await getActiveOrder(tenantId, orderId);

  if (driverId) {
    const driver = await prisma.user.findFirst({
      where: { id: driverId, tenantId, role: "REPARTIDOR", active: true },
    });
    if (!driver) throw new HttpError(400, "Repartidor inválido");
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      assignedDriverId: driverId,
      status: driverId ? "EN_PROCESO" : order.status === "EN_PROCESO" ? "NUEVO" : order.status,
    },
  });
}

/** EN_PROCESO → EN_CAMINO — el repartidor salió a entregar. */
export async function markEnCamino(tenantId: string, orderId: string, driverId?: string) {
  const order = await getActiveOrder(tenantId, orderId);
  if (driverId && order.assignedDriverId !== driverId) {
    throw new HttpError(403, "Este pedido no está asignado a vos");
  }
  if (!order.assignedDriverId) {
    throw new HttpError(400, "El pedido todavía no tiene un repartidor asignado");
  }

  return prisma.order.update({ where: { id: orderId }, data: { status: "EN_CAMINO" } });
}

/** driverId se pasa cuando lo llama un REPARTIDOR, para no dejarlo marcar pedidos ajenos. */
export async function markDelivered(tenantId: string, orderId: string, driverId?: string) {
  const order = await getActiveOrder(tenantId, orderId);
  if (driverId && order.assignedDriverId !== driverId) {
    throw new HttpError(403, "Este pedido no está asignado a vos");
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: "ENTREGADO", deliveredAt: new Date() },
  });
}

export async function cancelOrder(tenantId: string, orderId: string) {
  await getActiveOrder(tenantId, orderId);

  return prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELADO", cancelledAt: new Date() },
  });
}
