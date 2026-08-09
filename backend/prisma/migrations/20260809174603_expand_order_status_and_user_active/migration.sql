-- Add User.active (soft-disable a repartidor without deleting the row)
ALTER TABLE "User" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- Add Order.cancelledAt
ALTER TABLE "Order" ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- Expand OrderStatus from 3 to 5 values. Postgres can't drop enum values in
-- place, so we swap the type: create the new enum, migrate the column with a
-- CASE mapping of the old values, then drop the old type and rename.
CREATE TYPE "OrderStatus_new" AS ENUM ('NUEVO', 'EN_PROCESO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO');

ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING (
  CASE "status"::text
    WHEN 'PENDING' THEN 'NUEVO'
    WHEN 'DELIVERED' THEN 'ENTREGADO'
    WHEN 'CANCELLED' THEN 'CANCELADO'
    ELSE 'NUEVO'
  END
)::"OrderStatus_new";

ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'NUEVO'::"OrderStatus_new";

DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
