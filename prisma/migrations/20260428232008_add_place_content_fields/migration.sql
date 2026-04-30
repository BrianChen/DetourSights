-- CreateEnum
CREATE TYPE "IndoorOutdoor" AS ENUM ('INDOOR', 'OUTDOOR', 'BOTH');

-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "bestTimeToVisit" TEXT,
ADD COLUMN     "bookInAdvanceWarning" TEXT,
ADD COLUMN     "bookingRequired" BOOLEAN,
ADD COLUMN     "dressCode" TEXT,
ADD COLUMN     "historyBackground" TEXT,
ADD COLUMN     "howLongToSpend" TEXT,
ADD COLUMN     "indoorOutdoor" "IndoorOutdoor",
ADD COLUMN     "localTips" TEXT[],
ADD COLUMN     "neighbourhood" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "weatherDependent" BOOLEAN,
ADD COLUMN     "whatToBring" TEXT[],
ADD COLUMN     "whatToExpect" TEXT,
ADD COLUMN     "whyVisit" TEXT[];

-- CreateTable
CREATE TABLE "Mood" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Mood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceMood" (
    "placeId" INTEGER NOT NULL,
    "moodId" INTEGER NOT NULL,

    CONSTRAINT "PlaceMood_pkey" PRIMARY KEY ("placeId","moodId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mood_name_key" ON "Mood"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Mood_slug_key" ON "Mood"("slug");

-- CreateIndex
CREATE INDEX "PlaceMood_moodId_idx" ON "PlaceMood"("moodId");

-- AddForeignKey
ALTER TABLE "PlaceMood" ADD CONSTRAINT "PlaceMood_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceMood" ADD CONSTRAINT "PlaceMood_moodId_fkey" FOREIGN KEY ("moodId") REFERENCES "Mood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
