import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import styles from './page.module.css';
import SetRecentDestination from '@/components/SetRecentDestination';

export async function generateMetadata({ params }) {
  const { placeSlug } = await params;
  const place = await prisma.place.findUnique({ where: { slug: placeSlug } });
  if (!place) return {};
  return { title: `${place.name} — Detour Sights` };
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

  return (
    <div className={styles.page}>
      <SetRecentDestination slug={place.destination.slug} />
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

      {place.description && <p className={styles.description}>{place.description}</p>}

      <div className={styles.details}>
        {place.address && <p>📍 {place.address}</p>}
        {place.phone && <p>📞 {place.phone}</p>}
        {place.website && <p>🌐 <a href={place.website} target="_blank" rel="noopener noreferrer">{place.website}</a></p>}
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
  );
}
