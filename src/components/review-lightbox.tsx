'use client';

import { useState, useEffect, useCallback } from 'react';

interface ReviewLightboxProps {
  images: string[];
  initialIndex?: number;
  customerName?: string;
  reviewTitle?: string;
  onClose: () => void;
}

export default function ReviewLightbox({
  images,
  initialIndex = 0,
  customerName,
  reviewTitle,
  onClose,
}: ReviewLightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    setIndex(Math.min(Math.max(0, initialIndex), images.length - 1));
  }, [initialIndex, images.length]);

  const handlePrev = useCallback(() => {
    setIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, handlePrev, handleNext]);

  if (!images || images.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Review photo viewer"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Container - Stop propagation so clicking inside image area doesn't close modal */}
      <div
        className="relative flex flex-col items-center justify-center max-h-full max-w-5xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar with image counter and close button */}
        <div className="flex w-full items-center justify-between px-2 py-3 text-white">
          <div className="flex items-center gap-3">
            {images.length > 1 && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wider text-white backdrop-blur-sm">
                {index + 1} / {images.length}
              </span>
            )}
            {customerName && (
              <span className="text-sm font-medium text-white/90">
                Photo by {customerName}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo preview"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/25 hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Main image view with previous & next controls */}
        <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-black/40 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[index]}
            alt={reviewTitle ? `${reviewTitle} - Photo ${index + 1}` : `Customer review photo ${index + 1}`}
            className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-2xl transition-all duration-300 select-none"
          />

          {images.length > 1 && (
            <>
              {/* Prev button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white/90 backdrop-blur-sm transition hover:bg-black/80 hover:text-white hover:scale-105"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Next button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white/90 backdrop-blur-sm transition hover:bg-black/80 hover:text-white hover:scale-105"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Thumbnail carousel strip below if multiple images */}
        {images.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2 overflow-x-auto p-1">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`relative h-14 w-14 overflow-hidden rounded-lg transition-all ${
                  i === index
                    ? 'ring-2 ring-forest-400 ring-offset-2 ring-offset-black scale-105'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`Thumbnail ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Caption */}
        {reviewTitle && (
          <p className="mt-2 text-center text-xs font-medium text-white/70">
            "{reviewTitle}"
          </p>
        )}
      </div>
    </div>
  );
}
