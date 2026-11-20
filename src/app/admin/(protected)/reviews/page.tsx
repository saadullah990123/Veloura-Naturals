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

const TABS = ['all', 'pending', 'approved', 'hidden'] as const;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>('all');
  const [actionMessage, setActionMessage] = useState('');

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

  async function updateStatus(id: number, status: 'approved' | 'hidden' | 'pending') {
    try {
      const res = await adminFetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setActionMessage(
          status === 'approved'
            ? 'Review approved and published to storefront.'
            : 'Review unapproved and hidden from storefront.'
        );
        setTimeout(() => setActionMessage(''), 3500);
        load();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  async function deleteReview(id: number) {
    if (!confirm('Delete this review permanently from the database? This cannot be undone.')) return;
    try {
      const res = await adminFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setActionMessage('Review permanently deleted.');
        setTimeout(() => setActionMessage(''), 3500);
        load();
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  }

  const filtered =
    tab === 'all' ? reviews : reviews.filter((r) => r.status === tab);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Review Moderation</h1>
          <p className="mt-1 text-sm text-ink/50">
            Approve, unapprove, or delete customer reviews — approved reviews appear instantly on the live website.
          </p>
        </div>
      </div>

      {actionMessage && (
        <p className="mt-4 rounded-lg bg-forest-50 px-4 py-2 text-sm text-forest-700">
          {actionMessage}
        </p>
      )}

      {/* Status Filter Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count =
            t === 'all'
              ? reviews.length
              : reviews.filter((r) => r.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
                tab === t
                  ? 'bg-forest-600 text-white shadow-sm'
                  : 'bg-white text-ink/60 hover:bg-forest-50 border border-ink/10'
              }`}
            >
              {t} ({count})
            </button>
          );
        })}
      </div>

      {/* Reviews List */}
      <div className="mt-6 space-y-4">
        {loadError && (
          <div className="flex flex-col items-center gap-3 admin-card px-5 py-10 text-center">
            <p className="text-sm text-red-600">Couldn't load reviews. Please check your connection.</p>
            <button onClick={load} className="btn-outline">Retry</button>
          </div>
        )}
        {!loadError && loading && <p className="text-ink/40">Loading reviews…</p>}
        {!loadError && !loading && filtered.length === 0 && (
          <div className="admin-card p-8 text-center text-ink/40">
            No {tab === 'all' ? '' : tab} reviews found.
          </div>
        )}
        {!loadError &&
          filtered.map((r) => (
            <div key={r.id} className="admin-card p-5 transition hover:shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <StarRating rating={r.rating} size={15} />
                    {/* Status Badges */}
                    {r.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-forest-100 px-2.5 py-0.5 text-[11px] font-bold text-forest-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-forest-600" />
                        Approved (Live)
                      </span>
                    )}
                    {r.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
                        Pending Approval
                      </span>
                    )}
                    {r.status === 'hidden' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ink/10 px-2.5 py-0.5 text-[11px] font-bold text-ink/60">
                        Hidden
                      </span>
                    )}
                  </div>

                  {r.title && (
                    <h3 className="font-semibold text-ink text-base">{r.title}</h3>
                  )}
                  {r.body && (
                    <p className="text-sm text-ink/75 leading-relaxed">{r.body}</p>
                  )}
                  <p className="text-xs text-ink/40 pt-1">
                    By <span className="font-medium text-ink/60">{r.customerName}</span> ·{' '}
                    {new Date(r.createdAt).toLocaleDateString('en-GB', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Moderation Action Buttons */}
                <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-ink/5 pt-3 sm:border-0 sm:pt-0">
                  {r.status !== 'approved' && (
                    <button
                      onClick={() => updateStatus(r.id, 'approved')}
                      className="rounded-lg bg-forest-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-forest-700 active:scale-95 shadow-sm"
                    >
                      Approve
                    </button>
                  )}
                  {r.status === 'approved' && (
                    <button
                      onClick={() => updateStatus(r.id, 'hidden')}
                      className="rounded-lg border border-ink/20 px-3.5 py-1.5 text-xs font-semibold text-ink/70 transition hover:border-ink/40 hover:bg-forest-50/50 active:scale-95"
                    >
                      Unapprove / Hide
                    </button>
                  )}
                  {r.status === 'hidden' && (
                    <button
                      onClick={() => updateStatus(r.id, 'approved')}
                      className="rounded-lg bg-forest-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-forest-700 active:scale-95 shadow-sm"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="rounded-lg border border-red-200 px-3.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 active:scale-95"
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
