import Link from 'next/link';
import Image from 'next/image';

export default function SiteFooter({
  whatsappNumber,
  contactPhone,
  contactEmail,
}: {
  whatsappNumber?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}) {
  return (
    <footer className="mt-24 border-t border-forest-900/10 bg-forest-900 text-forest-50">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/logo-fleur.png"
              alt="Veloura Naturals"
              width={28}
              height={34}
              className="h-8 w-auto"
            />
            <span className="font-display text-lg font-semibold tracking-wide">
              VELOURA <span className="text-gold-400">NATURALS</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-forest-100/70">
            100% organic, halal-friendly hair growth oil — crafted to stop
            hair fall, strengthen roots, and restore natural shine.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
            Explore
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-forest-100/80">
            <li><Link href="/product" className="hover:text-white">Shop Hair Oil</Link></li>
            <li><Link href="/track-order" className="hover:text-white">Track Order</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
            Get in touch
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-forest-100/80">
            {contactPhone && (
              <li>
                <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="hover:text-white">
                  {contactPhone}
                </a>
              </li>
            )}
            {contactEmail && (
              <li>
                <a href={`mailto:${contactEmail}`} className="hover:text-white">
                  {contactEmail}
                </a>
              </li>
            )}
            {whatsappNumber && (
              <li>
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Chat on WhatsApp
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-forest-100/50">
        © {new Date().getFullYear()} Veloura Naturals. All rights reserved.
      </div>
    </footer>
  );
}
