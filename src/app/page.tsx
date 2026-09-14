import Link from 'next/link';
import Image from 'next/image';
import Typewriter from '@/components/typewriter';
import StarRating from '@/components/star-rating';
import ReviewsSection from '@/components/reviews-section';
import { getActiveProduct, getApprovedReviews, getReviewStats } from '@/lib/data';
import { formatPKR } from '@/lib/utils';

// Re-rendered from cache at most once every 30s under heavy traffic, instead
// of hitting the database on every single page view — this is what lets 200
// concurrent visitors load the homepage smoothly without 200 concurrent DB
// queries. Admin edits (price, reviews, settings) show up within 30s, not
// instantly — a deliberate, small trade-off for a large gain in throughput.
export const revalidate = 30;

export default async function HomePage() {
  const [product, reviews, stats] = await Promise.all([
    getActiveProduct(),
    getApprovedReviews(9),
    getReviewStats(),
  ]);

  return (
    <>
      {/* ------------------------------------------------------------ HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-forest-50 to-white">
        <div className="container-x grid gap-12 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="animate-fade-up">
            <span className="section-label">Veloura Naturals</span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
              No.1 Hair Growth Oil
            </h1>
            <p className="mt-5 min-h-[1.75rem] text-lg text-ink/70">
              <Typewriter />
            </p>
            <p className="mt-5 max-w-md text-ink/60">
              A 9-oil organic blend that stops hair fall, strengthens roots,
              and brings back natural shine — massage in, leave for 2–3
              hours, and let nature do the rest.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/product" className="btn-primary">
                Shop Now
              </Link>
              {stats.count > 0 && (
                <div className="flex items-center gap-2 text-sm text-ink/60">
                  <StarRating rating={stats.average} size={16} />
                  <span>
                    {stats.average} · {stats.count} reviews
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="relative animate-fade-up [animation-delay:150ms]">
            <div className="absolute -inset-6 -z-10 rounded-full bg-gold-100/60 blur-3xl" />
            <div className="overflow-hidden rounded-3xl border border-forest-900/10 bg-white shadow-xl">
              <Image
                src={product?.images?.[0] || '/images/product-placeholder-1.jpg'}
                alt={product?.name || 'Veloura Naturals Hair Oil'}
                width={800}
                height={600}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- BENEFITS */}
      <section className="container-x py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: 'Stops Hair Fall', desc: 'Nourishes roots to reduce breakage and shedding.' },
            { title: 'Boosts New Growth', desc: 'Rosemary and amla stimulate the scalp for regrowth.' },
            { title: 'Adds Shine & Volume', desc: 'Coconut and almond oil leave hair soft, never greasy.' },
          ].map((b) => (
            <div key={b.title} className="rounded-2xl border border-forest-900/10 p-6">
              <h3 className="font-display text-lg font-semibold text-forest-800">{b.title}</h3>
              <p className="mt-2 text-sm text-ink/60">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------- FEATURED CTA */}
      {product && (
        <section className="container-x">
          <div className="flex flex-col items-center gap-6 rounded-3xl bg-forest-900 px-8 py-12 text-center text-white sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h2 className="font-display text-2xl font-semibold">{product.name}</h2>
              <p className="mt-1 text-forest-100/80">
                {formatPKR(product.price)}{' '}
                {product.compareAtPrice && (
                  <span className="ml-2 text-forest-100/50 line-through">
                    {formatPKR(product.compareAtPrice)}
                  </span>
                )}
              </p>
            </div>
            <Link href="/product" className="btn-primary bg-gold-500 hover:bg-gold-600">
              Order Now
            </Link>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------- REVIEWS */}
      <ReviewsSection initialReviews={reviews} />
    </>
  );
}
