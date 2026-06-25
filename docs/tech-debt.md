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

- [ ] **Error tracking (Sentry, client + server).** *Needs a Sentry account + DSN.* Right now a
      production error is invisible unless a user emails. Highest-value missing safety net.
- [ ] **2 high + 4 moderate production npm vulnerabilities.** `npm audit` flags fixes; most apply
      via `npm audit fix` (non-breaking). Apply, then validate with a preview build before merge.
      Dependabot will also propose these. (Chains: `uuid → svix`, `postcss`.)
- [ ] **No automated test of the "money path."** The student exam/lesson flow is verified only by
      ad-hoc gitignored Playwright scripts. Promote one happy-path flow to a committed E2E test
      runnable in CI (needs a test Supabase project or seeded fixtures).

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
