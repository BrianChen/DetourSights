'use client';
import { useState } from 'react';
import Image from 'next/image';
import styles from './PlacesFilter.module.css';

export default function PlacesFilter({ places, destinationSlug }) {
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

  function toggle(slug) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  const filtered = selected.size === 0
    ? places
    : places.filter(p => p.categories.some(({ category }) => selected.has(category.slug)));

  return (
    <>
      <div className={styles.filterBar} role="group" aria-label="Filter by category">
        {categories.map(cat => (
          <button
            key={cat.slug}
            className={`${styles.pill} ${selected.has(cat.slug) ? styles.pillActive : ''}`}
            onClick={() => toggle(cat.slug)}
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
          <a key={place.id} href={`/${destinationSlug}/${place.slug}`} className={styles.card}>
            <div className={styles.imageWrap}>
              <Image
                src={place.coverImageUrl || '/place-placeholder.jpg'}
                alt={place.name}
                fill
                className={styles.image}
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.placeName}>{place.name}</h2>
              {place.description && <p className={styles.placeDesc}>{place.description}</p>}
              <div className={styles.tags}>
                {place.categories.map(({ category }) => (
                  <span key={category.id} className={styles.tag}>
                    {category.icon} {category.name}
                  </span>
                ))}
                {place.priceRange && <span className={styles.price}>{place.priceRange}</span>}
              </div>
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
