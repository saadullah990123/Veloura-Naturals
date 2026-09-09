'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/orders', label: 'Orders & Payments' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/account', label: 'My Account' },
];

export default function AdminSidebar({
  adminName,
  open,
  onClose,
}: {
  adminName: string;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <>
      {/* Mobile scrim */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gold-200/50 bg-[#FDFBF6] transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-gold-200/50 px-6">
          <div className="flex items-center gap-2">
            <Image src="/images/logo-fleur.png" alt="" width={20} height={24} className="h-5 w-auto opacity-80" />
            <span className="font-display text-base font-semibold tracking-wide text-forest-900">
              VELOURA <span className="text-gold-600">ADMIN</span>
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-ink/50 hover:bg-gold-100/60 lg:hidden"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'relative block rounded-lg py-2.5 pl-4 pr-3.5 text-sm font-medium transition',
                  active
                    ? 'bg-gold-100/70 text-forest-900'
                    : 'text-ink/55 hover:bg-gold-50 hover:text-ink'
                )}
              >
                {active && (
                  <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-gold-500" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gold-200/50 p-4">
          <p className="mb-2 truncate text-xs text-ink/40">{adminName}</p>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-ink/10 px-3.5 py-2 text-sm font-medium text-ink/60 transition hover:border-ink/20 hover:bg-white"
          >
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
