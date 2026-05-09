import Image from 'next/image';
import styles from './PlaceHero.module.css';

export default function PlaceHero({ place, destinationSlug, priceLabel, avgRating }) {
  return (
    <section className={styles.hero}>
      {(place.coverImageUrl ?? place.destination.coverImageUrl) && (
        <Image
          src={place.coverImageUrl ?? place.destination.coverImageUrl}
          alt={place.name}
          fill
          className={styles.heroImage}
          priority
          sizes="100vw"
        />
      )}
      <div className={styles.heroOverlay} />
      <div className={styles.heroContent}>
        <div className={styles.heroInfo}>
          <div className={styles.breadcrumb}>
            <a id="breadcrumb-destination" href={`/${destinationSlug}`}>{place.destination.name}</a>
            <span> / </span>
            <span>{place.name}</span>
          </div>
          <h1 className={styles.name}>{place.name}</h1>
          {place.aiGenData?.tagline && (
            <p className={styles.heroTagline}>{place.aiGenData.tagline}</p>
          )}
          <div className={styles.meta}>
            <div className={styles.tags}>
              {place.categories.map(({ category }) => (
                <span key={category.id} className={styles.tag}>
                  {category.icon} {category.name}
                </span>
              ))}
              {priceLabel && (
                <span className={styles.price}>{priceLabel}</span>
              )}
            </div>
            {avgRating && (
              <span className={styles.rating}>★ {avgRating} ({place.reviews.length} reviews)</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
