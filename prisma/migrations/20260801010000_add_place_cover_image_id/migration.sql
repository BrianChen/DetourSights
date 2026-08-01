-- Give Place the same Image-FK cover path Destination already has.

-- 1) Add nullable FK column (coverImageUrl is left in place for now)
ALTER TABLE "Place"
  ADD COLUMN "coverImageId" INTEGER;

-- 2) Create Image rows for Place cover URLs that aren't in Image yet.
--    get-place-images.js wrote Cloudinary URLs straight to Place.coverImageUrl
--    and never inserted Image rows, so none of them exist there. Only url is
--    available — photographer/altText were never persisted for place covers.
INSERT INTO "Image" (url)
SELECT DISTINCT p."coverImageUrl"
FROM "Place" p
WHERE p."coverImageUrl" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Image" i WHERE i.url = p."coverImageUrl");

-- 3) Backfill: match on Image.url (unique — no duplicate Image URLs).
UPDATE "Place" p
SET "coverImageId" = i.id
FROM "Image" i
WHERE i.url = p."coverImageUrl";

-- 4) FK constraint. SET NULL so deleting an Image blanks the cover
--    rather than deleting the place.
ALTER TABLE "Place"
  ADD CONSTRAINT "Place_coverImageId_fkey"
  FOREIGN KEY ("coverImageId") REFERENCES "Image"(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 5) Index for FK lookups / joins
CREATE INDEX "Place_coverImageId_idx" ON "Place"("coverImageId");
