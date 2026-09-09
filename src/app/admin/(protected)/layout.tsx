import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSessionFromCookies, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import AdminShell from '@/components/admin/admin-shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side auth check for every /admin/* page. The API routes under
  // /api/admin/* independently re-check this on every request too — this
  // layout guard only controls whether the admin UI renders, it is not the
  // security boundary by itself.
  const session = getSessionFromCookies();

  if (!session) {
    // If a cookie exists but failed verification (expired/tampered), send
    // the user through a route that safely clears it — rather than leaving
    // a stale, unusable cookie sitting in the browser — before returning to
    // login. If there's no cookie at all, go straight to login.
    const hasStaleCookie = Boolean(cookies().get(SESSION_COOKIE_NAME)?.value);
    redirect(hasStaleCookie ? '/admin/login?expired=1' : '/admin/login');
  }

  return <AdminShell adminName={session.email}>{children}</AdminShell>;
}
