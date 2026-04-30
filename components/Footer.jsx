import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.name}>Detour Sights</span>
          <p className={styles.tagline}>Discover things to do around the world.</p>
        </div>

        <nav className={styles.links} aria-label="Footer navigation">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </nav>
      </div>

      <div className={styles.bottom}>
        <p>&copy; {year} Detour Sights. All rights reserved.</p>
      </div>
    </footer>
  );
}
