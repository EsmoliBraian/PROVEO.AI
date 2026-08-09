import { prisma } from "../../lib/prisma.js";

export async function getBusinessSettings(tenantId: string) {
  return prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { businessHours: true, deliveryZone: true, deliveryCost: true, paymentMethodsInfo: true },
  });
}

export async function updateBusinessSettings(
  tenantId: string,
  input: {
    businessHours?: string | null;
    deliveryZone?: string | null;
    deliveryCost?: number | null;
    paymentMethodsInfo?: string | null;
  },
) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: input,
    select: { businessHours: true, deliveryZone: true, deliveryCost: true, paymentMethodsInfo: true },
  });
}
