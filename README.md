# Brit English School — Full-Stack Web Platform

> A production-ready English school platform: public marketing website + private student community, powered by Next.js, Supabase, and Claude AI.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Claude AI](https://img.shields.io/badge/Claude-AI-D97706?logo=anthropic)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?logo=vercel)

---

## Overview

Brit English School is a premium English school based in Tarragona, Spain. This platform replaces scattered WhatsApp groups, PDFs by email, and a static website with a single, unified platform:

- **Zone 1 — Public website:** SEO-optimised marketing site that converts visitors into students
- **Zone 2 — Private community:** Student dashboard with lessons, homework, exams, community feed, and direct messaging

---

## Screenshot

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   [Screenshot placeholder — add after deployment]  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email + Google OAuth) |
| Storage | Supabase Storage (homework, exam PDFs) |
| Realtime | Supabase Realtime (messaging, feed) |
| AI | Claude API (`claude-sonnet-4-6`) |
| Email | Resend |
| Rate limiting | Upstash Redis |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| Deployment | Vercel |

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/germanhernandezmairal/brit-english-school.git
cd brit-english-school
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and set the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Claude AI
ANTHROPIC_API_KEY=your_anthropic_api_key

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Resend (email)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=no-reply@britenglishschool.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Brit English School

# Replicate (AI image generation)
REPLICATE_API_TOKEN=your_replicate_api_token

# Web Push (VAPID) — generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your_email
```

### 4. Set up the Supabase database

1. Create a project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor** in your Supabase dashboard
3. Run the full schema from `supabase/schema.sql`
4. Run the messaging migration from `supabase/migrations/001_messaging.sql`
5. Enable Google OAuth in **Authentication → Providers** (optional)

### 5. Generate VAPID keys for Web Push

```bash
npx web-push generate-vapid-keys
```

Copy the output into your `.env.local`.

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Folder Structure

```
brit-english-school/
├── app/
│   ├── (auth)/                # Login, signup, onboarding pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── onboarding/
│   ├── (app)/                 # Protected student/admin area
│   │   ├── layout.tsx         # Auth guard + sidebar layout
│   │   ├── dashboard/         # Student home
│   │   ├── lessons/           # Lesson list + video player
│   │   ├── homework/          # File upload + AI pre-scan
│   │   ├── exams/             # PDF + interactive exam modes
│   │   ├── community/         # Post feed + announcements
│   │   ├── messages/          # Direct + broadcast messaging
│   │   └── admin/             # Admin panel (role-guarded)
│   ├── about/                 # Public about page
│   ├── blog/                  # Public blog index
│   ├── contact/               # Public contact page + form
│   ├── levels/                # Public CEFR levels page
│   ├── actions/               # Server actions (contact, admin, etc.)
│   ├── layout.tsx             # Root layout (fonts, SEO, OG)
│   ├── page.tsx               # Public homepage
│   ├── sitemap.ts             # Auto-generated sitemap.xml
│   ├── robots.ts              # Auto-generated robots.txt
│   └── opengraph-image.tsx    # Dynamic OG image (1200×630)
├── components/
│   ├── public/                # SiteHeader, SiteFooter
│   ├── dashboard/             # DashboardSidebar
│   └── shared/                # AnimateIn (Framer Motion)
├── lib/
│   └── supabase/              # Browser, server, admin clients
├── types/
│   └── database.ts            # TypeScript types for all 16 DB tables
├── supabase/
│   ├── schema.sql             # Full database schema + RLS policies
│   └── migrations/
│       └── 001_messaging.sql  # Conversations + messages tables
├── public/
│   └── animations/            # Lottie JSON files
├── docs/
│   ├── dev-log.html           # Developer log (architecture + decisions)
│   └── owner-guide.html       # Non-technical guide for the school owner
├── middleware.ts              # Auth guard for all protected routes
├── .env.local.example         # Environment variable template
└── .gitignore                 # Excludes .env, .next, node_modules
```

---

## Deployment — Vercel + Supabase

### Vercel

1. Push the repository to GitHub (keep it **private**)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Set all environment variables from `.env.local` in **Settings → Environment Variables**
   - Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g. `https://www.britenglishschool.com`)
4. Click **Deploy**

### Custom Domain

1. In Vercel → **Settings → Domains**, add `www.britenglishschool.com`
2. Update your DNS records as instructed by Vercel (CNAME or A record)
3. Vercel provisions an SSL certificate automatically

### Supabase Production Settings

1. In Supabase → **Authentication → URL Configuration**, add your production URL to **Redirect URLs**
2. Enable **RLS** on all tables (already configured in schema.sql)
3. Confirm the **Storage buckets** (`homework`, `lessons`) exist and have the correct policies

---

## Key Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server only — never expose) |
| `ANTHROPIC_API_KEY` | Yes | Claude AI API key |
| `UPSTASH_REDIS_REST_URL` | Yes | Rate limiting + caching |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Redis auth token |
| `RESEND_API_KEY` | Yes | Transactional email |
| `REPLICATE_API_TOKEN` | Optional | AI image generation |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Optional | Web push notifications |
| `VAPID_PRIVATE_KEY` | Optional | Web push (server only) |

---

## Contributing

This is a private project. Only collaborators added by the owner may contribute.

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -m "feat: description"`
3. Open a pull request against `main`

---

## License

Proprietary — © 2026 Brit English School. All rights reserved.

Technical implementation by [Germán Hernández Mairal](mailto:gerhm19@gmail.com).
