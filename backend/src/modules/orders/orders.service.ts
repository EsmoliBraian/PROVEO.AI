import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { interpretOrderMessage, type CatalogEntry } from "./orderInterpreter.js";

async function getCatalog(tenantId: string): Promise<CatalogEntry[]> {
  const products = await prisma.product.findMany({
    where: { tenantId, active: true },
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

export async function listOrders(tenantId: string) {
  return prisma.order.findMany({
    where: { tenantId },
    include: { items: { include: { product: true } }, assignedDriver: true },
    orderBy: { receivedAt: "desc" },
  });
}

export async function listOrdersForDriver(tenantId: string, driverId: string) {
  return prisma.order.findMany({
    where: { tenantId, assignedDriverId: driverId, status: "PENDING" },
    include: { items: { include: { product: true } } },
    orderBy: { receivedAt: "asc" },
  });
}

export async function assignDriver(tenantId: string, orderId: string, driverId: string | null) {
  const order = await prisma.order.findFirst({ where: { id: orderId, tenantId } });
  if (!order) throw new HttpError(404, "Pedido no encontrado");

  if (driverId) {
    const driver = await prisma.user.findFirst({
      where: { id: driverId, tenantId, role: "REPARTIDOR" },
    });
    if (!driver) throw new HttpError(400, "Repartidor inválido");
  }

  return prisma.order.update({ where: { id: orderId }, data: { assignedDriverId: driverId } });
}

/** driverId se pasa cuando lo llama un REPARTIDOR, para no dejarlo marcar pedidos ajenos. */
export async function markDelivered(tenantId: string, orderId: string, driverId?: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, tenantId } });
  if (!order) throw new HttpError(404, "Pedido no encontrado");
  if (driverId && order.assignedDriverId !== driverId) {
    throw new HttpError(403, "Este pedido no está asignado a vos");
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: "DELIVERED", deliveredAt: new Date() },
  });
}
