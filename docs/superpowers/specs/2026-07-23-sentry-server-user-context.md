# Sentry server-side user context + env-var cleanup

**Date:** 2026-07-23
**Status:** design approved

## Problem

Server-side error events captured by `instrumentation.ts`'s `onRequestError` carry
**no `user.id`** (live-verified 2026-07-21). `Sentry.setUser()` runs during the
Server-Component render in `app/(app)/layout.tsx`, but `onRequestError` runs *outside*
that request's async context, so the render-scope user never reaches the captured event.
Client events attach user + role correctly; only server events are affected.

The comment at `instrumentation.ts:13-17` still claims the render `setUser()` "rides
along" — empirically false, and inconsistent with the corrected `layout.tsx` comment.

Separately, six Vercel env vars are scoped to `Preview (feat/sentry-error-tracking)`, a
branch that was deleted after PR #18 merged. They are inert clutter.

## Non-goals

- **App role on server events.** The JWT's `role` claim is the Postgres role
  (`authenticated`), not our app role (student/admin). Resolving the app role needs a
  `profiles` query — a DB round-trip in the error path, which is exactly where the DB may
  be the failure. We deliberately attach **id only** server-side. Sentry can pivot on the
  user id; the client-side context (id + role) is unchanged.
- **Preview-scoped Sentry.** Deferred: previews are ephemeral, also lack Supabase env, and
  source-map upload needs `SENTRY_AUTH_TOKEN` (write-only, unreadable via CLI). Logged in
  `tech-debt.md`, not done here.
- No change to client events, `layout.tsx` behaviour, or `<SentryUser>`.

## Design

### A. Resolve the user id locally, with zero network

New module `lib/observability/request-user.ts`:

```ts
getUserIdFromCookieHeader(cookieHeader?: string): Promise<string | null>
```

- Parses the request `cookie` header and builds a `createServerClient` (`@supabase/ssr`)
  whose cookie adapter reads from those parsed cookies (`setAll` is a no-op).
  `autoRefreshToken: false`, `persistSession: false`.
- Calls `supabase.auth.getSession()` — Supabase's own **local** decode of the auth cookie
  (no network, no server validation) — and returns `session?.user?.id ?? null`.
- Reusing `getSession` (rather than hand-rolling base64/JWT parsing) keeps us robust to
  Supabase's cookie chunking/format. Validation isn't needed: error attribution is not a
  trust boundary, and an expired-but-present token still carries the right `sub`.
- The whole body is wrapped so **any** failure (missing env, malformed cookie, format
  drift, thrown error) returns `null`. Error reporting must never throw or hang.
- The Supabase client factory is injected via a default parameter so tests can stub
  `getSession` without touching cookie-format internals (matches the DI pattern in
  `lib/observability/sentry-options.ts`).

### B. Wire it into `onRequestError`

`instrumentation.ts` replaces `export const onRequestError = Sentry.captureRequestError`
with:

```ts
export async function onRequestError(err, request, context) {
  const userId = await getUserIdFromCookieHeader(request?.headers?.cookie)
  await Sentry.withIsolationScope(async (scope) => {
    if (userId) scope.setUser({ id: userId })
    Sentry.captureRequestError(err, request, context)
  })
}
```

`withIsolationScope` prevents cross-request user leakage (this hook can share the global
scope). The isolation-scope user merges into the event captured inside
`captureRequestError`. The misleading comment is rewritten to describe the real mechanism.

### C. Env-var hygiene (ops)

`vercel env rm` the six `Preview (feat/sentry-error-tracking)` vars:
`SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_PROJECT`, `SENTRY_ORG`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`. Production scope is untouched.

## Testing

`lib/observability/request-user.test.ts` (collected by `vitest.config.ts` under `lib/**`):

- `getSession` returns a session → the user id is returned.
- `getSession` returns `{ session: null }` → `null`.
- `getSession` throws → `null` (no rethrow).
- No cookie header → `null` without constructing a client.

`instrumentation.ts` stays thin and is exercised end-to-end by the live Sentry
verification, not unit tests.

## Verification

- CI: `tsc`, lint, vitest, e2e all green.
- Live (post-merge, prod): trigger a server error while logged in as a QA user, confirm the
  Sentry event now shows `User: <uuid>` (no email/role). Re-run the 2026-07-21 check.
