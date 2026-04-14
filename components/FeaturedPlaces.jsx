import prisma from '@/lib/db';
import Image from 'next/image';
import Link from 'next/link';
import CarouselRow from '@/components/CarouselRow';
import styles from './FeaturedPlaces.module.css';

/**
 * Server component — queries FeaturedPlace ordered by position.
 * @param {number} take - How many to show (default 5, max 10).
 */
export default async function FeaturedPlaces({ take = 5 }) {
  const rows = await prisma.featuredPlace.findMany({
    orderBy: { position: 'asc' },
    take,
    include: {
      place: {
        select: {
          id: true,
          name: true,
          slug: true,
          coverImageUrl: true,
          destination: { select: { slug: true, name: true } },
        },
      },
    },
  });

  if (!rows.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>Top Places</h2>
        <CarouselRow>
          {rows.map(({ place: p }) => (
            <Link key={p.id} href={`/${p.destination.slug}/${p.slug}`} className={styles.card}>
              <div className={styles.imageWrap}>
                {p.coverImageUrl ? (
                  <Image
                    src={p.coverImageUrl}
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
                <p className={styles.cardName}>{p.name}</p>
                <p className={styles.cardLocation}>{p.destination.name}</p>
              </div>
            </Link>
          ))}
        </CarouselRow>
      </div>
    </section>
  );
}
