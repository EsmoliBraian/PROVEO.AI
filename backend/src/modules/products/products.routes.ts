import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { requireAuth, requireActiveTenant, requireRole } from "../../middleware/auth.js";
import * as productsService from "./products.service.js";

export const productsRouter = Router();

productsRouter.use(requireAuth, requireActiveTenant, requireRole("TENANT_ADMIN"));

productsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await productsService.listProducts(req.auth!.tenantId!));
  }),
);

const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  aliases: z.array(z.string().min(1)).default([]),
});

productsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createProductSchema.parse(req.body);
    res.status(201).json(await productsService.createProduct(req.auth!.tenantId!, data));
  }),
);

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  active: z.boolean().optional(),
});

productsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateProductSchema.parse(req.body);
    res.json(await productsService.updateProduct(req.auth!.tenantId!, req.params.id, data));
  }),
);
