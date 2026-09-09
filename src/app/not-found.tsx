import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <span className="section-label">Error 404</span>
      <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
        We couldn't find that page
      </h1>
      <p className="mt-3 max-w-md text-ink/60">
        The page you're looking for may have been moved or no longer exists.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">Back to Home</Link>
        <Link href="/product" className="btn-outline">Shop Hair Oil</Link>
        <Link href="/contact" className="btn-outline">Contact Us</Link>
      </div>
    </div>
  );
}
