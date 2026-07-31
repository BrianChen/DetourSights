-- 1) Add nullable FK column (coverImageUrl is left in place for now)
ALTER TABLE "Destination"
  ADD COLUMN "coverImageId" INTEGER;

-- 2) Backfill: match on Image.url (unique — verified 1045/1045 distinct)
UPDATE "Destination" d
SET "coverImageId" = i.id
FROM "Image" i
WHERE i.url = d."coverImageUrl";

-- 3) FK constraint. SET NULL so deleting an Image blanks the cover
--    rather than deleting the destination.
ALTER TABLE "Destination"
  ADD CONSTRAINT "Destination_coverImageId_fkey"
  FOREIGN KEY ("coverImageId") REFERENCES "Image"(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 4) Index for FK lookups / joins
CREATE INDEX "Destination_coverImageId_idx" ON "Destination"("coverImageId");
