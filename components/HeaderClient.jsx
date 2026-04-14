'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import HeaderMenu from '@/components/HeaderMenu';

/**
 * @param {{ label: string, href: string }[]} destinations
 * @param {{ label: string, href: string }[]} places
 */
export default function HeaderClient({ destinations, places }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setScrolledPast(false);
      return;
    }

    const check = () => {
      const el = document.getElementById('hero-search');
      const header = document.querySelector('header');
      if (!el) return;
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      setScrolledPast(el.getBoundingClientRect().top < headerBottom);
    };

    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, [isHome]);

  // Menu only on homepage before scrolling past the hero search
  const showMenu = isHome && !scrolledPast;
  // Compact search everywhere else: non-homepage, or homepage after scrolling past
  const showSearch = !isHome || scrolledPast;

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
