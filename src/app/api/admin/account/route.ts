import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { admins } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/require-admin';
import { verifyPassword, hashPassword } from '@/lib/auth/password';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function GET() {
  const session = requireAdmin();
  if (session instanceof NextResponse) return session;

  const [admin] = await db.select().from(admins).where(eq(admins.id, session.adminId)).limit(1);
  if (!admin) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

  return NextResponse.json({
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
}

export async function PATCH(req: Request) {
  const session = requireAdmin();
  if (session instanceof NextResponse) return session;

  const body = await req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid input.' },
      { status: 400 }
    );
  }

  const [admin] = await db.select().from(admins).where(eq(admins.id, session.adminId)).limit(1);
  if (!admin) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

  const valid = await verifyPassword(parsed.data.currentPassword, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await db.update(admins).set({ passwordHash: newHash }).where(eq(admins.id, admin.id));

  return NextResponse.json({ success: true });
}
