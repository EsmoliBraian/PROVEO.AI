const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

/**
 * Los números de celular argentinos llegan en los webhooks como "549..."
 * (con el 9 extra que WhatsApp agrega para móviles AR), pero mientras la app
 * de Meta esté en modo desarrollo/sin verificar, la lista de destinatarios
 * de prueba autorizados se compara dígito a dígito contra "54..." (sin el
 * 9) — así que responderle al valor crudo del webhook rebota con
 * "Recipient phone number not in allowed list" aunque el número sí esté
 * habilitado. Una vez que la app esté verificada/Live esta restricción de
 * lista de prueba desaparece y este ajuste deja de ser necesario (Hielo
 * Guala, ya en producción, nunca lo necesitó).
 */
export function toWhatsAppRecipient(rawFrom: string): string {
  return rawFrom.startsWith("549") ? `54${rawFrom.slice(3)}` : rawFrom;
}

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
