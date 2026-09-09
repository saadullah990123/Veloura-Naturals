'use client';

/**
 * Use this instead of raw `fetch` for admin-dashboard API calls made from
 * client components. If the session has expired mid-session (a 401 comes
 * back from any /api/admin/* route), it clears the cookie via /logout and
 * sends the user back to /admin/login?expired=1 — the same safe path the
 * server-side layout guard uses, so there's a single, consistent "session
 * expired" experience and no redirect loop (this never runs on the login
 * page itself, since that page doesn't call adminFetch).
 */
export async function adminFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status === 401 && typeof window !== 'undefined') {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/admin/login?expired=1';
    // Return the original response so callers awaiting it don't hang —
    // the redirect above will navigate away before most code paths matter.
  }

  return res;
}
