import prisma from '@/lib/prisma';

export default async function sitemap() {
  const destinations = await prisma.destination.findMany({
    select: { slug: true, updatedAt: true },
  });

  const places = await prisma.place.findMany({
    select: { slug: true, updatedAt: true, destination: { select: { slug: true } } },
  });

  const destinationUrls = destinations.map((d) => ({
    url: `https://www.detoursights.com/${d.slug}`,
    lastModified: d.updatedAt,
  }));

  const placeUrls = places.map((p) => ({
    url: `https://www.detoursights.com/${p.destination.slug}/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  return [
    { url: 'https://www.detoursights.com', lastModified: new Date() },
    ...destinationUrls,
    ...placeUrls,
  ];
}
