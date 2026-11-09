-- AlterTable
ALTER TABLE "SiteContent" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
