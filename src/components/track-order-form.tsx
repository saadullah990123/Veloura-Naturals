'use client';

import { useState } from 'react';
import { formatPKR } from '@/lib/utils';

interface OrderResult {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  productName: string;
  quantity: number;
  total: string;
  trackingNumber: string | null;
  courier: string | null;
  createdAt: string;
}

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function TrackOrderForm() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [results, setResults] = useState<OrderResult[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber && !phone) {
      setErrorMsg('Enter your order number or phone number.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');

    try {
      const params = new URLSearchParams();
      if (orderNumber) params.set('orderNumber', orderNumber);
      if (phone) params.set('phone', phone);

      const res = await fetch(`/api/track-order?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong.');
        setStatus('error');
        return;
      }

      if (data.orders.length === 0) {
        setErrorMsg('No orders found. Double-check your order number or phone.');
        setStatus('error');
        return;
      }

      setResults(data.orders);
      setStatus('done');
    } catch {
      setErrorMsg('Network error — please try again.');
      setStatus('error');
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-forest-900/10 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-8">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/60">Order Number</label>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. VL-7K2Q9X"
            className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/60">Phone Number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03XX XXXXXXX"
            className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
          />
        </div>
        <button type="submit" disabled={status === 'loading'} className="btn-primary disabled:opacity-60">
          {status === 'loading' ? 'Searching…' : 'Track Order'}
        </button>
      </form>

      {errorMsg && <p className="mt-4 text-sm text-red-600">{errorMsg}</p>}

      {status === 'done' && (
        <div className="mt-8 space-y-6">
          {results.map((order) => (
            <div key={order.orderNumber} className="rounded-2xl border border-forest-900/10 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-mono text-lg font-semibold text-forest-700">
                  {order.orderNumber}
                </h3>
                <span className="rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-700">
                  {STATUS_LABEL[order.status]}
                </span>
              </div>

              <p className="mt-2 text-sm text-ink/60">
                {order.quantity} × {order.productName} — {formatPKR(order.total)}
              </p>

              {order.status !== 'cancelled' && (
                <div className="mt-5 flex items-center">
                  {STATUS_STEPS.map((step, i) => {
                    const currentIdx = STATUS_STEPS.indexOf(order.status);
                    const reached = i <= currentIdx;
                    return (
                      <div key={step} className="flex flex-1 items-center last:flex-none">
                        <div className="flex flex-col items-center gap-1.5">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              reached ? 'bg-forest-600' : 'bg-ink/15'
                            }`}
                          />
                          <span className={`text-[10px] font-medium ${reached ? 'text-forest-700' : 'text-ink/30'}`}>
                            {STATUS_LABEL[step]}
                          </span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`mx-1 h-0.5 flex-1 ${reached ? 'bg-forest-600' : 'bg-ink/10'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {order.trackingNumber && (
                <p className="mt-4 text-sm text-ink/60">
                  Tracking: <span className="font-medium text-ink">{order.trackingNumber}</span>
                  {order.courier && ` via ${order.courier}`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
