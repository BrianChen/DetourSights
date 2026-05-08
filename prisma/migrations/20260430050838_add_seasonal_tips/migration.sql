/*
  Warnings:

  - You are about to drop the column `bestTimeToVisit` on the `Place` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Place" DROP COLUMN "bestTimeToVisit";

-- CreateTable
CREATE TABLE "SeasonalTip" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "avoid" BOOLEAN NOT NULL DEFAULT false,
    "placeId" INTEGER,
    "destinationId" INTEGER,

    CONSTRAINT "SeasonalTip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeasonalTip_placeId_idx" ON "SeasonalTip"("placeId");

-- CreateIndex
CREATE INDEX "SeasonalTip_destinationId_idx" ON "SeasonalTip"("destinationId");

-- AddForeignKey
ALTER TABLE "SeasonalTip" ADD CONSTRAINT "SeasonalTip_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonalTip" ADD CONSTRAINT "SeasonalTip_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enforce exactly one parent: either placeId or destinationId must be set, not both and not neither
ALTER TABLE "SeasonalTip" ADD CONSTRAINT "seasonaltip_exactly_one_parent" CHECK (
  ("placeId" IS NOT NULL AND "destinationId" IS NULL) OR
  ("placeId" IS NULL AND "destinationId" IS NOT NULL)
);
