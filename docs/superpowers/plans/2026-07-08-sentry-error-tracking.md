# Sentry Error Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Report client, server and edge exceptions to Sentry with readable stack traces, without leaking student PII and without breaking the hermetic CI E2E gate.

**Architecture:** A single shared options module (`lib/observability/sentry-options.ts`) owns the DSN guard, the environment string and the PII scrubber. Three thin runtime entrypoints (server / edge / client) each call `Sentry.init` only when `isSentryEnabled()`. `next.config.ts` is wrapped in `withSentryConfig` for source-map upload and the `/monitoring` tunnel route, which `proxy.ts` must exclude from its matcher.

**Tech Stack:** Next.js 16.2.9 (App Router, Turbopack), `@sentry/nextjs` ^10.64.0, Vitest (new), Playwright (existing), TypeScript, Node 20.

**Spec:** `docs/superpowers/specs/2026-07-08-sentry-error-tracking-design.md`

## Global Constraints

- `@sentry/nextjs` must be `^10.64.0`. Turbopack source-map upload requires `>=10.13.0` and `next >=15.4.1`; we are on `next@16.2.9`.
- Next 16 builds with Turbopack by default. **Never add a `webpack: {...}` block to `withSentryConfig`** — the entire `webpack.*` option namespace is inert here.
- Errors only: `tracesSampleRate: 0`. Do **not** add `replayIntegration`, `replaysSessionSampleRate`, or `replaysOnErrorSampleRate`.
- `sendDefaultPii: false` everywhere.
- The integration must be a complete no-op when `NEXT_PUBLIC_SENTRY_DSN` is absent. CI's `e2e` job runs `npm run build` and the full Playwright suite with **no Sentry env vars at all**. If any task breaks this, the money-path gate breaks.
- Source-map upload must be gated on `SENTRY_AUTH_TOKEN` being present. CI has no token and `npm run build` must not fail.
- User context is **Supabase UUID + role only**. Never send email, username, name or IP.
- All user-facing copy is Spanish, matching existing site tone.
- Node 20 — no native TypeScript type-stripping; Vitest handles TS.
- Vitest must not collect `e2e/*.spec.ts` (Playwright owns those) and Playwright must not collect `*.test.ts`.

---

### Task 1: Shared options module + Vitest infrastructure

Installs the SDK, stands up the unit-test runner, and builds the one module every other task depends on. The DSN guard and the PII scrubber are pure functions, so they get real TDD.

**Files:**
- Modify: `package.json` (add `@sentry/nextjs` dep, `vitest` devDep, `test:unit` script)
- Create: `vitest.config.ts`
- Create: `lib/observability/sentry-options.ts`
- Test: `lib/observability/sentry-options.test.ts`
- Modify: `.github/workflows/ci.yml` (add unit-test step to the fast `check` job)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `SENTRY_DSN: string | undefined`
  - `isSentryEnabled(dsn?: string | undefined): boolean`
  - `sentryEnvironment(): string`
  - `scrubEvent(event: ErrorEvent): ErrorEvent`
  - `baseSentryOptions(): { dsn, tracesSampleRate, sendDefaultPii, environment, beforeSend }`

- [ ] **Step 1: Install the SDK and the test runner**

F: is a slow drive; these installs take a while.

```bash
npm install @sentry/nextjs@^10.64.0
npm install --save-dev vitest
```

- [ ] **Step 2: Add the `test:unit` script**

In `package.json`, add to `"scripts"` (keep the existing entries):

```json
"test:unit": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.ts`**

The `resolve.alias` entry is required: `proxy.ts` (Task 2) imports `@/lib/supabase/middleware`, and Vitest does not read `tsconfig.json` path mappings on its own.

```ts
import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    // Mirrors the "@/*" path mapping in tsconfig.json. Vitest does not read
    // tsconfig paths by itself.
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    // Playwright owns e2e/*.spec.ts. Keep the two runners from collecting
    // each other's files.
    include: ["lib/**/*.test.ts", "proxy.test.ts"],
    environment: "node",
  },
})
```

- [ ] **Step 4: Write the failing tests**

Create `lib/observability/sentry-options.test.ts`:

```ts
import type { ErrorEvent } from "@sentry/nextjs"
import { describe, expect, it } from "vitest"
import { isSentryEnabled, scrubEvent } from "./sentry-options"

describe("isSentryEnabled", () => {
  it("is disabled when the DSN is undefined", () => {
    expect(isSentryEnabled(undefined)).toBe(false)
  })

  it("is disabled when the DSN is an empty string", () => {
    expect(isSentryEnabled("")).toBe(false)
  })

  it("is disabled when the DSN is only whitespace", () => {
    expect(isSentryEnabled("   ")).toBe(false)
  })

  it("is enabled when a DSN is present", () => {
    expect(isSentryEnabled("https://abc@o1.ingest.sentry.io/2")).toBe(true)
  })
})

describe("scrubEvent", () => {
  it("drops request body, cookies, headers and query string but keeps the url", () => {
    const event = {
      request: {
        url: "https://example.com/exams/1",
        data: { answers: ["A", "B", "C"] },
        cookies: { "sb-access-token": "secret" },
        headers: { authorization: "Bearer secret" },
        query_string: "email=student%40example.com",
      },
    } as unknown as ErrorEvent

    const scrubbed = scrubEvent(event)

    expect(scrubbed.request?.data).toBeUndefined()
    expect(scrubbed.request?.cookies).toBeUndefined()
    expect(scrubbed.request?.headers).toBeUndefined()
    expect(scrubbed.request?.query_string).toBeUndefined()
    expect(scrubbed.request?.url).toBe("https://example.com/exams/1")
  })

  it("keeps the user id and role but drops email, username and ip", () => {
    const event = {
      user: {
        id: "8f14e45f-ceea-467a-9575-7a1c1d2e3f40",
        role: "student",
        email: "student@example.com",
        username: "student",
        ip_address: "203.0.113.7",
      },
    } as unknown as ErrorEvent

    const scrubbed = scrubEvent(event)

    expect(scrubbed.user?.id).toBe("8f14e45f-ceea-467a-9575-7a1c1d2e3f40")
    expect(scrubbed.user?.role).toBe("student")
    expect(scrubbed.user?.email).toBeUndefined()
    expect(scrubbed.user?.username).toBeUndefined()
    expect(scrubbed.user?.ip_address).toBeUndefined()
  })

  it("drops the server hostname", () => {
    const event = { server_name: "prod-iad1-abc123" } as unknown as ErrorEvent
    expect(scrubEvent(event).server_name).toBeUndefined()
  })

  it("tolerates an event with no request and no user", () => {
    expect(() => scrubEvent({} as ErrorEvent)).not.toThrow()
  })
})
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `npm run test:unit`
Expected: FAIL — `Failed to resolve import "./sentry-options"` (the module does not exist yet).

- [ ] **Step 6: Write the minimal implementation**

Create `lib/observability/sentry-options.ts`:

```ts
import type { ErrorEvent } from "@sentry/nextjs"

/**
 * The DSN is the single switch for the whole integration. When it is absent
 * `Sentry.init` is never called, every `captureException` becomes a no-op, and
 * no network client is constructed.
 *
 * This mirrors how Upstash / Anthropic / Resend / Replicate / VAPID behave when
 * their env vars are missing, which is what keeps the money-path E2E gate
 * hermetic in CI.
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

export function isSentryEnabled(dsn: string | undefined = SENTRY_DSN): boolean {
  return typeof dsn === "string" && dsn.trim().length > 0
}

/**
 * Vercel exposes VERCEL_ENV to the server only. The browser bundle needs the
 * NEXT_PUBLIC_ copy, which Next inlines at build time.
 */
export function sentryEnvironment(): string {
  return (
    process.env.NEXT_PUBLIC_VERCEL_ENV ??
    process.env.VERCEL_ENV ??
    "development"
  )
}

/**
 * Defence in depth on top of `sendDefaultPii: false`.
 *
 * Students are minors. Exam answers, chat messages and auth tokens must not
 * leave our infrastructure, so we drop every request-derived field rather than
 * trusting the SDK's defaults not to serialize one into an error. The request
 * URL is kept because the route is the single most useful triage signal and
 * carries no personal data.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.data
    delete event.request.cookies
    delete event.request.headers
    delete event.request.query_string
  }

  if (event.user) {
    delete event.user.ip_address
    delete event.user.email
    delete event.user.username
  }

  delete event.server_name

  return event
}

export function baseSentryOptions() {
  return {
    dsn: SENTRY_DSN,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    environment: sentryEnvironment(),
    beforeSend: scrubEvent,
  }
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm run test:unit`
Expected: PASS — 8 tests, 2 suites.

- [ ] **Step 8: Add the unit-test step to CI**

In `.github/workflows/ci.yml`, inside the `check` job, insert after the `Lint` step and before `Typecheck`:

```yaml
      - name: Unit tests
        run: npm run test:unit
```

It goes in `check`, not `e2e` — `check` needs no Supabase, so it stays fast.

- [ ] **Step 9: Verify lint and typecheck are clean**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/observability/ .github/workflows/ci.yml
git commit -m "feat(observability): Sentry options module + Vitest

Adds @sentry/nextjs and a Vitest unit-test runner (the repo had only
Playwright). The DSN guard and the PII scrubber are pure functions and are
tested directly - the scrubber is what stands between student exam answers
and a third-party server.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Exclude the tunnel route from the proxy matcher

Sentry's build docs warn that under Turbopack, client-side event recording fails when middleware intercepts the configured tunnel route. We have not reproduced that, but the current matcher does match `/monitoring`, and at minimum it would run a `supabase.auth.getUser()` call on every error POST. The exclusion is one line; the test is a durable guard against someone editing the matcher later.

**Files:**
- Modify: `proxy.ts:9-19` (the `config.matcher` array)
- Test: `proxy.test.ts`

**Interfaces:**
- Consumes: `vitest.config.ts` `include` already lists `proxy.test.ts` (Task 1).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the failing test**

Create `proxy.test.ts` at the repo root:

```ts
import { describe, expect, it } from "vitest"
import { config } from "./proxy"

/**
 * Next compiles matcher strings with path-to-regexp, not `new RegExp`. The
 * matcher here is already regex-flavoured, so anchoring it is a close enough
 * approximation to assert which paths are in and out. This is a regression
 * guard on the exclusion list, not a reimplementation of Next's router.
 */
function matches(pathname: string): boolean {
  const pattern = config.matcher[0]
  return new RegExp(`^${pattern}$`).test(pathname)
}

describe("proxy matcher", () => {
  it("excludes the Sentry tunnel route", () => {
    // Sentry docs: under Turbopack, client-side event recording fails if
    // middleware intercepts the tunnel route.
    expect(matches("/monitoring")).toBe(false)
  })

  it("still matches authenticated app routes", () => {
    expect(matches("/dashboard")).toBe(true)
    expect(matches("/exams")).toBe(true)
    expect(matches("/admin/lessons")).toBe(true)
  })

  it("still matches the marketing homepage and auth pages", () => {
    expect(matches("/")).toBe(true)
    expect(matches("/login")).toBe(true)
  })

  it("still excludes static assets", () => {
    expect(matches("/_next/static/chunk.js")).toBe(false)
    expect(matches("/favicon.ico")).toBe(false)
    expect(matches("/hero.png")).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run proxy.test.ts`
Expected: FAIL — `excludes the Sentry tunnel route`: expected `true` to be `false`. The other three tests pass. This proves the test discriminates.

- [ ] **Step 3: Add the exclusion**

In `proxy.ts`, replace the matcher. Add `monitoring|` as the first alternative in the negative lookahead, and document why:

```ts
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - monitoring (Sentry tunnel route; Sentry's docs warn that intercepting
     *   it breaks client-side event recording under Turbopack, and running
     *   updateSession() on every error POST would be pure waste anyway)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder assets
     */
    "/((?!monitoring|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run proxy.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add proxy.ts proxy.test.ts
git commit -m "fix(proxy): exclude Sentry tunnel route from the matcher

The matcher previously caught every non-static path, including /monitoring.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Runtime init entrypoints

Three thin files, one per runtime, plus the `instrumentation.ts` Next calls. Each is guarded by `isSentryEnabled()`.

**Files:**
- Create: `sentry.server.config.ts`
- Create: `sentry.edge.config.ts`
- Create: `instrumentation-client.ts`
- Create: `instrumentation.ts`

**Interfaces:**
- Consumes: `baseSentryOptions()`, `isSentryEnabled()` from `lib/observability/sentry-options.ts` (Task 1).
- Produces: `register()` and `onRequestError` from `instrumentation.ts`; `onRouterTransitionStart` from `instrumentation-client.ts`. Next.js discovers all three by filename convention.

- [ ] **Step 1: Create `sentry.server.config.ts`**

```ts
import * as Sentry from "@sentry/nextjs"
import { baseSentryOptions, isSentryEnabled } from "@/lib/observability/sentry-options"

if (isSentryEnabled()) {
  Sentry.init(baseSentryOptions())
}
```

- [ ] **Step 2: Create `sentry.edge.config.ts`**

Identical body. The two files are kept separate because Next loads them into different runtimes; the shared content already lives in `baseSentryOptions()`.

```ts
import * as Sentry from "@sentry/nextjs"
import { baseSentryOptions, isSentryEnabled } from "@/lib/observability/sentry-options"

if (isSentryEnabled()) {
  Sentry.init(baseSentryOptions())
}
```

- [ ] **Step 3: Create `instrumentation-client.ts`**

`onRouterTransitionStart` lets Sentry associate errors with the navigation that caused them. It is exported unconditionally — it is a no-op when `init` never ran.

```ts
import * as Sentry from "@sentry/nextjs"
import { baseSentryOptions, isSentryEnabled } from "@/lib/observability/sentry-options"

if (isSentryEnabled()) {
  Sentry.init(baseSentryOptions())
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
```

- [ ] **Step 4: Create `instrumentation.ts`**

```ts
import * as Sentry from "@sentry/nextjs"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

/**
 * Next calls this for every uncaught error in a Server Component, Route Handler
 * or Server Action. It reads the per-request isolation scope, so the
 * `Sentry.setUser()` call in app/(app)/layout.tsx rides along.
 */
export const onRequestError = Sentry.captureRequestError
```

- [ ] **Step 5: Verify typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 6: Verify the no-op contract holds**

With no Sentry env vars set:

Run: `npm run test:unit`
Expected: PASS — Task 1 and Task 2 suites still green.

- [ ] **Step 7: Commit**

```bash
git add sentry.server.config.ts sentry.edge.config.ts instrumentation-client.ts instrumentation.ts
git commit -m "feat(observability): Sentry runtime init for node, edge and client

Each entrypoint no-ops when NEXT_PUBLIC_SENTRY_DSN is absent.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Build integration — `withSentryConfig`, tunnel route, source maps

The task that must not break CI. `sourcemaps.disable` is gated on the auth token because Sentry's docs do not state whether a missing token fails or merely warns the build, and CI builds with no token.

**Files:**
- Modify: `next.config.ts`
- Modify: `.env.local.example`

**Interfaces:**
- Consumes: `tunnelRoute: "/monitoring"` must match the exclusion added in Task 2.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Wrap `next.config.ts`**

Keep the existing `nextConfig` object exactly as it is. Change only the import line and the default export:

```ts
import { withSentryConfig } from "@sentry/nextjs"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // ... existing config unchanged (images, experimental, headers) ...
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Quiet locally, verbose in CI.
  silent: !process.env.CI,
  telemetry: false,

  // Route Sentry events through our own domain so ad blockers do not silently
  // discard client-side errors. Must stay in sync with the exclusion in
  // proxy.ts's matcher.
  tunnelRoute: "/monitoring",

  sourcemaps: {
    // Deterministic rather than relying on undocumented behaviour: CI has no
    // auth token and `npm run build` must not fail. Vercel gets the token from
    // the Sentry Marketplace integration.
    disable: !process.env.SENTRY_AUTH_TOKEN,
    // Do not leave source maps sitting in .next/static to be served publicly.
    deleteSourcemapsAfterUpload: true,
  },
})
```

Do **not** add a `webpack: {}` block — Next 16 builds with Turbopack and that entire namespace is inert.

- [ ] **Step 2: Document the env vars**

Append to `.env.local.example`:

```bash
# ─── Sentry (error tracking) ─────────────────────────────────────────────────
# Provisioned by the Sentry integration on the Vercel Marketplace, which injects
# all four into every Vercel environment. Leave these unset locally and in CI:
# with no DSN, Sentry.init() never runs and the whole integration is a no-op.
# SENTRY_AUTH_TOKEN is build-time only, used to upload source maps so production
# stack traces are readable instead of minified.
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

- [ ] **Step 3: Verify the build succeeds with no Sentry env — the critical check**

This is the step that proves the CI contract. F: is a slow drive; expect a few minutes.

Run: `npm run build`
Expected: build completes successfully. No source-map upload is attempted. No "auth token" error.

If this fails, stop — the CI `e2e` job and therefore the money-path gate will fail too.

- [ ] **Step 4: Verify the tunnel route was created**

Run: `grep -r "monitoring" .next/routes-manifest.json || echo "not in manifest"`
Expected: the `/monitoring` route appears. (If Sentry generates it lazily this may print "not in manifest" — that is acceptable; verification step 4 in the spec is what actually confirms the tunnel works.)

- [ ] **Step 5: Verify typecheck, lint and unit tests**

Run: `npx tsc --noEmit && npm run lint && npm run test:unit`
Expected: all clean.

- [ ] **Step 6: Commit**

```bash
git add next.config.ts .env.local.example
git commit -m "feat(observability): wrap next.config in withSentryConfig

Tunnel route /monitoring bypasses ad blockers. Source-map upload is gated on
SENTRY_AUTH_TOKEN so CI, which has no token, still builds.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Global error boundary

The app currently has no error boundary of any kind. This is new surface, not a retrofit. Sentry needs `global-error.tsx` to see React render errors.

**Files:**
- Create: `app/global-error.tsx`

**Interfaces:**
- Consumes: `Sentry.captureException` (no-op when uninitialised).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Create `app/global-error.tsx`**

It replaces the root layout when it renders, so it must emit its own `<html>` and `<body>`. Importing `globals.css` keeps the CSS custom properties (`--color-primary` etc.) available.

```tsx
"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import "./globals.css"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="es">
      <body>
        <main
          className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
          style={{ background: "var(--color-bg)" }}
        >
          <h1
            className="text-2xl font-bold mb-3"
            style={{ color: "var(--color-text)" }}
          >
            Algo ha salido mal
          </h1>

          <p
            className="text-sm mb-8 max-w-md leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Hemos registrado el error y lo estamos revisando. Puedes intentarlo
            de nuevo o volver al inicio.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "var(--color-primary)", color: "#fff" }}
            >
              Reintentar
            </button>

            <a
              href="/"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border"
              style={{
                borderColor: "var(--color-primary)",
                color: "var(--color-primary)",
              }}
            >
              Volver al inicio
            </a>
          </div>

          {error.digest && (
            <p
              className="mt-8 text-xs font-mono"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Ref: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  )
}
```

Note the inline `color: "#fff"` on the button. `app/globals.css:257` has an unlayered `a:not(.btn) { color: var(--color-primary) }` which outranks Tailwind's `.text-white`; the same trap was hit by StylesPrompt Tasks 7-9. The `<button>` is not an `<a>` so it is unaffected, but the inline colour keeps it consistent and immune if the element ever changes.

- [ ] **Step 2: Verify typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Verify it renders**

Run: `npm run dev`, then visit `http://localhost:3000`.
Expected: the homepage renders normally — the boundary is inert until something throws. Confirm no hydration warnings in the console.

- [ ] **Step 4: Commit**

```bash
git add app/global-error.tsx
git commit -m "feat(observability): global error boundary reporting to Sentry

The app previously had no error boundary at all.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: User context — UUID and role only

**Files:**
- Create: `components/shared/SentryUser.tsx`
- Modify: `app/(app)/layout.tsx` (after the `if (!profile)` guard, currently line 24)

**Interfaces:**
- Consumes: `user.id` and `profile.role`, both already fetched in `app/(app)/layout.tsx`.
- Produces: `<SentryUser id={string} role={string} />`, a client component rendering `null`.

- [ ] **Step 1: Create the client component**

```tsx
"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

/**
 * Mirrors the server-side Sentry.setUser() into the browser SDK so client-side
 * errors carry the same identity. UUID and role only - never email or name.
 * The UUID resolves to a person in Supabase, which is where that mapping belongs.
 */
export function SentryUser({ id, role }: { id: string; role: string }) {
  useEffect(() => {
    Sentry.setUser({ id, role })
    return () => Sentry.setUser(null)
  }, [id, role])

  return null
}
```

- [ ] **Step 2: Set the server-side scope and render the client mirror**

In `app/(app)/layout.tsx`, add the imports:

```ts
import * as Sentry from "@sentry/nextjs"
import { SentryUser } from "@/components/shared/SentryUser"
```

Immediately after the existing `if (!profile) { redirect("/login") }` guard, add:

```ts
  // Lands on this request's isolation scope, which instrumentation.ts's
  // onRequestError reads. UUID + role only, never email.
  Sentry.setUser({ id: user.id, role: profile.role })
```

Then, inside the returned JSX, add the client mirror as the first child of the wrapper `<div>`:

```tsx
      <SentryUser id={user.id} role={profile.role} />
```

- [ ] **Step 3: Verify typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Verify the money-path E2E gate still passes**

This is the hermetic-contract check: the suite runs with no Sentry env, and `Sentry.setUser` is now called on every authenticated request.

Requires Docker for local Supabase. **The user has no Docker locally** — if `supabase start` is unavailable, skip this step and rely on the CI run in Task 7.

Run: `npm run test:e2e`
Expected: PASS — seeded student logs in, takes the interactive exam, scores 3/3.

- [ ] **Step 5: Commit**

```bash
git add components/shared/SentryUser.tsx "app/(app)/layout.tsx"
git commit -m "feat(observability): attach Supabase UUID + role to Sentry events

No email, username or IP. The UUID resolves to a person in Supabase.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Roadmap bookkeeping and push for CI

`docs/tech-debt.md` has three stale checkboxes: the npm-vulnerabilities item shipped in PR #14, the money-path E2E item shipped in PR #17, and error tracking ships here.

**Files:**
- Modify: `docs/tech-debt.md`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Tick the three completed items**

In `docs/tech-debt.md`, under "High blast radius — do next", replace all three bullets:

```markdown
- [x] **Error tracking (Sentry, client + server).** Errors-only config; no-op without a DSN.
      Provisioned via the Sentry integration on the Vercel Marketplace. See
      `docs/superpowers/specs/2026-07-08-sentry-error-tracking-design.md`.
- [x] **2 high + 4 moderate production npm vulnerabilities.** Resolved 2026-06-26 (PR #14):
      `npm audit` reports 0 vulnerabilities.
- [x] **No automated test of the "money path."** Shipped 2026-07-07 (PR #17): a Playwright
      gate runs the seeded student → interactive exam → 3/3 flow against an ephemeral local
      Supabase on every PR.
```

Add a new item under "Lower / watch":

```markdown
- [ ] **Unlayered `a:not(.btn)` rule in `app/globals.css:257`** outranks Tailwind's `text-*`
      utilities (higher specificity *and* unlayered CSS beats `@layer utilities`). Every
      coloured link needs an inline `style` or `!` override to work around it. Wrapping the
      rule in `@layer base` would let utilities win by default. Needs a visual pass over
      every `<a>` before flipping.
```

- [ ] **Step 2: Run the full local verification suite**

```bash
npx tsc --noEmit && npm run lint && npm run test:unit && npm run build
```

Expected: all four clean. The build runs with no Sentry env — this is the CI contract.

- [ ] **Step 3: Commit and push**

```bash
git add docs/tech-debt.md
git commit -m "docs: tick shipped roadmap items, log the globals.css layering trap

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push -u origin feat/sentry-error-tracking
```

- [ ] **Step 4: Open the PR and watch CI**

```bash
gh pr create --fill
gh run watch
```

Expected: both `check` (lint + unit + typecheck) and `e2e` (build + money-path) green.

A green `e2e` job **is** the proof of the no-op contract: it built and ran the whole money path with no Sentry env present.

- [ ] **Step 5: Stop. Report the honest status.**

At this point the branch is **plausibly correct but unproven**. CI green proves Sentry does not *break* anything. It does not prove Sentry *works* — nothing in CI exercises source-map upload or the tunnel route, because both need a real Vercel deploy with a real auth token.

Do not describe this task as "Sentry is working". Say: "wiring complete, CI green, dormant until the DSN exists."

The remaining verification (spec step 4) needs the maintainer:

1. Maintainer installs the Sentry integration from the Vercel Marketplace against the `brit-english-academy` project.
2. Redeploy the PR preview so the injected env vars take effect.
3. Add a temporary throwing route, deploy, hit it.
4. Confirm in Sentry: the issue arrives, the stack trace is **un-minified** (proves source-map upload), the event carries `user.id` + `role` and **no email** (proves the scrubber), and a client-side error also arrives (proves the tunnel route).
5. Delete the temporary route.
6. Merge.

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| `@sentry/nextjs@^10.64.0` | 1 |
| No `webpack.*` options | 4 (explicit warning) |
| `tracesSampleRate: 0`, no replay | 1 (`baseSentryOptions`) |
| `sendDefaultPii: false` | 1 |
| No-op when DSN absent | 1 (`isSentryEnabled`), verified 3/4/7 |
| `beforeSend` scrubbing | 1 (TDD) |
| `sourcemaps.disable` gated on token | 4 |
| `deleteSourcemapsAfterUpload` | 4 |
| `tunnelRoute: "/monitoring"` | 4 |
| proxy matcher exclusion | 2 (TDD) |
| `global-error.tsx`, Spanish copy | 5 |
| Server `Sentry.setUser` | 6 |
| Client `SentryUser` mirror | 6 |
| `.env.local.example` | 4 |
| `docs/tech-debt.md` | 7 |
| Verification steps 1-3 | 4, 7 |
| Verification step 4 (maintainer) | 7, step 5 |

No gaps.

**Placeholder scan:** none. Every code step carries complete code.

**Type consistency:** `isSentryEnabled` / `sentryEnvironment` / `scrubEvent` / `baseSentryOptions` / `SENTRY_DSN` are defined in Task 1 and used with identical names and signatures in Tasks 3 and 4. `SentryUser` takes `{ id: string; role: string }` in Task 6 and is called with exactly those props. `tunnelRoute: "/monitoring"` (Task 4) matches the `monitoring` exclusion (Task 2).

**Known approximation:** `proxy.test.ts` anchors the matcher string with `new RegExp` rather than path-to-regexp. It is a regression guard on the exclusion list, not a reimplementation of Next's router. Documented in the test.
