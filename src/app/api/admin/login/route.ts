import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { admins } from '@/lib/db/schema';
import { adminLoginSchema } from '@/lib/validation/schemas';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';
import { rateLimit, getClientKey } from '@/lib/auth/rate-limit';

export async function POST(req: Request) {
  // Brute-force protection: 8 attempts per 15 minutes per IP.
  const key = `admin-login:${getClientKey(req)}`;
  const { allowed } = rateLimit(key, { limit: 8, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again in a few minutes.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
  }

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, parsed.data.email.toLowerCase()))
    .limit(1);

  // Deliberately generic error for both "no such admin" and "wrong password"
  // so the login endpoint doesn't leak which emails are registered.
  const genericError = NextResponse.json(
    { error: 'Invalid email or password.' },
    { status: 401 }
  );

  if (!admin) return genericError;

  const valid = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!valid) return genericError;

  const token = createSessionToken({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  });
  setSessionCookie(token);

  return NextResponse.json({
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
}
