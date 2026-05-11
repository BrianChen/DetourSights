'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, MapPin, ChevronDown } from 'lucide-react';
import styles from './HeaderMenu.module.css';

/**
 * @param {{ label: string, href: string }[]} destinations - Top featured destinations
 * @param {{ label: string, href: string }[]} places - Top featured places
 */
export default function HeaderMenu({ destinations, places }) {
  const [menuState, setMenuState] = useState({ path: null, index: null });
  const navRef = useRef(null);
  const timeoutRef = useRef(null);
  const pathname = usePathname();

  // Derive activeMenu: only open if we're still on the path where it was opened
  const activeMenu = menuState.path === pathname ? menuState.index : null;

  const openMenu  = (index) => setMenuState({ path: pathname, index });
  const closeMenu = ()      => setMenuState({ path: null, index: null });

  const menuData = [
    {
      label: 'Destinations',
      icon: <MapPin size={16} />,
      sections: [
        { title: 'Top Destinations', items: destinations, viewAllHref: '/destinations' },
        { title: 'Top Places',       items: places,        viewAllHref: '/places' },
      ],
    },
  ];

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = (index) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    openMenu(index);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => closeMenu(), 150);
  };

  const handleDropdownEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <nav ref={navRef} className={styles.nav} onMouseLeave={handleMouseLeave}>
      <div className={styles.menuBar}>
        {menuData.map((item, index) => (
          <button
            key={item.label}
            onMouseEnter={() => handleMouseEnter(index)}
            onClick={() => activeMenu === index ? closeMenu() : openMenu(index)}
            className={`${styles.menuBtn} ${activeMenu === index ? styles.menuBtnActive : ''}`}
          >
            {item.icon}
            {item.label}
            <ChevronDown
              size={14}
              className={`${styles.chevron} ${activeMenu === index ? styles.chevronOpen : ''}`}
            />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {activeMenu !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={styles.backdrop}
              onClick={() => closeMenu()}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={styles.dropdown}
              onMouseEnter={handleDropdownEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className={styles.dropdownInner}>
                <div className={styles.dropdownHeader}>
                  <h2 className={styles.dropdownTitle}>{menuData[activeMenu].label}</h2>
                  <button className={styles.closeBtn} onClick={() => closeMenu()} aria-label="Close">
                    <X size={16} />
                  </button>
                </div>

                <div className={styles.sections}>
                  {menuData[activeMenu].sections.map((section) => (
                    <div key={section.title}>
                      <h3 className={styles.sectionTitle}>{section.title}</h3>
                      <div className={styles.sectionDivider} />
                      <div className={styles.itemGrid}>
                        {section.items.map((item) => (
                          <Link key={item.href} href={item.href} className={styles.item}>
                            <span>{item.label}</span>
                            <ChevronRight size={14} className={styles.itemChevron} />
                          </Link>
                        ))}
                      </div>
                      <div className={styles.sectionFooterDivider} />
                      <Link href={section.viewAllHref} className={styles.viewAll}>
                        View All <ChevronRight size={14} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
