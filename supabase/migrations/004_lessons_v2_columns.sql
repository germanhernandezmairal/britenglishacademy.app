-- ============================================================
-- 004 — Lessons v2 columns
-- ============================================================
-- The student lessons list (app/(app)/lessons/page.tsx) and detail
-- (app/(app)/lessons/[id]/page.tsx) select columns that never existed
-- in the live DB: video_source, thumbnail_url, pdf_resources. Those
-- selects fail, so the list silently shows the empty state and the
-- detail page 404s. Add the missing columns. Additive / idempotent.
-- ============================================================

alter table public.lessons add column if not exists video_source  text  not null default 'youtube';
alter table public.lessons add column if not exists thumbnail_url  text;
alter table public.lessons add column if not exists pdf_resources  jsonb not null default '[]';
