import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function globalSetup() {
  const [food, attraction] = await Promise.all([
    prisma.category.findUniqueOrThrow({ where: { slug: 'food' } }),
    prisma.category.findUniqueOrThrow({ where: { slug: 'attraction' } }),
  ]);

  const destination = await prisma.destination.upsert({
    where: { slug: '__test-city' },
    update: {},
    create: { name: 'Test City', slug: '__test-city', country: 'Testland' },
  });

  // Three places covering distinct filter combinations:
  //   __test-food             → food only
  //   __test-attraction       → attraction only
  //   __test-food-attraction  → food + attraction
  const [foodPlace, attractionPlace, bothPlace] = await Promise.all([
    prisma.place.upsert({
      where: { slug: '__test-food' },
      update: {},
      create: { name: 'Test Food Spot', slug: '__test-food', destinationId: destination.id },
    }),
    prisma.place.upsert({
      where: { slug: '__test-attraction' },
      update: {},
      create: { name: 'Test Landmark', slug: '__test-attraction', destinationId: destination.id },
    }),
    prisma.place.upsert({
      where: { slug: '__test-food-attraction' },
      update: {},
      create: { name: 'Test Food Landmark', slug: '__test-food-attraction', destinationId: destination.id },
    }),
  ]);

  // Four gallery images — enough to show thumbnails (3) + "+1" overflow badge
  const existingImages = await prisma.destinationImage.count({ where: { destinationId: destination.id } });
  if (existingImages === 0) {
    const images = await prisma.image.createManyAndReturn({
      data: [
        { url: '/logo.png', altText: '__test-gallery-1' },
        { url: '/logo.png', altText: '__test-gallery-2' },
        { url: '/logo.png', altText: '__test-gallery-3' },
        { url: '/logo.png', altText: '__test-gallery-4' },
      ],
    });
    await prisma.destinationImage.createMany({
      data: images.map((img, i) => ({
        destinationId: destination.id,
        imageId: img.id,
        position: i,
      })),
    });
  }

  await Promise.all([
    prisma.placeCategory.upsert({
      where: { placeId_categoryId: { placeId: foodPlace.id, categoryId: food.id } },
      update: {},
      create: { placeId: foodPlace.id, categoryId: food.id },
    }),
    prisma.placeCategory.upsert({
      where: { placeId_categoryId: { placeId: attractionPlace.id, categoryId: attraction.id } },
      update: {},
      create: { placeId: attractionPlace.id, categoryId: attraction.id },
    }),
    prisma.placeCategory.upsert({
      where: { placeId_categoryId: { placeId: bothPlace.id, categoryId: food.id } },
      update: {},
      create: { placeId: bothPlace.id, categoryId: food.id },
    }),
    prisma.placeCategory.upsert({
      where: { placeId_categoryId: { placeId: bothPlace.id, categoryId: attraction.id } },
      update: {},
      create: { placeId: bothPlace.id, categoryId: attraction.id },
    }),
  ]);

  await prisma.$disconnect();
}
