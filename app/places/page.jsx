import Image from 'next/image';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import PlacesFilterBar from './PlacesFilterBar';
import PlacesPagination from './PlacesPagination';
import styles from './page.module.css';

export const metadata = {
  title: 'All Places | DetourSights',
  description: 'Browse 1,000+ places on DetourSights — top sights, restaurants, nature spots, nightlife, and hidden gems across 91 destinations.',
  alternates: {
    canonical: 'https://www.detoursights.com/places',
  },
};

const PAGE_SIZE = 24;

const PRICE_LABEL = {
  FREE:          'Free',
  BUDGET:        '$',
  MODERATE:      '$$',
  EXPENSIVE:     '$$$',
  VERY_EXPENSIVE: '$$$$',
};

export default async function PlacesPage({ searchParams }) {
  const { category, q, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  const where = {};
  if (category && category !== 'all') {
    where.categories = { some: { category: { slug: category } } };
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { destination: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [places, total] = await Promise.all([
    prisma.place.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        coverImageUrl: true,
        priceRange: true,
        destination: { select: { name: true, slug: true, coverImage: { select: { url: true } } } },
        categories: {
          take: 1,
          select: { category: { select: { name: true, icon: true } } },
        },
        aiGenData: { select: { description: true } },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.place.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main>
      <div className={styles.pageHeader}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>All Places</h1>
          <p className={styles.subtitle}>{total.toLocaleString()} places around the world</p>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.inner}>
          <PlacesFilterBar category={category} q={q} />

          {places.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No places found</p>
              <p className={styles.emptyBody}>Try a different search or category.</p>
            </div>
          ) : (
            <>
              <p className={styles.count}>
                {total.toLocaleString()} place{total !== 1 ? 's' : ''}
                {category && category !== 'all' && ` · page ${page} of ${totalPages}`}
                {!category && page > 1 && ` · page ${page} of ${totalPages}`}
              </p>
              <div className={styles.grid}>
                {places.map((p) => {
                  const cat = p.categories[0]?.category;
                  return (
                    <Link
                      key={p.id}
                      href={`/${p.destination.slug}/${p.slug}`}
                      className={styles.card}
                    >
                      <div className={styles.imageWrap}>
                        {(p.coverImageUrl ?? p.destination.coverImage?.url) ? (
                          <Image
                            src={p.coverImageUrl ?? p.destination.coverImage?.url}
                            alt={p.name}
                            fill
                            className={styles.image}
                            sizes="(max-width: 479px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                          />
                        ) : (
                          <div className={styles.placeholder} />
                        )}
                      </div>
                      <div className={styles.cardBody}>
                        {cat && (
                          <span className={styles.categoryPill}>
                            {cat.icon} {cat.name}
                          </span>
                        )}
                        <p className={styles.cardName}>{p.name}</p>
                        <div className={styles.cardMeta}>
                          <span className={styles.cardLocation}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                            {p.destination.name}
                          </span>
                          {p.priceRange && (
                            <span className={styles.price}>{PRICE_LABEL[p.priceRange]}</span>
                          )}
                        </div>
                        {p.aiGenData?.description && (
                          <p className={styles.cardDescription}>{p.aiGenData.description}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <PlacesPagination
                  page={page}
                  totalPages={totalPages}
                  category={category}
                  q={q}
                />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
