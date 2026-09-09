'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled admin error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center admin-card p-10 text-center">
      <h2 className="font-display text-xl font-semibold text-ink">
        Something went wrong loading this page
      </h2>
      <p className="mt-2 max-w-sm text-sm text-ink/60">
        The error has been logged. Try again, or head back to the dashboard.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="btn-primary">Try Again</button>
        <a href="/admin" className="btn-outline">Dashboard</a>
      </div>
    </div>
  );
}
