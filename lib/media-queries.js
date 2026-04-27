'use client';
import { useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';

/**
 * Returns false on the server and during initial hydration, then updates to
 * the real value after mount — preventing SSR/client hydration mismatches.
 */
function useHydratedMediaQuery(query) {
  const matches = useMediaQuery({ query });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated ? matches : false;
}

export function useIsLaptopOrSmaller() {
  return useHydratedMediaQuery('(max-width: 1023px)'); /* --laptop breakpoint (app/globals.css) */
}

export function useIsTabletOrSmaller() {
  return useHydratedMediaQuery('(max-width: 767px)'); /* --tablet breakpoint (app/globals.css) */
}

export function useIsLargeMobileOrSmaller() {
  return useHydratedMediaQuery('(max-width: 559px)'); /* --lgMobile breakpoint (app/globals.css) */
}

export function useIsMobile() {
  return useHydratedMediaQuery('(max-width: 479px)'); /* --mobile breakpoint (app/globals.css) */
}
