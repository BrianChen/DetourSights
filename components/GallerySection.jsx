'use client';
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { GalleryThumbnails } from '@/components/GalleryThumbnail';
import { Gallery } from '@/components/Gallery';

export function GallerySection({ images, label }) {
  const [currentIndex, setCurrentIndex] = useState(null); // null = closed

  if (!images.length) return null;

  return (
    <>
      <GalleryThumbnails
        images={images}
        label={label}
        onThumbnailClick={(i) => setCurrentIndex(i)}
      />
      <AnimatePresence>
        {currentIndex !== null && (
          <Gallery
            images={images}
            label={label}
            currentIndex={currentIndex}
            onClose={() => setCurrentIndex(null)}
            onNext={() => setCurrentIndex((i) => Math.min(i + 1, images.length - 1))}
            onPrevious={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
          />
        )}
      </AnimatePresence>
    </>
  );
}
