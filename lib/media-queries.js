'use client';
import { useSyncExternalStore } from 'react';

/**
 * Returns false on the server (prevents hydration mismatch), then subscribes
 * to the real media query on the client via useSyncExternalStore.
 */
function useMediaQuery(query) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useIsLaptopOrSmaller() {
  return useMediaQuery('(max-width: 1023px)'); /* --laptop breakpoint (app/globals.css) */
}

export function useIsTabletOrSmaller() {
  return useMediaQuery('(max-width: 767px)'); /* --tablet breakpoint (app/globals.css) */
}

export function useIsLargeMobileOrSmaller() {
  return useMediaQuery('(max-width: 559px)'); /* --lgMobile breakpoint (app/globals.css) */
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 479px)'); /* --mobile breakpoint (app/globals.css) */
}
