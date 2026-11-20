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

export const DEFAULT_PRODUCT = {
  id: 1,
  name: 'Veloura Naturals Hair Oil',
  slug: 'veloura-naturals-hair-oil',
  categoryId: 1,
  price: '1999',
  compareAtPrice: '2999',
  shortDescription:
    'Anti-hair fall. Strengthens roots. Intense hair nourishment — with olive, almond, mustard, rosemary, amla, black seed, four seed, coconut and pumpkin oils plus Vitamin E.',
  description:
    'Veloura Naturals Hair Oil is a 100% organic, 9-oil blend crafted to stop hair fall, strengthen roots from within, and restore natural shine and volume. Massage into the scalp, leave active for 2–3 hours, then wash — with consistent use, most customers notice visibly stronger, thicker hair within a few weeks.',
  details:
    'Ingredients: Olive Oil, Almond Oil, Mustard Oil, Rosemary Oil, Amla Oil, Black Seed Oil, Four Seed Oil, Coconut Oil, Pumpkin Oil, Vitamin E.\n\nDirections: Take a few drops in hands and massage deeply into roots and scalp. Distribute evenly to hair ends. Leave active for 2–3 hours prior to washing.\n\nNet volume: 125ml.',
  images: ['/images/image-1.jpg', '/images/image-2.jpg', '/images/image-3.png'],
  stock: 250,
  isActive: true,
  isFeatured: true,
  isBestseller: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const getActiveProduct = cache(async () => {
  try {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.isFeatured), desc(products.updatedAt), desc(products.createdAt))
      .limit(1);
    return rows[0] ?? DEFAULT_PRODUCT;
  } catch (err) {
    console.error('getActiveProduct failed:', err);
    return DEFAULT_PRODUCT;
  }
});

export async function getProductBySlug(slug: string) {
  try {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    return rows[0] ?? DEFAULT_PRODUCT;
  } catch (err) {
    console.error('getProductBySlug failed:', err);
    return DEFAULT_PRODUCT;
  }
}

export async function getProductById(id: number) {
  try {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return rows[0] ?? DEFAULT_PRODUCT;
  } catch (err) {
    console.error('getProductById failed:', err);
    return DEFAULT_PRODUCT;
  }
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
