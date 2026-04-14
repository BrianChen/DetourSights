import { motion } from "motion/react";
import styles from "./GalleryThumbnail.module.css";

export function GalleryThumbnails({
  images,
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
          alt="Thumbnail 1"
          className={styles.img}
        />
        <div className={styles.overlay} />
      </motion.button>

      {/* Right column with stacked images */}
      <div className={styles.rightCol}>
        {/* Top right image */}
        {displayImages[1] && (
          <motion.button
            onClick={() => onThumbnailClick(1)}
            className={styles.thumb}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={displayImages[1]}
              alt="Thumbnail 2"
              className={styles.img}
            />
            <div className={styles.overlay} />
          </motion.button>
        )}

        {/* Bottom right image with counter */}
        {displayImages[2] && (
          <motion.button
            onClick={() => onThumbnailClick(2)}
            className={styles.thumb}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={displayImages[2]}
              alt="Thumbnail 3"
              className={styles.img}
            />
            <div className={styles.overlay} />

            {/* Show count badge if there are more images */}
            {remainingCount > 0 && (
              <div className={styles.badge}>+{remainingCount}</div>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}
