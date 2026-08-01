import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { getRecentDestinationSlug } from '@/lib/recentDestination';
import CarouselRow from '@/components/CarouselRow';
import styles from './PersonalizedSuggestions.module.css';

/** Reads the recentDestination cookie and renders 10 places from that destination. Returns null if no cookie or destination not found. */
export default async function PersonalizedSuggestions() {
  const slug = await getRecentDestinationSlug();
  if (!slug || !/^[a-z0-9_-]+$/.test(slug)) return null;

  const destination = await prisma.destination.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      coverImage: { select: { url: true } },
      places: {
        take: 10,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          aiGenData: { select: { description: true } },
          coverImageUrl: true,
          categories: {
            take: 1,
            select: { category: { select: { name: true, icon: true } } },
          },
        },
      },
    },
  });

  if (!destination || destination.places.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>Based on your recent search for {destination.name}</h2>
        <CarouselRow pageSize={3} responsiveCols={{ laptop: 2, lgMobile: 1 }}>
          {destination.places.map((place) => {
            const category = place.categories[0]?.category;
            const imageSrc = place.coverImageUrl ?? destination.coverImage?.url;
            return (
              <Link
                key={place.id}
                href={`/${destination.slug}/${place.slug}`}
                className={styles.card}
              >
                <div className={styles.imageWrap}>
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={place.name}
                      fill
                      className={styles.image}
                      sizes="110px"
                    />
                  ) : (
                    <div className={styles.placeholder} />
                  )}
                </div>
                <div className={styles.cardBody}>
                  {category && (
                    <span className={styles.categoryPill}>
                      {category.icon} {category.name}
                    </span>
                  )}
                  <p className={styles.cardName}>{place.name}</p>
                  {place.aiGenData?.description && (
                    <p className={styles.cardDescription}>{place.aiGenData.description}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </CarouselRow>
      </div>
    </section>
  );
}
