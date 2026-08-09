import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z.string().min(1),
  TOKEN_ENCRYPTION_KEY: z.string().min(1),
  /// Vacío hasta que el usuario cargue una key real — el parser IA falla
  /// explícitamente al usarse sin key en vez de fallar en el arranque, para
  /// no bloquear el resto del backend mientras todavía no está configurada.
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  /// Token propio (no de Meta) que Meta reenvía en la verificación del
  /// webhook (?hub.verify_token=...) — lo elegís vos al configurar el
  /// webhook en Meta for Developers, mismo patrón que WHATSAPP_VERIFY_TOKEN
  /// en Hielo Guala.
  WHATSAPP_VERIFY_TOKEN: z.string().optional().default(""),
});

export const env = envSchema.parse(process.env);
