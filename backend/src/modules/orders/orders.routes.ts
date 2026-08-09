import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { requireAuth, requireActiveTenant, requireRole } from "../../middleware/auth.js";
import * as ordersService from "./orders.service.js";

export const ordersRouter = Router();

ordersRouter.use(requireAuth, requireActiveTenant);

ordersRouter.get(
  "/",
  requireRole("TENANT_ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await ordersService.listOrders(req.auth!.tenantId!));
  }),
);

ordersRouter.get(
  "/mine",
  requireRole("REPARTIDOR"),
  asyncHandler(async (req, res) => {
    res.json(await ordersService.listOrdersForDriver(req.auth!.tenantId!, req.auth!.userId));
  }),
);

const assignSchema = z.object({ driverId: z.string().nullable() });

ordersRouter.patch(
  "/:id/assign",
  requireRole("TENANT_ADMIN"),
  asyncHandler(async (req, res) => {
    const { driverId } = assignSchema.parse(req.body);
    res.json(await ordersService.assignDriver(req.auth!.tenantId!, req.params.id, driverId));
  }),
);

ordersRouter.patch(
  "/:id/deliver",
  requireRole("TENANT_ADMIN", "REPARTIDOR"),
  asyncHandler(async (req, res) => {
    const driverId = req.auth!.role === "REPARTIDOR" ? req.auth!.userId : undefined;
    res.json(await ordersService.markDelivered(req.auth!.tenantId!, req.params.id, driverId));
  }),
);
