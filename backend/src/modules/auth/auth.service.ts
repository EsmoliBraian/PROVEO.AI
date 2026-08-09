import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { signAuthToken } from "../../lib/jwt.js";

/** Login por email (TENANT_ADMIN/SUPER_ADMIN) o celular (REPARTIDOR). */
export async function login(identifier: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] },
  });
  if (!user) throw new HttpError(401, "Credenciales inválidas");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new HttpError(401, "Credenciales inválidas");

  const token = signAuthToken({ userId: user.id, tenantId: user.tenantId, role: user.role });
  return {
    token,
    user: { id: user.id, name: user.name, role: user.role, tenantId: user.tenantId },
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: true },
  });
  if (!user) throw new HttpError(401, "No autenticado");
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    tenantName: user.tenant?.name ?? null,
    subscriptionStatus: user.tenant?.subscriptionStatus ?? null,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
