import prisma from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import CarouselRow from '@/components/CarouselRow';
import styles from './FeaturedDestinations.module.css';

/**
 * Server component — queries FeaturedDestination ordered by position.
 * @param {number} take - How many to show (default 5, max 10).
 */
export default async function FeaturedDestinations({ take = 5 }) {
  const rows = await prisma.featuredDestination.findMany({
    orderBy: { position: 'asc' },
    take,
    include: {
      destination: {
        select: { id: true, name: true, country: true, slug: true, coverImageUrl: true },
      },
    },
  });

  if (!rows.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>Featured Destinations</h2>
        <CarouselRow>
          {rows.map(({ destination: d }) => (
            <Link key={d.id} href={`/${d.slug}`} className={styles.card}>
              <div className={styles.imageWrap}>
                {d.coverImageUrl ? (
                  <Image
                    src={d.coverImageUrl}
                    alt={d.name}
                    fill
                    className={styles.image}
                    sizes="(max-width: 900px) 50vw, 20vw"
                  />
                ) : (
                  <div className={styles.placeholder} />
                )}
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardName}>{d.name}</p>
                <p className={styles.cardCountry}>{d.country}</p>
              </div>
            </Link>
          ))}
        </CarouselRow>
      </div>
    </section>
  );
}
