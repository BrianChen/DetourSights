import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_PLACE_SLUGS = ['__test-food', '__test-attraction', '__test-food-attraction'];

export default async function globalTeardown() {
  const places = await prisma.place.findMany({
    where: { slug: { in: TEST_PLACE_SLUGS } },
    select: { id: true },
  });

  const placeIds = places.map((p) => p.id);

  // PlaceCategory has no cascade — must delete before Place
  await prisma.placeCategory.deleteMany({ where: { placeId: { in: placeIds } } });
  await prisma.place.deleteMany({ where: { id: { in: placeIds } } });

  // Delete test gallery images (DestinationImage rows cascade-delete with the destination)
  await prisma.image.deleteMany({ where: { altText: { startsWith: '__test-gallery-' } } });

  await prisma.destination.deleteMany({ where: { slug: '__test-city' } });

  await prisma.$disconnect();
}
