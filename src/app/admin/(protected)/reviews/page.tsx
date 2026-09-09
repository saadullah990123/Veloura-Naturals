'use client';

import { adminFetch } from '@/lib/admin-fetch';
import { useEffect, useState } from 'react';
import StarRating from '@/components/star-rating';

interface Review {
  id: number;
  customerName: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: 'pending' | 'approved' | 'hidden';
  createdAt: string;
}

const TABS = ['pending', 'approved', 'hidden'] as const;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>('pending');

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await adminFetch('/api/admin/reviews');
      if (!res.ok) throw new Error('Failed to load reviews');
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: number, status: string) {
    await adminFetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function deleteReview(id: number) {
    if (!confirm('Delete this review permanently?')) return;
    await adminFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    load();
  }

  const filtered = reviews.filter((r) => r.status === tab);

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Reviews</h1>
      <p className="mt-1 text-sm text-ink/50">Approve, hide, or delete customer reviews.</p>

      <div className="mt-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
              tab === t ? 'bg-forest-600 text-white' : 'bg-white text-ink/60 hover:bg-forest-50'
            }`}
          >
            {t} ({reviews.filter((r) => r.status === t).length})
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {loadError && (
          <div className="flex flex-col items-center gap-3 admin-card px-5 py-10 text-center">
            <p className="text-sm text-red-600">Couldn't load reviews. Please check your connection.</p>
            <button onClick={load} className="btn-outline">Retry</button>
          </div>
        )}
        {!loadError && loading && <p className="text-ink/40">Loading…</p>}
        {!loadError && !loading && filtered.length === 0 && (
          <p className="text-ink/40">No {tab} reviews.</p>
        )}
        {!loadError && filtered.map((r) => (
          <div key={r.id} className="admin-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <StarRating rating={r.rating} size={14} />
                {r.title && <h3 className="mt-2 font-semibold text-ink">{r.title}</h3>}
                {r.body && <p className="mt-1 text-sm text-ink/60">{r.body}</p>}
                <p className="mt-2 text-xs text-ink/40">
                  — {r.customerName} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {tab !== 'approved' && (
                  <button
                    onClick={() => updateStatus(r.id, 'approved')}
                    className="rounded-lg bg-forest-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest-700"
                  >
                    Approve
                  </button>
                )}
                {tab !== 'hidden' && (
                  <button
                    onClick={() => updateStatus(r.id, 'hidden')}
                    className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/60 hover:border-ink/30"
                  >
                    Hide
                  </button>
                )}
                <button
                  onClick={() => deleteReview(r.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
