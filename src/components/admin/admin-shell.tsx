'use client';

import { useState } from 'react';
import AdminSidebar from './admin-sidebar';
import OfflineBanner from '@/components/offline-banner';

export default function AdminShell({
  adminName,
  children,
}: {
  adminName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gold-50/50">
      <OfflineBanner />
      <AdminSidebar adminName={adminName} open={open} onClose={() => setOpen(false)} />

      <div className="flex-1 lg:ml-0">
        {/* Mobile topbar */}
        <div className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gold-200/60 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink/70 hover:bg-forest-50"
          >
            <span className="relative block h-3.5 w-5">
              <span className="absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current" />
              <span className="absolute left-0 top-[6px] h-0.5 w-5 rounded-full bg-current" />
              <span className="absolute left-0 top-[12px] h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
          <span className="font-display text-base font-semibold tracking-wide text-forest-900">
            VELOURA <span className="text-gold-600">ADMIN</span>
          </span>
        </div>

        <main className="overflow-x-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
