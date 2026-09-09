import { NextResponse } from 'next/server';
import { getSessionFromCookies, SessionPayload } from './session';

/**
 * Verifies the request is from an authenticated admin.
 *
 * IMPORTANT: this must be called at the top of every /api/admin/* route
 * handler. Per the Master Prompt security standard, hiding an admin button
 * in the UI is not security — the API route itself must independently
 * verify authentication (who is this?) AND authorization (are they allowed?)
 * on every request, regardless of what the frontend does or doesn't show.
 *
 * Usage:
 *   const session = requireAdmin();
 *   if (session instanceof NextResponse) return session; // 401, short-circuit
 */
export function requireAdmin(): SessionPayload | NextResponse {
  const session = getSessionFromCookies();

  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated.' },
      { status: 401 }
    );
  }

  if (session.role !== 'admin' && session.role !== 'owner') {
    return NextResponse.json(
      { error: 'Not authorized.' },
      { status: 403 }
    );
  }

  return session;
}
