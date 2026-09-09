import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="container-x flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <span className="section-label">Error 403</span>
      <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
        You don't have access to this
      </h1>
      <p className="mt-3 max-w-md text-ink/60">
        Your account doesn't have permission to view this page.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/admin" className="btn-primary">Back to Dashboard</Link>
        <Link href="/admin/login" className="btn-outline">Switch Account</Link>
      </div>
    </div>
  );
}
