import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errorHandler.js";

export async function listProducts(tenantId: string) {
  return prisma.product.findMany({
    where: { tenantId },
    include: { aliases: true },
    orderBy: { name: "asc" },
  });
}

export async function createProduct(
  tenantId: string,
  input: { name: string; price: number; aliases: string[] },
) {
  return prisma.product.create({
    data: {
      tenantId,
      name: input.name,
      price: input.price,
      aliases: {
        create: input.aliases.map((alias) => ({ alias, tenantId })),
      },
    },
    include: { aliases: true },
  });
}

export async function updateProduct(
  tenantId: string,
  productId: string,
  input: { name?: string; price?: number; active?: boolean },
) {
  const existing = await prisma.product.findFirst({ where: { id: productId, tenantId } });
  if (!existing) throw new HttpError(404, "Producto no encontrado");

  return prisma.product.update({ where: { id: productId }, data: input });
}

/** Usado desde Análisis IA para aceptar una sugerencia de sinónimo. */
export async function addAlias(tenantId: string, productId: string, alias: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, tenantId } });
  if (!product) throw new HttpError(404, "Producto no encontrado");

  return prisma.productAlias.create({ data: { tenantId, productId, alias } });
}
