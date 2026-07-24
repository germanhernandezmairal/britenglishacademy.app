# Tech Debt & Post-MVP Roadmap Tracker

Ranked by **blast radius** (what breaks / how exposed we are if this stays as-is).
Derived from the `docs/mvp-best-practices.md` audit (2026-06-25). Check items off as done.

## Done (post-MVP hardening)

- [x] Lint clean — `npm run lint` and `tsc --noEmit` both pass; CI enforces them
- [x] Security headers on all routes (nosniff, frame-options, referrer, permissions, HSTS)
- [x] CI workflow (lint + typecheck on push/PR); build/preview via Vercel
- [x] Node pinned (`.nvmrc` + `engines >=20`)
- [x] `LICENSE` — proprietary/all-rights-reserved
- [x] Dependabot (weekly npm + actions updates, vuln alerts)
- [x] Dependency prune — removed unused `next-intl`, `shadcn`
- [x] `docs/runbook.md`, `docs/decisions.md`
- [x] Secrets audit — no secrets in git history; `.env*` gitignored + `.env.local.example`

## High blast radius — do next

- [x] **Error tracking (Sentry, client + server).** Errors-only config; no-op without a DSN.
      Provisioned via the Sentry integration on the Vercel Marketplace. See
      `docs/superpowers/specs/2026-07-08-sentry-error-tracking-design.md`.
      **Live-verified 2026-07-21** on the preview: un-minified server traces, `/monitoring`
      tunnel (POST 200), client user context = UUID + role only (no PII). Two follow-ups below:
      wire Sentry to Production, and the server-side user-context gap.
- [x] **2 high + 4 moderate production npm vulnerabilities.** Resolved 2026-06-26 (PR #14):
      `npm audit` reports 0 vulnerabilities.
- [x] **No automated test of the "money path."** Shipped 2026-07-07 (PR #17): a Playwright
      gate runs the seeded student → interactive exam → 3/3 flow against an ephemeral local
      Supabase on every PR.

- [x] **Keep Supabase awake (free-tier auto-pauses after 7 days idle).** Shipped 2026-07-22: a
      daily Vercel Cron hits `/api/cron/keep-alive`, which runs an anon `head` count against
      `blog_posts` using the same client login uses. Gated on `CRON_SECRET` (fails closed) and
      reports failures to Sentry, so a database problem alerts instead of surfacing later as a
      misleading `invalid_credentials` login error. Note this PREVENTS idling; it cannot un-pause
      an already-paused project. Still on the free tier.
- [x] **Wire Sentry to Production.** Done 2026-07-22: the four Sentry vars were added to the
      Production scope and `main` redeployed with source-map upload confirmed in the build log.
      Live-verified on brit-english-academy.vercel.app — client SDK initialised, a test throw
      tunnelled through `/monitoring` (POST 200) and landed in `sentry-aqua-yacht`.

## Medium

- [ ] **External uptime monitoring** (UptimeRobot etc.) on the prod URL + one critical endpoint.
      *Needs an account.* Our infra can't tell us it's down.
- [ ] **Restrict API keys to domain/scope** in each provider console (Supabase, Replicate, Resend,
      Upstash). *Needs console access.* Client-side/public keys especially.
- [ ] **Practice one Vercel rollback** end-to-end while nothing is on fire (see runbook).
- [ ] **Test a backup restore** to a scratch Supabase project; record the steps + timing in the
      runbook. Until then, backups are unproven.
- [ ] **Performance baseline** — one Lighthouse run on the landing page (throttled) as a reference;
      App Router already route-splits, images are already small (≤256K).

## Lower / watch

- [ ] **Content-Security-Policy** — deferred until the inline-script/style surface (Tailwind + Next)
      is audited; the other security headers are in place.
- [ ] **AI grading (F2-9)** — deferred pending Anthropic credits; deterministic grading works, AI
      falls back gracefully. Re-verify real `claude_feedback.summary` once credits are live.
- [ ] **Structured logging** — replace ad-hoc `console.*` on the server with one logging helper
      (request IDs, no PII) when log volume justifies it.
- [ ] **Unused default Next.js boilerplate assets** in `public/` (`next.svg`, `vercel.svg`,
      `globe.svg`, `window.svg`, `file.svg`) — delete if unreferenced.
- [ ] **QA cleanup leftovers** — see `docs/bug-hunt-findings.md` cleanup checklist (test users,
      Flow 2–3 seed data, conversations).
- [x] **Sentry server-side user context missing.** `Sentry.setUser()` in `app/(app)/layout.tsx`
      did not reach `onRequestError`-captured server errors (Next.js scope isolation — the hook
      runs outside the render async context); client events attach user + role fine.
      **Fixed 2026-07-23:** `instrumentation.ts`'s `onRequestError` now resolves the user id from
      the request cookies via a local `getSession()` decode (`lib/observability/request-user.ts`,
      no network / no DB dependency in the error path) and sets it on a fresh isolation scope.
      **Id only** — the JWT's `role` claim is the Postgres role, not our app role.
      **Live-verified on production 2026-07-24** (`SENTRY-AQUA-YACHT-6`, release `3df77e93ad13`): a
      server render error thrown while signed in as qa.student attached
      `ID 60714bd7-b8fc-49d5-a325-6176c03aa3e8` with no email or username, and the issue counts
      1 user where the 2026-07-21 check counted 0.
- [x] **Production login returned 500 on every attempt for ~66 days.** Found 2026-07-24. The stored
      `UPSTASH_REDIS_REST_URL` carried a trailing newline; Upstash validates eagerly, so `new Redis()`
      threw `UrlError` on construction and the throw escaped uncaught from `login()`'s first step
      (digest `3201808633`, confirmed in `vercel logs`). Hidden because `buildRedis()` returns `null`
      when the vars are *absent* — previews and the E2E gate have none, so **production was the only
      environment running that path**. Fixed by PR #28: credentials are trimmed on read, limiter
      construction is wrapped, and the new `checkRateLimit()` fails **open** (reports to Sentry,
      allows the request) so a limiter fault can never take auth down again.
- [ ] **Audit Production env vars for stray whitespace.** `UPSTASH_REDIS_REST_URL` is still stored
      with its trailing newline — harmless now that the value is trimmed on read, but wrong, and the
      other Production vars have never been checked for the same thing. Values are write-only via
      the CLI, so this needs the dashboard.
- [ ] **Rate limiting has never actually been active.** Corollary of the bug above: the only
      environment with Upstash credentials was the one where the client failed to construct. The
      login (5/15min) and signup (3/hour) caps are unproven in practice — worth exercising once.
- [ ] **Sentry not scoped to Preview deploys (deferred).** The four Sentry vars are Production-only.
      Previews get no error capture, but they also lack Supabase env (auth flows don't work there)
      and source-map upload needs `SENTRY_AUTH_TOKEN` (write-only, unreadable via CLI). Low value
      while previews are ephemeral; revisit if/when a staging Supabase exists.
- [ ] **Unlayered `a:not(.btn)` rule in `app/globals.css:257`** outranks Tailwind's `text-*`
      utilities (higher specificity *and* unlayered CSS beats `@layer utilities`). Every
      coloured link needs an inline `style` or `!` override to work around it. Wrapping the
      rule in `@layer base` would let utilities win by default. Needs a visual pass over
      every `<a>` before flipping.
