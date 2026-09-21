import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getActiveProduct, getApprovedReviews, getReviewStats, getSettings } from '@/lib/data';
import { formatPKR } from '@/lib/utils';
import StarRating from '@/components/star-rating';
import OrderForm from '@/components/order-form';

export const metadata: Metadata = {
  title: 'Shop Hair Growth Oil',
  description:
    'Order Veloura Naturals Hair Oil online — a 9-oil organic blend that stops hair fall and strengthens roots. Cash on Delivery, Meezan Bank & EasyPaisa accepted.',
};

// Same 30s ISR window as the homepage (see page.tsx for the full rationale).
// Note: this only affects how fresh the *displayed* price/stock badge is —
// the actual order API always re-checks real stock and price straight from
// the database at the moment of purchase, so a stale cached page can never
// result in overselling or a wrong charge.
export const revalidate = 30;

export default async function ProductPage() {
  const [product, settings, stats] = await Promise.all([
    getActiveProduct(),
    getSettings(),
    getReviewStats(),
  ]);

  if (!product) {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <span className="section-label">Product</span>
        <h1 className="mt-3 font-display text-2xl font-bold text-ink sm:text-3xl">
          We're between batches right now
        </h1>
        <p className="mt-3 max-w-md text-ink/60">
          Our hair oil isn't listed for order at the moment — check back
          shortly, or reach out and we'll let you know the second it's back.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="btn-primary">Contact Us</Link>
          <Link href="/" className="btn-outline">Back to Home</Link>
        </div>
      </div>
    );
  }
  const images = product.images.length > 0 ? product.images : ['/images/product-placeholder-2.png'];

  return (
    <div className="container-x py-14">
      <div className="grid gap-12 lg:grid-cols-2">
        {/* --------------------------------------------------------- Gallery */}
        <div>
          <div className="overflow-hidden rounded-2xl border border-forest-900/10 bg-forest-50">
            <Image
              src={images[0]}
              alt={product.name}
              width={800}
              height={800}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {images.slice(1, 5).map((src, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-forest-900/10">
                  <Image src={src} alt={`${product.name} ${i + 2}`} width={200} height={200} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------- Info */}
        <div>
          {product.isBestseller && (
            <span className="inline-block rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700">
              Bestseller
            </span>
          )}
          <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
            {product.name}
          </h1>

          {stats.count > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <StarRating rating={stats.average} />
              <span className="text-sm text-ink/60">
                {stats.average} ({stats.count} reviews)
              </span>
            </div>
          )}

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-forest-700">
              {formatPKR(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-lg text-ink/40 line-through">
                {formatPKR(product.compareAtPrice)}
              </span>
            )}
          </div>

          {product.shortDescription && (
            <p className="mt-5 text-ink/70">{product.shortDescription}</p>
          )}

          <div className="mt-4 text-sm">
            {product.stock > 0 ? (
              <span className="font-medium text-forest-600">In stock, ready to ship</span>
            ) : (
              <span className="font-medium text-red-600">Currently out of stock</span>
            )}
          </div>

          {product.details && (
            <div className="mt-8 whitespace-pre-line rounded-xl bg-forest-50 p-5 text-sm text-ink/70">
              {product.details}
            </div>
          )}

          <div className="mt-10">
            <h2 className="mb-4 font-display text-xl font-semibold text-ink">
              Order Now
            </h2>
            <OrderForm
              productId={product.id}
              unitPrice={parseFloat(product.price)}
              deliveryFee={parseFloat(settings.deliveryFee)}
              freeDeliveryThreshold={
                settings.freeDeliveryThreshold ? parseFloat(settings.freeDeliveryThreshold) : null
              }
              payment={{
                meezanAccountTitle: settings.meezanAccountTitle,
                meezanAccountNumber: settings.meezanAccountNumber,
                meezanIban: settings.meezanIban,
                meezanBankName: settings.meezanBankName,
                easypaisaAccountTitle: settings.easypaisaAccountTitle,
                easypaisaNumber: settings.easypaisaNumber,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
