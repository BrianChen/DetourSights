'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './NearbyDestinations.module.css';
import {
  useIsLaptopOrSmaller,
  useIsTabletOrSmaller,
  useIsLargeMobileOrSmaller,
  useIsMobile,
} from '@/lib/media-queries';

export function NearbyDestinations({ id, latitude, longitude }) {
  const [destinations, setDestinations] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState(null); // 'left' | 'right'

  const isLaptop   = useIsLaptopOrSmaller();
  const isTablet   = useIsTabletOrSmaller();
  const isLgMobile = useIsLargeMobileOrSmaller();
  const isMobile   = useIsMobile();

  // Compute visible column count — most restrictive breakpoint wins.
  let visibleCount = 5;
  if (isLaptop)   visibleCount = 4;
  if (isTablet)   visibleCount = 3;
  if (isLgMobile) visibleCount = 2;
  if (isMobile)   visibleCount = 1;

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    fetch(`/api/nearby?type=destination&lat=${latitude}&long=${longitude}&excludeId=${id}`)
      .then((r) => r.json())
      .then((data) => setDestinations(data));
  }, [id, latitude, longitude]);

  if (destinations.length === 0) return null;

  // Clamp so a window resize never strands us past the valid range.
  const effectiveStart = Math.min(startIndex, Math.max(0, destinations.length - visibleCount));
  const hasPrev = effectiveStart > 0;
  const hasNext = effectiveStart + visibleCount < destinations.length;
  const visible = destinations.slice(effectiveStart, effectiveStart + visibleCount);

  function navigate(dir) {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setStartIndex((i) => i + (dir === 'right' ? 1 : -1));
      setAnimating(false);
    }, 300);
  }

  const animClass = animating
    ? direction === 'right' ? styles.slideOutLeft : styles.slideOutRight
    : direction === 'right' ? styles.slideInFromRight : styles.slideInFromLeft;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Nearby Destinations</h2>
      <div className={styles.carousel}>
        {hasPrev && (
          <button className={`${styles.arrowBtn} ${styles.arrowLeft}`} onClick={() => navigate('left')} aria-label="Previous">
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
        )}
        <div className={styles.viewport}>
          <div
            className={`${styles.row} ${animClass}`}
            style={{ '--nearby-cols': visibleCount }}
          >
            {visible.map((d) => (
              <Link key={d.id} href={`/${d.slug}`} className={styles.card}>
                <div className={styles.imageWrap}>
                  {d.coverImageUrl ? (
                    <Image
                      src={d.coverImageUrl}
                      alt={d.name}
                      fill
                      className={styles.image}
                      sizes="(max-width: 767px) 50vw, 20vw" /* 767px = --tablet breakpoint (app/globals.css) */
                    />
                  ) : (
                    <div className={styles.placeholder} />
                  )}
                  <span className={styles.badge}>{Math.round(d.distanceMiles)} mi</span>
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardName}>{d.name}</p>
                  <p className={styles.cardCountry}>{d.country}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        {hasNext && (
          <button className={`${styles.arrowBtn} ${styles.arrowRight}`} onClick={() => navigate('right')} aria-label="Next">
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </section>
  );
}
