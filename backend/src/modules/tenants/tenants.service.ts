import { prisma } from "../../lib/prisma.js";
import { hashPassword } from "../auth/auth.service.js";
import type { SubscriptionStatus } from "@prisma/client";

export async function listTenants() {
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, orders: true } } },
  });
}

/** Alta de un tenant nuevo + su primer usuario TENANT_ADMIN. */
export async function createTenant(input: {
  name: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}) {
  const passwordHash = await hashPassword(input.adminPassword);

  return prisma.tenant.create({
    data: {
      name: input.name,
      users: {
        create: {
          role: "TENANT_ADMIN",
          name: input.adminName,
          email: input.adminEmail,
          passwordHash,
        },
      },
    },
    include: { users: true },
  });
}

export async function updateSubscriptionStatus(tenantId: string, status: SubscriptionStatus) {
  return prisma.tenant.update({ where: { id: tenantId }, data: { subscriptionStatus: status } });
}
