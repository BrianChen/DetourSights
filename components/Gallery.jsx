import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import styles from "./Gallery.module.css";

export function Gallery({ images, currentIndex, onClose, onNext, onPrevious }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrevious();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, onNext, onPrevious]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.backdrop}
      onClick={onClose}
    >
      {/* Close button */}
      <button onClick={onClose} className={styles.closeBtn}>
        <X size={32} />
      </button>

      {/* Counter */}
      <div className={styles.counter}>
        {currentIndex + 1} / {images.length}
      </div>

      {/* Image + nav buttons */}
      <div className={styles.imageWrap} onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`Gallery image ${currentIndex + 1}`}
            className={styles.image}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className={styles.prevBtn}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={48} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className={styles.nextBtn}
          disabled={currentIndex === images.length - 1}
        >
          <ChevronRight size={48} />
        </button>
      </div>
    </motion.div>
  );
}
