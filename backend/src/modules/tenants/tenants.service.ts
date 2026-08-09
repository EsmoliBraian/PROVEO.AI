import { prisma } from "../../lib/prisma.js";
import { hashPassword } from "../auth/auth.service.js";
import { encryptSecret } from "../../lib/crypto.js";
import { subscribeAppToWaba } from "../whatsapp/whatsappClient.js";
import type { SubscriptionStatus } from "@prisma/client";

export async function listTenants() {
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, orders: true } } },
  });
}

/** Alta de un tenant nuevo + su primer usuario TENANT_ADMIN. */
export async function createTenant(input: {
  name: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}) {
  const passwordHash = await hashPassword(input.adminPassword);

  return prisma.tenant.create({
    data: {
      name: input.name,
      users: {
        create: {
          role: "TENANT_ADMIN",
          name: input.adminName,
          email: input.adminEmail,
          passwordHash,
        },
      },
    },
    include: { users: true },
  });
}

export async function updateSubscriptionStatus(tenantId: string, status: SubscriptionStatus) {
  return prisma.tenant.update({ where: { id: tenantId }, data: { subscriptionStatus: status } });
}

/**
 * Carga las credenciales de WhatsApp Cloud API de este tenant (número de
 * prueba de Meta en Fase 1, número real vía Embedded Signup en Fase 3) y
 * suscribe la app al webhook de esa WABA — sin esto último Meta jamás
 * entrega los mensajes aunque el resto esté bien configurado.
 */
export async function setWhatsappCredentials(
  tenantId: string,
  input: { phoneNumberId: string; wabaId: string; accessToken: string },
) {
  await subscribeAppToWaba(input.wabaId, input.accessToken);

  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      whatsappPhoneNumberId: input.phoneNumberId,
      whatsappWabaId: input.wabaId,
      whatsappAccessToken: encryptSecret(input.accessToken),
    },
  });
}
