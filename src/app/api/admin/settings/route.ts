import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { settingsSchema } from '@/lib/validation/schemas';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET() {
  const session = requireAdmin();
  if (session instanceof NextResponse) return session;

  const [row] = await db.select().from(settings).limit(1);
  return NextResponse.json({ settings: row || null });
}

export async function PATCH(req: Request) {
  const session = requireAdmin();
  if (session instanceof NextResponse) return session;

  const body = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid settings data.' },
      { status: 400 }
    );
  }

  const [existing] = await db.select().from(settings).limit(1);

  const values = {
    ...parsed.data,
    deliveryFee: String(parsed.data.deliveryFee),
    freeDeliveryThreshold:
      parsed.data.freeDeliveryThreshold != null ? String(parsed.data.freeDeliveryThreshold) : null,
    updatedAt: new Date(),
  };

  if (existing) {
    const [row] = await db
      .update(settings)
      .set(values)
      .where(eq(settings.id, existing.id))
      .returning();
    return NextResponse.json({ settings: row });
  }

  const [created] = await db.insert(settings).values(values).returning();
  return NextResponse.json({ settings: created });
}
