'use client';

import { useState, useEffect } from 'react';
import StarRating from '@/components/star-rating';
import ReviewModal, { SubmittedReview } from '@/components/review-modal';
import ReviewLightbox from '@/components/review-lightbox';

export interface BaseReview {
  id: number | string;
  productId?: number | null;
  customerName: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  images?: string[] | null;
  status?: string;
  createdAt?: string | Date | null;
  isLocal?: boolean;
}

interface ReviewsSectionProps {
  initialReviews: BaseReview[];
}

const LOCAL_STORAGE_KEY = 'veloura_customer_reviews_v1';

// Initial sample customer photos to enrich starter reviews out-of-the-box
const SAMPLE_REVIEW_PHOTOS: Record<string, string[]> = {
  'Ayesha K.': ['/images/reviews/review-sample-1.jpg'],
  'Bilal R.': ['/images/reviews/review-sample-2.jpg'],
  'Sana M.': ['/images/reviews/review-sample-3.jpg'],
};

export default function ReviewsSection({ initialReviews }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<BaseReview[]>(() => {
    // Attach default preview photos to starter reviews if none present
    return initialReviews.map((r) => {
      const defaultPhotos = SAMPLE_REVIEW_PHOTOS[r.customerName];
      return {
        ...r,
        images: r.images && r.images.length > 0 ? r.images : defaultPhotos || [],
      };
    });
  });

  const [lightboxState, setLightboxState] = useState<{
    images: string[];
    index: number;
    customerName?: string;
    reviewTitle?: string;
  } | null>(null);

  const [recentNotification, setRecentNotification] = useState<string | null>(null);

  // Load persisted reviews from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: BaseReview[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReviews((prev) => {
            // Keep local reviews at the front, deduplicate by ID
            const existingIds = new Set(parsed.map((p) => String(p.id)));
            const nonDuplicates = prev.filter((p) => !existingIds.has(String(p.id)));
            return [...parsed, ...nonDuplicates];
          });
        }
      }
    } catch (e) {
      console.warn('Failed to parse reviews from localStorage:', e);
    }
  }, []);

  function handleNewReview(newReview: SubmittedReview) {
    const formattedReview: BaseReview = {
      ...newReview,
      isLocal: true,
    };

    setReviews((prev) => {
      const updated = [formattedReview, ...prev];
      // Save locally submitted reviews to localStorage
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        const currentLocals: BaseReview[] = stored ? JSON.parse(stored) : [];
        const newLocals = [formattedReview, ...currentLocals.filter((l) => l.id !== formattedReview.id)];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newLocals));
      } catch (e) {
        console.warn('Failed to save review to localStorage:', e);
      }
      return updated;
    });

    setRecentNotification(`Thanks ${formattedReview.customerName}! Your review was added live.`);
    setTimeout(() => {
      setRecentNotification(null);
    }, 6000);
  }

  function openImagePreview(
    images: string[],
    index: number,
    customerName?: string,
    reviewTitle?: string | null
  ) {
    setLightboxState({
      images,
      index,
      customerName,
      reviewTitle: reviewTitle || undefined,
    });
  }

  // Aggregate stats
  const totalCount = reviews.length;
  const avgRating =
    totalCount > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1)
      : '5.0';

  return (
    <section className="container-x py-20">
      {/* Live notification banner */}
      {recentNotification && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-forest-50 border border-forest-200 px-4 py-3 text-sm text-forest-800 animate-fade-up">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest-600 text-xs text-white font-bold">
              ✓
            </span>
            <span>{recentNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setRecentNotification(null)}
            className="text-xs text-forest-600 hover:text-forest-800 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header section with Stats & Write a Review CTA */}
      <div className="flex flex-wrap items-end justify-between gap-6 pb-6 border-b border-forest-900/10">
        <div>
          <span className="section-label">Real Results & Stories</span>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
            What customers are saying
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <StarRating rating={parseFloat(avgRating)} size={18} />
              <span className="font-semibold text-ink">{avgRating} out of 5</span>
            </div>
            <span className="text-ink/30">•</span>
            <span className="text-sm text-ink/60">
              Based on {totalCount} customer reviews
            </span>
          </div>
        </div>

        <ReviewModal onReviewSubmitted={handleNewReview} />
      </div>

      {/* Review Cards Grid */}
      {reviews.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-forest-900/20 p-12 text-center">
          <p className="text-lg font-medium text-ink">No customer reviews yet.</p>
          <p className="mt-1 text-sm text-ink/60">Be the first to share your experience with Veloura Naturals!</p>
          <div className="mt-5">
            <ReviewModal onReviewSubmitted={handleNewReview} />
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => {
            const hasImages = r.images && r.images.length > 0;
            const initials = r.customerName
              ? r.customerName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'U';

            return (
              <div
                key={r.id}
                className={`group flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition duration-200 hover:shadow-md ${
                  r.isLocal
                    ? 'border-forest-400/60 ring-1 ring-forest-400/30'
                    : 'border-forest-900/10'
                }`}
              >
                <div>
                  {/* Top line: Stars & Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <StarRating rating={r.rating} size={16} />
                    <div className="flex items-center gap-1.5">
                      {r.isLocal && (
                        <span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest-700">
                          Just added
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-forest-700 bg-forest-50 px-2 py-0.5 rounded-md">
                        <svg
                          className="h-3 w-3 text-forest-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified Buyer
                      </span>
                    </div>
                  </div>

                  {/* Title & Body */}
                  {r.title && (
                    <h4 className="mt-3 font-semibold text-ink leading-snug">
                      {r.title}
                    </h4>
                  )}
                  {r.body && (
                    <p className="mt-2 text-sm text-ink/75 leading-relaxed">
                      {r.body}
                    </p>
                  )}

                  {/* Customer Uploaded Images Thumbnail Grid */}
                  {hasImages && r.images && (
                    <div className="mt-4">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink/50">
                        Customer Photos ({r.images.length})
                      </p>
                      <div
                        className={`grid gap-2 ${
                          r.images.length === 1
                            ? 'grid-cols-1'
                            : r.images.length === 2
                            ? 'grid-cols-2'
                            : 'grid-cols-3'
                        }`}
                      >
                        {r.images.map((imgUrl, imgIdx) => (
                          <button
                            key={imgIdx}
                            type="button"
                            onClick={() =>
                              openImagePreview(r.images!, imgIdx, r.customerName, r.title)
                            }
                            aria-label={`Preview photo ${imgIdx + 1} by ${r.customerName}`}
                            className="group/img relative aspect-square w-full overflow-hidden rounded-xl border border-forest-900/10 bg-forest-50/50 transition duration-200 hover:opacity-90 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-forest-600"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgUrl}
                              alt={`Customer photo ${imgIdx + 1}`}
                              className="h-full w-full object-cover transition duration-300 group-hover/img:scale-105"
                              loading="lazy"
                            />
                            {/* Magnifying lens overlay on hover */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 backdrop-blur-[1px] transition duration-200 group-hover/img:opacity-100">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink shadow-md">
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                  />
                                </svg>
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: Customer Name & Avatar */}
                <div className="mt-5 flex items-center gap-3 pt-4 border-t border-forest-900/5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-100 text-xs font-bold text-forest-800">
                    {initials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">
                      {r.customerName}
                    </p>
                    <p className="text-[11px] text-ink/40">
                      {r.isLocal
                        ? 'Just now'
                        : r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString('en-GB', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Verified Purchase'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox for full-size photo preview */}
      {lightboxState && (
        <ReviewLightbox
          images={lightboxState.images}
          initialIndex={lightboxState.index}
          customerName={lightboxState.customerName}
          reviewTitle={lightboxState.reviewTitle}
          onClose={() => setLightboxState(null)}
        />
      )}
    </section>
  );
}
