-- Sumar un 6to estado a OrderStatus (Postgres permite agregar valores a un
-- enum existente sin recrearlo, a diferencia de borrarlos/renombrarlos).
ALTER TYPE "OrderStatus" ADD VALUE 'REQUIERE_REVISION';

-- Nuevos enums
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'OTHER');
CREATE TYPE "ProductStockStatus" AS ENUM ('DISPONIBLE', 'SIN_STOCK', 'PAUSADO');

-- Order.paymentMethod
ALTER TABLE "Order" ADD COLUMN "paymentMethod" "PaymentMethod";

-- Datos reales del negocio en Tenant, para que la IA nunca invente al
-- responder consultas frecuentes.
ALTER TABLE "Tenant" ADD COLUMN "businessHours" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "deliveryZone" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "deliveryCost" DECIMAL(10, 2);
ALTER TABLE "Tenant" ADD COLUMN "paymentMethodsInfo" TEXT;

-- Product.active (booleano) -> Product.stockStatus (3 estados)
ALTER TABLE "Product" ADD COLUMN "stockStatus" "ProductStockStatus" NOT NULL DEFAULT 'DISPONIBLE';
UPDATE "Product" SET "stockStatus" = CASE WHEN "active" THEN 'DISPONIBLE' ELSE 'PAUSADO' END::"ProductStockStatus";
ALTER TABLE "Product" DROP COLUMN "active";

-- Conversación persistente por (tenant, customerPhone) para que la IA
-- conserve contexto entre mensajes.
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "draftItems" JSONB,
    "lastIntent" TEXT,
    "lastConfidence" DOUBLE PRECISION,
    "linkedOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Conversation_linkedOrderId_key" ON "Conversation"("linkedOrderId");
CREATE UNIQUE INDEX "Conversation_tenantId_customerPhone_key" ON "Conversation"("tenantId", "customerPhone");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_linkedOrderId_fkey" FOREIGN KEY ("linkedOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConversationMessage_conversationId_createdAt_idx" ON "ConversationMessage"("conversationId", "createdAt");

ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
