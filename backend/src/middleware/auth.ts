import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { SESSION_COOKIE, verifyAuthToken, type AuthTokenPayload } from "../lib/jwt.js";
import { HttpError } from "./errorHandler.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

/** Requires a valid session cookie; attaches { userId, tenantId, role } to req.auth. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[SESSION_COOKIE];
  const payload = typeof token === "string" ? verifyAuthToken(token) : null;
  if (!payload) throw new HttpError(401, "No autenticado");
  req.auth = payload;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      throw new HttpError(403, "No autorizado");
    }
    next();
  };
}

/**
 * Blocks TENANT_ADMIN/REPARTIDOR access once a tenant's subscription isn't
 * ACTIVE — the owner tracks payment manually and flips this from the
 * super-admin panel. SUPER_ADMIN always bypasses this check.
 */
export async function requireActiveTenant(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.auth) throw new HttpError(401, "No autenticado");
  if (req.auth.role === "SUPER_ADMIN") return next();
  if (!req.auth.tenantId) throw new HttpError(403, "No autorizado");

  const tenant = await prisma.tenant.findUnique({ where: { id: req.auth.tenantId } });
  if (!tenant || tenant.subscriptionStatus !== "ACTIVE") {
    throw new HttpError(402, "Suscripción no activa");
  }
  next();
}
