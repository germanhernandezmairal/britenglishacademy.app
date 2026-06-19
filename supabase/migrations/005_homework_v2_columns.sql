-- ============================================================
-- 005 — Homework submissions v2 columns
-- ============================================================
-- The homework feature (submitHomework, updateHomeworkStatus, the student
-- /homework page and admin /admin/homework page) uses a "v2" shape that the
-- live "v1" homework_submissions table never had:
--   file_url (not file_path), file_type, claude_feedback (jsonb),
--   teacher_feedback (not teacher_notes), corrected_file_url, submitted_at.
-- submitHomework inserts file_url but NOT file_path, so the v1 `file_path NOT NULL`
-- constraint blocks every insert — drop that NOT NULL too. Additive / idempotent.
-- ============================================================

alter table public.homework_submissions alter column file_path drop not null;

alter table public.homework_submissions add column if not exists file_url           text;
alter table public.homework_submissions add column if not exists file_type          text;
alter table public.homework_submissions add column if not exists claude_feedback    jsonb;
alter table public.homework_submissions add column if not exists teacher_feedback   text;
alter table public.homework_submissions add column if not exists corrected_file_url text;
alter table public.homework_submissions add column if not exists submitted_at       timestamptz not null default now();
