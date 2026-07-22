# Supabase Keep-Alive Cron Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a daily Vercel Cron that runs a trivial Supabase read, so the free-tier database never reaches the 7-day idle auto-pause that breaks authentication on production and every preview.

**Architecture:** All decision logic lives in `lib/cron/keep-alive.ts` as two small dependency-injected functions, with a thin route handler at `app/api/cron/keep-alive/route.ts` doing only wiring. A new `vercel.json` registers the schedule. Failures are reported to Sentry, which is already live on Production.

**Tech Stack:** Next.js 16.2.9 (App Router), `@supabase/ssr`, `@sentry/nextjs` ^10.64.0, vitest 3, TypeScript.

**Spec:** `docs/superpowers/specs/2026-07-22-supabase-keep-alive-cron-design.md`

## Global Constraints

- **Tests must live under `lib/`.** `vitest.config.ts` collects only `include: ["lib/**/*.test.ts", "proxy.test.ts"]`. A test placed under `app/` is silently never run. Do not widen this config — put the logic in `lib/` instead, matching `lib/observability/sentry-options.ts`.
- **Inject dependencies via default parameters,** the established pattern in `lib/observability/sentry-options.ts` (`isSentryEnabled(dsn = SENTRY_DSN)`). Do not reach for `vi.mock` — no existing test uses it.
- **The auth gate fails closed.** A missing or blank `CRON_SECRET` must reject, not allow. This deliberately departs from the repo's "no-op when the env var is absent" convention used by Upstash / Anthropic / Resend / Replicate / VAPID, because here the variable *is* the access control.
- **Tests stay hermetic** — no network, no database, no Supabase instance. This preserves the CI contract that lets the money-path E2E gate run against ephemeral local Supabase.
- **Never read `SUPABASE_SERVICE_ROLE_KEY`** in this feature. The ping uses the anon client only.
- **Local `npm run build` is impossible on this machine** — the F: drive is exFAT and `@sentry/nextjs` needs NTFS junctions. Verify with `npx tsc --noEmit`, `npm run lint`, and `npm run test:unit` only; the real build is proven by CI.
- **F: is a slow drive.** Long npm commands should be run in the background.
- Style: no semicolons, double quotes, 2-space indent — match surrounding files.

---

### Task 1: Cron request authorization

**Files:**
- Create: `lib/cron/keep-alive.ts`
- Test: `lib/cron/keep-alive.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `isAuthorizedCronRequest(authorizationHeader: string | null, secret?: string | undefined): boolean`

- [ ] **Step 1: Write the failing test**

Create `lib/cron/keep-alive.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { isAuthorizedCronRequest } from "./keep-alive"

describe("isAuthorizedCronRequest", () => {
  it("rejects when the secret is undefined", () => {
    expect(isAuthorizedCronRequest("Bearer anything", undefined)).toBe(false)
  })

  it("rejects when the secret is an empty string", () => {
    expect(isAuthorizedCronRequest("Bearer ", "")).toBe(false)
  })

  it("rejects when the secret is only whitespace", () => {
    expect(isAuthorizedCronRequest("Bearer    ", "   ")).toBe(false)
  })

  it("rejects a missing Authorization header", () => {
    expect(isAuthorizedCronRequest(null, "s3cret")).toBe(false)
  })

  it("rejects a header with the wrong secret", () => {
    expect(isAuthorizedCronRequest("Bearer wrong", "s3cret")).toBe(false)
  })

  it("rejects a bare secret without the Bearer scheme", () => {
    expect(isAuthorizedCronRequest("s3cret", "s3cret")).toBe(false)
  })

  it("rejects a correct secret of a different length", () => {
    expect(isAuthorizedCronRequest("Bearer s3cretX", "s3cret")).toBe(false)
  })

  it("accepts the exact Bearer token", () => {
    expect(isAuthorizedCronRequest("Bearer s3cret", "s3cret")).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/cron/keep-alive.test.ts`
Expected: FAIL — `Failed to resolve import "./keep-alive"`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/cron/keep-alive.ts`:

```ts
import { timingSafeEqual } from "node:crypto"

/**
 * Vercel attaches `Authorization: Bearer <CRON_SECRET>` to cron invocations
 * whenever a CRON_SECRET env var exists on the project.
 *
 * This gate fails CLOSED: a missing or blank secret rejects every request.
 * That is the opposite of how Upstash / Anthropic / Resend degrade when their
 * env vars are absent, and the difference is deliberate — those variables
 * enable an optional feature, whereas this one IS the access control. A
 * misconfigured deploy must lock the route, never open it to the public.
 */
export function isAuthorizedCronRequest(
  authorizationHeader: string | null,
  secret: string | undefined = process.env.CRON_SECRET
): boolean {
  if (typeof secret !== "string" || secret.trim().length === 0) return false
  if (authorizationHeader === null) return false

  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(authorizationHeader)

  // timingSafeEqual throws on length mismatch, so check length first. The
  // length of a rejected guess leaks either way; the byte comparison is what
  // must not leak, hence the constant-time compare rather than `===`.
  if (expected.length !== actual.length) return false

  return timingSafeEqual(expected, actual)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/cron/keep-alive.test.ts`
Expected: PASS — 8 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/cron/keep-alive.ts lib/cron/keep-alive.test.ts
git commit -m "feat(cron): constant-time CRON_SECRET authorization gate"
```

---

### Task 2: The keep-alive ping runner

**Files:**
- Modify: `lib/cron/keep-alive.ts` (append)
- Test: `lib/cron/keep-alive.test.ts` (append)

**Interfaces:**
- Consumes: nothing from Task 1 — the two functions are independent.
- Produces:
  - `KEEP_ALIVE_TABLE: "blog_posts"`
  - `type KeepAliveResult = { ok: true; durationMs: number } | { ok: false; durationMs: number; error: Error }`
  - `runKeepAlivePing(query: () => PromiseLike<{ error: { message: string } | null }>): Promise<KeepAliveResult>`

The runner takes a **thunk** rather than a Supabase client. This keeps `lib/` free of Supabase types, sidesteps structural-typing friction with `PostgrestFilterBuilder`, and lets the test pass a two-line fake instead of mocking a module.

- [ ] **Step 1: Write the failing test**

First **widen the existing import line** at the top of `lib/cron/keep-alive.test.ts` — do not add a
second `import` from the same module, which `import/no-duplicates` will reject:

```ts
import { KEEP_ALIVE_TABLE, isAuthorizedCronRequest, runKeepAlivePing } from "./keep-alive"
```

Then append to `lib/cron/keep-alive.test.ts`:

```ts
describe("KEEP_ALIVE_TABLE", () => {
  it("targets the anon-readable blog_posts table", () => {
    // blog_posts is the only table with a policy that carries no auth
    // predicate by design (blog_select_public: is_published = true), so the
    // ping needs no service-role key.
    expect(KEEP_ALIVE_TABLE).toBe("blog_posts")
  })
})

describe("runKeepAlivePing", () => {
  it("reports ok when the query resolves without an error", async () => {
    const result = await runKeepAlivePing(async () => ({ error: null }))

    expect(result.ok).toBe(true)
    expect(typeof result.durationMs).toBe("number")
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it("reports ok even when the query matches zero rows", async () => {
    // A zero-row result still reached Postgres, which is all the keep-alive
    // needs. The health signal is the error channel, not the row count.
    const result = await runKeepAlivePing(async () => ({ error: null }))

    expect(result.ok).toBe(true)
  })

  it("reports failure when the query returns a Postgres error", async () => {
    const result = await runKeepAlivePing(async () => ({
      error: { message: "permission denied for table blog_posts" },
    }))

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected a failed ping")
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error.message).toContain("permission denied")
  })

  it("reports failure when the query itself throws", async () => {
    const result = await runKeepAlivePing(async () => {
      throw new Error("fetch failed")
    })

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected a failed ping")
    expect(result.error.message).toContain("fetch failed")
  })

  it("wraps a non-Error rejection in an Error", async () => {
    const result = await runKeepAlivePing(async () => {
      throw "database is paused"
    })

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected a failed ping")
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error.message).toContain("database is paused")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/cron/keep-alive.test.ts`
Expected: FAIL — `"KEEP_ALIVE_TABLE" is not exported by "lib/cron/keep-alive.ts"`.

- [ ] **Step 3: Write minimal implementation**

Append to `lib/cron/keep-alive.ts`:

```ts
/**
 * blog_posts carries `blog_select_public` (`for select using (is_published =
 * true)`) — the one policy with no auth predicate, because the marketing blog
 * is public. Every other table gates on auth.uid(), current_user_role(), or an
 * active authenticated profile.
 */
export const KEEP_ALIVE_TABLE = "blog_posts"

export type KeepAliveResult =
  | { ok: true; durationMs: number }
  | { ok: false; durationMs: number; error: Error }

/**
 * Runs the supplied query and classifies the outcome.
 *
 * Takes a thunk rather than a Supabase client so this module stays free of
 * Supabase types and the tests need no module mocking.
 *
 * A zero-row result is a SUCCESS. The point is that the query reached Postgres
 * and counted as database activity; how many rows RLS let through is
 * irrelevant to keeping the project awake.
 */
export async function runKeepAlivePing(
  query: () => PromiseLike<{ error: { message: string } | null }>
): Promise<KeepAliveResult> {
  const startedAt = Date.now()

  try {
    const { error } = await query()
    const durationMs = Date.now() - startedAt

    if (error) {
      return { ok: false, durationMs, error: new Error(error.message) }
    }

    return { ok: true, durationMs }
  } catch (cause) {
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      error: cause instanceof Error ? cause : new Error(String(cause)),
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/cron/keep-alive.test.ts`
Expected: PASS — 14 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/cron/keep-alive.ts lib/cron/keep-alive.test.ts
git commit -m "feat(cron): keep-alive ping runner with error classification"
```

---

### Task 3: The route handler

**Files:**
- Create: `app/api/cron/keep-alive/route.ts`

**Interfaces:**
- Consumes: `isAuthorizedCronRequest`, `runKeepAlivePing`, `KEEP_ALIVE_TABLE` from `@/lib/cron/keep-alive`; `createClient` from `@/lib/supabase/server`.
- Produces: `GET /api/cron/keep-alive` returning `200 {ok:true,durationMs}`, `401 {ok:false}`, or `503 {ok:false,durationMs}`.

This is the repo's second route handler; follow the import style of `app/auth/callback/route.ts` (`NextResponse` from `next/server`, `createClient` from `@/lib/supabase/server`). There is no test here by design — the handler is pure wiring and its two collaborators are fully covered by Tasks 1 and 2.

- [ ] **Step 1: Write the implementation**

Create `app/api/cron/keep-alive/route.ts`:

```ts
import * as Sentry from "@sentry/nextjs"
import { NextResponse } from "next/server"
import { KEEP_ALIVE_TABLE, isAuthorizedCronRequest, runKeepAlivePing } from "@/lib/cron/keep-alive"
import { createClient } from "@/lib/supabase/server"

// Never prerender or cache this route — a cached 200 would defeat the entire
// purpose by keeping the database untouched.
export const dynamic = "force-dynamic"

/**
 * Daily keep-alive for the free-tier Supabase project, which auto-pauses after
 * 7 days of inactivity and takes down auth on production AND every preview
 * (one database serves all environments).
 *
 * Uses the same cookie-based anon client that login uses, so a green ping is
 * evidence auth will work — not merely that Postgres accepted a connection.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const supabase = await createClient()

  const result = await runKeepAlivePing(() =>
    supabase.from(KEEP_ALIVE_TABLE).select("id", { count: "exact", head: true })
  )

  if (!result.ok) {
    Sentry.captureException(result.error, { tags: { cron: "keep-alive" } })
    return NextResponse.json({ ok: false, durationMs: result.durationMs }, { status: 503 })
  }

  return NextResponse.json({ ok: true, durationMs: result.durationMs })
}
```

- [ ] **Step 2: Verify types and lint**

Run: `npx tsc --noEmit`
Expected: no output (clean exit).

If `tsc` rejects the `supabase.from(...).select(...)` thunk because `PostgrestFilterBuilder` resolves to a wider result type than `{ error: { message: string } | null }`, widen the thunk's parameter type in `lib/cron/keep-alive.ts` to `PromiseLike<{ error: { message: string } | null; [key: string]: unknown }>` rather than casting at the call site. Do not use `as any`.

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Confirm the whole unit suite still passes**

Run: `npm run test:unit`
Expected: PASS — the two pre-existing files (`lib/observability/sentry-options.test.ts`, `proxy.test.ts`) plus the 14 new cases.

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/keep-alive/route.ts
git commit -m "feat(cron): GET /api/cron/keep-alive route handler"
```

---

### Task 4: Schedule registration and doc updates

**Files:**
- Create: `vercel.json`
- Modify: `docs/tech-debt.md` (two checkboxes)

**Interfaces:**
- Consumes: the route path `/api/cron/keep-alive` from Task 3.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Create the Vercel config**

The repo has no `vercel.json` today, so this file contains only the cron entry. Create `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/keep-alive",
      "schedule": "0 6 * * *"
    }
  ]
}
```

Daily at 06:00 UTC. The Hobby plan caps crons at once per day (max 2 jobs) and fires at an approximate time, which is fine — daily leaves a 7× margin on the 7-day pause window.

- [ ] **Step 2: Tick the keep-alive item in tech-debt.md**

Replace this block:

```markdown
- [ ] **Keep Supabase awake (free-tier auto-pauses after 7 days idle).** A paused DB makes login
      return `invalid_credentials` on prod AND every preview until manually restored from the
      dashboard (hit us 2026-07-21). Add a daily Vercel Cron → API route that runs a trivial
      Supabase query so the free project never idles out. Not upgrading to Pro for now.
```

with:

```markdown
- [x] **Keep Supabase awake (free-tier auto-pauses after 7 days idle).** Shipped 2026-07-22: a
      daily Vercel Cron hits `/api/cron/keep-alive`, which runs an anon `head` count against
      `blog_posts` using the same client login uses. Gated on `CRON_SECRET` (fails closed) and
      reports failures to Sentry, so a database problem alerts instead of surfacing later as a
      misleading `invalid_credentials` login error. Note this PREVENTS idling; it cannot un-pause
      an already-paused project. Still on the free tier.
```

- [ ] **Step 3: Tick the now-complete Sentry item in tech-debt.md**

This item finished on 2026-07-22 but the checkbox is stale. Replace:

```markdown
- [ ] **Wire Sentry to Production.** Prod env has NO Sentry vars, so Sentry is dormant on the live
      site — only the preview branch is wired. Add `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_ORG` +
      `SENTRY_PROJECT` + `SENTRY_AUTH_TOKEN` to the Production scope, then redeploy `main` so it
      activates with source-map upload. (Deferred 2026-07-21.)
```

with:

```markdown
- [x] **Wire Sentry to Production.** Done 2026-07-22: the four Sentry vars were added to the
      Production scope and `main` redeployed with source-map upload confirmed in the build log.
      Live-verified on brit-english-academy.vercel.app — client SDK initialised, a test throw
      tunnelled through `/monitoring` (POST 200) and landed in `sentry-aqua-yacht`.
```

- [ ] **Step 4: Verify the JSON parses**

Run: `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('vercel.json OK')"`
Expected: `vercel.json OK`

- [ ] **Step 5: Commit**

```bash
git add vercel.json docs/tech-debt.md
git commit -m "chore(cron): register daily keep-alive schedule, update tech-debt"
```

---

### Task 5: Provision CRON_SECRET and verify in production

**Files:** none — this task is environment configuration and live verification.

**Interfaces:**
- Consumes: everything from Tasks 1–4, merged to `main`.
- Produces: a working scheduled job.

This task **cannot be completed by an agent alone** — it needs a real deployment and a look at the Vercel dashboard. Steps 1–2 can be driven from the CLI; steps 4–6 need the maintainer.

- [ ] **Step 1: Generate a secret**

Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
Expected: a 64-character hex string. Keep it for the next step.

- [ ] **Step 2: Add it to the Production scope**

Run: `npx vercel env add CRON_SECRET production`

Paste the value when prompted. Note the Vercel dashboard SPA cannot be driven by the browser extension (it never reaches `document_idle`), so CLI or manual maintainer entry are the only routes.

Verify with: `npx vercel env ls`
Expected: a `CRON_SECRET` row scoped to Production.

- [ ] **Step 3: Confirm the gate is live before merging**

Because the gate fails closed, a deploy that lacks the variable returns 401 rather than exposing anything. Verify the variable exists (Step 2) **before** production deploys, so the first scheduled run succeeds.

- [ ] **Step 4: Open a PR and let CI run**

```bash
git push -u origin feat/supabase-keep-alive-cron
gh pr create --title "feat(cron): keep free-tier Supabase awake" --fill
```

Expected: the `check` job (lint + `test:unit` + `tsc --noEmit`) and the e2e gate both pass.

- [ ] **Step 5: After merge, confirm the cron registered**

Vercel reads `vercel.json` on the next **production** deployment. In the project's Settings → Cron Jobs, confirm `/api/cron/keep-alive` appears with a daily schedule.

Note crons run only against production deployments; previews are never invoked but share the same database, so they benefit from production's pings.

- [ ] **Step 6: Confirm a real run succeeds**

Either wait for the first scheduled fire and check the Cron Jobs log for a `200`, or trigger it manually:

```bash
curl -i -H "Authorization: Bearer <CRON_SECRET>" https://brit-english-academy.vercel.app/api/cron/keep-alive
```

Expected: `HTTP/2 200` with a body like `{"ok":true,"durationMs":123}`.

Also confirm the gate rejects an unauthenticated caller:

```bash
curl -i https://brit-english-academy.vercel.app/api/cron/keep-alive
```

Expected: `HTTP/2 401` with `{"ok":false}`.

**If the DB happens to be paused when you test,** the ping returns 503 and a Sentry alert fires — that is the design working, not a bug. Restore the project from the Supabase dashboard first, then re-test.

---

## Out of scope — logged for later

While auditing RLS policies for this plan, `questions_select_student` in `supabase/migrations/000_init.sql:367` was found to be the only policy with no auth predicate at all — it gates solely on the parent exam's `is_published = true`, and `exam_questions` holds `correct_answer`. Whether this is actually reachable depends on whether Postgres re-applies `exams`' own RLS inside the policy's `exists` subquery. **This is unverified and may well be safe.** It is unrelated to the cron work; do not address it here. It needs its own investigation.
