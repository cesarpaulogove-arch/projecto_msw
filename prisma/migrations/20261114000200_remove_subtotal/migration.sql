ALTER TABLE "Quotation"
DROP COLUMN IF EXISTS "subtotal";

ALTER TABLE "QuotationItem"
DROP COLUMN IF EXISTS "subtotal";

ALTER TABLE "Order"
DROP COLUMN IF EXISTS "subtotal";

ALTER TABLE "OrderItem"
ADD COLUMN "total" DECIMAL(12,2);

UPDATE "OrderItem"
SET "total" = "unitPrice" * "quantity";

ALTER TABLE "OrderItem"
ALTER COLUMN "total" SET NOT NULL;

ALTER TABLE "OrderItem"
DROP COLUMN IF EXISTS "subtotal";