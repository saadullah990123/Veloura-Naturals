import { NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validation/schemas';
import { rateLimit, getClientKey } from '@/lib/auth/rate-limit';

// Contact messages aren't persisted to a dedicated table in this build (the
// Master Prompt data model doesn't call for one) — swap this handler to
// insert into a `contact_messages` table, or send an email/WhatsApp
// notification via a provider of your choice, when you're ready to wire it
// up to a real inbox.
export async function POST(req: Request) {
  const key = `contact:${getClientKey(req)}`;
  const { allowed } = rateLimit(key, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many messages sent. Please try again later.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid message.' },
      { status: 400 }
    );
  }

  console.log('Contact form submission:', parsed.data);

  return NextResponse.json({ success: true });
}
