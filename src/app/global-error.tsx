'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled root layout error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">
            Something went wrong
          </h1>
          <p className="mt-3 max-w-md text-ink/60">
            Please refresh the page. If the problem continues, contact us via
            WhatsApp or email.
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-full bg-forest-600 px-7 py-3 text-sm font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
