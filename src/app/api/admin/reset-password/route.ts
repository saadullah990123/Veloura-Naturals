import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { admins } from '@/lib/db/schema';
import { adminResetPasswordSchema } from '@/lib/validation/schemas';
import { hashPassword } from '@/lib/auth/password';
import { rateLimit, getClientKey } from '@/lib/auth/rate-limit';

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function POST(req: Request) {
  const key = `reset-password:${getClientKey(req)}`;
  const { allowed } = rateLimit(key, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again shortly.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = adminResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid request.' },
      { status: 400 }
    );
  }

  const tokenHash = hashToken(parsed.data.token);

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.resetToken, tokenHash))
    .limit(1);

  if (
    !admin ||
    !admin.resetTokenExpiry ||
    new Date(admin.resetTokenExpiry).getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: 'This reset link is invalid or has expired. Please request a new one.' },
      { status: 400 }
    );
  }

  const newHash = await hashPassword(parsed.data.password);

  // Single-use: clear the token immediately so this link can't be replayed.
  await db
    .update(admins)
    .set({ passwordHash: newHash, resetToken: null, resetTokenExpiry: null })
    .where(eq(admins.id, admin.id));

  return NextResponse.json({ success: true });
}
