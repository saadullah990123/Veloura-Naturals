import Link from 'next/link';
import Image from 'next/image';
import MobileNav from './mobile-nav';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/product', label: 'Shop' },
  { href: '/track-order', label: 'Track Order' },
  { href: '/contact', label: 'Contact' },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-forest-900/10 bg-white/90 backdrop-blur">
      <div className="container-x flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5">
          <Image
            src="/images/logo-fleur.png"
            alt="Veloura Naturals"
            width={34}
            height={41}
            className="h-8 w-auto sm:h-9"
            priority
          />
          <span className="font-display text-base font-semibold tracking-wide text-forest-800 sm:text-xl">
            VELOURA <span className="text-gold-600">NATURALS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink/70 transition hover:text-forest-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link href="/product" className="btn-primary hidden md:inline-flex">
          Shop Now
        </Link>

        <MobileNav />
      </div>
    </header>
  );
}
