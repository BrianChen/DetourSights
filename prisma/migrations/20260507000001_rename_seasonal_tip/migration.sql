-- Rename table
ALTER TABLE "SeasonalTip" RENAME TO "SeasonalTipAiGen";

-- Rename primary key constraint
ALTER TABLE "SeasonalTipAiGen" RENAME CONSTRAINT "SeasonalTip_pkey" TO "SeasonalTipAiGen_pkey";

-- Rename indexes
ALTER INDEX "SeasonalTip_placeId_idx" RENAME TO "SeasonalTipAiGen_placeId_idx";
ALTER INDEX "SeasonalTip_destinationId_idx" RENAME TO "SeasonalTipAiGen_destinationId_idx";

-- Rename foreign key constraints
ALTER TABLE "SeasonalTipAiGen" RENAME CONSTRAINT "SeasonalTip_placeId_fkey" TO "SeasonalTipAiGen_placeId_fkey";
ALTER TABLE "SeasonalTipAiGen" RENAME CONSTRAINT "SeasonalTip_destinationId_fkey" TO "SeasonalTipAiGen_destinationId_fkey";

-- Rename check constraint
ALTER TABLE "SeasonalTipAiGen" RENAME CONSTRAINT "seasonaltip_exactly_one_parent" TO "seasonaltipaigens_exactly_one_parent";
