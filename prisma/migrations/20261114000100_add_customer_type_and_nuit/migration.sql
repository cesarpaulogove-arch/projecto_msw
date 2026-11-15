
-- Criar o tipo de cliente
DO $$ BEGIN
  CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'COMPANY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Adicionar os campos à tabela Quotation
ALTER TABLE "Quotation"
ADD COLUMN IF NOT EXISTS "customerType" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN IF NOT EXISTS "company" TEXT,
ADD COLUMN IF NOT EXISTS "nuit" TEXT;

-- Criar índice para pesquisa por NUIT
CREATE INDEX IF NOT EXISTS "Quotation_nuit_idx"
ON "Quotation"("nuit");
