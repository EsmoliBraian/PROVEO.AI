import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { requireAuth, requireActiveTenant, requireRole } from "../../middleware/auth.js";
import * as analysisService from "./analysis.service.js";

export const analysisRouter = Router();

analysisRouter.use(requireAuth, requireActiveTenant, requireRole("TENANT_ADMIN"));

analysisRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await analysisService.getInterpretationAnalysis(req.auth!.tenantId!));
  }),
);

analysisRouter.post(
  "/suggest-aliases",
  asyncHandler(async (req, res) => {
    res.json(await analysisService.suggestAliases(req.auth!.tenantId!));
  }),
);
