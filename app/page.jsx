import SearchBar from '@/components/SearchBar';
import FeaturedDestinations from '@/components/FeaturedDestinations';
import FeaturedPlaces from '@/components/FeaturedPlaces';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <>
      <main className={styles.hero}>
        <div className={styles.overlay} />
        <div className={styles.content}>
          <h1 className={styles.headline}>Discover things to do</h1>
          <div id="hero-search">
            <SearchBar />
          </div>
        </div>
      </main>
      <FeaturedDestinations take={5} />
      <FeaturedPlaces take={5} />
    </>
  );
}
