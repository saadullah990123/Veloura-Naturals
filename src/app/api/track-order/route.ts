import { NextResponse } from 'next/server';
import { findOrdersByTrack } from '@/lib/data';
import { trackOrderSchema } from '@/lib/validation/schemas';
import { rateLimit, getClientKey } from '@/lib/auth/rate-limit';

export async function GET(req: Request) {
  const key = `track:${getClientKey(req)}`;
  const { allowed } = rateLimit(key, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many lookup attempts. Please try again shortly.' },
      { status: 429 }
    );
  }

  const url = new URL(req.url);
  const parsed = trackOrderSchema.safeParse({
    orderNumber: url.searchParams.get('orderNumber') || undefined,
    phone: url.searchParams.get('phone') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Provide an order number or phone number.' },
      { status: 400 }
    );
  }

  const results = await findOrdersByTrack(parsed.data.orderNumber, parsed.data.phone);

  // Only return the fields a customer needs — never expose full address,
  // payment proof URLs, or admin notes through the public tracking endpoint.
  const sanitized = results.map((o) => ({
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    productName: o.productName,
    quantity: o.quantity,
    total: o.total,
    trackingNumber: o.trackingNumber,
    courier: o.courier,
    createdAt: o.createdAt,
  }));

  return NextResponse.json({ orders: sanitized });
}
