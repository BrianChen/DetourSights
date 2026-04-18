import { notFound } from 'next/navigation';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import styles from './page.module.css';
import SetRecentDestination from '@/components/SetRecentDestination';
import PlaceMap from '@/components/PlaceMap';

export async function generateMetadata({ params }) {
  const { placeSlug } = await params;
  const place = await prisma.place.findUnique({
    where: { slug: placeSlug },
    include: { destination: true },
  });
  if (!place) return {};
  const description = place.description
    ?? `Discover ${place.name} in ${place.destination?.name ?? 'this destination'}.`;
  return {
    title: `${place.name} — Detour Sights`,
    description,
    alternates: {
      canonical: `https://www.detoursights.com/${place.destination.slug}/${placeSlug}`,
    },
    openGraph: {
      title: `${place.name} — Detour Sights`,
      description,
      url: `https://www.detoursights.com/${place.destination.slug}/${placeSlug}`,
      siteName: 'Detour Sights',
      type: 'website',
      ...(place.coverImageUrl && { images: [{ url: place.coverImageUrl }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${place.name} — Detour Sights`,
      description,
      ...(place.coverImageUrl && { images: [place.coverImageUrl] }),
    },
  };
}

export default async function PlacePage({ params }) {
  const { destinationSlug, placeSlug } = await params;
  const place = await prisma.place.findUnique({
    where: { slug: placeSlug },
    include: {
      destination: true,
      categories: { include: { category: true } },
      photos: true,
      reviews: { include: { user: true }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!place) notFound();
  if (place.destination.slug !== destinationSlug) notFound();

  const avgRating = place.reviews.length
    ? (place.reviews.reduce((sum, r) => sum + r.rating, 0) / place.reviews.length).toFixed(1)
    : null;

  const hasMap = place.latitude != null && place.longitude != null;

  const CATEGORY_SCHEMA_TYPE = {
    food: 'FoodEstablishment',
    activity: 'TouristAttraction',
    attraction: 'TouristAttraction',
    nightlife: 'BarOrPub',
    shopping: 'Store',
    nature: 'Park',
  };

  const PRICE_RANGE_MAP = {
    FREE: 'Free',
    BUDGET: '$',
    MODERATE: '$$',
    EXPENSIVE: '$$$',
  };

  const schemaTypes = [...new Set(
    place.categories.map(({ category }) => CATEGORY_SCHEMA_TYPE[category.slug] ?? 'TouristAttraction')
  )];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaTypes.length === 1 ? schemaTypes[0] : schemaTypes,
    name: place.name,
    description: place.description ?? `Discover ${place.name} in ${place.destination.name}.`,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <SetRecentDestination slug={place.destination.slug} />

      <section className={styles.hero}>
        {place.coverImageUrl && (
          <Image
            src={place.coverImageUrl}
            alt={place.name}
            fill
            className={styles.heroImage}
            priority
            sizes="100vw"
          />
        )}
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroInfo}>
            <div className={styles.breadcrumb}>
              <a href={`/${destinationSlug}`}>{place.destination.name}</a>
              <span> / </span>
              <span>{place.name}</span>
            </div>
            <h1 className={styles.name}>{place.name}</h1>
            <div className={styles.meta}>
              <div className={styles.tags}>
                {place.categories.map(({ category }) => (
                  <span key={category.id} className={styles.tag}>
                    {category.icon} {category.name}
                  </span>
                ))}
                {place.priceRange && <span className={styles.price}>{place.priceRange}</span>}
              </div>
              {avgRating && (
                <span className={styles.rating}>★ {avgRating} ({place.reviews.length} reviews)</span>
              )}
            </div>
          </div>
          {hasMap && (
            <div className={styles.heroMap}>
              <PlaceMap latitude={place.latitude} longitude={place.longitude} name={place.name} />
            </div>
          )}
        </div>
      </section>

      <div className={styles.content}>
        {place.description && <p className={styles.description}>{place.description}</p>}

        <div className={styles.details}>
          {place.address && <p>📍 {place.address}</p>}
          {place.phone && <p>📞 {place.phone}</p>}
          {place.website && (
            <p>🌐 <a href={place.website} target="_blank" rel="noopener noreferrer">{place.website}</a></p>
          )}
        </div>

        {place.reviews.length > 0 && (
          <div className={styles.reviews}>
            <h2>Reviews</h2>
            {place.reviews.map((review) => (
              <div key={review.id} className={styles.review}>
                <div className={styles.reviewHeader}>
                  <strong>{review.user.name}</strong>
                  <span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                {review.body && <p>{review.body}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
