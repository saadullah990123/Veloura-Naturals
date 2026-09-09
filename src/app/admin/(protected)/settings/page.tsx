'use client';

import { adminFetch } from '@/lib/admin-fetch';
import { useEffect, useState } from 'react';

interface Settings {
  businessName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  whatsappNumber: string | null;
  address: string | null;
  announcementText: string | null;
  deliveryFee: string;
  freeDeliveryThreshold: string | null;
  meezanAccountTitle: string | null;
  meezanAccountNumber: string | null;
  meezanIban: string | null;
  meezanBankName: string | null;
  easypaisaAccountTitle: string | null;
  easypaisaNumber: string | null;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    adminFetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data.settings);
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage('');

    const res = await adminFetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || 'Failed to save.');
      return;
    }
    setSettings(data.settings);
    setMessage('Settings saved.');
  }

  if (loading) return <p className="text-ink/50">Loading…</p>;
  if (!settings) return <p className="text-ink/50">Could not load settings.</p>;

  const field = (key: keyof Settings, label: string, type = 'text') => (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-ink/60">{label}</label>
      <input
        type={type}
        value={(settings[key] as string) || ''}
        onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
        className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
      />
    </div>
  );

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Business Settings</h1>
      <p className="mt-1 text-sm text-ink/50">
        Contact info, delivery fee, and payment account details — editable without touching code.
      </p>

      <form onSubmit={handleSave} className="mt-8 max-w-2xl space-y-8">
        <section className="admin-card p-6">
          <h2 className="font-semibold text-ink">General</h2>
          <div className="mt-4 space-y-4">
            {field('businessName', 'Business Name')}
            <div className="grid gap-4 sm:grid-cols-2">
              {field('contactPhone', 'Contact Phone')}
              {field('contactEmail', 'Contact Email', 'email')}
            </div>
            {field('whatsappNumber', 'WhatsApp Number (digits only, with country code)')}
            {field('address', 'Business Address')}
            {field('announcementText', 'Announcement Bar Text')}
          </div>
        </section>

        <section className="admin-card p-6">
          <h2 className="font-semibold text-ink">Delivery</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {field('deliveryFee', 'Delivery Fee (Rs.)', 'number')}
            {field('freeDeliveryThreshold', 'Free Delivery Above (Rs.)', 'number')}
          </div>
        </section>

        <section className="admin-card p-6">
          <h2 className="font-semibold text-ink">Meezan Bank</h2>
          <div className="mt-4 space-y-4">
            {field('meezanAccountTitle', 'Account Title')}
            <div className="grid gap-4 sm:grid-cols-2">
              {field('meezanBankName', 'Bank Name')}
              {field('meezanAccountNumber', 'Account Number')}
            </div>
            {field('meezanIban', 'IBAN')}
          </div>
        </section>

        <section className="admin-card p-6">
          <h2 className="font-semibold text-ink">EasyPaisa</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {field('easypaisaAccountTitle', 'Account Title')}
            {field('easypaisaNumber', 'Mobile Number')}
          </div>
        </section>

        {message && (
          <p className={message.includes('saved') ? 'text-sm text-forest-600' : 'text-sm text-red-600'}>
            {message}
          </p>
        )}

        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
