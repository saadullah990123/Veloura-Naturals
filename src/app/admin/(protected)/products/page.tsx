'use client';

import { adminFetch } from '@/lib/admin-fetch';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { formatPKR } from '@/lib/utils';
import ProductFormModal, { ProductFormData } from '@/components/admin/product-form-modal';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  compareAtPrice: string | null;
  shortDescription: string | null;
  description: string | null;
  details: string | null;
  images: string[];
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
}

function toFormData(p: Product): ProductFormData {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice || '',
    stock: String(p.stock),
    shortDescription: p.shortDescription || '',
    description: p.description || '',
    details: p.details || '',
    images: p.images.join('\n'),
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    isBestseller: p.isBestseller,
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductFormData | undefined>(undefined);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await adminFetch('/api/admin/products');
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAddModal() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEditModal(p: Product) {
    setEditing(toFormData(p));
    setModalOpen(true);
  }

  function handleSaved() {
    setModalOpen(false);
    setMessage(editing ? 'Product updated.' : 'Product added.');
    load();
    setTimeout(() => setMessage(''), 3000);
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await adminFetch(`/api/admin/products/${p.id}`, { method: 'DELETE' });
    setMessage('Product deleted.');
    load();
    setTimeout(() => setMessage(''), 3000);
  }

  async function toggleActive(p: Product) {
    await adminFetch(`/api/admin/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    load();
  }

  async function quickUpdatePrice(p: Product, newPrice: string) {
    if (newPrice === p.price) return;
    await adminFetch(`/api/admin/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: newPrice }),
    });
    load();
  }

  async function quickUpdateStock(p: Product, newStock: string) {
    if (Number(newStock) === p.stock) return;
    await adminFetch(`/api/admin/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: newStock }),
    });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Products</h1>
          <p className="mt-1 text-sm text-ink/50">
            Add, edit, or remove items — price and stock update instantly on the storefront.
          </p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          + Add Product
        </button>
      </div>

      {message && (
        <p className="mt-4 rounded-lg bg-forest-50 px-4 py-2 text-sm text-forest-700">{message}</p>
      )}

      {loadError && (
        <div className="mt-6 flex flex-col items-center gap-3 admin-card px-5 py-10 text-center">
          <p className="text-sm text-red-600">Couldn't load products. Please check your connection.</p>
          <button onClick={load} className="btn-outline">Retry</button>
        </div>
      )}

      {!loadError && (
      <>
      {/* ---------------------------------------------- Mobile: card list */}
      <div className="mt-6 space-y-4 sm:hidden">
        {loading && <p className="text-ink/40">Loading…</p>}
        {!loading && products.length === 0 && (
          <p className="text-ink/40">No products yet. Add your first one above.</p>
        )}
        {products.map((p) => (
          <div key={p.id} className="admin-card p-4">
            <div className="flex gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-forest-50">
                {p.images[0] && (
                  <Image src={p.images[0]} alt={p.name} width={64} height={64} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{p.name}</p>
                <p className="text-sm text-ink/50">{formatPKR(p.price)} · Stock: {p.stock}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    p.isActive ? 'bg-forest-100 text-forest-700' : 'bg-ink/10 text-ink/50'
                  }`}
                >
                  {p.isActive ? 'Active' : 'Hidden'}
                </span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => openEditModal(p)} className="flex-1 rounded-lg border border-ink/15 py-2 text-xs font-semibold text-ink/70">
                Edit
              </button>
              <button onClick={() => toggleActive(p)} className="flex-1 rounded-lg border border-ink/15 py-2 text-xs font-semibold text-ink/70">
                {p.isActive ? 'Hide' : 'Show'}
              </button>
              <button onClick={() => handleDelete(p)} className="flex-1 rounded-lg border border-red-200 py-2 text-xs font-semibold text-red-600">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------ Desktop: table */}
      <div className="mt-6 hidden overflow-x-auto admin-card sm:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
              <th className="px-5 py-3.5">Product</th>
              <th className="px-5 py-3.5">Price</th>
              <th className="px-5 py-3.5">Stock</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-ink/40">Loading…</td></tr>
            )}
            {!loading && products.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-ink/40">No products yet. Add your first one above.</td></tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-b border-ink/5">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-forest-50">
                      {p.images[0] && (
                        <Image src={p.images[0]} alt={p.name} width={48} height={48} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{p.name}</p>
                      <p className="truncate text-xs text-ink/40">/{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 text-ink/60">
                    <span>Rs.</span>
                    <input
                      type="number"
                      defaultValue={p.price}
                      onBlur={(e) => quickUpdatePrice(p, e.target.value)}
                      className="w-24 rounded-md border border-ink/15 px-2 py-1 text-sm outline-none focus:border-forest-500"
                    />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <input
                    type="number"
                    defaultValue={p.stock}
                    onBlur={(e) => quickUpdateStock(p, e.target.value)}
                    className="w-20 rounded-md border border-ink/15 px-2 py-1 text-sm outline-none focus:border-forest-500"
                  />
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => toggleActive(p)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      p.isActive ? 'bg-forest-100 text-forest-700' : 'bg-ink/10 text-ink/50'
                    }`}
                  >
                    {p.isActive ? 'Active' : 'Hidden'}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-3">
                    <button onClick={() => openEditModal(p)} className="text-forest-600 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}

      {modalOpen && (
        <ProductFormModal
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
