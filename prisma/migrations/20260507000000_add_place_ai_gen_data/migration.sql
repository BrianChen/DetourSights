-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "PlaceAiGenData" (
    "id" SERIAL NOT NULL,
    "placeId" INTEGER NOT NULL,
    "tagline" TEXT,
    "taglineConfidence" "ConfidenceLevel",
    "description" TEXT,
    "descriptionConfidence" "ConfidenceLevel",
    "whyVisit" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "whyVisitConfidence" "ConfidenceLevel",
    "neighbourhood" TEXT,
    "neighbourhoodConfidence" "ConfidenceLevel",
    "howLongToSpend" TEXT,
    "howLongToSpendConfidence" "ConfidenceLevel",
    "bookingRequired" BOOLEAN,
    "bookingRequiredConfidence" "ConfidenceLevel",
    "bookInAdvanceWarning" TEXT,
    "bookInAdvanceWarningConfidence" "ConfidenceLevel",
    "dressCode" TEXT,
    "dressCodeConfidence" "ConfidenceLevel",
    "localTips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "localTipsConfidence" "ConfidenceLevel",
    "historyBackground" TEXT,
    "historyBackgroundConfidence" "ConfidenceLevel",
    "whatToExpect" TEXT,
    "whatToExpectConfidence" "ConfidenceLevel",
    "whatToBring" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "whatToBringConfidence" "ConfidenceLevel",
    "indoorOutdoor" "IndoorOutdoor",
    "indoorOutdoorConfidence" "ConfidenceLevel",
    "weatherDependent" BOOLEAN,
    "weatherDependentConfidence" "ConfidenceLevel",
    "moodsConfidence" "ConfidenceLevel",
    "generatedAt" TIMESTAMP(3),
    "modelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaceAiGenData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaceAiGenData_placeId_key" ON "PlaceAiGenData"("placeId");

-- AddForeignKey
ALTER TABLE "PlaceAiGenData" ADD CONSTRAINT "PlaceAiGenData_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data from Place to PlaceAiGenData
INSERT INTO "PlaceAiGenData" (
    "placeId", "description",
    "tagline", "whyVisit", "neighbourhood", "howLongToSpend",
    "bookingRequired", "bookInAdvanceWarning", "dressCode",
    "localTips", "historyBackground", "whatToExpect", "whatToBring",
    "indoorOutdoor", "weatherDependent",
    "createdAt", "updatedAt"
)
SELECT
    id, description,
    tagline, "whyVisit", neighbourhood, "howLongToSpend",
    "bookingRequired", "bookInAdvanceWarning", "dressCode",
    "localTips", "historyBackground", "whatToExpect", "whatToBring",
    "indoorOutdoor", "weatherDependent",
    NOW(), NOW()
FROM "Place"
WHERE description IS NOT NULL;

-- Drop AI-generated columns from Place
ALTER TABLE "Place" DROP COLUMN "description";
ALTER TABLE "Place" DROP COLUMN "tagline";
ALTER TABLE "Place" DROP COLUMN "whyVisit";
ALTER TABLE "Place" DROP COLUMN "neighbourhood";
ALTER TABLE "Place" DROP COLUMN "howLongToSpend";
ALTER TABLE "Place" DROP COLUMN "bookingRequired";
ALTER TABLE "Place" DROP COLUMN "bookInAdvanceWarning";
ALTER TABLE "Place" DROP COLUMN "dressCode";
ALTER TABLE "Place" DROP COLUMN "localTips";
ALTER TABLE "Place" DROP COLUMN "historyBackground";
ALTER TABLE "Place" DROP COLUMN "whatToExpect";
ALTER TABLE "Place" DROP COLUMN "whatToBring";
ALTER TABLE "Place" DROP COLUMN "indoorOutdoor";
ALTER TABLE "Place" DROP COLUMN "weatherDependent";
