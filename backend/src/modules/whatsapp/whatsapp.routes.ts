import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { decryptSecret } from "../../lib/crypto.js";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import * as ordersService from "../orders/orders.service.js";
import { sendWhatsAppMessage, toWhatsAppRecipient } from "./whatsappClient.js";

export const whatsappRouter = Router();

/** Meta llama esto una vez al configurar el webhook, para confirmar que somos dueños de la URL. */
whatsappRouter.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN && env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
    return;
  }
  res.sendStatus(403);
});

/**
 * Un único endpoint recibe los mensajes de TODOS los tenants — Meta manda
 * `phone_number_id` en el payload, que es la clave para resolver a qué
 * tenant pertenece (ver Tenant.whatsappPhoneNumberId). Siempre respondemos
 * 200 aunque no reconozcamos el remitente, para que Meta no reintente.
 */
whatsappRouter.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const phoneNumberId = req.body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;

    if (!message || message.type !== "text" || !phoneNumberId) {
      res.sendStatus(200);
      return;
    }

    const tenant = await prisma.tenant.findUnique({ where: { whatsappPhoneNumberId: phoneNumberId } });
    if (!tenant) {
      console.warn(`Mensaje de WhatsApp para un phone_number_id desconocido: ${phoneNumberId}`);
      res.sendStatus(200);
      return;
    }
    if (!tenant.whatsappAccessToken) {
      console.warn(`Tenant ${tenant.id} (${tenant.name}) no tiene access token de WhatsApp configurado`);
      res.sendStatus(200);
      return;
    }

    // Cualquier falla de acá en adelante (parser IA caído, token vencido, etc.)
    // se loguea pero igual respondemos 200 — Meta reintenta agresivamente un
    // webhook que no confirma recepción, y el pedido ya quedaría perdido de
    // todos modos si reintentara con el mismo mensaje.
    try {
      const { replyText } = await ordersService.createOrderFromWhatsapp({
        tenantId: tenant.id,
        customerPhone: message.from,
        rawMessage: message.text.body,
        waMessageId: message.id,
        receivedAt: new Date(Number(message.timestamp) * 1000),
      });

      await sendWhatsAppMessage(
        tenant.whatsappPhoneNumberId!,
        decryptSecret(tenant.whatsappAccessToken),
        toWhatsAppRecipient(message.from),
        replyText,
      );
    } catch (err) {
      console.error("Error al procesar un mensaje de WhatsApp:", err);
    }

    res.sendStatus(200);
  }),
);
