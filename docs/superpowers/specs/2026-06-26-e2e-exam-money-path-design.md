# Design: Committed E2E "money-path" test — student interactive exam

**Date:** 2026-06-26
**Status:** Approved (brainstorming) — pending implementation plan
**Tech-debt item:** "No automated test of the money path" (`docs/tech-debt.md`, High blast radius #3)

## Problem

The student exam/lesson flow — the core product loop — is verified only by ad-hoc,
gitignored Playwright scripts (`_f*.mjs`) run by hand against the live/prod Supabase
project. There is no committed, repeatable, CI-runnable test. A regression in auth,
exam rendering, the grading server action, or the DB write would ship undetected.

## Goal

One committed end-to-end test, runnable in CI with no external service dependencies,
that exercises the highest-value happy path and fails loudly on regression.

**Success criteria:** On every PR and push to `main`, CI brings up a hermetic stack,
seeds fixtures, and a headless browser drives: login → open published exam → answer →
submit → assert a deterministic full score. Green = the money path works.

## Scope

**In:** A single flow — student takes a published *interactive* exam (MCQ + gap-fill,
auto-graded). Local Supabase in CI. `@playwright/test` runner. Seeded fixtures.

**Out (YAGNI):** Homework/community/messages flows; cross-browser; visual regression;
AI/email/storage coverage; any test framework abstraction. The raw `playwright` driver
and the `_*.mjs` scratch scripts are left untouched.

## Why this flow

The interactive-exam path is **fully deterministic and hermetic**:

- MCQ and gap-fill answers are graded in-app by `submitInteractiveExam`
  (`app/actions/exams.ts`) — string comparison, no Anthropic. `gradeOpenText` is only
  called when an `open_text` question exists; the seeded exam has none, so the AI path
  is never touched.
- Login rate-limiting degrades gracefully: `lib/ratelimit.ts` returns `null` when
  `UPSTASH_REDIS_REST_*` env is absent, and `app/actions/auth.ts` only limits
  `if (limiter)`. No Upstash needed in CI.
- No Resend (email), Replicate, or VAPID on this path.

So with only local Supabase env set, every other integration no-ops by design.

## Architecture

### Backend bring-up (the crux)

`supabase db reset` / `supabase start` replay **only `supabase/migrations/*`**, not
`supabase/schema.sql`. Today the base tables (profiles, exams, lessons, …) live in
`schema.sql`; migrations `001–005` patch on top (incl. `003_exam_v2_model.sql`, which
adds `exam_type`, `questions`, and the `exam_submissions` table). A fresh local stack
replaying only `001–005` would be **missing the base tables**.

**Fix (prerequisite task):** add `supabase/migrations/000_init.sql` containing the
current `schema.sql` content, so the chain replays base → 001 → … → 005 and reproduces
the prod schema exactly. This also permanently closes the schema-drift gap that caused
the Flow 1–4 silent-failure bugs (`schema.sql` and live DB were "v1"; app code drifted
to "v2" with no bridging migration). `schema.sql` is retained as a human-readable dump;
`000_init.sql` is the replayable source of truth for `db reset`.

### Stack in CI

GitHub Actions, ubuntu, new **separate `e2e` job** in `.github/workflows/ci.yml` (kept
apart from the fast `check` lint/typecheck job so an e2e hiccup doesn't block that gate;
the `e2e` job is **required for merge**). Steps:

1. checkout → `actions/setup-node` (from `.nvmrc`, npm cache)
2. `npm ci`
3. Install Supabase CLI + `supabase start` (Docker; local Postgres + Auth + Storage,
   with the standard well-known local anon/service keys)
4. Apply migrations (`000_init` … `005`) via `supabase db reset` / `start`
5. Seed fixtures (`e2e/seed.ts`)
6. `npx playwright install --with-deps chromium`
7. `npx playwright test` — Playwright's `webServer` config boots `next build && next start`
   against local Supabase env
8. On failure: upload the Playwright HTML report / trace as an artifact

Job timeout ~15 min.

### Environment for the app in CI

- `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` = the standard local
  Supabase dev keys (non-secret; can be inline in the workflow)
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- No Upstash / Anthropic / Resend / Replicate / VAPID env → all integrations no-op.

## Components (committed files)

- **`@playwright/test`** — added as a devDependency (proper test runner). Chromium only,
  headless, 1 worker, retries 0 locally / 1 in CI.
- **`playwright.config.ts`** — `testDir: e2e/`, `webServer` boots the built app, base URL
  `http://localhost:3000`, trace `on-first-retry`, `globalSetup`.
- **`e2e/global-setup.ts`** — runs `e2e/seed.ts` once before the suite.
- **`e2e/seed.ts`** — promotes the logic from `_setup-test-users.mjs` + `_seed.mjs`,
  using the service-role key against local Supabase REST/admin API:
  - Create a confirmed student `e2e.student@example.test` (`email_confirm: true`),
    profile `level: "B2"`, password from a constant.
  - Insert one published `interactive` exam, `max_score: 3`, with 3 known-answer
    questions (2 mcq + 1 gap_fill). Fixed UUIDs → idempotent (upsert/delete-then-insert).
- **`e2e/exam-money-path.spec.ts`** — the test (below).

### The seed fixture (shape)

Mirrors `_seed.mjs`: `exams` row with `exam_type: "interactive"`, `is_published: true`,
`level: "B2"`, `skill: "grammar"`, `max_score: 3`, and a `questions` JSONB array of
`{ id, type, question, options?, correct_answer, max_score }`. All answers known so the
expected score is a full 3/3.

## Data flow (the test)

`e2e/exam-money-path.spec.ts`:

1. `goto('/login')`, fill seeded student email + password, submit → expect redirect to
   `/dashboard`.
2. `goto('/exams')` → expect the seeded exam title visible → click into it (`/exams/[id]`).
3. Answer all 3 questions with the known-correct values (select MCQ options, type the
   gap-fill word).
4. Submit → expect the result UI to show the full score (3/3, 100%, band A). The exact
   selectors/text are pinned down against `InteractiveExam.tsx` in the implementation plan.

Assertion is deterministic because no AI grading is involved.

## Error handling / failure modes

- **Schema missing / drifted:** seed insert or page render fails → test fails loudly.
  This is the desired signal and the reason `000_init.sql` is a prerequisite.
- **Flaky cold compile** (noted on the slow F: drive locally): in CI the app is built
  (`next build`) before serving, so there is no cold-compile flake; Playwright's `webServer`
  waits for readiness. `retries: 1` in CI absorbs incidental flake.
- **Seed not idempotent:** fixed UUIDs + delete-then-insert keep reruns clean.

## Open questions

None. Defaults approved: (A) e2e job runs on every PR + push, **blocking**; (B) schema
reproduced via committed `000_init.sql`.

## Out-of-scope follow-ups (noted, not now)

- Extend to homework (needs storage stub) and community/messages flows.
- Re-verify AI exam grading once Anthropic credits exist (tech-debt F2-9).
- Promote more `_*.mjs` scratch scripts into committed e2e specs as flows stabilize.
