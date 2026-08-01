-- Drop Place.coverImageUrl, now fully replaced by the coverImageId FK path
-- (Place.coverImage relation) and the PlaceImage gallery join table.
-- All reads were migrated to coverImage.url; the ingest script now writes
-- Image + PlaceImage + coverImageId instead of this column.

ALTER TABLE "Place"
  DROP COLUMN "coverImageUrl";
