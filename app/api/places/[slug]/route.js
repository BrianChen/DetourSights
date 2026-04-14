import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

const placeInclude = {
  destination: true,
  categories: { include: { category: true } },
};

export async function GET(request, { params }) {
  const place = await prisma.place.findUnique({
    where: { slug: params.slug },
    include: placeInclude,
  });
  if (!place) return NextResponse.json({ error: 'Place not found' }, { status: 404 });
  return NextResponse.json(place);
}

export async function PATCH(request, { params }) {
  const existing = await prisma.place.findUnique({ where: { slug: params.slug } });
  if (!existing) return NextResponse.json({ error: 'Place not found' }, { status: 404 });

  const { categoryIds, ...fields } = await request.json();
  const data = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));

  if (categoryIds) {
    await prisma.placeCategory.deleteMany({ where: { placeId: existing.id } });
    data.categories = { create: categoryIds.map((categoryId) => ({ categoryId })) };
  }

  const place = await prisma.place.update({ where: { id: existing.id }, data, include: placeInclude });
  return NextResponse.json(place);
}

export async function DELETE(request, { params }) {
  const existing = await prisma.place.findUnique({ where: { slug: params.slug } });
  if (!existing) return NextResponse.json({ error: 'Place not found' }, { status: 404 });
  await prisma.place.delete({ where: { id: existing.id } });
  return new NextResponse(null, { status: 204 });
}
