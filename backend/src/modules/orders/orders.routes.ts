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

ordersRouter.get(
  "/mine/summary",
  requireRole("REPARTIDOR"),
  asyncHandler(async (req, res) => {
    res.json(await ordersService.getDriverSummary(req.auth!.tenantId!, req.auth!.userId));
  }),
);

// Debe ir después de rutas literales como "/mine" — si no, "/mine" matchea acá con id="mine".
ordersRouter.get(
  "/:id",
  requireRole("TENANT_ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await ordersService.getOrderById(req.auth!.tenantId!, req.params.id));
  }),
);

const updateDetailsSchema = z.object({ paymentMethod: z.enum(["CASH", "TRANSFER", "OTHER"]).nullable() });

ordersRouter.patch(
  "/:id",
  requireRole("TENANT_ADMIN"),
  asyncHandler(async (req, res) => {
    const data = updateDetailsSchema.parse(req.body);
    res.json(await ordersService.updateOrderDetails(req.auth!.tenantId!, req.params.id, data));
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
  "/:id/en-camino",
  requireRole("TENANT_ADMIN", "REPARTIDOR"),
  asyncHandler(async (req, res) => {
    const driverId = req.auth!.role === "REPARTIDOR" ? req.auth!.userId : undefined;
    res.json(await ordersService.markEnCamino(req.auth!.tenantId!, req.params.id, driverId));
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

ordersRouter.patch(
  "/:id/cancel",
  requireRole("TENANT_ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await ordersService.cancelOrder(req.auth!.tenantId!, req.params.id));
  }),
);
