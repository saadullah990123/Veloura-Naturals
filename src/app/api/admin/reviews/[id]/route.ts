import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { reviews } from '@/lib/db/schema';
import { updateReviewStatusSchema } from '@/lib/validation/schemas';
import { requireAdmin } from '@/lib/auth/require-admin';

interface Params {
  params: { id: string };
}

export async function PATCH(req: Request, { params }: Params) {
  const session = requireAdmin();
  if (session instanceof NextResponse) return session;

  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid review id.' }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = updateReviewStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  const [updated] = await db
    .update(reviews)
    .set({ status: parsed.data.status })
    .where(eq(reviews.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });

  return NextResponse.json({ review: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = requireAdmin();
  if (session instanceof NextResponse) return session;

  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid review id.' }, { status: 400 });

  await db.delete(reviews).where(eq(reviews.id, id));
  return NextResponse.json({ success: true });
}
