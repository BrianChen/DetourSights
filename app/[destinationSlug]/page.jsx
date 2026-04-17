import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import styles from './page.module.css';
import PlacesFilter from '@/components/PlacesFilter';
import { GallerySection } from '@/components/GallerySection';
import { WhyVisit } from '@/components/WhyVisit';
import { NearbyDestinations } from '@/components/NearbyDestinations';
import SetRecentDestination from '@/components/SetRecentDestination';

export async function generateMetadata({ params }) {
  const { destinationSlug } = await params;
  const destination = await prisma.destination.findUnique({ where: { slug: destinationSlug } });
  if (!destination) return {};
  const description = destination.description
    ?? `Explore the best things to do in ${destination.name}, ${destination.country}.`;
  return {
    title: `${destination.name} — Detour Sights`,
    description,
    openGraph: {
      title: `${destination.name} — Detour Sights`,
      description,
      url: `https://www.detoursights.com/${destinationSlug}`,
      siteName: 'Detour Sights',
      type: 'website',
      ...(destination.coverImageUrl && { images: [{ url: destination.coverImageUrl }] }),
    },
  };
}

export default async function DestinationPage({ params }) {
  const { destinationSlug } = await params;
  const destination = await prisma.destination.findUnique({
    where: { slug: destinationSlug },
    include: {
      places: {
        include: { categories: { include: { category: true } } },
        orderBy: { name: 'asc' },
      },
      images: {
        include: { image: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!destination) notFound();

  const galleryImages = destination.images.map((di) => di.image.url);

  return (
    <div className={styles.page}>
      <SetRecentDestination slug={destination.slug} />
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>Welcome to</p>
          <h1 className={styles.name}>{destination.name}</h1>
          <p className={styles.country}>{destination.country}</p>
          {destination.description && <p className={styles.description}>{destination.description}</p>}
        </div>
        {galleryImages.length > 0 && <GallerySection images={galleryImages} />}
      </div>

      <PlacesFilter places={destination.places} destinationSlug={destinationSlug} />

      <WhyVisit destinationName={destination.name} />

      <NearbyDestinations
        id={destination.id}
        latitude={destination.latitude}
        longitude={destination.longitude}
      />
    </div>
  );
}
