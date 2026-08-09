import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as tenantsService from "./tenants.service.js";

export const tenantsRouter = Router();

// Todo lo que sigue es solo para el super-admin (el operador de PROVEO.AI).
tenantsRouter.use(requireAuth, requireRole("SUPER_ADMIN"));

tenantsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await tenantsService.listTenants());
  }),
);

const createTenantSchema = z.object({
  name: z.string().min(1),
  adminEmail: z.string().email(),
  adminName: z.string().min(1),
  adminPassword: z.string().min(8),
});

tenantsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createTenantSchema.parse(req.body);
    res.status(201).json(await tenantsService.createTenant(data));
  }),
);

const subscriptionSchema = z.object({
  status: z.enum(["ACTIVE", "OVERDUE", "SUSPENDED"]),
});

tenantsRouter.patch(
  "/:id/subscription",
  asyncHandler(async (req, res) => {
    const { status } = subscriptionSchema.parse(req.body);
    res.json(await tenantsService.updateSubscriptionStatus(req.params.id, status));
  }),
);
