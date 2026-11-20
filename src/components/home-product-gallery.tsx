'use client';

import { useState } from 'react';
import Image from 'next/image';

interface HomeProductGalleryProps {
  images?: string[] | null;
  productName: string;
}

export default function HomeProductGallery({
  images,
  productName,
}: HomeProductGalleryProps) {
  const fallbackImages = [
    '/images/image-1.jpg',
    '/images/image-2.jpg',
    '/images/image-3.png',
  ];

  const validImages =
    images && Array.isArray(images) && images.length > 0
      ? images.slice(0, 4)
      : fallbackImages;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentImage = validImages[selectedIndex] || validImages[0];

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-3xl border border-forest-900/10 bg-white shadow-xl">
        <div className="relative aspect-[4/3] w-full bg-forest-50/40">
          <Image
            src={currentImage}
            alt={`${productName} - Image ${selectedIndex + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-opacity duration-300"
            unoptimized={currentImage.startsWith('data:')}
          />
        </div>
      </div>

      {/* Thumbnail switcher for all 2 to 4 images */}
      {validImages.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          {validImages.map((src, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                aria-label={`View photo ${idx + 1}`}
                className={`relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-xl border transition-all ${
                  isSelected
                    ? 'border-forest-600 ring-2 ring-forest-500/50 shadow-md scale-105'
                    : 'border-forest-900/15 opacity-70 hover:opacity-100 hover:scale-[1.02]'
                }`}
              >
                <Image
                  src={src}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized={src.startsWith('data:')}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
