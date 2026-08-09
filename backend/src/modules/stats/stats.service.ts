import { prisma } from "../../lib/prisma.js";

export async function getTenantStats(tenantId: string) {
  const [totalOrders, deliveredOrders, pendingOrders, cancelledOrders] = await Promise.all([
    prisma.order.count({ where: { tenantId } }),
    prisma.order.count({ where: { tenantId, status: "DELIVERED" } }),
    prisma.order.count({ where: { tenantId, status: "PENDING" } }),
    prisma.order.count({ where: { tenantId, status: "CANCELLED" } }),
  ]);

  // Ingreso estimado al precio ACTUAL del producto (no hay snapshot de precio
  // por pedido en este schema) — suficiente para una primera vista, se puede
  // revisar si en algún momento hace falta precisión histórica exacta.
  const deliveredItems = await prisma.orderItem.findMany({
    where: { order: { tenantId, status: "DELIVERED" }, matched: true, productId: { not: null } },
    include: { product: true },
  });

  let estimatedRevenue = 0;
  const byProduct = new Map<string, { productName: string; quantity: number; revenue: number }>();
  for (const item of deliveredItems) {
    if (!item.product) continue;
    const lineRevenue = item.quantity * Number(item.product.price);
    estimatedRevenue += lineRevenue;

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
    where: { tenantId, status: "DELIVERED", assignedDriverId: { not: null } },
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

  return {
    totalOrders,
    deliveredOrders,
    pendingOrders,
    cancelledOrders,
    estimatedRevenue,
    topProducts,
    deliveriesByDriver,
  };
}
