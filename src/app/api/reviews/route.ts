import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews } from '@/lib/db/schema';
import { createReviewSchema } from '@/lib/validation/schemas';
import { rateLimit, getClientKey } from '@/lib/auth/rate-limit';

export async function POST(req: Request) {
  const key = `review:${getClientKey(req)}`;
  const { allowed } = rateLimit(key, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many reviews submitted. Please try again later.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid review.' },
      { status: 400 }
    );
  }

  // All public submissions land as "pending" — they only appear on the
  // storefront once an admin approves them (Section 6 requirement).
  await db.insert(reviews).values({
    productId: parsed.data.productId,
    customerName: parsed.data.customerName,
    rating: parsed.data.rating,
    title: parsed.data.title || null,
    body: parsed.data.body || null,
    status: 'pending',
  });

  return NextResponse.json({ success: true });
}
