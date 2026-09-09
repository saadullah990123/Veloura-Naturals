import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(req: Request) {
  const session = requireAdmin();
  if (session instanceof NextResponse) return session;

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status');

  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
  type OrderStatus = (typeof validStatuses)[number];

  const rows = statusFilter && (validStatuses as readonly string[]).includes(statusFilter)
    ? await db
        .select()
        .from(orders)
        .where(eq(orders.status, statusFilter as OrderStatus))
        .orderBy(desc(orders.createdAt))
    : await db.select().from(orders).orderBy(desc(orders.createdAt));

  return NextResponse.json({ orders: rows });
}
