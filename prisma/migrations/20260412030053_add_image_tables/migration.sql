-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "photographer" TEXT,
    "photographerUrl" TEXT,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationImage" (
    "destinationId" INTEGER NOT NULL,
    "imageId" INTEGER NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DestinationImage_pkey" PRIMARY KEY ("destinationId","imageId")
);

-- CreateIndex
CREATE INDEX "DestinationImage_destinationId_idx" ON "DestinationImage"("destinationId");

-- CreateIndex
CREATE INDEX "DestinationImage_imageId_idx" ON "DestinationImage"("imageId");

-- CreateIndex
CREATE INDEX "Photo_placeId_idx" ON "Photo"("placeId");

-- CreateIndex
CREATE INDEX "Photo_userId_idx" ON "Photo"("userId");

-- CreateIndex
CREATE INDEX "Place_destinationId_idx" ON "Place"("destinationId");

-- CreateIndex
CREATE INDEX "PlaceCategory_categoryId_idx" ON "PlaceCategory"("categoryId");

-- CreateIndex
CREATE INDEX "Review_placeId_idx" ON "Review"("placeId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- AddForeignKey
ALTER TABLE "DestinationImage" ADD CONSTRAINT "DestinationImage_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationImage" ADD CONSTRAINT "DestinationImage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
