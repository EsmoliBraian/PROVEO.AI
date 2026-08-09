import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { requireAuth, requireActiveTenant, requireRole } from "../../middleware/auth.js";
import * as statsService from "./stats.service.js";

export const statsRouter = Router();

statsRouter.get(
  "/",
  requireAuth,
  requireActiveTenant,
  requireRole("TENANT_ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await statsService.getTenantStats(req.auth!.tenantId!));
  }),
);
