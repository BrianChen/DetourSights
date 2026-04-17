import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  const destination = await prisma.destination.findUnique({
    where: { slug: params.slug },
    include: {
      places: {
        include: { categories: { include: { category: true } } },
        orderBy: { name: 'asc' },
      },
    },
  });
  if (!destination) return NextResponse.json({ error: 'Destination not found' }, { status: 404 });
  return NextResponse.json(destination);
}

export async function PATCH(request, { params }) {
  const data = await request.json();
  const destination = await prisma.destination.update({
    where: { slug: params.slug },
    data,
  }).catch(() => null);
  if (!destination) return NextResponse.json({ error: 'Destination not found' }, { status: 404 });
  return NextResponse.json(destination);
}

export async function DELETE(request, { params }) {
  const deleted = await prisma.destination.delete({
    where: { slug: params.slug },
  }).catch(() => null);
  if (!deleted) return NextResponse.json({ error: 'Destination not found' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
