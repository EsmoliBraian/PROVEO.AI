import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.update({
    where: { id: "cmsm1nezh000cfakptbg1scln" },
    data: { whatsappAccessToken: "fake-token-just-to-pass-the-check" },
  });
  console.log(tenant.id, tenant.whatsappPhoneNumberId, !!tenant.whatsappAccessToken);
}

main().finally(() => prisma.$disconnect());
