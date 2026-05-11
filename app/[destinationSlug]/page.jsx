import prisma from '@/lib/prisma';

export { default, generateMetadata } from './DestinationPage';

export async function generateStaticParams() {
  const destinations = await prisma.destination.findMany({ select: { slug: true } });
  return destinations.map((d) => ({ destinationSlug: d.slug }));
}
