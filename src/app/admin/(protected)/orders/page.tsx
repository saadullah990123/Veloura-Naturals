'use client';

import { adminFetch } from '@/lib/admin-fetch';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPKR } from '@/lib/utils';

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  total: string;
  createdAt: string;
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const STATUS_LABELS: Record<string, string> = {
  all: 'All',
  pending: 'Pending',
  confirmed: 'Confirmed (Packed)',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-forest-100 text-forest-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const url = filter === 'all' ? '/api/admin/orders' : `/api/admin/orders?status=${filter}`;
      const res = await adminFetch(url);
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function quickUpdateStatus(id: number, status: string) {
    await adminFetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Orders & Payments</h1>
      <p className="mt-1 text-sm text-ink/50">View and manage all customer orders.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {['all', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
              filter === s ? 'bg-forest-600 text-white' : 'bg-white text-ink/60 hover:bg-forest-50'
            }`}
          >
            {STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto admin-card">
        {loadError && (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <p className="text-sm text-red-600">Couldn't load orders. Please check your connection.</p>
            <button onClick={load} className="btn-outline">Retry</button>
          </div>
        )}

        {!loadError && (
        <>
        {/* ---------------------------------------------- Mobile: cards */}
        <div className="divide-y divide-ink/5 sm:hidden">
          {loading && <p className="px-5 py-8 text-center text-ink/40">Loading…</p>}
          {!loading && orders.length === 0 && (
            <p className="px-5 py-8 text-center text-ink/40">No orders found.</p>
          )}
          {orders.map((o) => (
            <div key={o.id} className="p-4">
              <div className="flex items-center justify-between">
                <Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-forest-700">
                  {o.orderNumber}
                </Link>
                <span className="font-medium">{formatPKR(o.total)}</span>
              </div>
              <p className="mt-1 text-sm text-ink/60">{o.customerName} · {o.phone}</p>
              <p className="mt-0.5 text-xs uppercase text-ink/40">{o.paymentMethod.replace('_', ' ')}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <select
                  value={o.status}
                  onChange={(e) => quickUpdateStatus(o.id, e.target.value)}
                  className={`rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize ${STATUS_COLORS[o.status]}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                  ))}
                </select>
                <Link href={`/admin/orders/${o.id}`} className="text-sm font-medium text-forest-600">
                  Manage →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* ---------------------------------------------- Desktop: table */}
        <table className="hidden w-full min-w-[900px] text-left text-sm sm:table">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
              <th className="px-5 py-3.5">Order #</th>
              <th className="px-5 py-3.5">Customer</th>
              <th className="px-5 py-3.5">Payment</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Total</th>
              <th className="px-5 py-3.5">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-ink/40">Loading…</td></tr>
            )}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-ink/40">No orders found.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-ink/5">
                <td className="px-5 py-4 font-mono font-medium text-forest-700">
                  <Link href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link>
                </td>
                <td className="px-5 py-4">
                  <p>{o.customerName}</p>
                  <p className="text-xs text-ink/40">{o.phone}</p>
                </td>
                <td className="px-5 py-4 uppercase text-xs font-semibold text-ink/50">
                  {o.paymentMethod.replace('_', ' ')}
                </td>
                <td className="px-5 py-4">
                  <select
                    value={o.status}
                    onChange={(e) => quickUpdateStatus(o.id, e.target.value)}
                    className={`rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize ${STATUS_COLORS[o.status]}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-4 font-medium">{formatPKR(o.total)}</td>
                <td className="px-5 py-4">
                  <Link href={`/admin/orders/${o.id}`} className="text-forest-600 hover:underline">
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
        )}
      </div>
    </div>
  );
}
