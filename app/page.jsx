import SearchBar from '@/components/SearchBar';
import FeaturedDestinations from '@/components/FeaturedDestinations';
import FeaturedPlaces from '@/components/FeaturedPlaces';
import PersonalizedSuggestions from '@/components/PersonalizedSuggestions';
import styles from './page.module.css';

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Detour Sights',
    url: 'https://www.detoursights.com',
    description: 'Discover the best things to do, places to eat, and hidden gems at destinations around the world.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className={styles.hero}>
        <div className={styles.overlay} />
        <div className={styles.content}>
          <h1 className={styles.headline}>Discover things to do</h1>
          <div id="hero-search">
            <SearchBar />
          </div>
        </div>
      </main>
      <PersonalizedSuggestions />
      <FeaturedDestinations take={5} />
      <FeaturedPlaces take={5} />
    </>
  );
}
