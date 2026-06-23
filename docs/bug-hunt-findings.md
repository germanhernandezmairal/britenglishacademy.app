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

> **▶ RESUME HERE (next session):** Flows 1, 2, 3 ✅ done (Flow 3: F3-1 + F3-3 fixed & verified). Start
> **Flow 4 (admin panels)** — and address the deferred items: **F2-3** (admin can't author interactive-exam
> questions / lesson vocab+PDFs) and **F3-2** (admin onboarding-gate for staff with no level). Flow 3 schema
> was NOT drifted (unlike Flow 2). Test content seeded for Flow 2 still in prod (see Cleanup).

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

**Schema is NOT drifted here (unlike Flow 2).** Probed the live DB (service role): every v2 table/column
the app uses already exists in prod — `posts`, `post_reactions`, `post_comments`, `conversations`,
`conversation_participants`, `messages`, `push_subscriptions`, `notifications`, `profiles.is_active`. The
orphaned v1 `community_posts` also still exists (0 rows). All Flow-3 tables are empty (clean slate). Probed
the RLS-exposed community path as a **student token**: insert+read of `posts`/`post_reactions`/`post_comments`
all succeed. (Repro gap, not a prod bug: there's no committed migration for `posts`/`post_reactions` and
`schema.sql` still defines the v1 `community_posts` — a fresh deploy from `schema.sql` would be wrong.)

**Verified working (browser, student + admin):**
- Community: create post (instant + persisted), 🔥 reaction (optimistic, count updates), comment (instant),
  delete post — 0 console/network errors.
- Messages direct: search user → create conversation → send → other user sees it in inbox + thread → reply.
  Message persists on reload. (Realtime push verified indirectly; full two-client realtime re-test pending.)
- Messages broadcast: admin broadcasts to level B2 → B2 student sees it in inbox → opens thread → message
  renders → input is correctly **read-only** for the student ("solo lectura para estudiantes").

### 🔴 BUG F3-1 — `/community` returns 500 for students whenever a post by another user exists (author RLS + unguarded deref) — ✅ FIXED & VERIFIED

**The community feed was fundamentally broken for students in any real multi-user state.**

Root cause (two layers, both confirmed against the **live** DB):
1. **`profiles` RLS** (`schema.sql:45-54`) has only `profiles_select_own` (`auth.uid() = id`) and
   `profiles_select_admin` (admin/teacher reads all). **No policy lets a student read another user's profile.**
   Probe as student token: `GET /profiles?id=eq.<admin>` → **0 rows**.
2. `app/(app)/community/page.tsx` builds the feed on the **RLS-bound** client and embeds
   `author:profiles(...)`. For any post authored by someone other than the viewing student, the embed is a
   left join → **`author: null`**. `PostCard` then does `post.author.id` (line ~242, also `.full_name`,
   `.level`) with **no null guard** → `Cannot read properties of null (reading 'id')` → the entire
   `/community` RSC throws → **HTTP 500**. A student can only see their *own* posts without crashing; the
   first admin announcement / weekly challenge / other student's post locks every student out of community.

`post_comments` authors come from the same RLS-hidden source, but `CommentRow` already null-guards
(`comment.author?.full_name ?? "Usuario"`), so comments degrade gracefully instead of crashing. Messages
avoids the whole problem by fetching other users' profiles via `createAdminClient` (service role).

**Why the earlier browser runs masked it:** Flow-3 tables start empty; the first student run only ever had
the student's *own* post in the feed (author = self = readable), so it rendered fine. The crash only appears
once a *second* author's post exists — caught by injecting an admin announcement (`_f3e.mjs`):
`HTTP 500 GET /community` + `pageerror: Cannot read properties of null (reading 'id')`.

**Fix (Option A — user's choice): keep RLS strict, fetch authors via the service-role admin client**
(exactly how the messages pages already resolve other users' profiles). `app/(app)/community/page.tsx` now
selects `author_id` (no `author:profiles(...)` embed) on the RLS client, then one `createAdminClient()`
`.in("id", authorIds)` query loads every post + comment author into a map; `authorFor(id)` attaches them with
a `"Usuario"` fallback so a deleted/unknown author can never 500 the page. Defensive `post.author?.id` guards
added in `PostCard.tsx` and `CommunityFeed.tsx`. **Verified:** `_f3e.mjs` — student now loads `/community`
with an admin announcement present (HTTP 200, author shows as "QA Admin · C2", 0 console/network errors);
`_f3a.mjs` regression — student post/react/comment/delete all still work. Typecheck clean. No RLS/DB change.

### 🟠 BUG F3-3 — Realtime live chat did not deliver (messages only appeared on reload) — ✅ FIXED & VERIFIED

`ConversationView` subscribes to `postgres_changes` (INSERT on `messages`, filtered by `conversation_id`) for
live chat, but in the live app a subscribed client received **no** events; messages only appeared on reload.

**Diagnosis (ruled out the obvious culprits):**
- DB publication is **correct** — `psql` against the live DB: `supabase_realtime` exists and already contains
  both `public.messages` and `public.conversations`. (So the originally-suspected publication migration was a
  red herring — no DDL needed.)
- Data path + RLS are fine — `_f3f.mjs`: an inserted admin message persists and the student sees it on reload.
- **Node realtime probe (`_rt.mjs`) was decisive:** subscribing to the same channel **with the student JWT
  (`realtime.setAuth(jwt)`) DID receive the INSERT event** (`received: true`); the browser did not. Realtime
  `postgres_changes` is **RLS-filtered**, so the socket must be authenticated as the user or the server drops
  every event.

**Root cause (code):** `ConversationView` created a fresh `createClient()` (`@supabase/ssr` browser client) in
`useEffect` and `.subscribe()`d **synchronously**, before the client finished recovering its session and
pushed the access token to the realtime socket → the channel joined as `anon` → RLS filtered out all message
events.

**Fix:** in the realtime `useEffect`, `await supabase.auth.getSession()` and `supabase.realtime.setAuth(token)`
**before** `.subscribe()` (guarded with a `cancelled` flag for cleanup). Also: the incoming-sender profile
fetch uses the RLS client (a student can't read another user's profile), so it now uses `.maybeSingle()` (no
406) and falls back to the known `otherUser` for direct conversations; the correct name otherwise resolves on
reload (server fetches sender profiles via the admin client). **Verified (`_f3f.mjs`): student now receives the
message live with no reload, 0 console/network errors.** Typecheck clean. No DB/RLS change.

### 🟡 BUG F3-2 — Admins/teachers with no CEFR level are forced through student onboarding to reach any app page (incl. /admin)

`app/(app)/layout.tsx:27` gates **every** `/(app)` route behind `if (!profile.level) redirect("/onboarding")`
with no role exemption. A freshly-provisioned admin/teacher (level null — as our QA admin was, and as manual
DB promotion typically leaves them) is bounced into the student-framed CEFR onboarding ("¿Cuál es tu nivel de
inglés? Esto nos ayuda a personalizar tu experiencia") and cannot reach `/admin` until they pick a learner
level. Self-resolves once any level is set (worked around in testing by setting QA admin → C2 via service
role). Low impact / arguably by-design, but staff shouldn't have to declare a CEFR level. Revisit in Flow 4.

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
- [x] Leftover QA community posts (`QA …` / `[QA …]`) — deleted 2026-06-23
- [ ] Flow 3 test conversations/messages: 1 direct conv (QA student ↔ QA admin) + 1 broadcast to B2, from `_f3b/_f3c`
- [ ] QA admin `level` was set to C2 (was null) to pass the onboarding gate for testing — reset to null if real admins should have no level (see F3-2)
- [ ] Any other test rows created (messages, conversations, lesson_completions)
- [ ] Keep the `homework` storage bucket (real feature dependency — do NOT delete)
- [ ] (Optional) drop orphaned v1 exam tables `exam_attempts`/`exam_questions`/`exam_answers` once v2 proven
