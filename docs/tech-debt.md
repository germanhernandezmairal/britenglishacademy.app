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
- [x] **2 high + 4 moderate production npm vulnerabilities.** Resolved 2026-06-26 (PR #14):
      `npm audit` reports 0 vulnerabilities.
- [x] **No automated test of the "money path."** Shipped 2026-07-07 (PR #17): a Playwright
      gate runs the seeded student → interactive exam → 3/3 flow against an ephemeral local
      Supabase on every PR.

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
- [ ] **Unlayered `a:not(.btn)` rule in `app/globals.css:257`** outranks Tailwind's `text-*`
      utilities (higher specificity *and* unlayered CSS beats `@layer utilities`). Every
      coloured link needs an inline `style` or `!` override to work around it. Wrapping the
      rule in `@layer base` would let utilities win by default. Needs a visual pass over
      every `<a>` before flipping.
