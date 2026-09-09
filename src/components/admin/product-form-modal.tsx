'use client';

import { adminFetch } from '@/lib/admin-fetch';
import { useState } from 'react';

export interface ProductFormData {
  id?: number;
  name: string;
  slug: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  shortDescription: string;
  description: string;
  details: string;
  images: string; // newline-separated in the form, converted to array on submit
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
}

const EMPTY: ProductFormData = {
  name: '',
  slug: '',
  price: '',
  compareAtPrice: '',
  stock: '0',
  shortDescription: '',
  description: '',
  details: '',
  images: '',
  isActive: true,
  isFeatured: true,
  isBestseller: false,
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ProductFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: ProductFormData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState<ProductFormData>(initial || EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slugTouched, setSlugTouched] = useState(isEdit);

  function update<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'name' && !slugTouched) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name: form.name,
      slug: form.slug,
      price: form.price,
      compareAtPrice: form.compareAtPrice ? form.compareAtPrice : null,
      stock: form.stock,
      shortDescription: form.shortDescription,
      description: form.description,
      details: form.details,
      images: form.images
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      isBestseller: form.isBestseller,
    };

    const url = isEdit ? `/api/admin/products/${form.id}` : '/api/admin/products';
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save product.');
        setSaving(false);
        return;
      }
      onSaved();
    } catch {
      setError('Network error. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/50 px-4 py-8 sm:items-center">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">Product Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">
              URL Slug
            </label>
            <input
              required
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update('slug', e.target.value);
              }}
              className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm font-mono outline-none focus:border-forest-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink/60">Price (Rs.)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink/60">Compare-at</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.compareAtPrice}
                onChange={(e) => update('compareAtPrice', e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1.5 block text-xs font-medium text-ink/60">Stock</label>
              <input
                required
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => update('stock', e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">Short Description</label>
            <textarea
              rows={2}
              value={form.shortDescription}
              onChange={(e) => update('shortDescription', e.target.value)}
              className="w-full resize-none rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">Full Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="w-full resize-none rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">
              Details (ingredients / directions)
            </label>
            <textarea
              rows={3}
              value={form.details}
              onChange={(e) => update('details', e.target.value)}
              className="w-full resize-none rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">
              Image URLs (one per line — first is the main image)
            </label>
            <textarea
              rows={3}
              value={form.images}
              onChange={(e) => update('images', e.target.value)}
              placeholder="/images/product-1.jpg"
              className="w-full resize-none rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm font-mono outline-none focus:border-forest-500"
            />
          </div>

          <div className="flex flex-wrap gap-5">
            {(
              [
                ['isActive', 'Active (visible on storefront)'],
                ['isFeatured', 'Featured'],
                ['isBestseller', 'Bestseller badge'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-ink/70">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => update(key, e.target.checked)}
                  className="h-4 w-4 rounded border-ink/30"
                />
                {label}
              </label>
            ))}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full disabled:opacity-60 sm:w-auto"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
