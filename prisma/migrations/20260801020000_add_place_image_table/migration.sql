-- Join table mirroring DestinationImage: a place's gallery images.

-- CreateTable
CREATE TABLE "PlaceImage" (
    "placeId" INTEGER NOT NULL,
    "imageId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlaceImage_pkey" PRIMARY KEY ("placeId", "imageId")
);

-- CreateIndex
CREATE INDEX "PlaceImage_placeId_idx" ON "PlaceImage"("placeId");

-- CreateIndex
CREATE INDEX "PlaceImage_imageId_idx" ON "PlaceImage"("imageId");

-- AddForeignKey
ALTER TABLE "PlaceImage" ADD CONSTRAINT "PlaceImage_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceImage" ADD CONSTRAINT "PlaceImage_imageId_fkey"
  FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: each existing place cover becomes a gallery row at position 0,
-- matching how the cover is also a DestinationImage member for destinations.
INSERT INTO "PlaceImage" ("placeId", "imageId", "position")
SELECT id, "coverImageId", 0
FROM "Place"
WHERE "coverImageId" IS NOT NULL;
