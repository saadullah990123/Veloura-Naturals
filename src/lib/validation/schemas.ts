import { z } from 'zod';

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
// The client sends ONLY product id + quantity + delivery details. Price,
// stock check, and total are always computed server-side in the order API
// route — never trusted from the browser (Master Prompt Section 4 & 8).
export const createOrderSchema = z.object({
  customerName: z.string().trim().min(2, 'Name is required').max(150),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, 'Enter a valid phone number'),
  email: z.string().trim().email().optional().or(z.literal('')),
  address: z.string().trim().min(5, 'Delivery address is required').max(500),
  city: z.string().trim().max(100).optional().or(z.literal('')),

  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().max(20),

  paymentMethod: z.enum(['cod', 'meezan_bank', 'easypaisa']),
  transactionId: z.string().trim().max(100).optional().or(z.literal('')),
  paymentProofUrl: z.string().trim().url().optional().or(z.literal('')),

  customerNotes: z.string().trim().max(500).optional().or(z.literal('')),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  trackingNumber: z.string().trim().max(100).optional(),
  courier: z.string().trim().max(100).optional(),
  adminNotes: z.string().trim().max(1000).optional(),
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['unpaid', 'pending_verification', 'verified', 'failed']),
});

export const trackOrderSchema = z.object({
  orderNumber: z.string().trim().max(30).optional(),
  phone: z.string().trim().max(30).optional(),
}).refine((d) => d.orderNumber || d.phone, {
  message: 'Provide an order number or phone number',
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export const productSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(220)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  price: z.coerce.number().positive('Price must be a positive number'),
  compareAtPrice: z.coerce.number().positive().nullable().optional(),
  shortDescription: z.string().trim().max(300).optional().or(z.literal('')),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  details: z.string().trim().max(10000).optional().or(z.literal('')),
  images: z.array(z.string().url()).max(12).default([]),
  stock: z.coerce.number().int().min(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(true),
  isBestseller: z.boolean().default(true),
});

export const productUpdateSchema = productSchema.partial();

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  parentId: z.coerce.number().int().positive().nullable().optional(),
});

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export const createReviewSchema = z.object({
  productId: z.coerce.number().int().positive().optional(),
  customerName: z.string().trim().min(2).max(150),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(150).optional().or(z.literal('')),
  body: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const updateReviewStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'hidden']),
});

// ---------------------------------------------------------------------------
// Admin auth
// ---------------------------------------------------------------------------
export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
});

export const adminForgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const adminResetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(200),
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export const settingsSchema = z.object({
  businessName: z.string().trim().min(2).max(150),
  contactPhone: z.string().trim().max(30).optional().or(z.literal('')),
  contactEmail: z.string().trim().email().optional().or(z.literal('')),
  whatsappNumber: z.string().trim().max(30).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  announcementText: z.string().trim().max(200).optional().or(z.literal('')),

  deliveryFee: z.coerce.number().min(0),
  freeDeliveryThreshold: z.coerce.number().min(0).nullable().optional(),

  meezanAccountTitle: z.string().trim().max(150).optional().or(z.literal('')),
  meezanAccountNumber: z.string().trim().max(60).optional().or(z.literal('')),
  meezanIban: z.string().trim().max(60).optional().or(z.literal('')),
  meezanBankName: z.string().trim().max(100).optional().or(z.literal('')),

  easypaisaAccountTitle: z.string().trim().max(150).optional().or(z.literal('')),
  easypaisaNumber: z.string().trim().max(30).optional().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------------
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  message: z.string().trim().min(5).max(2000),
});
