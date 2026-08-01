import Image from 'next/image';
import prisma from '@/lib/prisma';
import CarouselRow from '@/components/CarouselRow';
import CarouselPlaceLink from './CarouselPlaceLink';
import styles from './DestinationPlacesCarousel.module.css';

export default async function DestinationPlacesCarousel({ destinationId, destinationSlug, destinationName, excludePlaceId, excludePlaceSlug }) {
  const places = await prisma.place.findMany({
    where: {
      destinationId,
      NOT: { id: excludePlaceId },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      coverImage: { select: { url: true } },
      destination: { select: { coverImage: { select: { url: true } } } },
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
              <CarouselPlaceLink
                key={p.id}
                href={`/${destinationSlug}/${p.slug}`}
                className={styles.card}
                fromPlaceSlug={excludePlaceSlug}
                toPlaceSlug={p.slug}
                destinationSlug={destinationSlug}
              >
                <div className={styles.imageWrap}>
                  {(p.coverImage?.url ?? p.destination.coverImage?.url) ? (
                    <Image
                      src={p.coverImage?.url ?? p.destination.coverImage?.url}
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
              </CarouselPlaceLink>
            );
          })}
        </CarouselRow>
      </div>
    </section>
  );
}
