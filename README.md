<div align="center">

<img src="public/images/logo-fleur.png" alt="Veloura Naturals" width="120" />

# Veloura Naturals

### Organic hair care e-commerce with a full admin dashboard.

A fast, mobile-first storefront for a single-product organic hair oil brand, with order tracking, customer reviews, and a secure back office for managing products, orders, payments, and reviews.

<br />

[![Live Demo](https://img.shields.io/badge/Live_Demo-veloura--naturals.vercel.app-1B6B0F?style=for-the-badge&logo=vercel&logoColor=white)](https://veloura-naturals.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=flat-square&logo=tailwindcss&logoColor=38BDF8)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat-square&logo=drizzle&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

[**Live Demo**](https://veloura-naturals.vercel.app) · [**Features**](#-features) · [**Architecture**](#-architecture) · [**Getting Started**](#-getting-started) · [**Screenshots**](#-screenshots)

</div>

---

## 📖 Overview

**Veloura Naturals** is a full-stack e-commerce platform built for an organic hair growth oil brand. Customers can browse the product, read verified reviews, and place an order in a single form. The store owner manages everything from a protected admin dashboard, with no code changes needed.

The checkout is built for the Pakistani market: customers pay by **Cash on Delivery**, **Meezan Bank**, or **EasyPaisa**, and every order is tracked through a clear fulfillment lifecycle.

**Highlights**

- ⚡ Next.js App Router with server-rendered pages and a polished, brand-consistent UI
- 🧾 One-page ordering: customer details, quantity, payment method, and live totals in a single form
- 🛠️ Admin dashboard for products, orders and payments, review moderation, store settings, and account security
- ⭐ Review system with photo uploads, a lightbox viewer, and admin approval before anything goes live
- 🔒 Protected admin: hashed credentials, session-based auth, rate limiting, and guarded API routes
- 📡 Resilient UX: offline banner, route-level error boundaries, and a mobile navigation bar

---

## ✨ Features

### 🛍️ Storefront

| | Feature | Description |
|:-:|:--|:--|
| 🏠 | **Landing Page** | Hero section with animated headline, benefit cards, and live rating summary |
| 🛒 | **Shop & Product Page** | Image gallery, bestseller badge, sale and compare-at pricing, and live stock status |
| 🧾 | **Order Form** | Name, phone, city, address, quantity, payment method, and notes, with an itemized total |
| 💳 | **Flexible Payments** | Cash on Delivery, Meezan Bank, and EasyPaisa |
| 📦 | **Order Tracking** | Customers check the status of an order from the Track Order page |
| ⭐ | **Reviews** | Star ratings, written reviews, photo uploads, and a lightbox gallery |
| ✉️ | **Contact Form** | Messages delivered to the store owner through a validated API route |
| 📱 | **Responsive** | Mobile navigation and layouts tuned for phones, where most customers shop |
| 📡 | **Offline Awareness** | Banner that warns users when they lose connectivity |

### 🔐 Admin Dashboard

| | Feature | Description |
|:-:|:--|:--|
| 📊 | **Overview** | At-a-glance summary of store activity |
| 🏷️ | **Products** | Create, edit, and remove products through a modal form |
| 🧾 | **Orders & Payments** | Filter by status, change status inline, and view each order's payment method and total |
| ⭐ | **Review Moderation** | Approve, unapprove or hide, and delete reviews; approved reviews go live instantly |
| ⚙️ | **Settings** | Store-wide configuration managed from the dashboard |
| 🔑 | **My Account** | Update credentials, with login, forgot-password, and reset-password flows |

### 🔄 Order Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: Customer places order
    Pending --> Confirmed: Admin confirms
    state "Confirmed (Packed)" as Confirmed
    Confirmed --> Shipped
    Shipped --> Delivered
    Pending --> Cancelled
    Confirmed --> Cancelled
    Delivered --> [*]
    Cancelled --> [*]
```

### 💬 Review Moderation Flow

```mermaid
flowchart LR
    A[Customer submits review] --> B{Pending approval}
    B -->|Approve| C[Live on storefront]
    B -->|Delete| D[Removed]
    C -->|Unapprove / Hide| E[Hidden]
    E -->|Approve| C
```

---

## 🏗️ Architecture

```mermaid
flowchart LR
    A[Customer] --> B[Storefront Pages]
    C[Admin] --> D[Admin Dashboard]
    B --> E[Public API Routes]
    D --> F[Protected Admin API Routes]
    E --> G[Validation Schemas]
    F --> H[Auth Guard + Rate Limit]
    H --> G
    G --> I[(Database via Drizzle ORM)]
```

**Request flow:** every mutation is validated against shared schemas. Admin routes additionally pass an authentication guard and rate limiting before any database access.

### 🛡️ Security

| Concern | Approach |
|:--|:--|
| **Passwords** | Stored as hashes, never in plain text |
| **Sessions** | Session-based admin authentication |
| **Authorization** | Every admin API route is protected by a shared admin guard, with a dedicated forbidden page |
| **Abuse protection** | Rate limiting on authentication endpoints |
| **Input validation** | Shared validation schemas used by the API routes |
| **Error handling** | Route-level and global error boundaries so failures degrade gracefully |
| **Password recovery** | Forgot and reset password flows for admin accounts |

---

## 🛠️ Tech Stack

| Layer | Technology |
|:--|:--|
| **Framework** | [Next.js](https://nextjs.org/) (App Router) |
| **UI** | [React](https://react.dev/) · [Tailwind CSS](https://tailwindcss.com/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Database & ORM** | [Drizzle ORM](https://orm.drizzle.team/) with SQL migrations |
| **Auth** | Session-based admin authentication with hashed passwords |
| **Hosting** | [Vercel](https://vercel.com/) |

---

## 📁 Project Structure

<details>
<summary><b>Expand the file tree</b></summary>

```text
veloura-naturals
├── .brain/                       # Architecture and data-flow notes
├── .agents/rules/                # Commit style conventions
└── veloura/
    ├── drizzle/                  # SQL migrations and snapshots
    ├── public/images/            # Brand assets, product and review images
    └── src/
        ├── app/
        │   ├── page.tsx          # Landing page
        │   ├── shop/             # Shop listing
        │   ├── product/          # Product page and order form
        │   ├── track-order/      # Order tracking
        │   ├── contact/          # Contact page
        │   ├── admin/
        │   │   ├── (protected)/  # overview · products · orders · reviews
        │   │   │                 # settings · account
        │   │   └── login · forgot-password · reset-password · forbidden
        │   └── api/              # Public + protected admin endpoints
        ├── components/
        │   ├── admin/            # Shell, sidebar, product form modal
        │   └── ...               # Order form, reviews, gallery, header, footer
        └── lib/
            ├── auth/             # Sessions, password hashing, rate limit, guard
            ├── db/               # Schema, connection, migrate, seed
            ├── validation/       # Shared validation schemas
            └── data.ts · utils.ts · admin-fetch.ts
```

</details>

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- A database supported by the project's Drizzle configuration

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/veloura-naturals.git
cd veloura-naturals/veloura

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Apply migrations and seed initial data
npm run db:migrate
npm run db:seed

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

All required variables are documented in [`.env.example`](./.env.example). Copy it to `.env` and fill in your own values.

> [!WARNING]
> Never commit your `.env` file. Use long, random secrets for session signing and rotate them if they are ever exposed.

---

## 📜 Available Scripts

| Command | Description |
|:--|:--|
| `npm run dev` | Start the local development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Run the production server |
| `npm run lint` | Lint the codebase |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Seed the database with initial data |

---

## 🌐 Deployment

Veloura Naturals is deployed on **Vercel**.

1. Import the repository into Vercel and set the project root to `veloura`.
2. Add the environment variables from `.env.example`.
3. Run the database migrations against the production database.
4. Deploy. Vercel builds every push and creates preview deployments for branches.

---

## 📸 Screenshots

| Storefront | Product & Checkout |
|:-:|:-:|
| <img src="docs/screenshots/home.png" alt="Storefront home page" /> | ![Uploading veloura-naturals.vercel.app_product.png…]()
 |

| Orders & Payments | Review Moderation |
|:-:|:-:|
| <img src="docs/screenshots/admin-orders.png" alt="Admin orders and payments" /> | <img src="docs/screenshots/admin-reviews.png" alt="Admin review moderation" /> |

---

## 📄 License

This project is privately owned by **Veloura Naturals**. All rights reserved © 2026.

---

<div align="center">

Designed & developed by **Saad Ullah Irfan** for **Veloura Naturals**

[**🔗 Visit the Live Store**](https://veloura-naturals.vercel.app)

</div>
