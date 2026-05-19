-- ============================================================
-- Migration 002: Fix lesson_resources RLS (security audit)
-- The previous policy allowed any logged-in user to query
-- lesson_resources for any lesson that existed, including
-- unpublished ones and those above the student's level.
-- This migration aligns it with lessons_select_student.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

drop policy if exists "lesson_resources_select" on public.lesson_resources;

create policy "lesson_resources_select" on public.lesson_resources
  for select using (
    exists (
      select 1
      from public.lessons l
      join public.profiles p on p.id = auth.uid()
      where l.id = lesson_id
        and l.is_published = true
        and p.is_active = true
        and (
          p.role in ('admin', 'teacher')
          or (
            p.level is not null
            and (
              (p.level = 'A1' and l.level = 'A1') or
              (p.level = 'A2' and l.level in ('A1', 'A2')) or
              (p.level = 'B1' and l.level in ('A1', 'A2', 'B1')) or
              (p.level = 'B2' and l.level in ('A1', 'A2', 'B1', 'B2')) or
              (p.level = 'C1' and l.level in ('A1', 'A2', 'B1', 'B2', 'C1')) or
              (p.level = 'C2')
            )
          )
        )
    )
  );
