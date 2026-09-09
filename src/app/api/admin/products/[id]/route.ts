import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { productUpdateSchema } from '@/lib/validation/schemas';
import { requireAdmin } from '@/lib/auth/require-admin';

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  const session = requireAdmin();
  if (session instanceof NextResponse) return session;

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });
  }

  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

  return NextResponse.json({ product });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = requireAdmin();
  if (session instanceof NextResponse) return session;

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid product data.' },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.price != null) updateData.price = String(parsed.data.price);
  if (parsed.data.compareAtPrice !== undefined) {
    updateData.compareAtPrice =
      parsed.data.compareAtPrice != null ? String(parsed.data.compareAtPrice) : null;
  }

  const [updated] = await db
    .update(products)
    .set(updateData)
    .where(eq(products.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

  return NextResponse.json({ product: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = requireAdmin();
  if (session instanceof NextResponse) return session;

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });
  }

  await db.delete(products).where(eq(products.id, id));
  return NextResponse.json({ success: true });
}
