'use client';

import { useState } from 'react';

export default function ReviewModal() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setErrorMsg('Please select a star rating.');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: name, rating, title, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }
      setStatus('done');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  function resetAndClose() {
    setOpen(false);
    setTimeout(() => {
      setRating(0);
      setName('');
      setTitle('');
      setBody('');
      setStatus('idle');
      setErrorMsg('');
    }, 300);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-outline">
        Write a Review
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
            {status === 'done' ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-forest-100 text-forest-600">
                  ✓
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  Thank you!
                </h3>
                <p className="mt-1.5 text-sm text-ink/60">
                  Your review has been submitted and will appear once approved.
                </p>
                <button onClick={resetAndClose} className="btn-primary mt-5">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-ink">
                    Share your experience
                  </h3>
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="text-ink/40 hover:text-ink"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-medium text-ink/60">
                    Your rating
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      >
                        <svg
                          width={28}
                          height={28}
                          viewBox="0 0 24 24"
                          fill={(hoverRating || rating) >= star ? '#c39642' : 'none'}
                          stroke="#c39642"
                          strokeWidth="1.5"
                        >
                          <polygon points="12 2 15.09 8.63 22 9.24 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.24 8.91 8.63 12 2" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-medium text-ink/60">
                    Your name
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
                    placeholder="e.g. Ayesha K."
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-medium text-ink/60">
                    Review title (optional)
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
                    placeholder="Sum it up in a few words"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-medium text-ink/60">
                    Your review (optional)
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
                    placeholder="What did you like about it?"
                  />
                </div>

                {errorMsg && (
                  <p className="mt-3 text-sm text-red-600">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="btn-primary mt-5 w-full disabled:opacity-60"
                >
                  {status === 'submitting' ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
