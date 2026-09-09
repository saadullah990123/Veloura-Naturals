import type { Metadata } from 'next';
import TrackOrderForm from '@/components/track-order-form';

export const metadata: Metadata = {
  title: 'Track Your Order',
  description:
    'Check the status of your Veloura Naturals order using your order number or phone number.',
};

export default function TrackOrderPage() {
  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="section-label">Order Status</span>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
          Track Your Order
        </h1>
        <p className="mt-3 text-ink/60">
          Enter your order number or the phone number you used at checkout.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <TrackOrderForm />
      </div>
    </div>
  );
}
