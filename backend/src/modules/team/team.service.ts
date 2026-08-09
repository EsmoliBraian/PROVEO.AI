import { prisma } from "../../lib/prisma.js";
import { hashPassword } from "../auth/auth.service.js";

export async function listDrivers(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantId, role: "REPARTIDOR" },
    select: { id: true, name: true, phone: true, createdAt: true },
    orderBy: { name: "asc" },
  });
}

export async function createDriver(
  tenantId: string,
  input: { name: string; phone: string; password: string },
) {
  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: { tenantId, role: "REPARTIDOR", name: input.name, phone: input.phone, passwordHash },
    select: { id: true, name: true, phone: true, createdAt: true },
  });
}
