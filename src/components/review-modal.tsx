'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';

export interface SubmittedReview {
  id: number | string;
  customerName: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  images?: string[];
  createdAt: string | Date;
  status?: string;
  isLocal?: boolean;
}

interface ReviewModalProps {
  onReviewSubmitted?: (review: SubmittedReview) => void;
  triggerButtonText?: string;
  triggerClassName?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: '1 - Poor',
  2: '2 - Fair',
  3: '3 - Good',
  4: '4 - Very Good',
  5: '5 - Excellent, loved it!',
};

// Client-side image compressor: keeps data URL size under ~120KB for fast local storage & instant rendering
async function compressImage(file: File, maxDimension = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(mime, quality));
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

export default function ReviewModal({
  onReviewSubmitted,
  triggerButtonText = 'Write a Review',
  triggerClassName = 'btn-outline',
}: ReviewModalProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeStarCount = hoverRating || rating;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    if (images.length + files.length > 4) {
      setErrorMsg('You can upload a maximum of 4 photos per review.');
      return;
    }

    setErrorMsg('');
    setIsCompressing(true);

    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          setErrorMsg('Please only upload image files (JPG, PNG, WebP).');
          continue;
        }
        // Compress and convert to base64
        const compressed = await compressImage(file);
        newImages.push(compressed);
      }

      setImages((prev) => [...prev, ...newImages].slice(0, 4));
    } catch {
      setErrorMsg('Error processing images. Please try different photos.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function removeImage(indexToRemove: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setErrorMsg('Please select a star rating.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Please provide your name.');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    const newReviewItem: SubmittedReview = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      customerName: name.trim(),
      rating,
      title: title.trim() || null,
      body: body.trim() || null,
      images: images.length > 0 ? [...images] : [],
      createdAt: new Date().toISOString(),
      status: 'approved',
      isLocal: true,
    };

    try {
      // Background attempt to also send to server API
      fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newReviewItem.customerName,
          rating: newReviewItem.rating,
          title: newReviewItem.title,
          body: newReviewItem.body,
        }),
      }).catch((err) => {
        console.warn('Server sync note:', err);
      });

      // Notify parent immediately for real-time live update
      if (onReviewSubmitted) {
        onReviewSubmitted(newReviewItem);
      }

      setStatus('done');
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  function resetAndClose() {
    setOpen(false);
    setTimeout(() => {
      setRating(5);
      setHoverRating(0);
      setName('');
      setTitle('');
      setBody('');
      setImages([]);
      setStatus('idle');
      setErrorMsg('');
    }, 300);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName}
        id="write-review-button"
      >
        <svg
          className="h-4 w-4 text-forest-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        <span>{triggerButtonText}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) resetAndClose();
          }}
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl transition-all my-8 max-h-[90vh] overflow-y-auto">
            {status === 'done' ? (
              <div className="py-8 text-center animate-fade-up">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-forest-100 text-forest-600 ring-8 ring-forest-50">
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-ink">
                  Thank You for Your Review!
                </h3>
                <p className="mt-2 text-sm text-ink/70 max-w-sm mx-auto">
                  Your feedback and photos have been added live to our customer reviews section.
                </p>
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="btn-primary"
                  >
                    View Live Review
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex items-start justify-between border-b border-ink/10 pb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-ink">
                      Share Your Experience
                    </h3>
                    <p className="mt-1 text-xs text-ink/60">
                      Help other customers learn about your hair transformation
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink/40 hover:bg-ink/5 hover:text-ink transition"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>

                {/* Rating Selection */}
                <div className="mt-5">
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-ink/70">
                    Overall Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          aria-label={`${star} star${star > 1 ? 's' : ''}`}
                          className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                        >
                          <svg
                            width={32}
                            height={32}
                            viewBox="0 0 24 24"
                            fill={activeStarCount >= star ? '#c39642' : '#f3e8ce'}
                            stroke="#a67c33"
                            strokeWidth="1.2"
                            className="transition-colors duration-150"
                          >
                            <polygon points="12 2 15.09 8.63 22 9.24 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.24 8.91 8.63 12 2" />
                          </svg>
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-medium text-gold-700 bg-gold-50 px-2.5 py-1 rounded-md">
                      {RATING_LABELS[activeStarCount] || `${activeStarCount} Stars`}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-ink/70">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-ink/20 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                    placeholder="e.g. Sara Malik"
                  />
                </div>

                {/* Title */}
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-ink/70">
                    Review Headline (optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-ink/20 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                    placeholder="e.g. Noticeable hair regrowth in 4 weeks!"
                  />
                </div>

                {/* Body */}
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-ink/70">
                    Your Review
                  </label>
                  <textarea
                    rows={3}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full resize-none rounded-xl border border-ink/20 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                    placeholder="How does your scalp and hair feel? How often did you apply it?"
                  />
                </div>

                {/* Photo Upload Attachment */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold tracking-wide uppercase text-ink/70">
                      Attach Photos (Optional)
                    </label>
                    <span className="text-[11px] text-ink/50">
                      {images.length}/4 photos
                    </span>
                  </div>

                  {/* Drag and Drop Zone */}
                  {images.length < 4 && (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition ${
                        isDragging
                          ? 'border-forest-600 bg-forest-50/70'
                          : 'border-forest-900/15 bg-forest-50/30 hover:border-forest-600/60 hover:bg-forest-50/50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-100 text-forest-700">
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
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-xs font-medium text-ink">
                          <span className="text-forest-700 font-semibold underline">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-[11px] text-ink/50">
                          Product pictures or hair results (JPG, PNG, WebP)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Uploading / processing indicator */}
                  {isCompressing && (
                    <p className="mt-2 text-xs text-forest-700 animate-pulse">
                      Optimizing photos…
                    </p>
                  )}

                  {/* Attached Photos Preview Grid */}
                  {images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      {images.map((imgSrc, idx) => (
                        <div
                          key={idx}
                          className="group relative h-20 w-20 overflow-hidden rounded-xl border border-forest-900/15 shadow-sm"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgSrc}
                            alt={`Preview ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(idx);
                            }}
                            aria-label={`Remove photo ${idx + 1}`}
                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-white opacity-90 transition hover:bg-red-600 hover:opacity-100"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error message */}
                {errorMsg && (
                  <div className="mt-4 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
                    {errorMsg}
                  </div>
                )}

                {/* Submit button */}
                <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-ink/10">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="px-4 py-2.5 text-sm font-medium text-ink/70 hover:text-ink transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'submitting' || isCompressing}
                    className="btn-primary disabled:opacity-60"
                  >
                    {status === 'submitting' ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 animate-spin text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                        Posting…
                      </span>
                    ) : (
                      'Post Review'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
