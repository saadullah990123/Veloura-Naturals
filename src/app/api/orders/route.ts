import { NextResponse } from 'next/server';
import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, products, settings, orderStatusHistory } from '@/lib/db/schema';
import { createOrderSchema } from '@/lib/validation/schemas';
import { generateOrderNumber } from '@/lib/utils';
import { rateLimit, getClientKey } from '@/lib/auth/rate-limit';

export async function POST(req: Request) {
  // Basic abuse protection — 10 order attempts per 10 minutes per IP.
  const key = `order:${getClientKey(req)}`;
  const { allowed } = rateLimit(key, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many order attempts. Please try again shortly.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid order data.' },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // EasyPaisa orders require a transaction ID to be verifiable by admin.
  if (input.paymentMethod === 'easypaisa' && !input.transactionId) {
    return NextResponse.json(
      { error: 'Please provide your EasyPaisa transaction ID.' },
      { status: 400 }
    );
  }

  // A quick, non-authoritative existence check so a missing/inactive product
  // gets a clean 404 instead of falling through to the generic stock error
  // below (the real, race-safe check happens inside the transaction).
  const [preCheck] = await db
    .select({ id: products.id, isActive: products.isActive })
    .from(products)
    .where(eq(products.id, input.productId))
    .limit(1);

  if (!preCheck || !preCheck.isActive) {
    return NextResponse.json({ error: 'Product not found or unavailable.' }, { status: 404 });
  }

  const [storeSettings] = await db.select().from(settings).limit(1);
  const deliveryFee = storeSettings ? parseFloat(storeSettings.deliveryFee) : 200;
  const freeThreshold = storeSettings?.freeDeliveryThreshold
    ? parseFloat(storeSettings.freeDeliveryThreshold)
    : null;

  const paymentStatus =
    input.paymentMethod === 'cod'
      ? 'unpaid'
      : 'pending_verification'; // bank transfer / easypaisa await admin verification

  try {
    const created = await db.transaction(async (tx) => {
      // --- SECURITY + CONCURRENCY: this single atomic UPDATE is the real
      // stock check. It decrements stock and re-verifies availability in the
      // same database operation (`WHERE stock >= quantity`), so if two
      // customers order the last unit at the exact same moment, Postgres
      // serializes the two UPDATEs and only one of them can match the
      // `stock >= quantity` condition — the second gets zero rows back and
      // is rejected before any order is created. This closes the race that
      // a separate "read stock, then write stock" pattern would leave open.
      const [updatedProduct] = await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${input.quantity}` })
        .where(
          and(
            eq(products.id, input.productId),
            eq(products.isActive, true),
            gte(products.stock, input.quantity)
          )
        )
        .returning();

      if (!updatedProduct) {
        // Either someone else just took the remaining stock, or the
        // quantity requested exceeds what's left right now.
        throw new Error('OUT_OF_STOCK');
      }

      const unitPrice = parseFloat(updatedProduct.price);
      const subtotal = unitPrice * input.quantity;
      const effectiveDeliveryFee = freeThreshold && subtotal >= freeThreshold ? 0 : deliveryFee;
      const total = subtotal + effectiveDeliveryFee;
      const orderNumber = generateOrderNumber();

      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerName: input.customerName,
          phone: input.phone,
          email: input.email || null,
          address: input.address,
          city: input.city || null,
          productId: updatedProduct.id,
          productName: updatedProduct.name,
          unitPrice: updatedProduct.price,
          quantity: input.quantity,
          deliveryFee: String(effectiveDeliveryFee),
          total: String(total),
          paymentMethod: input.paymentMethod,
          paymentStatus,
          transactionId: input.transactionId || null,
          paymentProofUrl: input.paymentProofUrl || null,
          customerNotes: input.customerNotes || null,
          status: 'pending',
        })
        .returning();

      await tx.insert(orderStatusHistory).values({
        orderId: newOrder.id,
        fromStatus: null,
        toStatus: 'pending',
        note: 'Order placed by customer.',
      });

      return newOrder;
    });

    return NextResponse.json({
      order: { orderNumber: created.orderNumber, total: created.total },
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'OUT_OF_STOCK') {
      return NextResponse.json(
        { error: 'Sorry, that quantity just sold out. Please try a smaller quantity.' },
        { status: 409 }
      );
    }
    throw err;
  }
}
