import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import styles from './PlacePage.module.css';
import SetRecentDestination from '@/components/SetRecentDestination';
import PlaceMap from '@/components/PlaceMap';
import PlaceHero from './components/PlaceHero/PlaceHero';
import PlaceMoods from './components/PlaceMoods/PlaceMoods';
import LocalTipsSection from './components/LocalTipsSection/LocalTipsSection';
import SeasonalTipsSection from './components/SeasonalTipsSection/SeasonalTipsSection';
import WhyVisitSection from './components/WhyVisitSection/WhyVisitSection';
import PlaceDetailsCard from './components/PlaceDetailsCard/PlaceDetailsCard';
import WhatToBringCard from './components/WhatToBringCard/WhatToBringCard';
import AccessibilityCard from './components/AccessibilityCard/AccessibilityCard';
import DestinationPlacesCarousel from './components/DestinationPlacesCarousel/DestinationPlacesCarousel';

const PRICE_RANGE_MAP = {
  FREE: 'Free',
  BUDGET: '$',
  MODERATE: '$$',
  EXPENSIVE: '$$$',
};

const CATEGORY_SECTIONS = {
  'sights-and-landmarks':       ['description', 'localTips', 'seasonalTips', 'whatToBring'],
  'nature-outdoors':            ['description', 'localTips', 'seasonalTips', 'whatToBring'],
  'food-and-drink':             ['description', 'localTips'],
  'nightlife':                  ['description', 'localTips'],
  'shopping':                   ['description', 'localTips'],
  'arts-and-entertainment':     ['description', 'localTips'],
  'activities-and-experiences': ['description', 'localTips', 'seasonalTips', 'whatToBring'],
};

const CATEGORY_SCHEMA_TYPE = {
  'sights-and-landmarks': 'TouristAttraction',
  'nature-outdoors': 'Park',
  'food-and-drink': 'FoodEstablishment',
  'nightlife': 'BarOrPub',
  'shopping': 'Store',
  'arts-and-entertainment': 'EntertainmentBusiness',
  'activities-and-experiences': 'TouristAttraction',
};

export async function generateMetadata({ params }) {
  const { destinationSlug, placeSlug } = await params;
  const place = await prisma.place.findFirst({
    where: { slug: placeSlug, destination: { slug: destinationSlug } },
    include: {
      destination: { include: { coverImage: { select: { url: true } } } },
      aiGenData: true,
    },
  });
  if (!place) return {};
  const description = place.aiGenData?.description
    ?? `Discover ${place.name} in ${place.destination?.name ?? 'this destination'}.`;
  return {
    title: `${place.name} — DetourSights`,
    description,
    alternates: {
      canonical: `https://www.detoursights.com/${place.destination.slug}/${placeSlug}`,
    },
    openGraph: {
      title: `${place.name} — DetourSights`,
      description,
      url: `https://www.detoursights.com/${place.destination.slug}/${placeSlug}`,
      siteName: 'DetourSights',
      type: 'website',
      ...(place.coverImageUrl && { images: [{ url: place.coverImageUrl }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${place.name} — DetourSights`,
      description,
      ...(place.coverImageUrl && { images: [{ url: place.coverImageUrl }] }),
    },
  };
}

export default async function PlacePage({ params }) {
  const { destinationSlug, placeSlug } = await params;
  const place = await prisma.place.findFirst({
    where: { slug: placeSlug, destination: { slug: destinationSlug } },
    include: {
      destination: { include: { coverImage: { select: { url: true } } } },
      aiGenData: true,
      categories: { include: { category: true } },
      photos: true,
      reviews: { include: { user: true }, orderBy: { createdAt: 'desc' } },
      moods: { include: { mood: true } },
      seasonalTips: true,
    },
  });

  if (!place) notFound();

  const avgRating = place.reviews.length
    ? (place.reviews.reduce((sum, r) => sum + r.rating, 0) / place.reviews.length).toFixed(1)
    : null;

  const hasMap = place.latitude != null && place.longitude != null;

  const categorySlugs = place.categories.map(({ category }) => category.slug);
  const visibleSections = new Set(['description', 'localTips', 'seasonalTips', 'whatToBring']);
  // const visibleSections = new Set(categorySlugs.flatMap(slug => CATEGORY_SECTIONS[slug] ?? []));

  const schemaTypes = [...new Set(
    place.categories.map(({ category }) => CATEGORY_SCHEMA_TYPE[category.slug] ?? 'TouristAttraction')
  )];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaTypes.length === 1 ? schemaTypes[0] : schemaTypes,
    name: place.name,
    description: place.aiGenData?.description ?? `Discover ${place.name} in ${place.destination.name}.`,
    url: `https://www.detoursights.com/${place.destination.slug}/${place.slug}`,
    ...(place.coverImageUrl && { image: place.coverImageUrl }),
    ...(place.address && { address: place.address }),
    ...(place.phone && { telephone: place.phone }),
    ...(place.website && { sameAs: place.website }),
    ...(place.priceRange && { priceRange: PRICE_RANGE_MAP[place.priceRange] }),
    ...(avgRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating,
        reviewCount: place.reviews.length,
        bestRating: 5,
      },
    }),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: place.destination.name,
        item: `https://www.detoursights.com/${place.destination.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: place.name,
        item: `https://www.detoursights.com/${place.destination.slug}/${place.slug}`,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SetRecentDestination slug={place.destination.slug} />

      <PlaceHero
        place={place}
        destinationSlug={destinationSlug}
        priceLabel={PRICE_RANGE_MAP[place.priceRange]}
        avgRating={avgRating}
      />

      <div className={styles.pageBody}>

        <main className={styles.mainCol}>
          <PlaceMoods moods={place.moods} />

          {visibleSections.has('description') && place.aiGenData?.description && (
            <div className={styles.description}>
              {place.aiGenData.description.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {visibleSections.has('localTips') && (
            <LocalTipsSection localTips={place.aiGenData?.localTips} />
          )}
          {visibleSections.has('seasonalTips') && (
            <SeasonalTipsSection seasonalTips={place.seasonalTips} />
          )}
          <WhyVisitSection whyVisit={place.aiGenData?.whyVisit} />
        </main>

        <aside className={styles.sidebar}>
          {hasMap && (
            <div className={styles.sidebarMap}>
              <PlaceMap latitude={place.latitude} longitude={place.longitude} name={place.name} />
            </div>
          )}
          <PlaceDetailsCard place={place} categorySlugs={categorySlugs} />
          <AccessibilityCard accessibilityOptions={place.accessibilityOptions} />
          {visibleSections.has('whatToBring') && (
            <WhatToBringCard whatToBring={place.aiGenData?.whatToBring} />
          )}
        </aside>

      </div>

      <DestinationPlacesCarousel
        destinationId={place.destination.id}
        destinationSlug={place.destination.slug}
        destinationName={place.destination.name}
        excludePlaceId={place.id}
        excludePlaceSlug={place.slug}
      />
    </>
  );
}
