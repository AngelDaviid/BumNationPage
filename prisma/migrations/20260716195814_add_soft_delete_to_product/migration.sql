-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "deleteAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
