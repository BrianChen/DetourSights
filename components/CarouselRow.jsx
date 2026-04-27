'use client';
import { useState, useEffect } from 'react';
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './CarouselRow.module.css';
import {
  useIsLaptopOrSmaller,
  useIsTabletOrSmaller,
  useIsLargeMobileOrSmaller,
  useIsMobile,
} from '@/lib/media-queries';

/**
 * Wraps any set of cards in a paginated carousel with prev/next navigation
 * and slide animations — shows visibleCount items at a time, shifting by one per click.
 *
 * @param {number} pageSize       - Cards visible at once on desktop (default 5).
 * @param {object} responsiveCols - Per-breakpoint column overrides. Keys match breakpoints
 *                                  defined in app/globals.css: laptop (≤1023px), tablet (≤767px),
 *                                  lgMobile (≤559px), mobile (≤479px).
 *                                  Unspecified keys fall back to sensible defaults (tablet→2, mobile→1).
 *                                  Example: { laptop: 2, lgMobile: 1 }
 */
export default function CarouselRow({ children, pageSize = 5, responsiveCols }) {
  const isLaptop   = useIsLaptopOrSmaller();
  const isTablet   = useIsTabletOrSmaller();
  const isLgMobile = useIsLargeMobileOrSmaller();
  const isMobile   = useIsMobile();

  // Compute visible column count — most restrictive breakpoint wins.
  // Fallbacks (tablet→2, mobile→1) match the previous CSS-only defaults so
  // carousels without responsiveCols behave identically to before.
  let visibleCount = pageSize;
  if (isLaptop)   visibleCount = responsiveCols?.laptop   ?? pageSize;
  if (isTablet)   visibleCount = responsiveCols?.tablet   ?? 2;
  if (isLgMobile) visibleCount = responsiveCols?.lgMobile ?? visibleCount;
  if (isMobile)   visibleCount = responsiveCols?.mobile   ?? 1;

  const items = React.Children.toArray(children);
  const [startIndex, setStartIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState(null);

  // Reset to page 0 when visibleCount changes (e.g. window resize) so we
  // never get stranded at an index past the new valid range.
  useEffect(() => {
    setStartIndex(0);
  }, [visibleCount]);

  if (items.length === 0) return null;

  const hasPrev = startIndex > 0;
  const hasNext = startIndex + visibleCount < items.length;
  const visible = items.slice(startIndex, startIndex + visibleCount);

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
    <div className={styles.carousel}>
      {hasPrev && (
        <button
          className={`${styles.arrowBtn} ${styles.arrowLeft}`}
          onClick={() => navigate('left')}
          aria-label="Previous"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
      )}
      <div className={styles.viewport}>
        <div
          className={`${styles.row} ${animClass}`}
          style={{ '--carousel-page-size': visibleCount }}
        >
          {visible}
        </div>
      </div>
      {hasNext && (
        <button
          className={`${styles.arrowBtn} ${styles.arrowRight}`}
          onClick={() => navigate('right')}
          aria-label="Next"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
