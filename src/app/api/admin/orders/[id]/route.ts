import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderStatusHistory } from '@/lib/db/schema';
import { updateOrderStatusSchema, updatePaymentStatusSchema } from '@/lib/validation/schemas';
import { requireAdmin } from '@/lib/auth/require-admin';

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  const session = requireAdmin();
  if (session instanceof NextResponse) return session;

  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid order id.' }, { status: 400 });

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  const history = await db
    .select()
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, id));

  return NextResponse.json({ order, history });
}

/**
 * Handles both order-status transitions (pending -> confirmed -> shipped ->
 * delivered / cancelled) and payment-verification updates, distinguished by
 * which field is present in the request body. Both are admin-only writes.
 */
export async function PATCH(req: Request, { params }: Params) {
  const session = requireAdmin();
  if (session instanceof NextResponse) return session;

  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid order id.' }, { status: 400 });

  const body = await req.json().catch(() => null);

  const [existing] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  if (body && 'paymentStatus' in body) {
    const parsed = updatePaymentStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
    }
    const [updated] = await db
      .update(orders)
      .set({ paymentStatus: parsed.data.paymentStatus, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return NextResponse.json({ order: updated });
  }

  const parsed = updateOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid order update.' },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(orders)
    .set({
      status: parsed.data.status,
      ...(parsed.data.trackingNumber !== undefined && { trackingNumber: parsed.data.trackingNumber }),
      ...(parsed.data.courier !== undefined && { courier: parsed.data.courier }),
      ...(parsed.data.adminNotes !== undefined && { adminNotes: parsed.data.adminNotes }),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id))
    .returning();

  // Audit trail — every status change is recorded with who changed it.
  await db.insert(orderStatusHistory).values({
    orderId: id,
    fromStatus: existing.status,
    toStatus: parsed.data.status,
    changedByAdminId: session.adminId,
    note: parsed.data.adminNotes || null,
  });

  return NextResponse.json({ order: updated });
}
