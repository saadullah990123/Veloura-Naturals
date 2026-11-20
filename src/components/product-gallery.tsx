'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeImage = images[selectedIndex] || images[0] || '/images/product-placeholder-2.png';

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-forest-900/10 bg-forest-50 aspect-square relative">
        <Image
          src={activeImage}
          alt={productName}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-opacity duration-300"
          priority
          unoptimized={activeImage.startsWith('data:')}
        />
      </div>

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {images.slice(0, 4).map((src, i) => {
            const isSelected = selectedIndex === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                aria-label={`View photo ${i + 1}`}
                className={`overflow-hidden rounded-xl border aspect-square relative transition-all ${
                  isSelected
                    ? 'border-forest-600 ring-2 ring-forest-500/50 shadow-sm scale-102'
                    : 'border-forest-900/10 opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={src}
                  alt={`${productName} thumbnail ${i + 1}`}
                  fill
                  sizes="120px"
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
