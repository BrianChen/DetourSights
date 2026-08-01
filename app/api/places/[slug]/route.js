import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const placeInclude = {
  coverImage: { select: { url: true } },
  destination: true,
  aiGenData: true,
  categories: { include: { category: true } },
};

function stripConfidence(place) {
  if (!place?.aiGenData) return place;
  const aiGenData = Object.fromEntries(
    Object.entries(place.aiGenData).filter(([k]) => !k.endsWith('Confidence'))
  );
  return { ...place, aiGenData };
}

export async function GET(request, { params }) {
  const { slug } = await params;
  const place = await prisma.place.findFirst({
    where: { slug },
    include: placeInclude,
  });
  if (!place) return NextResponse.json({ error: 'Place not found' }, { status: 404 });
  return NextResponse.json(stripConfidence(place));
}

const AI_FIELDS = new Set([
  'tagline',
  'description',
  'whyVisit',
  'visitDuration',
  'visitDurationConfidence',
  'bookingRequired',
  'bookInAdvanceWarning',
  'dressCode',
  'localTips',
  'whatToBring',
  'indoorOutdoor',
  'weatherDependent',
  'generatedAt', 'modelVersion',
]);

export async function PATCH(request, { params }) {
  const { slug } = await params;
  const existing = await prisma.place.findFirst({ where: { slug } });
  if (!existing) return NextResponse.json({ error: 'Place not found' }, { status: 404 });

  const { categoryIds, ...fields } = await request.json();
  const defined = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));

  const placeData = Object.fromEntries(Object.entries(defined).filter(([k]) => !AI_FIELDS.has(k)));
  const aiData    = Object.fromEntries(Object.entries(defined).filter(([k]) =>  AI_FIELDS.has(k)));

  if (categoryIds) {
    await prisma.placeCategory.deleteMany({ where: { placeId: existing.id } });
    placeData.categories = { create: categoryIds.map((categoryId) => ({ categoryId })) };
  }

  if (Object.keys(placeData).length > 0) {
    await prisma.place.update({ where: { id: existing.id }, data: placeData });
  }

  if (Object.keys(aiData).length > 0) {
    await prisma.placeAiGenData.upsert({
      where: { placeId: existing.id },
      create: { placeId: existing.id, ...aiData },
      update: aiData,
    });
  }

  const place = await prisma.place.findUnique({ where: { id: existing.id }, include: placeInclude });
  return NextResponse.json(stripConfidence(place));
}

export async function DELETE(request, { params }) {
  const { slug } = await params;
  const existing = await prisma.place.findFirst({ where: { slug } });
  if (!existing) return NextResponse.json({ error: 'Place not found' }, { status: 404 });
  await prisma.place.delete({ where: { id: existing.id } });
  return new NextResponse(null, { status: 204 });
}
