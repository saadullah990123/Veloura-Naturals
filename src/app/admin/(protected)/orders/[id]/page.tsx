'use client';

import { adminFetch } from '@/lib/admin-fetch';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPKR } from '@/lib/utils';

interface OrderDetail {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  city: string | null;
  productName: string;
  unitPrice: string;
  quantity: number;
  deliveryFee: string;
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentProofUrl: string | null;
  transactionId: string | null;
  status: string;
  trackingNumber: string | null;
  courier: string | null;
  adminNotes: string | null;
  customerNotes: string | null;
  createdAt: string;
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUS_OPTIONS = ['unpaid', 'pending_verification', 'verified', 'failed'];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    const res = await adminFetch(`/api/admin/orders/${id}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleStatusUpdate() {
    if (!order) return;
    setSaving(true);
    setMessage('');
    const res = await adminFetch(`/api/admin/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: order.status,
        trackingNumber: order.trackingNumber || '',
        courier: order.courier || '',
        adminNotes: order.adminNotes || '',
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || 'Failed to update.');
      return;
    }
    setMessage('Order updated.');
  }

  async function handlePaymentStatusUpdate(paymentStatus: string) {
    if (!order) return;
    setOrder({ ...order, paymentStatus });
    await adminFetch(`/api/admin/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus }),
    });
  }

  if (loading) return <p className="text-ink/50">Loading…</p>;
  if (!order) return <p className="text-ink/50">Order not found.</p>;

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-forest-600 hover:underline">
        ← Back to Orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-mono font-display text-lg font-bold text-ink sm:text-2xl">{order.orderNumber}</h1>
        <span className="text-sm text-ink/40">
          Placed {new Date(order.createdAt).toLocaleString()}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* --------------------------------------------------- Customer info */}
        <div className="admin-card p-6 lg:col-span-1">
          <h2 className="font-semibold text-ink">Customer</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-ink/40">Name</dt><dd className="font-medium">{order.customerName}</dd></div>
            <div><dt className="text-ink/40">Phone</dt><dd className="font-medium">{order.phone}</dd></div>
            {order.email && <div><dt className="text-ink/40">Email</dt><dd className="font-medium">{order.email}</dd></div>}
            <div><dt className="text-ink/40">Address</dt><dd className="font-medium">{order.address}{order.city ? `, ${order.city}` : ''}</dd></div>
            {order.customerNotes && (
              <div><dt className="text-ink/40">Customer Notes</dt><dd className="font-medium">{order.customerNotes}</dd></div>
            )}
          </dl>
        </div>

        {/* ---------------------------------------------------- Order & pay */}
        <div className="admin-card p-6 lg:col-span-2">
          <h2 className="font-semibold text-ink">Order Details</h2>
          <div className="mt-4 flex items-center justify-between border-b border-ink/5 pb-3 text-sm">
            <span>{order.quantity} × {order.productName}</span>
            <span>{formatPKR(order.unitPrice)} each</span>
          </div>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-ink/60"><span>Delivery Fee</span><span>{formatPKR(order.deliveryFee)}</span></div>
            <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatPKR(order.total)}</span></div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink/60">Payment Method</label>
              <p className="text-sm font-medium uppercase">{order.paymentMethod.replace('_', ' ')}</p>
              {order.transactionId && (
                <p className="mt-1 text-xs text-ink/50">TRX ID: {order.transactionId}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink/60">Payment Status</label>
              <select
                value={order.paymentStatus}
                onChange={(e) => handlePaymentStatusUpdate(e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm capitalize"
              >
                {PAYMENT_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {order.paymentProofUrl && (
            <div className="mt-5">
              <label className="mb-1.5 block text-xs font-medium text-ink/60">Payment Proof</label>
              <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-forest-600 hover:underline">
                View uploaded proof →
              </a>
            </div>
          )}

          <div className="mt-8 border-t border-ink/10 pt-6">
            <h3 className="font-semibold text-ink">Fulfillment</h3>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink/60">Order Status</label>
                <select
                  value={order.status}
                  onChange={(e) => setOrder({ ...order, status: e.target.value })}
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm capitalize"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink/60">Courier</label>
                <input
                  value={order.courier || ''}
                  onChange={(e) => setOrder({ ...order, courier: e.target.value })}
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  placeholder="e.g. TCS, Leopards"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-ink/60">Tracking Number</label>
              <input
                value={order.trackingNumber || ''}
                onChange={(e) => setOrder({ ...order, trackingNumber: e.target.value })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-ink/60">Admin Notes (internal)</label>
              <textarea
                rows={2}
                value={order.adminNotes || ''}
                onChange={(e) => setOrder({ ...order, adminNotes: e.target.value })}
                className="w-full resize-none rounded-lg border border-ink/15 px-3 py-2 text-sm"
              />
            </div>

            {message && <p className="mt-3 text-sm text-forest-600">{message}</p>}

            <button onClick={handleStatusUpdate} disabled={saving} className="btn-primary mt-5 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Order Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
