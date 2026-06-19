-- ============================================================
-- 003 — Exam v2 model
-- ============================================================
-- Brings the live DB in line with the application code, which uses:
--   * exams.questions (jsonb), exams.max_score, exams.pdf_url, exams.time_limit_minutes
--   * an `exam_submissions` table (replacing the v1 exam_attempts/exam_answers flow)
-- The v1 exams (pdf_path, time_limit) + exam_attempts/exam_questions/exam_answers
-- tables are left in place (0 rows; harmless). Safe to run on a populated DB:
-- all changes are additive / IF NOT EXISTS.
-- ============================================================

-- ── exams: add v2 columns ──────────────────────────────────
alter table public.exams add column if not exists pdf_url            text;
alter table public.exams add column if not exists time_limit_minutes integer;
alter table public.exams add column if not exists max_score          integer not null default 100;
alter table public.exams add column if not exists questions          jsonb   not null default '[]';

-- Backfill v2 cols from any existing v1 rows (no-op when empty).
update public.exams set pdf_url = pdf_path            where pdf_url is null            and pdf_path  is not null;
update public.exams set time_limit_minutes = time_limit where time_limit_minutes is null and time_limit is not null;


-- ── exam_submissions ───────────────────────────────────────
create table if not exists public.exam_submissions (
  id                     uuid primary key default uuid_generate_v4(),
  exam_id                uuid not null references public.exams(id) on delete cascade,
  student_id             uuid not null references public.profiles(id) on delete cascade,
  answers                jsonb not null default '{}',
  score                  integer,
  band_score             text,
  claude_feedback        jsonb,
  status                 text not null default 'graded',
  teacher_feedback       text,
  teacher_override_score integer,
  submitted_at           timestamptz not null default now(),
  graded_at              timestamptz
);

create index if not exists exam_submissions_exam_idx    on public.exam_submissions (exam_id);
create index if not exists exam_submissions_student_idx on public.exam_submissions (student_id);

alter table public.exam_submissions enable row level security;

-- A student sees their own submissions.
drop policy if exists "exam_submissions_select_own" on public.exam_submissions;
create policy "exam_submissions_select_own" on public.exam_submissions
  for select using (auth.uid() = student_id);

-- Staff see all submissions.
drop policy if exists "exam_submissions_select_admin" on public.exam_submissions;
create policy "exam_submissions_select_admin" on public.exam_submissions
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );

-- A student inserts their own submissions (for a published exam).
drop policy if exists "exam_submissions_insert_own" on public.exam_submissions;
create policy "exam_submissions_insert_own" on public.exam_submissions
  for insert with check (
    auth.uid() = student_id
    and exists (select 1 from public.exams e where e.id = exam_id and e.is_published = true)
  );

-- Staff can grade / override.
drop policy if exists "exam_submissions_update_admin" on public.exam_submissions;
create policy "exam_submissions_update_admin" on public.exam_submissions
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );
