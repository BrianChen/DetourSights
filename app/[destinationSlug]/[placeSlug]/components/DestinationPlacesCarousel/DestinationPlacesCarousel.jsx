import Image from 'next/image';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import CarouselRow from '@/components/CarouselRow';
import styles from './DestinationPlacesCarousel.module.css';

export default async function DestinationPlacesCarousel({ destinationId, destinationSlug, destinationName, excludePlaceId }) {
  const places = await prisma.place.findMany({
    where: {
      destinationId,
      NOT: { id: excludePlaceId },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      coverImageUrl: true,
      destination: { select: { coverImageUrl: true } },
      categories: {
        take: 1,
        select: { category: { select: { name: true, icon: true } } },
      },
    },
    orderBy: { name: 'asc' },
    take: 16,
  });

  if (!places.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>Other top places in {destinationName}</h2>
        <CarouselRow responsiveCols={{ laptop: 4, tablet: 3, lgMobile: 2 }}>
          {places.map((p) => {
            const cat = p.categories[0]?.category;
            return (
              <Link key={p.id} href={`/${destinationSlug}/${p.slug}`} className={styles.card}>
                <div className={styles.imageWrap}>
                  {(p.coverImageUrl ?? p.destination.coverImageUrl) ? (
                    <Image
                      src={p.coverImageUrl ?? p.destination.coverImageUrl}
                      alt={p.name}
                      fill
                      className={styles.image}
                      sizes="(max-width: 900px) 50vw, 20vw"
                    />
                  ) : (
                    <div className={styles.placeholder} />
                  )}
                </div>
                <div className={styles.cardBody}>
                  {cat && <span className={styles.categoryPill}>{cat.icon} {cat.name}</span>}
                  <p className={styles.cardName}>{p.name}</p>
                </div>
              </Link>
            );
          })}
        </CarouselRow>
      </div>
    </section>
  );
}
