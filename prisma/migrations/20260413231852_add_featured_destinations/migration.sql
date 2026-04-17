-- CreateTable
CREATE TABLE "FeaturedDestination" (
    "id" SERIAL NOT NULL,
    "destinationId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "FeaturedDestination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedDestination_destinationId_key" ON "FeaturedDestination"("destinationId");

-- CreateIndex
CREATE INDEX "FeaturedDestination_position_idx" ON "FeaturedDestination"("position");

-- AddForeignKey
ALTER TABLE "FeaturedDestination" ADD CONSTRAINT "FeaturedDestination_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
