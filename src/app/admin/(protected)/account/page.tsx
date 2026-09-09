'use client';

import { adminFetch } from '@/lib/admin-fetch';
import { useEffect, useState } from 'react';

export default function AdminAccountPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch('/api/admin/account')
      .then((r) => r.json())
      .then((data) => {
        if (data.admin) {
          setEmail(data.admin.email);
          setName(data.admin.name);
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    const res = await adminFetch('/api/admin/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || 'Failed to update password.');
      return;
    }

    setMessage('Password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Account</h1>
      <p className="mt-1 text-sm text-ink/50">Manage your own admin login.</p>

      <div className="mt-8 max-w-md space-y-8">
        <section className="admin-card p-6">
          <h2 className="font-semibold text-ink">Signed in as</h2>
          <p className="mt-2 text-sm text-ink/60">{name || '—'}</p>
          <p className="text-sm text-ink/60">{email || '—'}</p>
        </section>

        <section className="admin-card p-6">
          <h2 className="font-semibold text-ink">Change Password</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink/60">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink/60">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink/60">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-forest-600">{message}</p>}

            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
