'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

export default function CarouselPlaceLink({ href, fromPlaceSlug, toPlaceSlug, destinationSlug, className, children }) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackEvent('carousel_click', {
        from_place: fromPlaceSlug,
        to_place: toPlaceSlug,
        destination: destinationSlug,
        source: 'place_page_carousel',
      })}
    >
      {children}
    </Link>
  );
}
