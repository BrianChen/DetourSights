'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import HeaderMenu from '@/components/HeaderMenu';
import { useIsLaptopOrSmaller } from '@/lib/media-queries';

/**
 * @param {{ label: string, href: string }[]} destinations
 * @param {{ label: string, href: string }[]} places
 */
export default function HeaderClient({ destinations, places }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [heroSearchScrolledPast, setIsHomePageSearchBarInViewport] = useState(false);
  const isLaptopOrSmaller = useIsLaptopOrSmaller();

  useEffect(() => {
    if (!isHomePage) return;

    const check = () => {
      const el = document.getElementById('hero-search');
      const header = document.querySelector('header');
      if (!el) return;
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      setIsHomePageSearchBarInViewport(el.getBoundingClientRect().top < headerBottom);
    };

    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, [isHomePage]);

  // Menu only on homepage while hero search is still visible, and not on tablet/mobile
  const showMenu = isHomePage && !heroSearchScrolledPast && !isLaptopOrSmaller;
  // Compact search when hero search is out of view (scrolled past or non-homepage), and not on tablet/mobile
  const showSearch = (heroSearchScrolledPast || !isHomePage) && !isLaptopOrSmaller;

  return (
    <AnimatePresence mode="wait">
      {showMenu ? (
        <motion.div
          key="menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <HeaderMenu destinations={destinations} places={places} />
        </motion.div>
      ) : showSearch ? (
        <motion.div
          key="search-inline"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <SearchBar compact />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
