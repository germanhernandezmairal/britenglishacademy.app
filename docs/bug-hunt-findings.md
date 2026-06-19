# Functional Bug Hunt — Findings

End-to-end functional testing of the authenticated app against the live Supabase
project, using dedicated test users. Approach: hybrid (static skim of each flow's
server action + schema, then browser-driven verification). Fixing as we go.

**Test users** (created via service-role admin API, `email_confirm: true`, no emails sent).
Left in the live DB so we can resume; clean up at the end of the hunt.
- Student: `qa.student@example.com` — id `60714bd7-b8fc-49d5-a325-6176c03aa3e8` — level **B2** (set during onboarding test)
- Admin: `qa.admin@example.com` — id `efbcb150-9675-4192-a514-9b40ca1501e4`
- Password (both): `TestPass123!`
- Provisioning/reset script (idempotent, gitignored, local only): `_setup-test-users.mjs`
- Browser harness (gitignored, local only): `_harness.mjs` (+ `_f1*.mjs` flow runners). Dev server: `npm run dev` → http://localhost:3000

**Severity:** 🔴 blocker · 🟠 major · 🟡 minor · 🔵 polish

> **▶ RESUME HERE (next session):** Flows 1 & 2 ✅ done. Start **Flow 3 (community & messages)**.
> Expect the SAME v1↔v2 schema drift — **probe the live DB first** (`_probe.mjs` pattern) for
> `community_posts`, `post_comments`, `conversations`, `conversation_participants`, `messages`,
> `notifications` before browser-testing. Test content seeded for Flow 2 is still in prod (see Cleanup).

---

## Flow 1 — Auth & onboarding ✅ no bugs

Verified end-to-end:
- Login (correct) → forced onboarding when `level` is null → dashboard. ✓
- Onboarding sets level (B2) + learning goals → dashboard. ✓
- Wrong password → `/login?error=invalid_credentials` with visible error message. ✓
- Logout → home; protected route afterwards bounces to `/login?redirectTo=%2Fdashboard`. ✓
- Dashboard renders correctly (greeting, level card, stat tiles, empty states). 0 console/network errors.

Note (dev-only, not a bug): the Next.js dev-mode "N" indicator overlaps the
"Cerrar sesión" control in the sidebar bottom-left. Cosmetic in dev; gone in prod.

## Flow 2 — Student core (dashboard, lessons, exams, homework)

**List views** — `/lessons`, `/exams`, `/homework`, `/community`, `/messages` all render with
correct headings, polished B2 empty states, 0 browser console/network errors. ✓ (B2 student, no content yet.)

### 🔴 BUG F2-1 — Exam subsystem schema mismatch (entire exam feature broken in prod)

The whole exam feature is built on a **"v2" data model** in app code, but the **live DB is still "v1"**.
There is no migration bridging them (`supabase/migrations/` has only 001, 002).

Probed live DB (service role):
- `exams` has v1 cols `pdf_path`, `time_limit`; **missing** `pdf_url`, `time_limit_minutes`, `max_score`, `questions`.
- `exam_submissions` table **does not exist** (only v1 `exam_attempts`/`exam_questions`/`exam_answers`).
- `exams` and `exam_attempts` both have **0 rows** → no data to migrate, low risk.

App code expecting v2 (would all fail against live DB):
- `app/(app)/exams/page.tsx` — selects `time_limit_minutes, max_score` + reads `exam_submissions`.
- `app/(app)/exams/[id]/page.tsx` — selects `pdf_url, questions, time_limit_minutes, max_score` + `exam_submissions`.
- `app/actions/exams.ts` — `submitInteractiveExam`/`submitPdfExam` read `exams.questions, max_score`, insert into `exam_submissions`.
- `app/actions/admin.ts` `createExam` — inserts `time_limit_minutes, max_score, questions`.
- `app/(app)/dashboard/page.tsx` — still counts the **v1** `exam_attempts` (needs → `exam_submissions`).

**Why the harness missed it:** these are server-side (RSC) Supabase queries; on failure they return
`{ data: null }` and the page silently renders the empty state. The browser sees no console/network
error, so `/exams` looked "fine" (0 issues) while actually being broken. **Harness gap: server-side query
errors are invisible to browser capture.**

**Fix — ✅ APPLIED & VERIFIED:** migration `supabase/migrations/003_exam_v2_model.sql` (ALTER exams add
`pdf_url/time_limit_minutes/max_score/questions` + CREATE `exam_submissions` + RLS) applied to prod via
`psql` (CLI link blocked by non-TTY; used Session-pooler conn string in gitignored `_dburl.txt`, since
deleted). Dashboard `exam_attempts` → `exam_submissions` in `app/(app)/dashboard/page.tsx`. v1 tables left
in place (empty, harmless). Verified end-to-end: seeded published B2 interactive exam now appears on
`/exams`, detail loads, submission scored **3/3 band A** and wrote to `exam_submissions`. (Seed: `_seed.mjs`.)

### ⚠️ SYSTEMIC ROOT CAUSE (read this first)

These are not isolated bugs. A whole **"v2" schema refactor was shipped in the app code but the matching
DB migration was never written/applied.** `supabase/schema.sql` + the live DB are still "v1". So every
feature whose RSC queries reference v2 columns/tables silently breaks (queries return `{data:null}` →
empty state / 404 / failed write), invisibly to the browser harness. Confirmed broken so far: exams,
lessons, homework. **Flow 3 (community_posts / conversations / messages / notifications) is very likely
the same — probe before testing.** Fix pattern: probe live DB → write additive idempotent migration →
apply via psql → re-verify.

### 🔴 BUG F2-2 — Lessons schema mismatch — ✅ FIXED & VERIFIED

Live `lessons` was missing v2 columns `video_source`, `thumbnail_url`, `pdf_resources` → list silently
empty, detail 404. **Fixed:** `004_lessons_v2_columns.sql` applied to prod (3 `add column if not exists`).
Verified: seeded B2 lesson now renders in list + detail, vocabulary shows, **0 issues**.

### 🔴 BUG F2-5 — `homework` storage bucket did not exist — ✅ FIXED & VERIFIED

`GET /storage/v1/bucket` returned `[]` (no buckets) → every homework upload failed. **Fixed:** created a
**private** `homework` bucket via the service-role storage API (`_bucket.mjs`) — 20 MB limit, MIME allowlist
matching `ALLOWED_MIME_TYPES`. Signed-URL reads in `homework/page.tsx` use the admin client (RLS bypass), so
no storage policies needed (see F2-7).

### 🔴 BUG F2-6 — homework_submissions schema mismatch — ✅ FIXED & VERIFIED

Same v1↔v2 drift; the `submitHomework` insert provided `file_url` but not the v1 `file_path NOT NULL` column.
**Fixed:** `005_homework_v2_columns.sql` applied to prod — dropped NOT NULL on `file_path`; added `file_url`,
`file_type`, `claude_feedback` (jsonb), `teacher_feedback`, `corrected_file_url`, `submitted_at`.

### 🔴 BUG F2-7 — `createAdminClient` did not bypass RLS (not actually service-role) — ✅ FIXED & VERIFIED

`lib/supabase/server.ts` built `createAdminClient` with `@supabase/ssr` `createServerClient` **+ the cookie
handler**, so it loaded the caller's session and sent the *user's* JWT as `Authorization`. The service-role
key was only the `apikey` (doesn't set the Postgres role) → requests ran as the authenticated user, RLS
applied. DB admin ops only worked because tables have admin RLS policies; the `homework` bucket has no storage
policies → **every homework upload was denied** ("Error al subir el archivo…"). Latent correctness/security
smell for all admin ops. **Fixed:** `createAdminClient` now uses plain `@supabase/supabase-js` `createClient`
with the service key + `persistSession:false` (no cookies) → true service-role, bypasses RLS. Verified:
homework upload + signed download URL now work end-to-end (`_f2d.mjs`). Typecheck passes.

### 🟠 BUG F2-8 — New homework submission not shown until reload — ✅ FIXED & VERIFIED

Same stale-`useState` pattern as F2-4: `HomeworkView` held `useState(initialSubmissions)` and `UploadForm`
success didn't refresh the list. **Fixed:** `UploadForm` calls `router.refresh()` on success; `HomeworkView`
syncs state from props via `useEffect`. Verified: submission appears without manual reload.

### 🟡 BUG F2-9 — All AI features unavailable (Anthropic key empty → now: account out of credits) — _USER ACTION_

Two-part config issue, NOT a code bug (app degrades gracefully):
1. Initially `ANTHROPIC_API_KEY` was **empty** (length 0) in `.env.local`.
2. User added a valid key (2026-06-19). Direct API test: key **authenticates** but returns
   **400 "Your credit balance is too low… purchase credits"** — the account has $0 balance.

So `analyzeWithClaude` (homework pre-scan), `gradeOpenText`, `gradePdfResponse` still get null/fallback:
homework `claude_feedback` stays null, open-text + pdf_practice exams show "Análisis de IA no disponible".
Auto-graded exams (mcq/gap_fill) unaffected. **To enable AI feedback: add credits at
console.anthropic.com → Plans & Billing** (and ensure the key is set in Vercel too). No code change needed.
**User has decided NOT to add credits for now (2026-06-19)** — AI feedback remains untested/unavailable.

### 🟠 BUG F2-3 — Admin cannot author interactive-exam questions or lesson vocab/PDFs (Flow 4 gap)

Student detail pages render content the admin UI can't create:
- `ExamForm` offers exam_type "Interactivo" but there is **no question editor** and `createExam` hardcodes
  `questions: []` (no exam edit route). → admin-created interactive exams have 0 questions; student sees
  "Enviar examen (0/0)". The interactive exam type is non-functional from the admin side.
- `LessonForm` has no inputs for `vocabulary`, `thumbnail_url`, or `pdf_resources` → those detail-page
  sections are always empty in real usage.
Not a crash; `pdf_practice` exams + basic lessons still work. Revisit properly in Flow 4.

### 🟠 BUG F2-4 — Lesson comment not shown until reload — ✅ FIXED & VERIFIED

`CommentsSection` used `useState(initialComments)`; on **add** it only cleared the textarea and relied on
`revalidatePath`, but client state never updates from new props → the new comment didn't appear until reload
(saved correctly; delete worked because it mutates local state). Users would think it failed → duplicates.
**Fixed:** `addLessonComment` now returns the inserted row (with `author:profiles(...)`); `CommentsSection`
appends it to local state on success. Verified via `_f2c.mjs`: comment now visible without reload.

### Flow 2 — ✅ COMPLETE (student side)
- List views (lessons/exams/homework/community/messages) render, 0 browser errors.
- Exam: list → detail → submit (3/3 band A, persisted to `exam_submissions`).
- Lesson: list → detail, vocabulary renders, completion toggle (persists), comment add (now instant) + delete.
- Homework: upload (.txt) → stored in `homework` bucket → row inserted → list updates (now instant) →
  signed Download URL works. (AI pre-scan skipped — empty key, F2-9.)
- Note (by design, not a bug): exams have no multiple-attempt guard — each submit creates a new
  `exam_submission`; "Reintentar examen" + attempt-history UI support this intentionally.
- 5 bugs fixed (F2-1,2,4,7,8), bucket created (F2-5), 3 migrations applied (003/004/005). Open items for
  later: F2-3 (admin authoring gap → Flow 4), F2-9 (set real `ANTHROPIC_API_KEY` → user/config).

**Still to finish in Flow 2 after F2-2:** lesson completion toggle, lesson comment add/delete, homework
submit (file upload + Claude pre-scan), exam re-submission behavior (no guard against multiple attempts —
likely by design, confirm). Seeded test content: lesson `81d33d27-a17b-4c16-a8f2-c2c6a7e080f9`,
exam `d2d8f786-9723-4857-b9d8-49acaf50f083` (both `[QA]`-prefixed, B2, published → delete at cleanup).

## Flow 3 — Community & messages

_(pending)_

## Flow 4 — Admin panels

_(pending)_

---

## Fixed

_(none yet)_

## Cleanup checklist

- [ ] Delete test users (`qa.student@example.com`, `qa.admin@example.com`)
- [ ] Delete seeded `[QA]` content: lesson `81d33d27-a17b-4c16-a8f2-c2c6a7e080f9`, exam `d2d8f786-9723-4857-b9d8-49acaf50f083`
- [ ] Delete test `exam_submissions` for the QA exam (several, from `_f2b.mjs` runs)
- [ ] Delete test `homework_submissions` titled `QA Homework …` (several, from `_f2d.mjs` runs) + their files in the `homework` bucket under `60714bd7-…/`
- [ ] Any other test rows created (posts, messages, conversations, lesson_completions)
- [ ] Keep the `homework` storage bucket (real feature dependency — do NOT delete)
- [ ] (Optional) drop orphaned v1 exam tables `exam_attempts`/`exam_questions`/`exam_answers` once v2 proven
