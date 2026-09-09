import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { reviews } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET() {
  const session = requireAdmin();
  if (session instanceof NextResponse) return session;

  const rows = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  return NextResponse.json({ reviews: rows });
}
