# E2E Exam Money-Path Test — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one committed, CI-runnable end-to-end test that drives a seeded student through login → taking a published interactive exam → asserting a deterministic full score, against a hermetic local Supabase.

**Architecture:** A new GitHub Actions `e2e` job spins up local Supabase (Docker) via the Supabase CLI, which replays `supabase/migrations/*` (now including a `000_init.sql` that reproduces the full base schema). Playwright's `globalSetup` seeds a confirmed student + a published interactive exam directly via the Supabase admin/REST API. Playwright then boots the app and runs a single Chromium spec. No external services (Anthropic/Resend/Upstash/Replicate/VAPID) are configured, so they all no-op by design.

**Tech Stack:** `@playwright/test`, Supabase CLI (local stack), Next.js 16 App Router, GitHub Actions.

## Global Constraints

- Node version: `20` (from `.nvmrc`) — exact value, used in every CI job.
- Test runner: `@playwright/test`. The raw `playwright` driver and the gitignored `_*.mjs` scratch scripts are NOT touched.
- Browser: Chromium only, headless, 1 worker. `retries: 1` in CI, `0` locally.
- Seeded exam is MCQ + gap_fill ONLY (no `open_text`) so `gradeOpenText` (Anthropic path) is never reached.
- Seed identifiers are fixed UUIDs and the seed is idempotent (delete-then-insert / upsert).
- Seed test user: email `e2e.student@example.test`, password `E2ePass123!`, profile `level: "B2"`, `role: "student"`.
- App runtime env in CI: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (local Supabase values), `NEXT_PUBLIC_APP_URL=http://localhost:3000`. No other service env is set.
- `getBand`: `pct >= 90 → "A"`. A 3/3 (100%) score ⇒ band `A`, label `Sobresaliente`.

---

## File Structure

- `supabase/migrations/000_init.sql` — **create**. Copy of `supabase/schema.sql`; makes `supabase db reset`/`start` replay the full base schema before 001–005.
- `playwright.config.ts` — **create**. Test dir `e2e/`, webServer, globalSetup, Chromium project.
- `e2e/seed.ts` — **create**. `seedDatabase()` — provisions the student + published interactive exam via Supabase admin/REST API. Exports fixture constants.
- `e2e/global-setup.ts` — **create**. Calls `seedDatabase()` once before the suite.
- `e2e/smoke.spec.ts` — **create**. Trivial homepage smoke test to validate the Playwright harness without Supabase.
- `e2e/exam-money-path.spec.ts` — **create**. The money-path test.
- `package.json` — **modify**. Add `@playwright/test` devDep + `test:e2e` script.
- `.gitignore` — **modify**. Ignore Playwright output dirs.
- `.github/workflows/ci.yml` — **modify**. Add the `e2e` job.

---

### Task 1: Playwright harness + homepage smoke test

Establishes the Playwright runner and webServer wiring with a test that needs no database, so it is verifiable locally without Docker.

**Files:**
- Modify: `package.json` (devDependencies + scripts)
- Create: `playwright.config.ts`
- Create: `e2e/smoke.spec.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `playwright.config.ts` exporting a config whose `testDir` is `./e2e`, `webServer` runs the app on `http://localhost:3000`, and `globalSetup` points at `./e2e/global-setup.ts` (file added in Task 3). Until Task 3 exists, `globalSetup` line stays commented with an exact TODO marker shown below.

- [ ] **Step 1: Add the dev dependency**

Run:
```bash
npm install -D @playwright/test@^1.60.0
```
Expected: `package.json` gains `"@playwright/test": "^1.60.0"` under devDependencies; `package-lock.json` updates. (On the slow F: drive this can take several minutes — run in background if needed.)

- [ ] **Step 2: Add the `test:e2e` script**

In `package.json`, add to `"scripts"`:
```json
    "test:e2e": "playwright test"
```

- [ ] **Step 3: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test"

const PORT = 3000
const BASE_URL = `http://localhost:${PORT}`
const isCI = !!process.env.CI

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["html", { open: "never" }], ["list"]] : "list",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    headless: true,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // CI builds first then serves the optimized output (no cold-compile flake).
    // Locally we use the dev server so no separate build is required.
    command: isCI ? "npm run start" : "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
})
```

NOTE: `globalSetup` references `./e2e/global-setup.ts`, created in Task 3. Create that file as an empty no-op stub now so this task runs standalone:

Create `e2e/global-setup.ts`:
```ts
// Replaced with real seeding in Task 3.
export default async function globalSetup() {}
```

- [ ] **Step 4: Write the smoke test**

Create `e2e/smoke.spec.ts`:
```ts
import { test, expect } from "@playwright/test"

test("homepage renders", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/Brit English Academy/i)
})
```

- [ ] **Step 5: Ignore Playwright output**

Append to `.gitignore`:
```
# Playwright
/test-results/
/playwright-report/
/playwright/.cache/
```

- [ ] **Step 6: Install the Chromium browser**

Run:
```bash
npx playwright install chromium
```
Expected: Chromium downloads (or "is already installed").

- [ ] **Step 7: Run the smoke test**

Run:
```bash
npx playwright test e2e/smoke.spec.ts
```
Expected: PASS — `1 passed`. (Locally this launches `npm run dev`; the homepage does not query Supabase, so no DB is needed.)

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json playwright.config.ts e2e/smoke.spec.ts e2e/global-setup.ts .gitignore
git commit -m "test(e2e): add Playwright harness + homepage smoke test"
```

---

### Task 2: Reproducible base-schema migration (`000_init.sql`)

`supabase db reset`/`start` replays only `supabase/migrations/*`, not `schema.sql`. Adding the base schema as migration `000` makes a fresh local stack reproduce prod (base → 001 → … → 005).

**Files:**
- Create: `supabase/migrations/000_init.sql` (content = current `supabase/schema.sql`)

**Interfaces:**
- Produces: a local Supabase DB (after `supabase start`) containing `profiles`, `exams` (with `exam_type`, `questions`, `level`, `max_score`, `is_published`), `exam_submissions`, and the new-user → profiles trigger.

- [ ] **Step 1: Create the migration from the schema dump**

Run:
```bash
cp supabase/schema.sql supabase/migrations/000_init.sql
```
Expected: `000_init.sql` exists and is byte-identical to `schema.sql`.

- [ ] **Step 2: Confirm ordering and idempotency**

Verify the migrations directory lists in this order (lexical):
```bash
ls supabase/migrations/
```
Expected:
```
000_init.sql
001_messaging.sql
002_fix_lesson_resources_rls.sql
003_exam_v2_model.sql
004_lessons_v2_columns.sql
005_homework_v2_columns.sql
```
Confirm `000_init.sql` uses `create table`/`create type` statements (migrations 001–005 are already additive `create ... if not exists` / `add column if not exists`, so the chain is replayable on a clean DB).

- [ ] **Step 3: Bring up the local stack and verify the schema (requires Docker)**

Run:
```bash
supabase start
```
Expected: services start; migrations `000`…`005` apply without error.

Verify the key tables exist:
```bash
supabase db reset --linked=false >/dev/null 2>&1; \
psql "$(supabase status -o env | sed -n 's/^DB_URL=//p' | tr -d '"')" -c "\dt public.*" -c "\d public.exams" </dev/null
```
Expected: `profiles`, `exams`, `exam_submissions` are listed and `public.exams` shows `exam_type`, `questions`, `level`, `max_score`, `is_published` columns.

> If Docker is unavailable on the dev machine, this step's verification is deferred to the CI run in Task 5 — that is the authoritative gate. Do not block the task on local Docker; note it in the execution ledger.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/000_init.sql
git commit -m "chore(db): add 000_init migration so local supabase reproduces full schema"
```

---

### Task 3: Seed module + global setup

Promotes the logic from `_setup-test-users.mjs` + `_seed.mjs` into a committed, idempotent seed that runs before the suite via Playwright `globalSetup`.

**Files:**
- Create: `e2e/seed.ts`
- Modify: `e2e/global-setup.ts` (replace the Task 1 stub)

**Interfaces:**
- Consumes: `process.env.NEXT_PUBLIC_SUPABASE_URL`, `process.env.SUPABASE_SERVICE_ROLE_KEY`.
- Produces:
  - `seedDatabase(): Promise<void>` — provisions the student and exam.
  - Exported constants used by the spec in Task 4: `STUDENT_EMAIL`, `STUDENT_PASSWORD`, `EXAM_TITLE`, and `ANSWERS` (`{ q1Correct: "went", q2Correct: "since", q3Correct: "quickly" }`).

- [ ] **Step 1: Write the seed module**

Create `e2e/seed.ts`:
```ts
// Idempotent seeding for the e2e money-path test. Talks to Supabase REST/admin
// API directly with fetch (no supabase-js → no WS polyfill needed on Node 20).

export const STUDENT_EMAIL = "e2e.student@example.test"
export const STUDENT_PASSWORD = "E2ePass123!"
export const EXAM_TITLE = "[E2E] B2 Grammar Money Path"

// Fixed UUIDs keep the seed idempotent across runs.
const EXAM_ID = "e2e00000-0000-4000-8000-000000000001"
const Q1_ID = "e2e00000-0000-4000-8000-0000000000a1"
const Q2_ID = "e2e00000-0000-4000-8000-0000000000a2"
const Q3_ID = "e2e00000-0000-4000-8000-0000000000a3"

export const ANSWERS = { q1Correct: "went", q2Correct: "since", q3Correct: "quickly" }

const QUESTIONS = [
  {
    id: Q1_ID,
    type: "mcq",
    question: "Choose the correct verb: \"She ___ to London yesterday.\"",
    options: ["went", "goes", "gone", "going"],
    correct_answer: "went",
    max_score: 1,
  },
  {
    id: Q2_ID,
    type: "gap_fill",
    question: "Complete with one word: \"I have lived here ___ 2010.\"",
    correct_answer: "since",
    max_score: 1,
  },
  {
    id: Q3_ID,
    type: "mcq",
    question: "Pick the synonym of \"rapidly\".",
    options: ["slowly", "quickly", "rarely", "seldom"],
    correct_answer: "quickly",
    max_score: 1,
  },
]

function env(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`[seed] missing env ${name}`)
  return v
}

export async function seedDatabase(): Promise<void> {
  const url = env("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "")
  const key = env("SUPABASE_SERVICE_ROLE_KEY")
  const h = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  }

  // 1. Ensure the confirmed student auth user exists.
  let userId: string | undefined
  const createRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      email: STUDENT_EMAIL,
      password: STUDENT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "E2E Student" },
    }),
  })
  const createJson = await createRes.json()
  if (createRes.ok && createJson.id) {
    userId = createJson.id
  } else {
    // Already exists → look up + reset password.
    const listRes = await fetch(`${url}/auth/v1/admin/users?per_page=200`, { headers: h })
    const listJson = await listRes.json()
    userId = (listJson.users || []).find((u: { email: string }) => u.email === STUDENT_EMAIL)?.id
    if (!userId) throw new Error(`[seed] could not create or find ${STUDENT_EMAIL}: ${JSON.stringify(createJson)}`)
    await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: h,
      body: JSON.stringify({ password: STUDENT_PASSWORD, email_confirm: true }),
    })
  }

  // 2. Upsert the profile (covers both "trigger created the row" and "it didn't").
  const profileRes = await fetch(`${url}/rest/v1/profiles`, {
    method: "POST",
    headers: { ...h, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: userId,
      full_name: "E2E Student",
      role: "student",
      level: "B2",
      is_active: true,
    }),
  })
  if (!profileRes.ok) throw new Error(`[seed] profile upsert failed: ${await profileRes.text()}`)

  // 3. Reset prior submissions for this exam, then upsert the published exam.
  await fetch(`${url}/rest/v1/exam_submissions?exam_id=eq.${EXAM_ID}`, { method: "DELETE", headers: h })
  const examRes = await fetch(`${url}/rest/v1/exams`, {
    method: "POST",
    headers: { ...h, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: EXAM_ID,
      title: EXAM_TITLE,
      description: "Seeded interactive exam for the e2e money-path test.",
      level: "B2",
      skill: "grammar",
      exam_type: "interactive",
      is_published: true,
      max_score: 3,
      time_limit_minutes: null,
      questions: QUESTIONS,
      created_by: userId,
    }),
  })
  if (!examRes.ok) throw new Error(`[seed] exam upsert failed: ${await examRes.text()}`)
}
```

- [ ] **Step 2: Wire `globalSetup` to the seed**

Replace `e2e/global-setup.ts` with:
```ts
import { seedDatabase } from "./seed"

export default async function globalSetup() {
  await seedDatabase()
}
```

- [ ] **Step 3: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add e2e/seed.ts e2e/global-setup.ts
git commit -m "test(e2e): seed confirmed student + published interactive exam"
```

> Running the seed end-to-end requires a live local Supabase (Docker) and is exercised by the full test in Task 4 / the CI run in Task 5.

---

### Task 4: Exam money-path spec

The actual end-to-end test. Selectors are taken verbatim from `login/page.tsx`, `exams/page.tsx`, `ExamDetail.tsx`, and `InteractiveExam.tsx`.

**Files:**
- Create: `e2e/exam-money-path.spec.ts`

**Interfaces:**
- Consumes: `STUDENT_EMAIL`, `STUDENT_PASSWORD`, `EXAM_TITLE`, `ANSWERS` from `./seed`.

- [ ] **Step 1: Write the test**

Create `e2e/exam-money-path.spec.ts`:
```ts
import { test, expect } from "@playwright/test"
import { STUDENT_EMAIL, STUDENT_PASSWORD, EXAM_TITLE, ANSWERS } from "./seed"

test("student logs in, takes the interactive exam, and scores 3/3", async ({ page }) => {
  // 1. Log in.
  await page.goto("/login")
  await page.fill("#email", STUDENT_EMAIL)
  await page.fill("#password", STUDENT_PASSWORD)
  await page.getByRole("button", { name: "Entrar" }).click()
  await page.waitForURL("**/dashboard")

  // 2. Open the seeded exam from the list.
  await page.goto("/exams")
  await page.getByText(EXAM_TITLE).click()
  await expect(page.getByRole("heading", { name: EXAM_TITLE })).toBeVisible()

  // 3. Start the attempt.
  await page.getByRole("button", { name: /Empezar examen/ }).click()

  // 4. Answer all three questions with the known-correct values.
  //    MCQ options render as <label> wrapping an sr-only radio + a visible <span>.
  await page.getByText(ANSWERS.q1Correct, { exact: true }).click()
  await page.getByPlaceholder("Escribe tu respuesta…").fill(ANSWERS.q2Correct)
  await page.getByText(ANSWERS.q3Correct, { exact: true }).click()

  // 5. Submit.
  await page.getByRole("button", { name: /Enviar examen/ }).click()

  // 6. Assert the deterministic full-score result.
  await expect(page.getByText("100% — Banda A: Sobresaliente")).toBeVisible()
  await expect(page.getByText("Desglose por pregunta")).toBeVisible()
})
```

- [ ] **Step 2: Run the full suite (requires local Supabase up — Docker)**

Pre-req: `supabase start` is running and the app env points at it (see Task 5 for the exact env). Run:
```bash
npx playwright test
```
Expected: `2 passed` (smoke + money-path). If Docker/local Supabase is unavailable, defer this run to CI (Task 5) and record that in the ledger — do NOT weaken the assertions to make it pass locally.

- [ ] **Step 3: Commit**

```bash
git add e2e/exam-money-path.spec.ts
git commit -m "test(e2e): student interactive-exam money-path happy path"
```

---

### Task 5: CI `e2e` job

Adds a separate, merge-blocking `e2e` job that brings up local Supabase, builds the app, and runs Playwright. Kept apart from the fast `check` job.

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: everything from Tasks 1–4 (`playwright.config.ts`, `e2e/*`, `000_init.sql`, `test:e2e` script).

- [ ] **Step 1: Add the `e2e` job**

In `.github/workflows/ci.yml`, add this job alongside the existing `check` job (same indentation level, under `jobs:`):

```yaml
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-node@v6
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install dependencies
        run: npm ci

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start local Supabase
        run: supabase start

      - name: Export Supabase env
        run: |
          supabase status -o env \
            --override-name api.url=NEXT_PUBLIC_SUPABASE_URL \
            --override-name auth.anon_key=NEXT_PUBLIC_SUPABASE_ANON_KEY \
            --override-name auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY \
            >> "$GITHUB_ENV"
          echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> "$GITHUB_ENV"

      - name: Build app
        run: npm run build

      - name: Install Playwright browser
        run: npx playwright install --with-deps chromium

      - name: Run e2e tests
        run: npm run test:e2e

      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

- [ ] **Step 2: Validate the workflow locally**

Run:
```bash
npx --yes yaml-lint .github/workflows/ci.yml 2>/dev/null || node -e "require('js-yaml')" 2>/dev/null || echo "no local yaml linter; rely on GitHub parse"
```
Expected: no YAML syntax error (or the fallback message). Visually confirm the new `e2e:` job is a sibling of `check:` under `jobs:`.

- [ ] **Step 3: Commit and push to trigger CI**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add e2e job (local supabase + playwright money-path)"
git push -u origin HEAD
```

- [ ] **Step 4: Verify the e2e job is green**

Run:
```bash
gh run watch --exit-status
```
Expected: the `e2e` job completes successfully (`student logs in, takes the interactive exam, and scores 3/3` passes). This is the authoritative integration gate. If it fails, read the uploaded `playwright-report` artifact / job logs and fix forward.

---

## Self-Review

**Spec coverage:**
- Local Supabase in CI → Task 5 (`supabase start`). ✓
- `000_init.sql` schema reproducibility → Task 2. ✓
- `@playwright/test` runner + config → Task 1. ✓
- Seeded confirmed student + published interactive exam (mcq/gap_fill, no AI) → Task 3. ✓
- Money path login → exam → submit → deterministic full score → Task 4. ✓
- Separate, blocking `e2e` job + trace artifact on failure → Task 5. ✓
- No external stubs needed (Upstash/Anthropic/etc. no-op) → encoded in Global Constraints + Task 3 (no open_text). ✓

**Placeholder scan:** No TBD/TODO left in steps; the only deferred items are explicit "verify in CI if no local Docker" notes, which name the authoritative gate (Task 5). The Task 1 `globalSetup` stub is created concretely, then replaced concretely in Task 3.

**Type consistency:** `seedDatabase`, `STUDENT_EMAIL`, `STUDENT_PASSWORD`, `EXAM_TITLE`, `ANSWERS` are defined in Task 3 (`e2e/seed.ts`) and consumed with the same names in Task 4 (`e2e/exam-money-path.spec.ts`). `ANSWERS` shape `{ q1Correct, q2Correct, q3Correct }` matches usage. Result assertion string `"100% — Banda A: Sobresaliente"` matches `InteractiveExam.tsx` (`{percentage}% — Banda {band}: {BAND_LABEL[band]}`) with `getBand(100)="A"` and `BAND_LABEL.A="Sobresaliente"`.

## Known execution risk

The full e2e (Tasks 3–4) and the CI job (Task 5) require Docker. If the dev machine has no Docker, Tasks 1–2 are still locally verifiable; Tasks 3–5 are verified by the CI run on push (Task 5, Step 4). Flag this at execution kickoff so we choose where to run.
