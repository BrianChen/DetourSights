import prisma from '@/lib/prisma';

export { default, generateMetadata } from './PlacePage';

export async function generateStaticParams() {
  const places = await prisma.place.findMany({
    select: { slug: true, destination: { select: { slug: true } } },
  });
  return places.map((p) => ({
    destinationSlug: p.destination.slug,
    placeSlug: p.slug,
  }));
}
