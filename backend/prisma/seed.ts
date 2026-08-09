import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  await prisma.user.upsert({
    where: { email: "admin@proveo.ai" },
    update: {},
    create: {
      role: "SUPER_ADMIN",
      name: "Braian (PROVEO.AI)",
      email: "admin@proveo.ai",
      passwordHash,
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: { id: "demo-tenant" },
    update: {},
    create: {
      id: "demo-tenant",
      name: "Distribuidora Demo",
      subscriptionStatus: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "dueno@demo.proveo.ai" },
    update: {},
    create: {
      tenantId: tenant.id,
      role: "TENANT_ADMIN",
      name: "Dueño Demo",
      email: "dueno@demo.proveo.ai",
      passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { phone: "5491100000000" },
    update: {},
    create: {
      tenantId: tenant.id,
      role: "REPARTIDOR",
      name: "Repartidor Demo",
      phone: "5491100000000",
      passwordHash,
    },
  });

  const hielo = await prisma.product.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "Bolsa de hielo 3kg" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Bolsa de hielo 3kg",
      price: 1500,
      aliases: {
        create: [
          { tenantId: tenant.id, alias: "bolsita" },
          { tenantId: tenant.id, alias: "bolsa" },
        ],
      },
    },
  });

  console.log("Seed listo:");
  console.log("  Super admin: admin@proveo.ai / demo1234");
  console.log("  Tenant admin (Distribuidora Demo): dueno@demo.proveo.ai / demo1234");
  console.log("  Repartidor (Distribuidora Demo): 5491100000000 / demo1234");
  console.log(`  Producto de ejemplo: ${hielo.name}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
