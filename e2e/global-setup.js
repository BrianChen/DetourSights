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
