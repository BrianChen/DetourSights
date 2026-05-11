'use client';
import { useRouter } from 'next/navigation';
import { useState, useRef, useTransition } from 'react';
import { trackEvent } from '@/lib/analytics';
import styles from './PlacesFilterBar.module.css';

const CATEGORIES = [
  { slug: 'all',                       name: 'All',                    icon: null  },
  { slug: 'sights-and-landmarks',      name: 'Sights & Landmarks',     icon: '🏛️' },
  { slug: 'food-and-drink',            name: 'Food & Drink',           icon: '🍽️' },
  { slug: 'nature-outdoors',           name: 'Nature & Outdoors',      icon: '🌿'  },
  { slug: 'arts-and-entertainment',    name: 'Arts & Entertainment',   icon: '🎭'  },
  { slug: 'activities-and-experiences',name: 'Activities',             icon: '🎯'  },
  { slug: 'nightlife',                 name: 'Nightlife',              icon: '🎶'  },
  { slug: 'shopping',                  name: 'Shopping',               icon: '🛍️' },
  { slug: 'neighborhoods',             name: 'Neighborhoods',          icon: '🏘️' },
];

function buildUrl(category, q) {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.set('category', category);
  if (q && q.trim()) params.set('q', q.trim());
  const qs = params.toString();
  return `/places${qs ? '?' + qs : ''}`;
}

export default function PlacesFilterBar({ category, q }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState(q || '');
  const debounceRef = useRef(null);

  const activeCategory = category || 'all';

  function handleCategory(slug) {
    if (slug !== 'all' && slug !== activeCategory) {
      const name = CATEGORIES.find((c) => c.slug === slug)?.name;
      trackEvent('place_category_filter_click', {
        category: slug,
        category_name: name,
        source: 'all_places_page',
      });
    }
    clearTimeout(debounceRef.current);
    startTransition(() => router.push(buildUrl(slug, inputValue)));
  }

  function handleSearch(e) {
    const val = e.target.value;
    setInputValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(() => router.push(buildUrl(activeCategory, val)));
    }, 400);
  }

  return (
    <div className={`${styles.bar} ${isPending ? styles.pending : ''}`}>
      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="search"
          className={styles.search}
          placeholder="Search places or destinations…"
          value={inputValue}
          onChange={handleSearch}
          aria-label="Search places"
        />
      </div>
      <div className={styles.pillRow} role="group" aria-label="Filter by category">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            className={`${styles.pill} ${activeCategory === cat.slug ? styles.pillActive : ''}`}
            onClick={() => handleCategory(cat.slug)}
          >
            {cat.icon && <span aria-hidden="true">{cat.icon}</span>}
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
