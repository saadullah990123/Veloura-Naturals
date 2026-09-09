'use client';

import { useState } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/product', label: 'Shop' },
  { href: '/track-order', label: 'Track Order' },
  { href: '/contact', label: 'Contact' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="relative z-50 flex h-10 w-10 items-center justify-center rounded-lg text-ink/70 hover:bg-forest-50"
      >
        <span className="relative block h-4 w-5">
          <span
            className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition ${
              open ? 'translate-y-[7px] rotate-45' : ''
            }`}
          />
          <span
            className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition ${
              open ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`absolute left-0 top-[14px] h-0.5 w-5 rounded-full bg-current transition ${
              open ? '-translate-y-[7px] -rotate-45' : ''
            }`}
          />
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed left-0 right-0 top-20 z-40 border-b border-forest-900/10 bg-white px-5 pb-6 pt-2 shadow-lg">
            <nav className="flex flex-col divide-y divide-ink/5">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="py-3.5 text-base font-medium text-ink/80"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/product"
              onClick={() => setOpen(false)}
              className="btn-primary mt-4 w-full"
            >
              Shop Now
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
