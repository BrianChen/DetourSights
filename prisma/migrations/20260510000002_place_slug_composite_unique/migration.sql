-- Drop the global unique constraint on Place.slug
DROP INDEX "Place_slug_key";

-- Add composite unique constraint on (destinationId, slug)
CREATE UNIQUE INDEX "Place_destinationId_slug_key" ON "Place"("destinationId", "slug");
