'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatPKR } from '@/lib/utils';

interface Props {
  productId: number;
  unitPrice: number;
  deliveryFee: number;
  freeDeliveryThreshold: number | null;
  payment: {
    meezanAccountTitle?: string | null;
    meezanAccountNumber?: string | null;
    meezanIban?: string | null;
    meezanBankName?: string | null;
    easypaisaAccountTitle?: string | null;
    easypaisaNumber?: string | null;
  };
}

type PaymentMethod = 'cod' | 'meezan_bank' | 'easypaisa';

export default function OrderForm({
  productId,
  unitPrice,
  deliveryFee,
  freeDeliveryThreshold,
  payment,
}: Props) {
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [transactionId, setTransactionId] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const subtotal = unitPrice * quantity;
  const effectiveDeliveryFee =
    freeDeliveryThreshold && subtotal >= freeDeliveryThreshold ? 0 : deliveryFee;
  const total = subtotal + effectiveDeliveryFee;
  // Note: this is a live preview only — the server independently recalculates
  // the real total from the database price at order-creation time.

  async function handleCopy() {
    if (!orderNumber) return;
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const form = new FormData(e.currentTarget);
    const customerName = form.get('customerName')?.toString().trim();
    const phone = form.get('phone')?.toString().trim();
    const email = form.get('email')?.toString().trim() || undefined;
    const address = form.get('address')?.toString().trim();
    const city = form.get('city')?.toString().trim() || undefined;
    const customerNotes = form.get('customerNotes')?.toString().trim() || undefined;

    const payload = {
      customerName,
      phone,
      email,
      address,
      city,
      productId,
      quantity,
      paymentMethod,
      transactionId: paymentMethod === 'easypaisa' ? (transactionId.trim() || undefined) : undefined,
      customerNotes,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong placing your order.');
        setStatus('error');
        return;
      }
      setOrderNumber(data.order.orderNumber);
      setStatus('done');
    } catch {
      setErrorMsg('Network error — please check your connection and try again.');
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-forest-200 bg-forest-50 p-6 text-center sm:p-8">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-forest-600 text-white shadow-md">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-2xl font-bold text-ink">
          Order Placed Successfully!
        </h3>
        <p className="mt-2 text-sm font-medium text-forest-800">
          Thank you! Please save this Order ID to track your order status.
        </p>

        {/* 1-Click Copy Order ID box */}
        <div className="my-5 inline-flex max-w-full flex-wrap items-center justify-center gap-3 rounded-xl border border-forest-300 bg-white px-4 py-2.5 shadow-sm">
          <span className="font-mono text-lg font-bold tracking-wider text-forest-700">
            {orderNumber}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
              copied
                ? 'bg-forest-700 text-white shadow-inner'
                : 'bg-forest-600 text-white hover:bg-forest-700 shadow-sm'
            }`}
            aria-label={copied ? 'Order ID Copied' : 'Copy Order ID to clipboard'}
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <p className="mt-1 text-xs text-ink/60">
          We'll contact you shortly to confirm your delivery details.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href={`/track-order?orderNumber=${encodeURIComponent(orderNumber)}`}
            className="btn-primary text-xs sm:text-sm"
          >
            Track Order Status
          </Link>
          <Link href="/" className="btn-outline text-xs sm:text-sm">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-forest-900/10 p-6 sm:p-8">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink/60">Full Name</label>
        <input
          name="customerName"
          required
          className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
          placeholder="Your full name"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/60">Phone Number</label>
          <input
            name="phone"
            required
            type="tel"
            className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
            placeholder="03XX XXXXXXX"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/60">City (optional)</label>
          <input
            name="city"
            className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
            placeholder="e.g. Rawalpindi"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink/60">Email Address (optional)</label>
        <input
          name="email"
          type="email"
          className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
          placeholder="name@example.com (for order receipt)"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink/60">Delivery Address</label>
        <textarea
          name="address"
          required
          rows={2}
          className="w-full resize-none rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
          placeholder="House #, street, area"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink/60">Quantity</label>
        <div className="inline-flex items-center rounded-lg border border-ink/15">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3.5 py-2 text-lg text-ink/60 hover:text-ink"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            className="px-3.5 py-2 text-lg text-ink/60 hover:text-ink"
          >
            +
          </button>
        </div>
      </div>

      {/* ------------------------------------------------ Payment method */}
      <div>
        <label className="mb-2 block text-xs font-medium text-ink/60">Payment Method</label>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              { id: 'cod', label: 'Cash on Delivery' },
              { id: 'meezan_bank', label: 'Meezan Bank' },
              { id: 'easypaisa', label: 'EasyPaisa' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPaymentMethod(m.id)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                paymentMethod === m.id
                  ? 'border-forest-600 bg-forest-50 text-forest-700'
                  : 'border-ink/15 text-ink/60 hover:border-ink/30'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {paymentMethod === 'meezan_bank' && (
          <div className="mt-3 rounded-lg bg-forest-50 p-4 text-sm text-ink/70">
            <p><span className="font-medium">Account Title:</span> {payment.meezanAccountTitle || '—'}</p>
            <p><span className="font-medium">Bank:</span> {payment.meezanBankName || 'Meezan Bank'}</p>
            <p><span className="font-medium">Account Number:</span> {payment.meezanAccountNumber || '—'}</p>
            <p><span className="font-medium">IBAN:</span> {payment.meezanIban || '—'}</p>
            <p className="mt-2 text-xs text-ink/50">
              After transferring, our team will verify payment before shipping. You can share your
              transaction screenshot via WhatsApp with your order number.
            </p>
          </div>
        )}

        {paymentMethod === 'easypaisa' && (
          <div className="mt-3 rounded-lg bg-forest-50 p-4 text-sm text-ink/70">
            <p><span className="font-medium">Account Title:</span> {payment.easypaisaAccountTitle || '—'}</p>
            <p><span className="font-medium">Mobile Number:</span> {payment.easypaisaNumber || '—'}</p>
            <div className="mt-3">
              <label className="mb-1.5 block text-xs font-medium text-ink/60">
                Transaction ID (TRX ID)
              </label>
              <input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
                placeholder="e.g. 123456789"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink/60">Order Notes (optional)</label>
        <textarea
          name="customerNotes"
          rows={2}
          className="w-full resize-none rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
          placeholder="Anything we should know?"
        />
      </div>

      {/* --------------------------------------------------------- Totals */}
      <div className="space-y-1.5 border-t border-ink/10 pt-4 text-sm">
        <div className="flex justify-between text-ink/60">
          <span>Subtotal</span>
          <span>{formatPKR(subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink/60">
          <span>Delivery</span>
          <span>{effectiveDeliveryFee === 0 ? 'Free' : formatPKR(effectiveDeliveryFee)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold text-ink">
          <span>Total</span>
          <span>{formatPKR(total)}</span>
        </div>
      </div>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="btn-primary w-full disabled:opacity-60"
      >
        {status === 'submitting' ? 'Placing Order…' : 'Place Order'}
      </button>
    </form>
  );
}
