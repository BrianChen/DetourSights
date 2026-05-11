'use client';
import Link from 'next/link';
import styles from './PlacesPagination.module.css';

function buildHref(page, category, q) {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.set('category', category);
  if (q && q.trim()) params.set('q', q.trim());
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return `/places${qs ? '?' + qs : ''}`;
}

function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [];
  pages.push(1);
  if (current > 3) pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

export default function PlacesPagination({ page, totalPages, category, q }) {
  const pages = pageNumbers(page, totalPages);

  return (
    <nav className={styles.nav} aria-label="Pagination">
      {page > 1 ? (
        <Link href={buildHref(page - 1, category, q)} className={styles.arrow}>
          ← Prev
        </Link>
      ) : (
        <span className={`${styles.arrow} ${styles.disabled}`}>← Prev</span>
      )}

      <div className={styles.pages}>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
          ) : (
            <Link
              key={p}
              href={buildHref(p, category, q)}
              className={`${styles.page} ${p === page ? styles.pageActive : ''}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </Link>
          )
        )}
      </div>

      {page < totalPages ? (
        <Link href={buildHref(page + 1, category, q)} className={styles.arrow}>
          Next →
        </Link>
      ) : (
        <span className={`${styles.arrow} ${styles.disabled}`}>Next →</span>
      )}
    </nav>
  );
}
