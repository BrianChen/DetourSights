-- CreateTable
CREATE TABLE "FeaturedPlace" (
    "id" SERIAL NOT NULL,
    "placeId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "FeaturedPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedPlace_placeId_key" ON "FeaturedPlace"("placeId");

-- CreateIndex
CREATE INDEX "FeaturedPlace_position_idx" ON "FeaturedPlace"("position");

-- AddForeignKey
ALTER TABLE "FeaturedPlace" ADD CONSTRAINT "FeaturedPlace_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
