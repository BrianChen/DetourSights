import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const placeInclude = {
  destination: true,
  categories: { include: { category: true } },
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const destinationSlug = searchParams.get('destinationSlug');
  const categorySlug = searchParams.get('categorySlug');

  const where = {};
  if (destinationSlug) where.destination = { slug: destinationSlug };
  if (categorySlug) where.categories = { some: { category: { slug: categorySlug } } };

  const places = await prisma.place.findMany({
    where,
    include: placeInclude,
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(places);
}

export async function POST(request) {
  const { name, slug, description, address, latitude, longitude, website, phone, priceRange, destinationId, categoryIds = [] } = await request.json();
  if (!name || !slug || !destinationId) {
    return NextResponse.json({ error: 'name, slug, and destinationId are required' }, { status: 400 });
  }
  const place = await prisma.place.create({
    data: {
      name, slug, description, address, latitude, longitude, website, phone, priceRange, destinationId,
      categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
    },
    include: placeInclude,
  });
  return NextResponse.json(place, { status: 201 });
}
