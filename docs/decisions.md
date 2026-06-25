# Architecture Decision Records

One paragraph per significant choice: **context → decision → trade-off accepted.**
Backfilled from the project as it stands; append new decisions as they're made.

---

## ADR-001 — Supabase as the backend (Postgres + Auth + Storage)

**Context:** A solo-built school platform needs auth, a relational DB, file storage, and
realtime, without standing up bespoke infrastructure.
**Decision:** Use Supabase for all four. Row-Level Security (RLS) enforces per-user access;
the `service_role` key bypasses RLS for trusted server-side admin operations.
**Trade-off accepted:** Vendor lock-in to Supabase's APIs and a hard dependency on RLS being
correct. Mitigated by keeping schema in `supabase/migrations/` and concentrating service-role
use in `lib/supabase/server.ts`.

## ADR-002 — Next.js App Router on Vercel

**Context:** Want SEO-friendly marketing pages, an authenticated app, and server-side data
access in one codebase, deployed with minimal ops.
**Decision:** Next.js App Router (React Server Components + Server Actions) hosted on Vercel.
Mutations are Server Actions; reads are mostly RSC queries.
**Trade-off accepted:** RSC Supabase queries fail *silently* (return `{ data: null }` → empty
state) on schema/permission errors, invisible to the browser. This caused a class of bugs (see
ADR-004). Accepted in exchange for the simplicity of co-located server data fetching.

## ADR-003 — `service_role` Supabase client for trusted writes/storage

**Context:** Admin operations and storage uploads need to bypass RLS; the SSR cookie-bound
client runs as the authenticated user.
**Decision:** `createAdminClient` uses plain `@supabase/supabase-js` with the service key and
`persistSession: false` (no cookies) → true service-role. Used only in server actions behind a
`getAdminUser()`/role gate.
**Trade-off accepted:** The service key is a full-access secret; any misuse bypasses all RLS.
Contained to server-only modules and never exposed to the client.

## ADR-004 — Additive, idempotent migrations applied manually

**Context:** A "v2" schema refactor once shipped in app code without the matching DB migration,
silently breaking exams/lessons/homework in prod (see `docs/bug-hunt-findings.md`).
**Decision:** All migrations are additive and idempotent (`ADD COLUMN IF NOT EXISTS`), applied
to prod via `psql`/SQL editor, and verified with a service-role probe before relying on them.
**Trade-off accepted:** Manual application is error-prone vs. an automated migration pipeline;
chosen for control at small scale. Re-evaluate if migration frequency grows.

## ADR-005 — Claude for AI grading, with graceful fallback

**Context:** Interactive open-text and PDF exams are graded by an LLM; the account may lack
credits at any time.
**Decision:** Grade with the Anthropic API; on failure, fall back to a neutral result and the
message "Análisis de IA no disponible" rather than erroring. MCQ/gap-fill are always
auto-scored deterministically and don't depend on the AI.
**Trade-off accepted:** PDF exams (AI-only) score 0 when the AI is unavailable. Accepted so the
app never hard-fails on grading; revisit once credits are reliably provisioned.
