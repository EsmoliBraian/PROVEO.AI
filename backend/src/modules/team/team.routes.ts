import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { requireAuth, requireActiveTenant, requireRole } from "../../middleware/auth.js";
import * as teamService from "./team.service.js";

export const teamRouter = Router();

teamRouter.use(requireAuth, requireActiveTenant, requireRole("TENANT_ADMIN"));

teamRouter.get(
  "/drivers",
  asyncHandler(async (req, res) => {
    res.json(await teamService.listDrivers(req.auth!.tenantId!));
  }),
);

const createDriverSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  password: z.string().min(8),
});

teamRouter.post(
  "/drivers",
  asyncHandler(async (req, res) => {
    const data = createDriverSchema.parse(req.body);
    res.status(201).json(await teamService.createDriver(req.auth!.tenantId!, data));
  }),
);

const setActiveSchema = z.object({ active: z.boolean() });

teamRouter.patch(
  "/drivers/:id",
  asyncHandler(async (req, res) => {
    const { active } = setActiveSchema.parse(req.body);
    res.json(await teamService.setDriverActive(req.auth!.tenantId!, req.params.id, active));
  }),
);
