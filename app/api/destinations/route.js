import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  const destinations = await prisma.destination.findMany({
    where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(destinations);
}

export async function POST(request) {
  const { name, country, slug, description, coverImageUrl } = await request.json();
  if (!name || !country || !slug) {
    return NextResponse.json({ error: 'name, country, and slug are required' }, { status: 400 });
  }
  const destination = await prisma.destination.create({
    data: { name, country, slug, description, coverImageUrl },
  });
  return NextResponse.json(destination, { status: 201 });
}
