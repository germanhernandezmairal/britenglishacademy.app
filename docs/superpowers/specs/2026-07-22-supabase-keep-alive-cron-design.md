# Supabase Keep-Alive Cron — Design

**Date:** 2026-07-22
**Status:** Approved, ready for implementation plan
**Tech-debt item:** `docs/tech-debt.md` — "Keep Supabase awake (free-tier auto-pauses after 7 days idle)"

## Problem

The project's Supabase database (`gxunzmybwbghizrezhhw`, "brit-english-academy") is on the **free
tier**, which auto-pauses after **7 days of inactivity**. A paused database must be restored by hand
from the Supabase dashboard.

There is exactly one database behind both production and every preview deployment — there is no
staging Supabase. So a pause takes down authentication **everywhere** at once.

The failure is deceptive. When paused, login returns `/login?error=invalid_credentials` even with
correct credentials: the auth endpoint answers but cannot reach the database to validate, so it
rejects. It reads as a wrong-password bug. This cost real debugging time on 2026-07-21 before the
paused project was spotted.

Upgrading to Supabase Pro would remove the pause behaviour entirely, but that is out of scope — the
decision is to stay on the free tier for now.

## Goal

A daily automated request that performs a trivial database read, so the project never reaches 7 idle
days. Secondarily, make any failure of that read **loud**, so a database problem produces an alert
rather than a silent week that ends in a broken login.

## Non-goals

- Restoring an already-paused database. This design prevents idling; it cannot un-pause.
- A general-purpose health endpoint for external uptime monitoring. That remains a separate roadmap
  item.
- Any change to authentication, RLS policies, or the schema.

## Architecture

Four files. No new dependencies.

| File | Purpose |
|---|---|
| `lib/cron/keep-alive.ts` | The logic: authorization gate + ping runner |
| `lib/cron/keep-alive.test.ts` | vitest coverage of both |
| `app/api/cron/keep-alive/route.ts` | Thin GET handler wiring the two together |
| `vercel.json` (new file) | `crons` entry pointing at that path |

Both `app/api/` and `vercel.json` are greenfield: the repo currently has a single route handler
(`app/auth/callback/route.ts`) and no Vercel config file.

**Why the logic lives in `lib/` rather than beside the route** (revised during planning): the test
runner is configured with `include: ["lib/**/*.test.ts", "proxy.test.ts"]`, so a test placed under
`app/` is silently never collected — it would look like passing coverage while running nothing.
Rather than widen that config, the feature follows the pattern already set by
`lib/observability/sentry-options.ts`: dependency-injected functions in `lib/` with a colocated
test, and a route handler thin enough that it needs no test of its own.

## Data flow

1. **Vercel Cron fires** `GET /api/cron/keep-alive`. When a `CRON_SECRET` environment variable
   exists, Vercel automatically attaches `Authorization: Bearer <CRON_SECRET>` to the invocation.

2. **Auth gate.** The handler compares the header against `process.env.CRON_SECRET`. A mismatch —
   **or an unset `CRON_SECRET`** — returns `401`.

   Failing closed when the variable is unset is deliberate, and is a departure from the repo's
   "no-op when the env var is absent" convention for optional services (Upstash, Anthropic, Resend,
   Replicate, VAPID). That convention exists to keep builds and the hermetic E2E gate working
   without secrets. Here the variable *is* the access control, so a missing value must lock the
   route rather than open it.

3. **The query.** Build an anon client with the existing `createClient()` from
   `lib/supabase/server.ts`, then run:

   ```ts
   supabase.from("blog_posts").select("id", { count: "exact", head: true })
   ```

   Two reasons for this exact query:

   - **`blog_posts` is deliberately anon-readable.** Its `blog_select_public` policy is
     `for select using (is_published = true)` — no role predicate, by design, because the marketing
     blog is public. Every other table's policies gate on `auth.uid()`, `current_user_role()`, or an
     active authenticated profile. Reading it needs no service-role key, so the route never touches
     `SUPABASE_SERVICE_ROLE_KEY`.

     A ping that returns zero rows is still a successful ping: the query reaches Postgres and counts
     as database activity regardless of how many rows RLS lets through. The check is on the error
     channel, not the row count.
   - **Going through `createClient()` exercises the same code path login uses** — the cookie-based
     anon SSR client. A green ping is therefore evidence that authentication will work, not merely
     that Postgres accepted a connection.

   `head: true` returns a count and no rows, keeping the response minimal while still doing real
   database work.

4. **Report.**
   - Success → `200 { ok: true, durationMs }`
   - Failure → capture the exception to Sentry tagged `cron: keep-alive`, then `503 { ok: false }`

The route exports `dynamic = "force-dynamic"` so it is never statically prerendered or cached, which
would silently defeat the whole purpose.

## Schedule

```json
{
  "crons": [{ "path": "/api/cron/keep-alive", "schedule": "0 6 * * *" }]
}
```

Daily. The Vercel Hobby plan caps cron jobs at **once per day** (max 2 jobs) and fires them at an
approximate time rather than an exact one, which is fine — daily leaves a 7× margin against the
7-day pause window, and the exact minute is irrelevant.

**Vercel crons run only against production deployments.** Previews are never invoked, but since all
environments share the one database, previews benefit from production's pings.

## Error handling

Sentry is wired and live-verified on Production, so a failed ping arrives as a real alert rather
than a log line nobody reads. This is what turns the job from "hopefully still running" into
something observable.

The honest limit, restated: if a pause happens anyway, the cron cannot fix it. Its value in that
case is that Sentry tells you before a user does.

## Testing

Fourteen vitest cases in `lib/cron/keep-alive.test.ts`, split across the two functions:

| Function | Cases |
|---|---|
| `isAuthorizedCronRequest` | secret undefined / empty / whitespace, header missing, wrong secret, bare secret without the `Bearer` scheme, correct secret at the wrong length, and the exact match |
| `runKeepAlivePing` | query resolves clean, query matches zero rows, query returns a Postgres error, query throws, query rejects with a non-`Error` value |

No module mocking is needed. Both functions take their dependencies as parameters — the secret as a
default-valued argument, and the query as a thunk — so each test passes a two-line fake. This
matches how `lib/observability/sentry-options.test.ts` already works; no existing test in the repo
uses `vi.mock`.

No network and no database, so the suite stays hermetic and runs in the fast `check` CI job
alongside the existing vitest tests.

## Rollout

1. Generate a random `CRON_SECRET` and add it to the **Production** scope via the Vercel CLI. (The
   Vercel dashboard SPA cannot be driven by the browser extension — it never reaches `document_idle`
   — so CLI or manual entry by the maintainer are the only options.)
2. Merge to `main`; Vercel registers the cron from `vercel.json` on the next production deployment.
3. Verify the job appears under the project's Cron Jobs, then confirm a `200` from the first run.

## Incidental cleanup

`docs/tech-debt.md` still shows "Wire Sentry to Production" unchecked, but that work completed on
2026-07-22 (production Sentry vars added, deployed, live-verified). Tick it, and tick the keep-alive
item as this design ships.
