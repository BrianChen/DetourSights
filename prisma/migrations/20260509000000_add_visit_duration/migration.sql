CREATE TYPE "VisitDurationEnum" AS ENUM (
  'UNDER_1_HOUR', 'ONE_TO_TWO_HOURS', 'TWO_TO_FOUR_HOURS', 'HALF_DAY', 'FULL_DAY'
);
ALTER TABLE "PlaceAiGenData" ADD COLUMN "visitDuration" "VisitDurationEnum";
ALTER TABLE "PlaceAiGenData" ADD COLUMN "visitDurationConfidence" "ConfidenceLevel";
