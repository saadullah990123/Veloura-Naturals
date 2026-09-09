import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cod',
  'meezan_bank',
  'easypaisa',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'unpaid',
  'pending_verification',
  'verified',
  'failed',
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'pending',
  'approved',
  'hidden',
]);

// ---------------------------------------------------------------------------
// Categories (kept for extensibility — the storefront currently sells one
// product, but the admin can add more products/categories later without a
// rebuild, per the Master Prompt scalability requirement).
// ---------------------------------------------------------------------------
export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 140 }).notNull().unique(),
    parentId: integer('parent_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: index('categories_slug_idx').on(t.slug),
  })
);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 220 }).notNull().unique(),
    categoryId: integer('category_id').references(() => categories.id),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: numeric('compare_at_price', { precision: 10, scale: 2 }),
    shortDescription: text('short_description'),
    description: text('description'),
    details: text('details'), // long-form specs / ingredients / how to use
    images: jsonb('images').$type<string[]>().notNull().default([]),
    stock: integer('stock').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    isFeatured: boolean('is_featured').notNull().default(true),
    isBestseller: boolean('is_bestseller').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: index('products_slug_idx').on(t.slug),
    activeIdx: index('products_active_idx').on(t.isActive),
  })
);

// ---------------------------------------------------------------------------
// Orders — customer name/phone/address captured directly (no customer
// accounts required, matches the frictionless single-click order form).
// ---------------------------------------------------------------------------
export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),
    customerName: varchar('customer_name', { length: 150 }).notNull(),
    phone: varchar('phone', { length: 30 }).notNull(),
    email: varchar('email', { length: 200 }),
    address: text('address').notNull(),
    city: varchar('city', { length: 100 }),

    // Snapshot of what was ordered — price/total always computed server-side
    // at order-creation time, never trusted from the client.
    productId: integer('product_id')
      .references(() => products.id)
      .notNull(),
    productName: varchar('product_name', { length: 200 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull(),
    deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).notNull().default('0'),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),

    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('unpaid'),
    paymentProofUrl: text('payment_proof_url'),
    transactionId: varchar('transaction_id', { length: 100 }),

    status: orderStatusEnum('status').notNull().default('pending'),
    trackingNumber: varchar('tracking_number', { length: 100 }),
    courier: varchar('courier', { length: 100 }),
    adminNotes: text('admin_notes'),
    customerNotes: text('customer_notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    orderNumberIdx: index('orders_order_number_idx').on(t.orderNumber),
    phoneIdx: index('orders_phone_idx').on(t.phone),
    statusIdx: index('orders_status_idx').on(t.status),
  })
);

// Audit trail for order status changes (Section 6 — audit logging requirement).
export const orderStatusHistory = pgTable('order_status_history', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  fromStatus: varchar('from_status', { length: 30 }),
  toStatus: varchar('to_status', { length: 30 }).notNull(),
  changedByAdminId: integer('changed_by_admin_id').references(() => admins.id),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export const reviews = pgTable(
  'reviews',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id').references(() => products.id),
    customerName: varchar('customer_name', { length: 150 }).notNull(),
    rating: integer('rating').notNull(),
    title: varchar('title', { length: 150 }),
    body: text('body'),
    status: reviewStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index('reviews_status_idx').on(t.status),
  })
);

// ---------------------------------------------------------------------------
// Admins
// ---------------------------------------------------------------------------
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 200 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  role: varchar('role', { length: 30 }).notNull().default('admin'),
  resetToken: varchar('reset_token', { length: 200 }),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Settings — single-row key/value-ish table for editable business info.
// Kept as one row so the admin Settings page is a simple form, not a list.
// ---------------------------------------------------------------------------
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  businessName: varchar('business_name', { length: 150 }).notNull().default('Veloura Naturals'),
  contactPhone: varchar('contact_phone', { length: 30 }),
  contactEmail: varchar('contact_email', { length: 200 }),
  whatsappNumber: varchar('whatsapp_number', { length: 30 }),
  address: text('address'),
  announcementText: varchar('announcement_text', { length: 200 }),

  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).notNull().default('200'),
  freeDeliveryThreshold: numeric('free_delivery_threshold', { precision: 10, scale: 2 }),

  meezanAccountTitle: varchar('meezan_account_title', { length: 150 }),
  meezanAccountNumber: varchar('meezan_account_number', { length: 60 }),
  meezanIban: varchar('meezan_iban', { length: 60 }),
  meezanBankName: varchar('meezan_bank_name', { length: 100 }).default('Meezan Bank'),

  easypaisaAccountTitle: varchar('easypaisa_account_title', { length: 150 }),
  easypaisaNumber: varchar('easypaisa_number', { length: 30 }),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
