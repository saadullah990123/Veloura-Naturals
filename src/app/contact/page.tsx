import type { Metadata } from 'next';
import ContactForm from '@/components/contact-form';
import { getSettings } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with Veloura Naturals for questions about your order or our hair growth oil — via WhatsApp, phone, email, or our contact form.',
};

export const revalidate = 60;

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="section-label">Get in Touch</span>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
          Contact Us
        </h1>
        <p className="mt-3 text-ink/60">
          Questions about your order or the product? We're happy to help.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-8 md:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          {settings.whatsappNumber && (
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-forest-900/10 p-5 transition hover:border-forest-400"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-100 text-forest-700">
                💬
              </span>
              <div>
                <p className="font-semibold text-ink">Chat on WhatsApp</p>
                <p className="text-sm text-ink/50">Fastest way to reach us</p>
              </div>
            </a>
          )}

          {settings.contactPhone && (
            <div className="rounded-2xl border border-forest-900/10 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Phone</p>
              <p className="mt-1 font-semibold text-ink">
                <a href={`tel:${settings.contactPhone.replace(/\s+/g, '')}`} className="hover:text-forest-700">
                  {settings.contactPhone}
                </a>
              </p>
            </div>
          )}

          {settings.contactEmail && (
            <div className="rounded-2xl border border-forest-900/10 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Email</p>
              <p className="mt-1 font-semibold text-ink">
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-forest-700">
                  {settings.contactEmail}
                </a>
              </p>
            </div>
          )}
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
