'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-forest-950 via-forest-900 to-forest-950 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center">
          <Image src="/images/logo-fleur.png" alt="Veloura Naturals" width={40} height={48} className="h-10 w-auto" />
          <h1 className="mt-4 font-display text-xl font-semibold text-ink">Reset Password</h1>
        </div>

        {done ? (
          <div className="mt-6 text-center">
            <p className="text-sm text-ink/60">
              If that email is registered, a reset link has been sent. It expires in 1 hour.
            </p>
            <Link href="/admin/login" className="btn-outline mt-6 inline-flex">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <p className="text-sm text-ink/50">
              Enter your admin email and we'll send you a link to reset your password.
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink/60">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>

            <Link href="/admin/login" className="block text-center text-sm text-ink/50 hover:text-ink">
              Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
