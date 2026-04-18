import { motion } from "motion/react";
import styles from "./GalleryThumbnail.module.css";

export function GalleryThumbnails({
  images,
  label,
  thumbnailCount = 3,
  onThumbnailClick
}) {
  const displayImages = images.slice(0, thumbnailCount);
  const remainingCount = Math.max(0, images.length - thumbnailCount);

  return (
    <div className={styles.container}>
      {/* Large image on the left */}
      <motion.button
        onClick={() => onThumbnailClick(0)}
        className={styles.thumb}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.2 }}
      >
        <img
          src={displayImages[0]}
          alt={label ? `${label} — photo 1` : 'Photo 1'}
          className={styles.img}
        />
        <div className={styles.overlay} />
      </motion.button>

      {/* Right column with stacked images */}
      <div className={styles.rightCol}>
        {displayImages.slice(1).map((src, i) => {
          const index = i + 1;
          const isLast = index === displayImages.length - 1;
          return (
            <motion.button
              key={src}
              onClick={() => onThumbnailClick(index)}
              className={styles.thumb}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.2 }}
            >
              <img
                src={src}
                alt={label ? `${label} — photo ${index + 1}` : `Photo ${index + 1}`}
                className={styles.img}
              />
              <div className={styles.overlay} />
              {/* Show count badge on the last visible thumbnail if more exist */}
              {isLast && remainingCount > 0 && (
                <div className={styles.badge}>+{remainingCount}</div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
