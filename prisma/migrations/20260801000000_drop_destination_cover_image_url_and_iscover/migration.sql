-- Drop dead columns superseded by the coverImageId FK path.
--
-- Destination."coverImageUrl": replaced by the coverImage relation
--   (coverImageId FK -> Image). Only ever read via coverImage.url; the old
--   column was kept around solely to backfill coverImageId in migration
--   20260731000000 and is no longer referenced by any code.
--
-- DestinationImage."isCover": write-only. Set by the image-ingest script but
--   never read — cover selection is driven entirely by Destination.coverImageId.
--   Dropping the column also drops its partial unique index automatically.

ALTER TABLE "Destination"
  DROP COLUMN "coverImageUrl";

ALTER TABLE "DestinationImage"
  DROP COLUMN "isCover";
