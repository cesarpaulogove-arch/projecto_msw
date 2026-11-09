-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('SERVICOS', 'PROJECTOS', 'SOLUCOES');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('RASCUNHO', 'PUBLICADO');

-- CreateTable
CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "image" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'RASCUNHO',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteContent_slug_key" ON "SiteContent"("slug");

-- CreateIndex
CREATE INDEX "SiteContent_type_status_idx" ON "SiteContent"("type", "status");

-- CreateIndex
CREATE INDEX "SiteContent_status_publishedAt_idx" ON "SiteContent"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "SiteContent_order_idx" ON "SiteContent"("order");
