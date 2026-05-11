'use client';
import { useState } from 'react';
import Image from 'next/image';
import { trackEvent } from '@/lib/analytics';
import styles from './PlacesFilter.module.css';

export default function PlacesFilter({ places, destinationSlug, destinationCoverImageUrl }) {
  const [selected, setSelected] = useState(new Set());

  // Derive unique categories from this destination's places only
  const categories = [];
  const seen = new Set();
  for (const place of places) {
    for (const { category } of place.categories) {
      if (!seen.has(category.slug)) {
        seen.add(category.slug);
        categories.push(category);
      }
    }
  }
  categories.sort((a, b) => a.name.localeCompare(b.name));

  function toggle(slug, name) {
    setSelected(prev => {
      const next = new Set(prev);
      const isAdding = !next.has(slug);
      isAdding ? next.add(slug) : next.delete(slug);
      if (isAdding) {
        trackEvent('place_category_filter_click', {
          category: slug,
          category_name: name,
          destination: destinationSlug,
          source: 'destination_page',
        });
      }
      return next;
    });
  }

  const filtered = selected.size === 0
    ? places
    : places.filter(p => p.categories.some(({ category }) => selected.has(category.slug)));

  return (
    <>
      <p className={styles.filterLabel}>Filters:</p>
      <div className={styles.filterBar} role="group" aria-label="Filter by category">
        {categories.map(cat => (
          <button
            key={cat.slug}
            className={`${styles.pill} ${selected.has(cat.slug) ? styles.pillActive : ''}`}
            onClick={() => toggle(cat.slug, cat.name)}
            aria-pressed={selected.has(cat.slug)}
          >
            {cat.icon && <span className={styles.icon}>{cat.icon}</span>}
            {cat.name}
          </button>
        ))}
        {selected.size > 0 && (
          <button className={styles.clearBtn} onClick={() => setSelected(new Set())}>
            Clear
          </button>
        )}
      </div>

      <p className={styles.count}>
        {filtered.length} {filtered.length === 1 ? 'place' : 'places'}
      </p>

      <div className={styles.grid}>
        {filtered.map(place => (
          <a key={place.id} id={`place-${place.slug}`} href={`/${destinationSlug}/${place.slug}`} className={styles.card}>
            <div className={styles.imageWrap}>
              {(place.coverImageUrl ?? destinationCoverImageUrl) && (
                <Image
                  src={place.coverImageUrl ?? destinationCoverImageUrl}
                  alt={place.name}
                  fill
                  className={styles.image}
                  sizes="(max-width: 767px) 100vw, 33vw" /* 767px = --tablet breakpoint (app/globals.css) */
                />
              )}
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.placeName}>{place.name}</h2>
              {place.aiGenData?.tagline && (
                <p className={styles.placeTagline}>{place.aiGenData.tagline}</p>
              )}
            </div>
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className={styles.empty}>No places found for the selected categories.</p>
      )}
    </>
  );
}
