import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { productSchema } from '@/lib/validation/schemas';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET() {
  const session = requireAdmin();
  if (session instanceof NextResponse) return session;

  const rows = await db.select().from(products).orderBy(desc(products.createdAt));
  return NextResponse.json({ products: rows });
}

export async function POST(req: Request) {
  const session = requireAdmin();
  if (session instanceof NextResponse) return session;

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid product data.' },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(products)
    .values({
      ...parsed.data,
      price: String(parsed.data.price),
      compareAtPrice:
        parsed.data.compareAtPrice != null ? String(parsed.data.compareAtPrice) : null,
    })
    .returning();

  return NextResponse.json({ product: created }, { status: 201 });
}
