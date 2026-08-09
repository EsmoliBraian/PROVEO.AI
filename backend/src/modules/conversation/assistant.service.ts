import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { getCatalog } from "../orders/orders.service.js";
import * as ordersService from "../orders/orders.service.js";
import type { DraftOrderItem } from "../orders/orders.service.js";

// Sonnet: este motor necesita manejar tono, ambigüedad y contexto
// multi-mensaje mucho mejor que Haiku (que sí alcanza para el parser viejo
// de un solo mensaje en orderInterpreter.ts) — decidido con el usuario
// 2026-08-10 tras revisar la spec de la IA conversacional.
const MODEL = "claude-sonnet-5";
const HISTORY_LIMIT = 12;

interface AssistantResult {
  intent: string;
  replyText: string;
  items: DraftOrderItem[];
  readyToConfirm: boolean;
  confirmed: boolean;
  confidence: number;
}

const ASSISTANT_TOOL: Anthropic.Tool = {
  name: "respond_to_customer",
  description: "Registra la interpretación interna del mensaje y la respuesta a enviarle al cliente.",
  input_schema: {
    type: "object",
    properties: {
      intent: {
        type: "string",
        description:
          "Intención detectada (uso interno, nunca se le muestra al cliente): saludo, consulta_catalogo, consulta_precio, consulta_horario, consulta_zona, consulta_envio, consulta_pago, consulta_pedido, armar_pedido, modificar_pedido, cancelar_pedido, confirmar_pedido, agradecimiento, conversacion_casual, reclamo, otro.",
      },
      replyText: {
        type: "string",
        description:
          "ÚNICA respuesta que el cliente va a recibir por WhatsApp. Natural, breve, amable. Nunca una descripción técnica de la intención ni razonamiento interno.",
      },
      items: {
        type: "array",
        description:
          "Estado COMPLETO y actualizado del carrito en construcción (no un delta) — incluye lo que ya se había armado en mensajes anteriores más los cambios de este mensaje. Vacío si todavía no hay ningún ítem o si el mensaje no es sobre un pedido.",
        items: {
          type: "object",
          properties: {
            productId: { type: ["string", "null"] },
            rawFragment: { type: "string" },
            quantity: { type: "integer", minimum: 1 },
            matched: { type: "boolean" },
          },
          required: ["productId", "rawFragment", "quantity", "matched"],
        },
      },
      readyToConfirm: {
        type: "boolean",
        description: "true si ya se le mostró al cliente el resumen del pedido y se le preguntó si confirma.",
      },
      confirmed: {
        type: "boolean",
        description:
          "true SOLO en el mensaje donde el cliente confirma explícitamente (ej. 'sí', 'dale', 'confirmo') un resumen que ya se le mostró. Nunca true de entrada.",
      },
      confidence: { type: "number", minimum: 0, maximum: 1 },
    },
    required: ["intent", "replyText", "items", "readyToConfirm", "confirmed", "confidence"],
  },
};

function buildSystemPrompt(
  catalog: { productId: string; name: string; aliases: string[] }[],
  tenant: {
    businessHours: string | null;
    deliveryZone: string | null;
    deliveryCost: unknown;
    paymentMethodsInfo: string | null;
  },
  draftItems: DraftOrderItem[],
): string {
  const catalogText = catalog.length
    ? catalog
        .map((p) => `- ${p.name} (id: ${p.productId})${p.aliases.length ? `, también conocido como: ${p.aliases.join(", ")}` : ""}`)
        .join("\n")
    : "(el distribuidor todavía no cargó productos)";

  const configLines = [
    tenant.businessHours ? `Horario de atención: ${tenant.businessHours}` : null,
    tenant.deliveryZone ? `Zona de entrega: ${tenant.deliveryZone}` : null,
    tenant.deliveryCost != null ? `Costo de envío: $${tenant.deliveryCost}` : null,
    tenant.paymentMethodsInfo ? `Métodos de pago: ${tenant.paymentMethodsInfo}` : null,
  ].filter(Boolean);

  const draftText = draftItems.length
    ? draftItems.map((i) => `- ${i.quantity} x ${i.rawFragment}`).join("\n")
    : "(vacío todavía)";

  return `Sos el asistente comercial por WhatsApp de un distribuidor mayorista. Hablás español rioplatense, argentino pero sin exagerar modismos. Sos amable, claro, breve, resolutivo y profesional — nunca robótico. No repetís preguntas que el cliente ya contestó, no pedís información que ya tenés, no decís "no entendí" cuando podés inferir el contexto de la conversación. No inventás nada: si hay ambigüedad real, preguntás.

Catálogo de productos:
${catalogText}

Datos reales del negocio (usalos para responder consultas — si algo no está acá, decí literalmente "No tengo esa información configurada todavía. Te puedo derivar con un operador." en vez de inventar):
${configLines.length ? configLines.join("\n") : "(nada configurado todavía)"}

Carrito en construcción de esta conversación:
${draftText}

Reglas centrales:
- Una consulta (¿qué tienen?, ¿cuánto sale?, ¿hacen envíos?, ¿hasta qué hora?, etc.) NO es un pedido — respondé la consulta con los datos de arriba y NO toques el carrito ni pidas confirmación.
- Un pedido se arma de a poco en varios mensajes. Si el cliente dice solo "hielo" sin cantidad ni presentación, preguntá qué presentación y cuántas unidades — no asumas.
- Si el cliente corrige ("mejor 6", "agregame 2 más", "sacá las de 10kg"), actualizá el ítem correspondiente del carrito en vez de tratarlo como un pedido nuevo.
- Antes de confirmar cualquier pedido, mostrá un resumen claro (items + cantidades) y preguntá "¿confirmamos?". Marcá "confirmed" en true únicamente en el mensaje donde el cliente responde que sí a ESE resumen.
- "confirmed" nunca puede ser true si "items" está vacío.
- Nunca inventes un productId que no esté en el catálogo de arriba. Si un fragmento no corresponde a ningún producto, incluilo igual en "items" con productId null y matched false (para que un humano lo revise), pero antes intentá aclarar con el cliente de qué se trata.
- "replyText" es lo ÚNICO que el cliente va a leer — nunca puede sonar como una clasificación interna (ej. "el usuario preguntó..."). Escribilo como si se lo estuvieras escribiendo vos mismo por WhatsApp.`;
}

async function getConversationContext(tenantId: string, customerPhone: string) {
  const conversation = await prisma.conversation.upsert({
    where: { tenantId_customerPhone: { tenantId, customerPhone } },
    update: {},
    create: { tenantId, customerPhone },
  });
  return conversation;
}

/** Colapsa mensajes consecutivos del mismo rol — Claude exige turnos alternados
 * y en teoría no debería pasar, pero es barato blindarlo. */
function toClaudeMessages(history: { role: string; content: string }[]): Anthropic.MessageParam[] {
  const merged: Anthropic.MessageParam[] = [];
  for (const m of history) {
    const role = m.role === "assistant" ? "assistant" : "user";
    const last = merged[merged.length - 1];
    if (last && last.role === role) {
      last.content = `${last.content}\n${m.content}`;
    } else {
      merged.push({ role, content: m.content });
    }
  }
  return merged;
}

export async function handleIncomingMessage(input: {
  tenantId: string;
  customerPhone: string;
  messageText: string;
  receivedAt: Date;
}): Promise<{ replyText: string }> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new HttpError(503, "El asistente de IA no está configurado (falta ANTHROPIC_API_KEY)");
  }

  const [conversation, catalog, tenant] = await Promise.all([
    getConversationContext(input.tenantId, input.customerPhone),
    getCatalog(input.tenantId),
    prisma.tenant.findUniqueOrThrow({
      where: { id: input.tenantId },
      select: { businessHours: true, deliveryZone: true, deliveryCost: true, paymentMethodsInfo: true },
    }),
  ]);

  await prisma.conversationMessage.create({
    data: { conversationId: conversation.id, role: "customer", content: input.messageText },
  });

  const recentMessages = await prisma.conversationMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
    select: { role: true, content: true },
  });
  const history = recentMessages.reverse();

  const currentDraft = (conversation.draftItems as unknown as DraftOrderItem[] | null) ?? [];

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(catalog, tenant, currentDraft),
    tools: [ASSISTANT_TOOL],
    tool_choice: { type: "tool", name: ASSISTANT_TOOL.name },
    messages: toClaudeMessages(history),
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) throw new HttpError(502, "El asistente de IA no devolvió una respuesta interpretable");

  const result = toolUse.input as AssistantResult;

  if (result.confirmed && result.items.length > 0) {
    const order = await ordersService.createOrderFromDraft({
      tenantId: input.tenantId,
      customerPhone: input.customerPhone,
      rawMessage: history.map((m) => `${m.role === "customer" ? "Cliente" : "Bot"}: ${m.content}`).join("\n"),
      receivedAt: input.receivedAt,
      items: result.items,
      confidence: result.confidence,
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { draftItems: Prisma.JsonNull, linkedOrderId: order.id, lastIntent: result.intent, lastConfidence: result.confidence },
    });
  } else {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        draftItems: result.items as unknown as Prisma.InputJsonValue,
        lastIntent: result.intent,
        lastConfidence: result.confidence,
      },
    });
  }

  await prisma.conversationMessage.create({
    data: { conversationId: conversation.id, role: "assistant", content: result.replyText },
  });

  return { replyText: result.replyText };
}
