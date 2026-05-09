-- AlterEnum
ALTER TYPE "PriceRange" ADD VALUE 'VERY_EXPENSIVE';

-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "accessibilityOptions" JSONB,
ADD COLUMN     "openingHours" JSONB,
ADD COLUMN     "reservable" BOOLEAN;
