import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { hashPassword } from "../auth/auth.service.js";

const DRIVER_SELECT = { id: true, name: true, phone: true, active: true, createdAt: true } as const;

export async function listDrivers(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantId, role: "REPARTIDOR" },
    select: DRIVER_SELECT,
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
    select: DRIVER_SELECT,
  });
}

export async function setDriverActive(tenantId: string, driverId: string, active: boolean) {
  const driver = await prisma.user.findFirst({ where: { id: driverId, tenantId, role: "REPARTIDOR" } });
  if (!driver) throw new HttpError(404, "Repartidor no encontrado");

  return prisma.user.update({ where: { id: driverId }, data: { active }, select: DRIVER_SELECT });
}
