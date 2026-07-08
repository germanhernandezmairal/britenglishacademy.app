# Sentry Error Tracking — Design

**Date:** 2026-07-08
**Status:** Approved, pending implementation plan
**Roadmap item:** `docs/tech-debt.md` → High blast radius #1 (error tracking)

## Problem

A production error is invisible unless a user emails us. There is no error
boundary anywhere in the app, no error reporting, and no way to distinguish
"one student's session is broken" from "every student is broken."

## Scope

**Errors only.** Exceptions and unhandled rejections, client + server + edge.

Explicitly out of scope:

- Performance tracing (`tracesSampleRate: 0`). There is no performance baseline
  to compare traces against — that is a separate roadmap item.
- Session Replay. It records rendered DOM by default; this platform displays
  student exam answers and private chat. Not worth the PII exposure.
- Structured logging (separate roadmap item).
- Route-level error boundaries beyond the one Sentry requires.

Both tracing and replay are one-line sample-rate changes later. Nothing here is
hard to reverse.

## Constraints discovered

1. **Turbopack.** Next 16's `next build` defaults to Turbopack. Sentry supports
   this from `@sentry/nextjs@10.13.0` + `next@15.4.1`; we are on 10.64.0 and
   16.2.9. Source maps upload *after* the build completes. The entire
   `webpack.*` option block is inert and must not be added.

2. **The tunnel route collides with `proxy.ts`.** Sentry's build docs:

   > "If you're using Turbopack, client-side event recording will fail if your
   > Next.js middleware intercepts the configured tunnel route."

   `proxy.ts`'s matcher currently matches every path except static assets, so it
   *would* intercept `/monitoring` and run `updateSession()` on every error POST.
   Failure mode is silent: client events simply never arrive. The matcher must
   exclude the tunnel route.

3. **The no-op contract.** The money-path E2E gate (PR #17) is hermetic because
   Upstash, Anthropic, Resend, Replicate and VAPID all no-op when their env vars
   are absent. Sentry must do the same. The CI `e2e` job runs `npm run build`
   with no Sentry env at all.

4. **PII.** Students are minors. Emails, exam answers and chat messages must not
   leave our infrastructure.

## Design

### Package

`@sentry/nextjs@^10.64.0`

### Files

| File | Status | Purpose |
|---|---|---|
| `sentry.server.config.ts` | new | Node runtime `Sentry.init` |
| `sentry.edge.config.ts` | new | Edge runtime `Sentry.init` |
| `instrumentation-client.ts` | new | Browser `Sentry.init` + `onRouterTransitionStart` |
| `instrumentation.ts` | new | `register()` dispatches by runtime; re-exports `onRequestError` |
| `app/global-error.tsx` | new | Captures React render errors |
| `components/shared/SentryUser.tsx` | new | Client-side user context |
| `next.config.ts` | edit | Wrap in `withSentryConfig` |
| `proxy.ts` | edit | Exclude `/monitoring` from matcher |
| `app/(app)/layout.tsx` | edit | Server-side `Sentry.setUser` |
| `.env.local.example` | edit | Document new vars |
| `docs/tech-debt.md` | edit | Tick this item; tick the two stale ones |

### Init configuration

Shared across all three runtimes:

```ts
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    environment: process.env.VERCEL_ENV ?? "development",
    beforeSend: scrubRequestData,
  })
}
```

The `if (dsn)` guard *is* the no-op contract. When the DSN is absent `Sentry.init`
is never called, every `captureException` becomes a no-op, and no network client
is constructed.

`beforeSend` strips `event.request.data`, cookies and headers as defence in depth
— `sendDefaultPii: false` already prevents most of it, but exam payloads could
otherwise ride along inside a serialized error.

### Source maps

```ts
sourcemaps: {
  disable: !process.env.SENTRY_AUTH_TOKEN,
  deleteSourcemapsAfterUpload: true,
}
```

Deliberately explicit. Sentry's docs do not state whether a missing auth token
fails or merely warns the build, and CI's `npm run build` must not fail. Gating
on the token's presence makes the behaviour deterministic rather than dependent
on undocumented internals.

`deleteSourcemapsAfterUpload` prevents the maps being served publicly from
`.next/static` after upload.

Without uploaded source maps every production stack trace reads
`chunk-4f2a.js:1:28471` — technically a report, practically useless. This is the
difference between the feature working and the feature existing.

### Tunnel route

`tunnelRoute: "/monitoring"` in `withSentryConfig`, and in `proxy.ts`:

```
"/((?!monitoring|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
```

Rationale: ad blockers block `sentry.io` ingest endpoints, silently discarding
exactly the browser-side crashes we most want. Sentry restricts the tunnel to our
own DSN, so it is not an open relay.

Note for the future CSP roadmap item: `/monitoring` must be allowed in
`connect-src`.

### User context

`app/(app)/layout.tsx` already fetches `user.id` and `profile.role`. Immediately
after the `if (!profile) redirect(...)` guard:

```ts
Sentry.setUser({ id: user.id, role: profile.role })
```

This lands on the per-request isolation scope that `onRequestError` reads, so
server errors carry it. `<SentryUser id={user.id} role={profile.role} />` mirrors
it into the browser SDK for client events.

UUID + role only. No email, no name, no IP. The UUID resolves to a person in
Supabase, which is where that mapping belongs.

Public marketing routes (`/`, `/levels`, `/blog`) have no session; their errors
are anonymous. Correct.

### Error boundary

`app/global-error.tsx` — client component, calls `Sentry.captureException(error)`
in a `useEffect`, renders its own `<html>/<body>` (Next requires this, as it
replaces the root layout). Spanish copy consistent with the site.

Only the global boundary. Finer-grained `error.tsx` boundaries are deferred until
we know from real Sentry data where things actually break.

## Verification

1. `npm run build` with no Sentry env → succeeds, no upload attempted.
   Proves constraint 3.
2. `npm run test:e2e` money-path gate stays green.
3. `npx tsc --noEmit` and `npm run lint` clean.
4. After the Marketplace integration is installed: a temporary throwing route
   deployed to a Vercel preview → the issue appears in Sentry **with a readable,
   un-minified stack trace** → the route is deleted before merge. This is the only
   step that exercises source-map upload and the tunnel route together, because
   neither runs in CI.

## Provisioning

Sentry via the **Vercel Marketplace integration**, installed against the
`brit-english-academy` project. It creates the Sentry project and injects
`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT`
into all Vercel environments. No secret ever transits a chat message or a git
diff, and billing is unified.

This is the one step that requires the maintainer.

## Risks

| Risk | Mitigation |
|---|---|
| Tunnel route intercepted by proxy → silent loss of all client events | Matcher exclusion; verification step 4 |
| Source-map upload never exercised in CI | Accepted. Step 4 covers it on a preview deploy |
| Free-tier quota (5k errors/mo) exhausted by an error loop | Errors-only keeps volume low; revisit if quota alerts fire |
| `beforeSend` misses a PII path | `sendDefaultPii: false` is the primary control; `beforeSend` is defence in depth |

## Rollout

Branch `feat/sentry-error-tracking` → PR → CI green (proves the no-op contract)
→ maintainer installs the Marketplace integration → redeploy preview → verification
step 4 → delete test route → merge.
