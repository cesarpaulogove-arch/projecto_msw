
-- =====================================================
-- MIGRACAO: CRIACAO DA TABELA USER
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'UserRole'
    ) THEN
        CREATE TYPE "UserRole" AS ENUM (
            'CLIENTE',
            'GESTOR'
        );
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "phone" TEXT,
    "pinHash" TEXT,
    "phoneVerifiedAt" TIMESTAMP(3),
    "googleId" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'CLIENTE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"
ON "User"("email");

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key"
ON "User"("phone");

CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key"
ON "User"("googleId");

CREATE INDEX IF NOT EXISTS "User_role_idx"
ON "User"("role");

CREATE INDEX IF NOT EXISTS "User_active_idx"
ON "User"("active");

