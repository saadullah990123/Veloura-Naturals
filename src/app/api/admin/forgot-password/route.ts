import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { admins } from '@/lib/db/schema';
import { adminForgotPasswordSchema } from '@/lib/validation/schemas';
import { rateLimit, getClientKey } from '@/lib/auth/rate-limit';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function POST(req: Request) {
  const key = `forgot-password:${getClientKey(req)}`;
  const { allowed } = rateLimit(key, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again shortly.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = adminForgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  // Always return the same generic response whether or not the email is
  // registered, so this endpoint can't be used to enumerate admin accounts.
  const genericResponse = NextResponse.json({
    success: true,
    message: 'If that email is registered, a reset link has been sent.',
  });

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, parsed.data.email.toLowerCase()))
    .limit(1);

  if (!admin) return genericResponse;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiry = new Date(Date.now() + TOKEN_TTL_MS);

  await db
    .update(admins)
    .set({ resetToken: tokenHash, resetTokenExpiry: expiry })
    .where(eq(admins.id, admin.id));

  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/reset-password?token=${rawToken}`;

  // NOTE: no email provider is wired up yet — the reset link is logged
  // server-side only for now. Before going live, connect a transactional
  // email service (e.g. Resend, SendGrid, Postmark) here and send `resetUrl`
  // to the admin's email instead of logging it.
  console.log(`[Password Reset] Reset link for ${admin.email}: ${resetUrl}`);

  return genericResponse;
}
