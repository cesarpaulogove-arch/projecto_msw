-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "navOrder" INTEGER,
ADD COLUMN     "showInNav" BOOLEAN NOT NULL DEFAULT false;
