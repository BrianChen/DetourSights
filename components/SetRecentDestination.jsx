'use client';
import { useEffect } from 'react';

/** Renders nothing. Sets the recentDestination cookie on mount. */
export default function SetRecentDestination({ slug }) {
  useEffect(() => {
    document.cookie = `recentDestination=${slug}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
  }, [slug]);
  return null;
}
