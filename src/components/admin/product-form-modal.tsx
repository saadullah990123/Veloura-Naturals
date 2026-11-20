'use client';

import { adminFetch } from '@/lib/admin-fetch';
import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';

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
  images: string[];
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
  images: [],
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

// Client-side image compressor for fast, reliable upload directly to product records
async function compressImage(file: File, maxDimension = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(mime, quality));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
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
  const [form, setForm] = useState<ProductFormData>(() => {
    if (!initial) return EMPTY;
    return {
      ...initial,
      images: Array.isArray(initial.images) ? initial.images : [],
    };
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'name' && !slugTouched) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  function handleAddUrl() {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    if (form.images.length >= 12) {
      setError('A product can have a maximum of 12 images.');
      return;
    }
    setForm((f) => ({ ...f, images: [...f.images, trimmed] }));
    setNewImageUrl('');
    setError('');
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (form.images.length + files.length > 12) {
      setError('A product can have a maximum of 12 images.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          continue;
        }
        const compressed = await compressImage(file);
        newImages.push(compressed);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...newImages] }));
    } catch {
      setError('Failed to process image files.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function removeImage(index: number) {
    setForm((f) => ({
      ...f,
      images: f.images.filter((_, i) => i !== index),
    }));
  }

  function moveImage(index: number, direction: 'prev' | 'next') {
    const targetIdx = direction === 'prev' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= form.images.length) return;

    setForm((f) => {
      const nextImages = [...f.images];
      const temp = nextImages[index];
      nextImages[index] = nextImages[targetIdx];
      nextImages[targetIdx] = temp;
      return { ...f, images: nextImages };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice && form.compareAtPrice.trim() !== '' ? Number(form.compareAtPrice) : null,
      stock: Number(form.stock),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      details: form.details.trim(),
      images: form.images,
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
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-ink/10 pb-3">
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
              placeholder="e.g. Veloura Naturals Hair Oil"
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
              placeholder="e.g. veloura-naturals-hair-oil"
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
                placeholder="1999"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink/60">Compare-at Price (Rs.)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.compareAtPrice}
                onChange={(e) => update('compareAtPrice', e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
                placeholder="2999 (optional)"
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
              placeholder="Quick highlight of product benefits"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">Full Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="w-full resize-none rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
              placeholder="Detailed description of the product"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">
              Details (Ingredients & How to Use)
            </label>
            <textarea
              rows={3}
              value={form.details}
              onChange={(e) => update('details', e.target.value)}
              className="w-full resize-none rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-500"
              placeholder="Ingredients, application directions, and specs"
            />
          </div>

          {/* -------------------------------------- Product Images Management */}
          <div className="rounded-xl border border-ink/15 bg-forest-50/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink/70">
                Product Images ({form.images.length}/12)
              </label>
              <span className="text-[11px] text-ink/50">First image is the main storefront image</span>
            </div>

            {/* Current Images Gallery / Reordering */}
            {form.images.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {form.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-ink/15 bg-white shadow-sm"
                  >
                    <div className="relative aspect-square w-full bg-forest-50/50">
                      <Image
                        src={img}
                        alt={`Product image ${idx + 1}`}
                        fill
                        sizes="160px"
                        className="object-cover"
                        unoptimized={img.startsWith('data:')}
                      />
                      {idx === 0 && (
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-forest-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                          Main
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-ink/10 bg-white px-2 py-1 text-xs">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveImage(idx, 'prev')}
                          className="rounded px-1.5 py-0.5 font-bold text-ink/60 hover:bg-ink/5 disabled:opacity-20"
                          title="Move earlier"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          disabled={idx === form.images.length - 1}
                          onClick={() => moveImage(idx, 'next')}
                          className="rounded px-1.5 py-0.5 font-bold text-ink/60 hover:bg-ink/5 disabled:opacity-20"
                          title="Move later"
                        >
                          →
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="text-[11px] font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Image Options */}
            <div className="mt-4 space-y-3 border-t border-ink/10 pt-3">
              {/* Option 1: Direct File Upload */}
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || form.images.length >= 12}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-forest-600/30 bg-white px-3.5 py-2 text-xs font-semibold text-forest-700 shadow-sm hover:bg-forest-50 active:scale-95 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{isUploading ? 'Compressing…' : '+ Upload Image from Device'}</span>
                </button>
                <span className="text-xs text-ink/40">or enter path/URL below</span>
              </div>

              {/* Option 2: Add image path / URL */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUrl();
                    }
                  }}
                  placeholder="/images/product-placeholder-1.png or https://..."
                  className="flex-1 rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-forest-500"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  disabled={!newImageUrl.trim() || form.images.length >= 12}
                  className="rounded-lg bg-forest-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-forest-700 disabled:opacity-50"
                >
                  Add URL
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-5 pt-1">
            {(
              [
                ['isActive', 'Active (visible on storefront)'],
                ['isFeatured', 'Featured on homepage'],
                ['isBestseller', 'Bestseller badge'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-ink/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(e) => update(key, e.target.checked)}
                  className="h-4 w-4 rounded border-ink/30 text-forest-600 focus:ring-forest-500"
                />
                {label}
              </label>
            ))}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col-reverse gap-3 pt-3 border-t border-ink/10 sm:flex-row sm:justify-end">
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
