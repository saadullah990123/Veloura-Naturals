'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logged server/console-side only — never shown to the customer.
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="container-x flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <span className="section-label">Something went wrong</span>
      <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
        We hit a snag
      </h1>
      <p className="mt-3 max-w-md text-ink/60">
        This is on us, not you. Please try again — if it keeps happening,
        reach out and we'll sort it out.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn-primary">Try Again</button>
        <a href="/" className="btn-outline">Back to Home</a>
        <a href="/contact" className="btn-outline">Contact Support</a>
      </div>
    </div>
  );
}
