# Post-MVP Best Practices

A practical reference for the phase **after** a project reaches MVP — the gap between
*"it works"* and *"it's production-grade"*. Generic by design: copy it into any project
and work through the checklists.

**How to use this document**

- Don't do everything at once. Follow the [roadmap](#the-roadmap) at the end: a handful
  of practices in the first week, more in the first month, the rest as ongoing habits.
- Each practice states *what* it is, *why it matters at the MVP stage specifically*, and
  a concrete *first step*.
- Solo-developer calibration: **[solo]** = essential even working alone.
  **[team]** = only pays off (or only possible) with collaborators — skip guilt-free
  until you have them.

**Contents**

1. [Code Quality & Refactoring](#1-code-quality--refactoring)
2. [Testing Strategy](#2-testing-strategy)
3. [CI/CD](#3-cicd)
4. [Security Hardening](#4-security-hardening)
5. [Performance](#5-performance)
6. [Observability & Monitoring](#6-observability--monitoring)
7. [Dependency & Repo Hygiene](#7-dependency--repo-hygiene)
8. [Documentation](#8-documentation)
9. [Deployment & Rollback](#9-deployment--rollback)
10. [The Roadmap](#the-roadmap)

---

## 1. Code Quality & Refactoring

**Triage the debt — don't refactor everything. [solo]**
MVP code is full of shortcuts; that was the right call. Now list them, rank by
*blast radius* (what breaks if this stays bad?), and only schedule the top few.
*Start:* a `TODO.md` or issue list of known shortcuts, each with a one-line consequence.

**Automate formatting and linting. [solo]**
Style debates with yourself are still debates. A formatter plus a linter with zero
errors makes every future diff meaningful.
*Start:* run the linter on the whole repo, fix or explicitly disable every rule with a
comment saying why, then make CI enforce it (§3).

**Delete dead code — don't comment it out. [solo]**
Dead code rots, misleads, and still shows up in searches. Git history is your undo.
*Start:* one pass deleting unused files, components, exports, and commented blocks.

**Strengthen module boundaries before the codebase grows.**
The MVP's "everything imports everything" is fine at 20 files and crippling at 200.
*Start:* name your layers (UI / domain logic / data access) and fix the worst
cross-layer import you can find.

**Add type safety incrementally.**
You don't need a TypeScript rewrite; you need types where data crosses boundaries
(API responses, form payloads, configs).
*Start:* type or schema-validate (e.g. zod) the single most important external response.

## 2. Testing Strategy

**Test the money path first. [solo]**
One end-to-end test of the flow that justifies the product's existence (signup,
checkout, contact form, core feature) catches more real regressions than 100 unit tests
of helpers.
*Start:* a single E2E happy-path test (Playwright/Cypress) that runs locally and in CI.

**Unit-test pure logic only.**
Functions with inputs and outputs (pricing, parsing, validation) are cheap to test and
where bugs hide. UI snapshots and trivial getters are noise at this stage.
*Start:* test the gnarliest pure function in the codebase.

**Write a regression test for every bug you fix — forever. [solo]**
The cheapest test suite is the one that grows from real failures: each bug becomes a
test that proves it never returns.
*Start:* adopt the rule now; apply it to the next bug.

**Treat coverage as a signal, not a goal.**
Chasing a percentage produces tests that assert nothing. Review *what's* uncovered, not
*how much*.
*Start:* generate a coverage report once; note (don't fix) the risky gaps.

## 3. CI/CD

**Make CI the gatekeeper on every push. [solo]**
"Works on my machine" stops being a sentence you can say. Lint + build + tests on every
push catches breakage before your host does.
*Start:* a single workflow file: install, lint, build, test. Keep it under 5 minutes.

**Get preview deployments per change.**
Reviewing a live URL beats reviewing a diff for anything visual. Most platforms
(Vercel, Netlify, Render) give this for free.
*Start:* confirm your host generates preview URLs; if not, prioritize a host that does.

**Keep branches short-lived. [team]**
Long-lived branches are merge-conflict factories. Solo and pushing to main with CI
green is a legitimate workflow; with a team, switch to short PRs + required checks.
*Start (team):* branch protection requiring CI green + one review before merge.

**Pin your toolchain.**
"Latest" in CI means your build can break while you sleep. Pin the runtime version and
commit the lockfile; pin third-party actions to versions.
*Start:* set the exact Node/Python/etc. version in CI config and an `.nvmrc`/equivalent.

## 4. Security Hardening

**Audit secrets now — and assume git history is public. [solo]**
The MVP rush is when keys get pasted into code. A leaked key in a public repo is
compromised the moment it's pushed, even if deleted later.
*Start:* search the *entire history* (`git log -S`, gitleaks/trufflehog) for keys,
tokens, and passwords. Rotate anything found. Confirm `.env*` is gitignored with a
committed `.env.example`.

**Restrict every API key to its job. [solo]**
Client-side keys (maps, video APIs, analytics) are public by definition — restriction
(HTTP referrer, IP, scope) is the only thing standing between you and quota theft.
*Start:* open each provider's console; restrict each key to your domain(s) and the
minimum scopes.

**Automate dependency vulnerability alerts. [solo]**
You won't remember to run audits manually; let the robots nag you.
*Start:* enable Dependabot/Renovate (or your registry's audit in CI) and fix
highs/criticals in production dependencies within days, not months.

**Set security headers.**
Five lines of config raise the floor against clickjacking and MIME sniffing:
`X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`,
`Permissions-Policy`; add a CSP when your inline-script situation allows it.
*Start:* check your production domain on securityheaders.com; fix what's red.

**Validate input where trust changes.**
Every boundary where outside data enters (forms, API routes, webhooks, URL params)
needs validation *server-side* — client validation is UX, not security.
*Start:* list your trust boundaries; verify the server rejects garbage on each.

**Test the backup, not just the backup job.**
If the project has a database and you've never restored from backup, you don't have
backups — you have hope.
*Start:* restore yesterday's backup to a scratch environment once. Time it. Write down
the steps (§8 runbook).

## 5. Performance

**Measure before optimizing. [solo]**
Post-MVP intuition about what's slow is usually wrong. One profile is worth a week of
guessing.
*Start:* Lighthouse (web) or an APM trace (API) on the most-visited page/endpoint, on a
throttled connection. Keep the report as your baseline.

**Optimize assets first — it's almost always images. [solo]**
The highest perf ROI in most MVPs: multi-MB images shipped raw. Modern formats (WebP/
AVIF), explicit dimensions, and lazy loading routinely cut page weight by 90%+.
*Start:* list your heaviest assets; convert, resize to the largest displayed size, and
set width/height to kill layout shift.

**Split code by route.**
Users shouldn't download the admin panel to view the landing page.
*Start:* lazy-load every route except the entry page; check the bundle report before
and after.

**Define a caching strategy on purpose.**
Accidental caching causes both slowness (nothing cached) and horror (stale data
cached). Static assets: immutable + hashed filenames. Data: decide staleness per
endpoint.
*Start:* read the `Cache-Control` headers your production site actually sends.

**Find the N+1 queries before users do.**
ORMs make it trivial to fire 200 queries per page without noticing; fine with 10 rows
in dev, fatal with 10,000 in prod.
*Start:* log queries for one slow page; count them. Add the missing indexes/joins.

## 6. Observability & Monitoring

**Install error tracking before users find the bugs. [solo]**
Without it, your error reporting is "a user might email you". With it, you get the
stack trace, browser, and frequency the moment something breaks.
*Start:* Sentry (or similar) wired to both client and server; trigger a test error and
confirm the alert reaches you.

**Monitor uptime from outside. [solo]**
Your own infrastructure can't tell you it's down. An external pinger can.
*Start:* a free uptime check (UptimeRobot etc.) on the production URL + one critical
endpoint, alerting to something you actually read.

**Log with structure, for questions you'll ask later.**
`console.log("here 2")` doesn't survive contact with production. Structured logs
(JSON, request IDs, user-safe context) answer "what happened for this user?".
*Start:* one logging helper; route all server logs through it; never log secrets/PII.

**Alert only on what you'd get out of bed for.**
Noisy alerts train you to ignore alerts. Page on user-facing breakage; review the rest
weekly.
*Start:* exactly two alerts — site down, error spike. Resist adding more for a month.

**Separate product analytics from ops monitoring.**
"Are users clicking this?" and "is the server on fire?" are different questions with
different tools; conflating them gives you neither.
*Start:* one lightweight, privacy-respecting analytics tool if you need usage data.

## 7. Dependency & Repo Hygiene

**Remove dependencies you don't use. [solo]**
Every dependency is a supply-chain liability, audit surface, and bundle weight. MVPs
accumulate "tried it once" packages.
*Start:* depcheck/knip (or grep imports per dependency); uninstall the strays.

**Keep heavy binaries out of git. [solo]**
PSDs, videos, raw images, and ZIPs bloat every future clone forever — git never
forgets. Design sources belong in cloud storage or LFS.
*Start:* list your largest tracked files; archive offenders outside the repo and
gitignore their paths going forward.

**Curate `.gitignore` deliberately. [solo]**
Build output, env files, caches, editor junk, OS junk — and project-specific private
material. Review it when the project structure changes.
*Start:* `git status` should show *only* files you intend to commit. If not, fix the
ignore file now.

**Make commits tell a story. [team]**
Conventional, scoped commits (`feat:`, `fix:`, `chore:`) turn history into
documentation and enable changelogs. Solo it's a nicety; in a team it's how reviewers
and future-you navigate.
*Start:* adopt the convention for all commits from today; don't rewrite the past.

**Decide the license consciously. [solo]**
No license file = all rights reserved. That's often correct for a personal/commercial
project — but it should be a decision, not an accident.
*Start:* decide; add `LICENSE` or note "proprietary" in the README.

## 8. Documentation

**README: a stranger can run it. [solo]**
The bar: clone → install → configure → run, with every required env var listed. The
stranger is you, on a new machine, in a year.
*Start:* follow your own README on a clean directory; fix every step where you had to
improvise.

**Write the runbook while things are calm. [solo]**
How to deploy, roll back, restore the database, rotate a key — written *before* the
3 a.m. incident, because during it you won't be writing docs.
*Start:* `docs/runbook.md` with: deploy, rollback, backup-restore, key rotation. Bullet
points beat prose.

**Record big decisions in one paragraph each.**
Why this database, this host, this framework — Architecture Decision Records save you
from re-litigating settled questions every six months.
*Start:* `docs/decisions.md`; backfill the 3 biggest choices already made, one
paragraph each: context → decision → trade-off accepted.

**Document the API surface if anyone else consumes it. [team]**
The moment a second person (or your own frontend) depends on your endpoints, undocu-
mented behavior becomes breaking-change roulette.
*Start:* OpenAPI spec or a plain markdown table of endpoints: method, path, payload,
response, errors.

## 9. Deployment & Rollback

**Make deploys boring and repeatable. [solo]**
A deploy should be one command or one push — never a sequence you perform from memory.
If it has manual steps, script them or they will eventually be done wrong.
*Start:* write down today's deploy steps; automate the first manual one.

**Prove you can roll back — before you need to. [solo]**
Rollback is a deploy-time feature, not an incident-time improvisation. Most platforms
offer instant re-promotion of a previous build; know where the button is.
*Start:* deploy, roll back to the previous version, confirm the site works, roll
forward. Five minutes, once.

**Keep environments boringly similar.**
"Works in dev, broken in prod" is almost always an environment delta: versions, env
vars, data shape.
*Start:* diff your dev and prod env-var lists; document every intentional difference.

**Make database migrations reversible.**
Schema changes are the riskiest deploys. Additive first (add column → backfill →
switch reads → drop later) beats destructive-in-one-shot.
*Start:* adopt the rule: every migration ships with its down-migration, tested on a
copy.

**Flag risky features instead of betting the deploy.**
A boolean toggle (env var is enough at this scale) lets you ship dark, test in prod,
and kill a misbehaving feature without a redeploy.
*Start:* wrap the next risky feature in a simple flag; no framework needed.

---

## The Roadmap

### First week after MVP

- [ ] Secrets audit across full git history; rotate anything found (§4)
- [ ] Restrict every API key to domain/scope minimums (§4)
- [ ] Error tracking live on client + server, test alert received (§6)
- [ ] External uptime monitoring on production URL (§6)
- [ ] CI on every push: lint + build (+ tests when they exist) (§3)
- [ ] Practice one rollback on the production platform (§9)
- [ ] `.gitignore` review; `git status` shows only intentional files (§7)

### First month

- [ ] One E2E test of the money path, running in CI (§2)
- [ ] Dependency prune + automated vulnerability alerts (§7, §4)
- [ ] Performance baseline (Lighthouse/APM) + asset optimization pass (§5)
- [ ] Security headers pass; check on securityheaders.com (§4)
- [ ] Route-level code splitting (§5)
- [ ] README a stranger can follow + `docs/runbook.md` (§8)
- [ ] Backup restore tested, steps written down (§4, §8)
- [ ] Debt triage list with blast-radius ranking (§1)
- [ ] License decision made explicit (§7)

### Ongoing habits

- [ ] Regression test for every bug fixed (§2)
- [ ] Dependency updates reviewed on a schedule, not "someday" (§7)
- [ ] Re-profile performance after any significant feature (§5)
- [ ] Decision log updated when architecture choices are made (§8)
- [ ] Alerts reviewed: would I get out of bed for each one? (§6)
- [ ] Migrations always reversible; risky features behind flags (§9)
- [ ] Docs touched in the same change that makes them stale (§8)
