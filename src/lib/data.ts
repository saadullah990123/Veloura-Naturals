import { eq, desc, or, sql, count, avg } from 'drizzle-orm';
import { cache } from 'react';
import { db } from './db';
import { products, reviews, settings, orders } from './db/schema';

// `cache()` (React's per-request memoization, not a cross-request cache)
// means that if the same page render calls one of these functions more than
// once — e.g. the root layout and a page both need settings — only one
// database round trip actually happens for that request. It does NOT persist
// data between different users/requests, so it can't ever serve stale data
// across requests.

export const getActiveProduct = cache(async () => {
  try {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .limit(1);
    return rows[0] ?? null;
  } catch (err) {
    console.error('getActiveProduct failed:', err);
    return null;
  }
});

export async function getProductBySlug(slug: string) {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export const getApprovedReviews = cache(async (limit = 20) => {
  try {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.status, 'approved'))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);
  } catch (err) {
    console.error('getApprovedReviews failed:', err);
    return [];
  }
});

// A single SQL aggregate instead of pulling up to 1000 full review rows into
// application memory just to count them and average one column in JS — the
// database is far better at this than Node is, and it's one small round
// trip instead of a large one.
export const getReviewStats = cache(async () => {
  try {
    const [row] = await db
      .select({
        count: count(),
        average: avg(reviews.rating),
      })
      .from(reviews)
      .where(eq(reviews.status, 'approved'));

    const reviewCount = row?.count ?? 0;
    const average = row?.average ? Math.round(parseFloat(row.average) * 10) / 10 : 0;

    return { count: reviewCount, average };
  } catch (err) {
    console.error('getReviewStats failed:', err);
    return { count: 0, average: 0 };
  }
});

const DEFAULT_SETTINGS = {
  id: 0,
  businessName: 'Veloura Naturals',
  contactPhone: '',
  contactEmail: '',
  whatsappNumber: '',
  address: '',
  announcementText: '',
  deliveryFee: '200',
  freeDeliveryThreshold: null as string | null,
  meezanAccountTitle: '',
  meezanAccountNumber: '',
  meezanIban: '',
  meezanBankName: 'Meezan Bank',
  easypaisaAccountTitle: '',
  easypaisaNumber: '',
  updatedAt: new Date(),
};

export const getSettings = cache(async () => {
  try {
    const rows = await db.select().from(settings).limit(1);
    // Sensible fallback so pages render before the DB is seeded, or if a
    // query briefly fails — a missing settings row should never take the
    // whole storefront down.
    return rows[0] ?? DEFAULT_SETTINGS;
  } catch (err) {
    console.error('getSettings failed:', err);
    return DEFAULT_SETTINGS;
  }
});

export async function findOrdersByTrack(orderNumber?: string, phone?: string) {
  const conditions = [];
  if (orderNumber) conditions.push(eq(orders.orderNumber, orderNumber.trim().toUpperCase()));
  if (phone) conditions.push(eq(orders.phone, phone.trim()));

  if (conditions.length === 0) return [];

  return db
    .select()
    .from(orders)
    .where(or(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(10);
}
