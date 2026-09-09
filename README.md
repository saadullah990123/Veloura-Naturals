# Veloura Naturals — E-commerce Platform

A single-product (Hair Growth Oil) direct-to-consumer storefront with a full
admin management hub, built with Next.js 14 (App Router), TypeScript,
Tailwind CSS, and PostgreSQL via Drizzle ORM.

## 1. Prerequisites

- Node.js 18+ 
- A PostgreSQL database — free options that work well: [Neon](https://neon.tech),
  [Supabase](https://supabase.com), or [Railway](https://railway.app)

## 2. Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL="postgresql://user:password@host:5432/dbname"
SESSION_SECRET="<generate with the command below>"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
NEXT_PUBLIC_WHATSAPP_NUMBER="923001234567"
```

Generate a strong session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Database

Run the migration to create all tables, then seed starter data (a default
admin account, business settings, the hair oil product, and a few reviews):

```bash
npm run db:migrate
npm run db:seed
```

By default the seed script creates:
- Admin login: `admin@velouranaturals.co.uk` / `ChangeThisPassword123!`
- **Change this password immediately after your first login.**

To use different seed credentials, set `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD` in your `.env` before running `npm run db:seed`.

## 4. Run locally

```bash
npm run dev
```

- Storefront: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin/login

## 5. Deploy (e.g. to Vercel)

1. Push this project to a GitHub repo.
2. Import it into Vercel.
3. Add the same environment variables (`DATABASE_URL`, `SESSION_SECRET`,
   `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`) in Vercel's project
   settings.
4. Run `npm run db:migrate` and `npm run db:seed` once against your
   production database (locally, pointed at the prod `DATABASE_URL`, or via
   a one-off Vercel deploy hook).
5. Deploy.

## 6. What's included

- **Customer pages**: Home (hero, typewriter, social proof/reviews),
  Product (single-click order form with COD / Meezan Bank / EasyPaisa),
  Track Order (lookup by order number or phone), Contact (form + WhatsApp).
- **Admin dashboard** (`/admin`): Overview stats, Product editor, Orders
  (filter, status updates, payment verification, tracking info, audit
  trail), Review moderation (approve/hide/delete), Business Settings (bank
  details, delivery fee, contact info) — all editable without touching code.
- **Security**: bcrypt-hashed admin passwords, HMAC-signed httpOnly session
  cookies, every `/api/admin/*` route independently re-verifies
  authentication and authorization server-side, Zod validation on all
  inputs, and all order totals are recalculated server-side from the
  database — client-submitted prices are never trusted.

## 7. Replacing the placeholder product images

The two images currently used for the product (`/public/images/...`) are
placeholders using the label artwork you provided. Once you have real
product photography:

1. Log into `/admin` → **Product**.
2. Upload your images somewhere with a public URL (e.g. a Vercel Blob
   store, Cloudinary, or S3 bucket), or drop files directly into
   `/public/images/` in the repo and reference them as `/images/filename.jpg`.
3. Paste the URLs into the **Image URLs** field (one per line, first line is
   the main image) and save — no redeploy needed if using external URLs.

## 8. Known follow-ups / things to wire up before going fully live

- **Payment proof upload**: the schema and admin UI support a
  `paymentProofUrl`, but there's no file-upload endpoint wired up yet for
  bank-transfer screenshots — customers currently share proof via WhatsApp,
  which the admin can note manually. Add an upload route (e.g. to Vercel
  Blob or S3) if you want in-app uploads.
- **Contact form**: messages are currently logged to the server console
  only. Wire `/api/contact` to send an email or a WhatsApp/Slack
  notification when you're ready.
- **Rate limiting** is in-memory per server instance — fine for a single
  small deployment, but swap for a durable store (e.g. Upstash Redis) if you
  scale to multiple instances.
- **Password reset flow**: fully working now (`/admin/forgot-password` →
  `/admin/reset-password`), with hashed, single-use, 1-hour-expiring tokens.
  The one remaining gap: no email provider is wired up yet, so the reset
  link is only logged server-side (`console.log`) rather than emailed —
  connect a transactional email service (Resend, SendGrid, Postmark) in
  `src/app/api/admin/forgot-password/route.ts` before relying on this in
  production, and remove the console.log of the raw link once you do.

## 9. Handling concurrent traffic (e.g. ~200 simultaneous visitors)

Two separate things had to be true for this, and both are now built in:

**1. Two people can't buy the last unit at once.** Order creation
(`/api/orders`) uses a single atomic database transaction: the stock
decrement and the availability check happen as one operation
(`UPDATE products SET stock = stock - qty WHERE stock >= qty`), so if two
customers submit an order for the same last unit at the exact same moment,
Postgres guarantees only one of those updates can succeed — the second
customer gets a clean "just sold out" message instead of the order silently
overselling.

**2. The homepage/product/contact pages don't hit the database per
visitor.** They use Next.js ISR (`export const revalidate = 30`), so under a
traffic spike, 200 people loading the site are served the same cached page
render, refreshed at most once every 30–60 seconds — not 200 separate
database round trips. An admin price/stock/review change appears within
that window, not instantly; this is a deliberate trade-off for throughput.
The **order and tracking APIs are never cached** — every checkout always
reads live stock/price straight from the database.

**For production deployment specifically**, one more thing matters more
than anything in this codebase: **use your database provider's pooled
connection string** (Neon and Supabase both call this the "pooler" or
PgBouncer endpoint) for `DATABASE_URL`, not the direct connection string.
On serverless hosting (Vercel), every warm function instance opens its own
small connection pool (`DB_POOL_MAX`, default 5) — with real concurrent
traffic spread across many instances, a direct (non-pooled) connection can
run out of Postgres's connection limit well before 200 concurrent users.
The pooled endpoint is built to multiplex far more logical connections than
Postgres allows directly, and requires no code change — just the connection
string.

If you outgrow this (thousands of concurrent users, not hundreds), the
in-memory rate limiter is the next thing to swap for a durable store (e.g.
Upstash Redis) — see the note in `src/lib/auth/rate-limit.ts`.
