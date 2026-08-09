import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { tenantsRouter } from "./modules/tenants/tenants.routes.js";
import { productsRouter } from "./modules/products/products.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";
import { teamRouter } from "./modules/team/team.routes.js";
import { whatsappRouter } from "./modules/whatsapp/whatsapp.routes.js";
import { statsRouter } from "./modules/stats/stats.routes.js";

export function createApp() {
  const app = express();

  app.use(cors({ credentials: true, origin: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/tenants", tenantsRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/team", teamRouter);
  app.use("/api/whatsapp", whatsappRouter);
  app.use("/api/stats", statsRouter);

  app.use(errorHandler);

  return app;
}
