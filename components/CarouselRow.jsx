'use client';
import { useState } from 'react';
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './CarouselRow.module.css';

/**
 * Wraps any set of cards in a paginated carousel with prev/next navigation
 * and slide animations — shows pageSize items at a time, shifting by one per click.
 * @param {number} pageSize - Cards visible at once (default 5).
 */
export default function CarouselRow({ children, pageSize = 5 }) {
  const items = React.Children.toArray(children);
  const [startIndex, setStartIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState(null);

  if (items.length === 0) return null;

  const hasPrev = startIndex > 0;
  const hasNext = startIndex + pageSize < items.length;
  const visible = items.slice(startIndex, startIndex + pageSize);

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
          style={{ '--carousel-page-size': pageSize }}
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
