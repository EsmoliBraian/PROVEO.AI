import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { requireAuth, requireActiveTenant, requireRole } from "../../middleware/auth.js";
import * as settingsService from "./settings.service.js";

export const settingsRouter = Router();

settingsRouter.use(requireAuth, requireActiveTenant, requireRole("TENANT_ADMIN"));

settingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await settingsService.getBusinessSettings(req.auth!.tenantId!));
  }),
);

const updateSchema = z.object({
  businessHours: z.string().nullable().optional(),
  deliveryZone: z.string().nullable().optional(),
  deliveryCost: z.number().nullable().optional(),
  paymentMethodsInfo: z.string().nullable().optional(),
});

settingsRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    res.json(await settingsService.updateBusinessSettings(req.auth!.tenantId!, data));
  }),
);
