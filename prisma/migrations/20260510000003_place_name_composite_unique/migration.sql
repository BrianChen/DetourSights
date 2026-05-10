-- Drop the global unique constraint on Place.name
ALTER TABLE "Place" DROP CONSTRAINT "Place_name_key";

-- Add composite unique constraint on (destinationId, name)
CREATE UNIQUE INDEX "Place_destinationId_name_key" ON "Place"("destinationId", "name");
