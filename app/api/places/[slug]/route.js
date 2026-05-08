import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const placeInclude = {
  destination: true,
  aiGenData: true,
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

const AI_FIELDS = new Set([
  'tagline', 'taglineConfidence',
  'description', 'descriptionConfidence',
  'whyVisit', 'whyVisitConfidence',
  'neighbourhood', 'neighbourhoodConfidence',
  'howLongToSpend', 'howLongToSpendConfidence',
  'bookingRequired', 'bookingRequiredConfidence',
  'bookInAdvanceWarning', 'bookInAdvanceWarningConfidence',
  'dressCode', 'dressCodeConfidence',
  'localTips', 'localTipsConfidence',
  'whatToBring', 'whatToBringConfidence',
  'indoorOutdoor', 'indoorOutdoorConfidence',
  'weatherDependent', 'weatherDependentConfidence',
  'moodsConfidence',
  'generatedAt', 'modelVersion',
]);

export async function PATCH(request, { params }) {
  const existing = await prisma.place.findUnique({ where: { slug: params.slug } });
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
  return NextResponse.json(place);
}

export async function DELETE(request, { params }) {
  const existing = await prisma.place.findUnique({ where: { slug: params.slug } });
  if (!existing) return NextResponse.json({ error: 'Place not found' }, { status: 404 });
  await prisma.place.delete({ where: { id: existing.id } });
  return new NextResponse(null, { status: 204 });
}
