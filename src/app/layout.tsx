import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import OfflineBanner from '@/components/offline-banner';
import { getSettings } from '@/lib/data';

export const metadata: Metadata = {
  title: {
    default: 'Veloura Naturals — No.1 Hair Growth Oil',
    template: '%s | Veloura Naturals',
  },
  description:
    '100% organic, halal-friendly hair growth oil. Anti-hair fall, strengthens roots, and delivers intense hair nourishment. Order online across Pakistan with Cash on Delivery, Meezan Bank, or EasyPaisa.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings().catch(() => null);

  return (
    <html lang="en">
      <body>
        <OfflineBanner />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter
          whatsappNumber={settings?.whatsappNumber}
          contactPhone={settings?.contactPhone}
          contactEmail={settings?.contactEmail}
        />
      </body>
    </html>
  );
}
