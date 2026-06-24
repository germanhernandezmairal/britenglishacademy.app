# Admin Authoring (Flow 4 / F2-3) — Design

**Date:** 2026-06-24
**Status:** Approved (design); pending spec review
**Context:** Functional bug-hunt Flow 4 (admin panels). Closes the long-deferred
**F2-3** gap. F3-2 (staff onboarding gate) was already fixed in `app/(app)/layout.tsx`
in this session and is out of scope here.

## Problem

The admin panels can create exams and lessons, but cannot author the **content**
that the student-facing pages render:

- `createExam` always writes `questions: []` and the form has no question editor
  and no PDF field. Every admin-created interactive exam has 0 questions; every
  PDF exam has no PDF. The exam feature is unusable for admin-authored content.
- `LessonForm` / `createLesson` / `updateLesson` only handle
  title/description/level/video_url/order/published. There is no editor for
  `vocabulary` or `pdf_resources`, both of which the student lesson page renders.

The live DB already has every required column (`exams.questions`, `exams.pdf_url`,
`lessons.vocabulary`, `lessons.pdf_resources`, etc.) — verified by probe on
2026-06-24. **No schema drift, no migration needed.** This is purely an
authoring-UI gap plus one storage bucket.

## What already exists (do NOT rebuild)

The entire student-side grading flow is complete and was verified in Flow 2:

- `app/actions/exams.ts` → `submitInteractiveExam` auto-grades `mcq` (exact match)
  and `gap_fill` (case-insensitive match), and AI-grades `open_text` via
  `gradeOpenText`. `submitPdfExam` AI-grades the essay via `gradePdfResponse`.
  Both use `@anthropic-ai/sdk`, model `claude-sonnet-4-6`, with a graceful
  fallback when `ANTHROPIC_API_KEY` is missing/unfunded.
- Student components `ExamDetail` / `InteractiveExam` / `PdfExam` and the lesson
  detail page already consume the JSON shapes below.

**Therefore there is no grading code to write.** "Test AI grading end-to-end"
means: after Anthropic credits are added, author an open-text exam through the
new editor and take it as the QA student.

## Fixed data shapes (dictated by the consumers — match exactly)

```ts
// Exam question (app/actions/exams.ts, ExamDetail.tsx)
type Question = {
  id: string                                   // uuid generated client-side
  type: "mcq" | "gap_fill" | "open_text"
  question: string
  options?: string[]                            // mcq only
  correct_answer?: string                       // mcq + gap_fill; omitted for open_text
  max_score: number
}

// Lesson vocabulary (app/(app)/lessons/[id]/page.tsx)
type VocabItem = { word: string; definition: string; example?: string }

// Lesson / exam PDF resource (lesson page renders <a href={url}>)
type PdfResource = { name: string; url: string; size?: number }
```

`exam.pdf_url` is a single public URL string. The student PDF exam opens it via
`<a href={pdf_url} target="_blank">` with **no signing**, so it must be publicly
readable.

## Work area 1 — Storage bucket `resources` (public)

- Create a **public** Supabase storage bucket named `resources` via a one-off
  service-role script (same pattern as `_bucket.mjs` for `homework`, but public).
- Add a `uploadResource` server action (`app/actions/uploads.ts`, service-role
  client, staff-only) that:
  - accepts a `File` + a path prefix (`exam-pdfs/` or `lesson-pdfs/`),
  - uploads to `resources`,
  - returns `{ url, name, size }` using the bucket's public URL.
- Accepted types: `application/pdf` (+ size cap, e.g. 20 MB). Reject others.
- Bucket is **kept** (real feature dependency), like `homework`.

## Work area 2 — Exam authoring

### Components
- **`QuestionEditor`** (`admin/exams/_components/QuestionEditor.tsx`, client):
  manages `Question[]` in React state. Per question card:
  - type select (`mcq` / `gap_fill` / `open_text`)
  - question prompt (textarea)
  - points (number, min 1)
  - `mcq` → editable options list (add/remove, min 2) + a correct-answer picker
    (radio bound to one option)
  - `gap_fill` → correct-answer text input
  - `open_text` → no extra fields
  - add / remove / reorder (move up/down) questions
  - Serializes to a hidden input (`questions` = JSON string) so it submits with
    the existing `FormData` flow.
- **`PdfUploadField`** (reused for exam PDF + lesson PDFs): file input → calls
  `uploadResource` → shows uploaded file name + a remove control; stores the
  resulting URL in a hidden input.

### Form behavior (`ExamForm`)
- When `exam_type === "interactive"`: show `QuestionEditor`, hide PDF upload.
  `max_score` is **derived = sum of question `max_score`** (manual field removed
  for this type; show the computed total read-only).
- When `exam_type === "pdf_practice"`: show `PdfUploadField` (→ `pdf_url`), hide
  `QuestionEditor`. Keep the manual `max_score` field.
- The type select drives this toggle live.

### Server actions (`app/actions/admin.ts`)
- `createExam`: parse `questions` (JSON) and `pdf_url` from `FormData`. For
  interactive, compute `max_score` from questions and write `questions`. For PDF,
  write `pdf_url` and the manual `max_score` (and `questions: []`).
- **`updateExam(examId, formData)`** (new): same parsing, updates the row.

### Validation
- Interactive: ≥1 question; each `mcq` ≥2 options and a `correct_answer` that is
  one of its options; each `gap_fill` a non-empty `correct_answer`; every
  question prompt non-empty and `max_score ≥ 1`.
- PDF: a `pdf_url` is required (uploaded file).
- Reuse the existing title/level/skill/exam_type validation.
- Validate on both client (UX) and server (authoritative).

### New route
- **`admin/exams/[id]/edit/page.tsx`** — loads the exam (incl. `questions`,
  `pdf_url`, `max_score`) via the admin client and renders `ExamForm` in edit
  mode (mirrors the existing lesson edit page).
- Add an **edit link** to `ExamRow` (pencil icon → the edit route).

## Work area 3 — Lesson authoring

### Components
- **`VocabularyEditor`** (`admin/lessons/_components/VocabularyEditor.tsx`,
  client): repeater of `{ word, definition, example? }`; add / remove / reorder;
  serializes to a hidden `vocabulary` JSON input.
- Reuse **`PdfUploadField`** (multi-file) for `pdf_resources`; each upload →
  `{ name, url, size }`; serializes to a hidden `pdf_resources` JSON input.

### Form behavior (`LessonForm`)
- Add a Vocabulary section and a PDF-resources section below the existing fields.
- Video stays a single YouTube URL field (unchanged). `video_source` keeps its
  default `'youtube'`; no thumbnail / no video upload (out of scope).

### Server actions (`app/actions/admin.ts`)
- `createLesson` / `updateLesson`: parse and write `vocabulary` and
  `pdf_resources` JSON (validate they are arrays of the right shape; default to
  `[]`).

### Edit route
- `admin/lessons/[id]/edit/page.tsx` and the edit-page query must additionally
  load `vocabulary` and `pdf_resources` and pass them to `LessonForm`, so the
  editor is pre-populated (currently it only loads the basic fields).

## Out of scope

- Any DB migration (live DB already has all columns).
- Grading logic (already built and verified).
- Video-file upload, thumbnails, `video_source` toggle.
- F3-2 (already fixed this session).
- AI-grading verification itself (blocked on Anthropic credits; done after).

## Testing / verification

Following the established Approach C (static + browser-driven against live
Supabase, QA admin/student users):

1. **Typecheck** clean (`npm run build` / `tsc`).
2. As **QA admin**: create an **interactive** exam with one mcq + one gap_fill +
   one open_text; verify `questions` JSON + derived `max_score` persisted (probe).
3. As **QA admin**: create a **PDF** exam, upload a PDF; verify public `pdf_url`
   opens.
4. As **QA admin**: edit an existing exam (the QA exam) to add questions; verify.
5. As **QA admin**: create/edit a lesson with vocabulary + a PDF resource; verify
   JSON persisted and the PDF is publicly downloadable.
6. As **QA student** (matching level, published content): take the interactive
   exam → MCQ/gap-fill auto-score correct; take the PDF exam → essay submits.
7. **After credits added:** confirm the open_text/PDF AI feedback returns real
   content (not the "Análisis de IA no disponible" fallback).
8. Add all new test rows/files to the bug-hunt cleanup checklist.

## File touch list

- New: `app/actions/uploads.ts`, `admin/exams/_components/QuestionEditor.tsx`,
  `admin/exams/_components/PdfUploadField.tsx` (shared),
  `admin/lessons/_components/VocabularyEditor.tsx`,
  `admin/exams/[id]/edit/page.tsx`, a `_resources_bucket.mjs` scratch script.
- Edit: `app/actions/admin.ts` (createExam, +updateExam, createLesson,
  updateLesson), `ExamForm.tsx`, `LessonForm.tsx`, `ExamRow.tsx`,
  `admin/lessons/[id]/edit/page.tsx`.
