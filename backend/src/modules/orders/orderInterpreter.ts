import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env.js";
import { HttpError } from "../../middleware/errorHandler.js";

// Haiku es suficiente para esta tarea de extracción estructurada y sale
// mucho más barato que Sonnet/Opus a volumen (varios tenants, varios
// pedidos/día) — ver riesgo de costo anotado en el plan de arquitectura.
const MODEL = "claude-haiku-4-5-20251001";

export interface CatalogEntry {
  productId: string;
  name: string;
  aliases: string[];
}

export interface InterpretedItem {
  productId: string | null;
  rawFragment: string;
  quantity: number;
  matched: boolean;
}

export interface InterpretResult {
  items: InterpretedItem[];
  /** Confianza global [0,1] de haber interpretado bien todo el mensaje. */
  confidence: number;
  /** Frase corta en español si hay ambigüedad real a resolver con el cliente; null si no. */
  clarificationNeeded: string | null;
}

const RECORD_ORDER_TOOL: Anthropic.Tool = {
  name: "record_order_items",
  description: "Registra los ítems interpretados de un pedido de WhatsApp de un distribuidor mayorista.",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            productId: {
              type: ["string", "null"],
              description: "id del producto del catálogo, o null si no matchea con ninguno",
            },
            rawFragment: { type: "string", description: "el fragmento original del mensaje" },
            quantity: { type: "integer", minimum: 1 },
            matched: { type: "boolean" },
          },
          required: ["productId", "rawFragment", "quantity", "matched"],
        },
      },
      confidence: { type: "number", minimum: 0, maximum: 1 },
      clarificationNeeded: { type: ["string", "null"] },
    },
    required: ["items", "confidence", "clarificationNeeded"],
  },
};

function buildSystemPrompt(catalog: CatalogEntry[]): string {
  const catalogText = catalog.length
    ? catalog
        .map((p) => `- ${p.name} (id: ${p.productId})${p.aliases.length ? `, también conocido como: ${p.aliases.join(", ")}` : ""}`)
        .join("\n")
    : "(el distribuidor todavía no cargó productos)";

  return `Sos el asistente de un distribuidor mayorista que interpreta pedidos que le llegan por WhatsApp en español rioplatense, a veces con errores de tipeo o abreviaturas.

Catálogo de productos de este distribuidor:
${catalogText}

Reglas:
- Nunca inventes un productId que no esté literalmente en el catálogo de arriba.
- Si un fragmento del mensaje no corresponde a ningún producto del catálogo, igual devolvelo como un ítem con productId null y matched false — nunca lo descartes en silencio, así un humano lo puede revisar después.
- Si no se menciona cantidad para un ítem, asumí 1.
- Un mismo mensaje puede pedir varios productos distintos.
- confidence es tu confianza global (0 a 1) de haber interpretado bien el mensaje completo.
- clarificationNeeded: si hay ambigüedad real que amerite preguntarle algo al cliente (ej. "bolsa" podría ser dos productos distintos), describilo en una frase corta en español; si no hay ambigüedad, null.

Llamá siempre a la herramienta record_order_items con el resultado.`;
}

export async function interpretOrderMessage(
  message: string,
  catalog: CatalogEntry[],
): Promise<InterpretResult> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new HttpError(503, "El parser de IA no está configurado (falta ANTHROPIC_API_KEY)");
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(catalog),
    tools: [RECORD_ORDER_TOOL],
    tool_choice: { type: "tool", name: RECORD_ORDER_TOOL.name },
    messages: [{ role: "user", content: message }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new HttpError(502, "El parser de IA no devolvió una respuesta interpretable");
  }

  return toolUse.input as InterpretResult;
}
