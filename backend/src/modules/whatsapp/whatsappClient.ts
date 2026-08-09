const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

/** Envía un mensaje de texto por WhatsApp Cloud API usando las credenciales del tenant. */
export async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string,
): Promise<void> {
  const res = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Error al enviar mensaje de WhatsApp (${res.status}): ${body}`);
  }
}

/**
 * Suscribe la app de Meta a los webhooks de esta WABA — sin este paso, Meta
 * jamás entrega mensajes al webhook aunque todo lo demás esté bien
 * configurado (gotcha ya documentado en Hielo Guala).
 */
export async function subscribeAppToWaba(wabaId: string, accessToken: string): Promise<void> {
  const res = await fetch(`${GRAPH_API_BASE}/${wabaId}/subscribed_apps`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`No se pudo suscribir la app a la WABA (${res.status}): ${body}`);
  }
}
