import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { HttpError } from "../../middleware/errorHandler.js";

const HIGH_CONFIDENCE = 0.9;
const MEDIUM_CONFIDENCE = 0.7;

export async function getInterpretationAnalysis(tenantId: string) {
  const orders = await prisma.order.findMany({
    where: { tenantId, aiConfidence: { not: null } },
    select: { id: true, rawMessage: true, aiConfidence: true, receivedAt: true, status: true },
  });

  const avgConfidence = orders.length
    ? orders.reduce((sum, o) => sum + (o.aiConfidence ?? 0), 0) / orders.length
    : null;

  const confidenceBuckets = { alta: 0, media: 0, baja: 0 };
  for (const o of orders) {
    const c = o.aiConfidence ?? 0;
    if (c >= HIGH_CONFIDENCE) confidenceBuckets.alta++;
    else if (c >= MEDIUM_CONFIDENCE) confidenceBuckets.media++;
    else confidenceBuckets.baja++;
  }

  const unmatchedItemOrders = await prisma.order.findMany({
    where: { tenantId, items: { some: { matched: false } } },
    select: {
      id: true,
      rawMessage: true,
      aiConfidence: true,
      receivedAt: true,
      items: { where: { matched: false }, select: { rawFragment: true } },
    },
    orderBy: { receivedAt: "desc" },
    take: 20,
  });

  return { avgConfidence, totalAnalyzed: orders.length, confidenceBuckets, ordersNeedingReview: unmatchedItemOrders };
}

interface AliasSuggestion {
  rawFragment: string;
  suggestedProductId: string | null;
  suggestedProductName: string | null;
  reason: string;
}

const SUGGEST_ALIASES_TOOL: Anthropic.Tool = {
  name: "suggest_aliases",
  description: "Sugiere a qué producto del catálogo podría corresponder cada fragmento no reconocido.",
  input_schema: {
    type: "object",
    properties: {
      suggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            rawFragment: { type: "string" },
            suggestedProductId: { type: ["string", "null"] },
            reason: { type: "string", description: "una frase corta en español" },
          },
          required: ["rawFragment", "suggestedProductId", "reason"],
        },
      },
    },
    required: ["suggestions"],
  },
};

/** Junta los fragmentos no reconocidos más frecuentes y le pide a la IA que sugiera un alias existente para cada uno. */
export async function suggestAliases(tenantId: string): Promise<AliasSuggestion[]> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new HttpError(503, "El análisis de IA no está configurado (falta ANTHROPIC_API_KEY)");
  }

  const [unmatchedItems, products] = await Promise.all([
    prisma.orderItem.findMany({
      where: { order: { tenantId }, matched: false },
      select: { rawFragment: true },
    }),
    prisma.product.findMany({ where: { tenantId, active: true }, select: { id: true, name: true } }),
  ]);

  if (unmatchedItems.length === 0 || products.length === 0) return [];

  const counts = new Map<string, number>();
  for (const item of unmatchedItems) {
    counts.set(item.rawFragment, (counts.get(item.rawFragment) ?? 0) + 1);
  }
  const topFragments = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([fragment]) => fragment);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const catalogText = products.map((p) => `- ${p.name} (id: ${p.id})`).join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `Sos el asistente de un distribuidor mayorista. Te paso fragmentos de pedidos por WhatsApp que el sistema NO pudo asociar a ningún producto del catálogo. Para cada uno, sugerí a qué producto del catálogo probablemente se refiere (mismo id que en la lista), o null si parece un producto totalmente distinto que no vendemos. Nunca inventes un id que no esté en el catálogo.

Catálogo:
${catalogText}`,
    tools: [SUGGEST_ALIASES_TOOL],
    tool_choice: { type: "tool", name: SUGGEST_ALIASES_TOOL.name },
    messages: [{ role: "user", content: topFragments.map((f) => `- "${f}"`).join("\n") }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) throw new HttpError(502, "El análisis de IA no devolvió una respuesta interpretable");

  const productById = new Map(products.map((p) => [p.id, p.name]));
  const { suggestions } = toolUse.input as {
    suggestions: { rawFragment: string; suggestedProductId: string | null; reason: string }[];
  };

  return suggestions.map((s) => ({
    ...s,
    suggestedProductName: s.suggestedProductId ? (productById.get(s.suggestedProductId) ?? null) : null,
  }));
}
