import { prisma } from "../../lib/prisma.js";
import type { OrderStatus } from "@prisma/client";

const ALL_STATUSES: OrderStatus[] = ["NUEVO", "EN_PROCESO", "EN_CAMINO", "ENTREGADO", "CANCELADO"];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getTenantStats(tenantId: string) {
  const [totalOrders, statusGroups] = await Promise.all([
    prisma.order.count({ where: { tenantId } }),
    prisma.order.groupBy({ by: ["status"], where: { tenantId }, _count: { _all: true } }),
  ]);

  const countByStatus = new Map(statusGroups.map((g) => [g.status, g._count._all]));
  const statusCounts = Object.fromEntries(
    ALL_STATUSES.map((s) => [s, countByStatus.get(s) ?? 0]),
  ) as Record<OrderStatus, number>;

  // Ingreso estimado al precio ACTUAL del producto (no hay snapshot de precio
  // por pedido en este schema) — suficiente para una primera vista, se puede
  // revisar si en algún momento hace falta precisión histórica exacta.
  const deliveredItems = await prisma.orderItem.findMany({
    where: { order: { tenantId, status: "ENTREGADO" }, matched: true, productId: { not: null } },
    include: { product: true, order: { select: { deliveredAt: true } } },
  });

  const today = startOfDay(new Date());
  let estimatedRevenue = 0;
  let todayRevenue = 0;
  const byProduct = new Map<string, { productName: string; quantity: number; revenue: number }>();
  for (const item of deliveredItems) {
    if (!item.product) continue;
    const lineRevenue = item.quantity * Number(item.product.price);
    estimatedRevenue += lineRevenue;
    if (item.order.deliveredAt && item.order.deliveredAt >= today) {
      todayRevenue += lineRevenue;
    }

    const entry = byProduct.get(item.productId!) ?? {
      productName: item.product.name,
      quantity: 0,
      revenue: 0,
    };
    entry.quantity += item.quantity;
    entry.revenue += lineRevenue;
    byProduct.set(item.productId!, entry);
  }
  const topProducts = [...byProduct.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 8);

  const driverGroups = await prisma.order.groupBy({
    by: ["assignedDriverId"],
    where: { tenantId, status: "ENTREGADO", assignedDriverId: { not: null } },
    _count: { _all: true },
  });
  const drivers = await prisma.user.findMany({
    where: { id: { in: driverGroups.map((g) => g.assignedDriverId!) } },
    select: { id: true, name: true },
  });
  const driverNameById = new Map(drivers.map((d) => [d.id, d.name]));
  const deliveriesByDriver = driverGroups
    .map((g) => ({
      driverName: driverNameById.get(g.assignedDriverId!) ?? "Desconocido",
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const [todayOrders, todayDelivered] = await Promise.all([
    prisma.order.count({ where: { tenantId, receivedAt: { gte: today } } }),
    prisma.order.count({ where: { tenantId, status: "ENTREGADO", deliveredAt: { gte: today } } }),
  ]);

  // Series simples para los gráficos del dashboard — se agregan en memoria
  // en vez de SQL crudo porque el volumen esperado por tenant es chico.
  const allReceivedAt = await prisma.order.findMany({
    where: { tenantId },
    select: { receivedAt: true },
  });

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const ordersByDay = last7Days.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const count = allReceivedAt.filter((o) => o.receivedAt >= day && o.receivedAt < next).length;
    return { date: day.toISOString().slice(0, 10), count };
  });

  const hourCounts = new Array(24).fill(0);
  for (const o of allReceivedAt) hourCounts[o.receivedAt.getHours()]++;
  const ordersByHour = hourCounts.map((count, hour) => ({ hour, count }));

  return {
    totalOrders,
    statusCounts,
    today: { orders: todayOrders, delivered: todayDelivered, revenue: todayRevenue },
    estimatedRevenue,
    topProducts,
    deliveriesByDriver,
    ordersByDay,
    ordersByHour,
  };
}
