'use client';

import { useState } from 'react';
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

  const subtotal = unitPrice * quantity;
  const effectiveDeliveryFee =
    freeDeliveryThreshold && subtotal >= freeDeliveryThreshold ? 0 : deliveryFee;
  const total = subtotal + effectiveDeliveryFee;
  // Note: this is a live preview only — the server independently recalculates
  // the real total from the database price at order-creation time.

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const form = new FormData(e.currentTarget);
    const payload = {
      customerName: form.get('customerName'),
      phone: form.get('phone'),
      email: form.get('email'),
      address: form.get('address'),
      city: form.get('city'),
      productId,
      quantity,
      paymentMethod,
      transactionId: paymentMethod === 'easypaisa' ? transactionId : undefined,
      customerNotes: form.get('customerNotes'),
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
      <div className="rounded-2xl border border-forest-200 bg-forest-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-forest-600 text-white">
          ✓
        </div>
        <h3 className="font-display text-xl font-semibold text-ink">
          Order placed!
        </h3>
        <p className="mt-2 text-ink/70">
          Your order number is{' '}
          <span className="font-mono font-semibold text-forest-700">
            {orderNumber}
          </span>
          . Save it to track your order.
        </p>
        <p className="mt-1 text-sm text-ink/50">
          We'll contact you shortly to confirm delivery details.
        </p>
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
            placeholder="e.g. Lahore"
          />
        </div>
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
