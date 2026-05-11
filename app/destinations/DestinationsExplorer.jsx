'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getRegion } from './regions';
import styles from './DestinationsExplorer.module.css';

const REGIONS = ['All', 'Europe', 'Asia', 'Americas', 'Africa', 'Middle East', 'Oceania'];

export default function DestinationsExplorer({ destinations }) {
  const [region, setRegion] = useState('All');
  const [query, setQuery]   = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return destinations.filter((d) => {
      const matchesRegion = region === 'All' || getRegion(d.country) === region;
      const matchesQuery  = !q || d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q);
      return matchesRegion && matchesQuery;
    });
  }, [destinations, region, query]);

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              className={styles.search}
              placeholder="Search destinations or countries…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search destinations"
            />
          </div>
          <div className={styles.pillRow} role="group" aria-label="Filter by region">
            {REGIONS.map((r) => (
              <button
                key={r}
                className={`${styles.pill} ${region === r ? styles.pillActive : ''}`}
                onClick={() => setRegion(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <p className={styles.count}>
          {filtered.length} destination{filtered.length !== 1 ? 's' : ''}
          {region !== 'All' && ` in ${region}`}
          {query && ` matching "${query}"`}
        </p>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No destinations found</p>
            <p className={styles.emptyBody}>Try a different search or region.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((d) => (
              <Link key={d.id} href={`/${d.slug}`} className={styles.card}>
                <div className={styles.imageWrap}>
                  {d.coverImageUrl ? (
                    <Image
                      src={d.coverImageUrl}
                      alt={d.name}
                      fill
                      className={styles.image}
                      sizes="(max-width: 479px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                    />
                  ) : (
                    <div className={styles.placeholder} />
                  )}
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardName}>{d.name}</p>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardCountry}>{d.country}</span>
                    {d._count.places > 0 && (
                      <span className={styles.cardPlaces}>
                        {d._count.places} place{d._count.places !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
