-- ============================================================
-- Brit English School — Supabase Schema + RLS Policies
-- ============================================================
-- Run this in the Supabase SQL editor (dashboard → SQL editor)
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


-- ─────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────

create type user_role as enum ('admin', 'teacher', 'student');
create type cefr_level as enum ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
create type homework_status as enum ('pending', 'under_review', 'corrected');
create type exam_type as enum ('pdf_practice', 'interactive');
create type question_type as enum ('multiple_choice', 'gap_fill', 'open_text');
create type message_type as enum ('direct', 'group_broadcast');
create type post_type as enum ('student_post', 'weekly_challenge', 'announcement');


-- ─────────────────────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────────────────────

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null default 'student',
  full_name     text not null,
  avatar_url    text,
  level         cefr_level,
  learning_goals text,
  login_streak  integer not null default 0,
  last_login_at timestamptz,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_select_admin" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_update_admin" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────
-- LESSONS
-- ─────────────────────────────────────────────────────────────

create table public.lessons (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  description   text,
  level         cefr_level not null,
  video_url     text,
  video_storage_path text,
  vocabulary    jsonb default '[]',
  order_index   integer not null default 0,
  is_published  boolean not null default false,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.lessons enable row level security;

create policy "lessons_select_student" on public.lessons
  for select using (
    is_published = true
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.is_active = true
        and (
          p.role in ('admin', 'teacher')
          or (
            p.level is not null
            and (
              (p.level = 'A1' and level = 'A1') or
              (p.level = 'A2' and level in ('A1', 'A2')) or
              (p.level = 'B1' and level in ('A1', 'A2', 'B1')) or
              (p.level = 'B2' and level in ('A1', 'A2', 'B1', 'B2')) or
              (p.level = 'C1' and level in ('A1', 'A2', 'B1', 'B2', 'C1')) or
              (p.level = 'C2')
            )
          )
        )
    )
  );

create policy "lessons_all_admin" on public.lessons
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );


-- ─────────────────────────────────────────────────────────────
-- LESSON RESOURCES (PDFs)
-- ─────────────────────────────────────────────────────────────

create table public.lesson_resources (
  id            uuid primary key default uuid_generate_v4(),
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  file_name     text not null,
  storage_path  text not null,
  file_size     bigint,
  created_at    timestamptz not null default now()
);

alter table public.lesson_resources enable row level security;

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

create policy "lesson_resources_admin" on public.lesson_resources
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );


-- ─────────────────────────────────────────────────────────────
-- LESSON COMPLETIONS
-- ─────────────────────────────────────────────────────────────

create table public.lesson_completions (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references public.profiles(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  unique (student_id, lesson_id)
);

alter table public.lesson_completions enable row level security;

create policy "completions_select_own" on public.lesson_completions
  for select using (auth.uid() = student_id);

create policy "completions_select_admin" on public.lesson_completions
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );

create policy "completions_insert_own" on public.lesson_completions
  for insert with check (auth.uid() = student_id);

create policy "completions_delete_own" on public.lesson_completions
  for delete using (auth.uid() = student_id);


-- ─────────────────────────────────────────────────────────────
-- LESSON COMMENTS
-- ─────────────────────────────────────────────────────────────

create table public.lesson_comments (
  id            uuid primary key default uuid_generate_v4(),
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  author_id     uuid not null references public.profiles(id) on delete cascade,
  content       text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.lesson_comments enable row level security;

create policy "lesson_comments_select" on public.lesson_comments
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_active = true
    )
  );

create policy "lesson_comments_insert" on public.lesson_comments
  for insert with check (auth.uid() = author_id);

create policy "lesson_comments_update_own" on public.lesson_comments
  for update using (auth.uid() = author_id);

create policy "lesson_comments_delete_own" on public.lesson_comments
  for delete using (
    auth.uid() = author_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );


-- ─────────────────────────────────────────────────────────────
-- HOMEWORK SUBMISSIONS
-- ─────────────────────────────────────────────────────────────

create table public.homework_submissions (
  id                    uuid primary key default uuid_generate_v4(),
  student_id            uuid not null references public.profiles(id) on delete cascade,
  title                 text not null,
  description           text,
  file_path             text not null,
  file_name             text not null,
  file_size             bigint,
  status                homework_status not null default 'pending',
  ai_feedback           text,
  ai_grammar_report     jsonb,
  teacher_notes         text,
  corrected_file_path   text,
  corrected_file_name   text,
  reviewed_by           uuid references public.profiles(id) on delete set null,
  reviewed_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.homework_submissions enable row level security;

create policy "homework_select_own" on public.homework_submissions
  for select using (auth.uid() = student_id);

create policy "homework_select_admin" on public.homework_submissions
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );

create policy "homework_insert_own" on public.homework_submissions
  for insert with check (auth.uid() = student_id);

create policy "homework_update_own" on public.homework_submissions
  for update using (auth.uid() = student_id)
  with check (
    status = 'pending'
  );

create policy "homework_update_admin" on public.homework_submissions
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );


-- ─────────────────────────────────────────────────────────────
-- EXAMS
-- ─────────────────────────────────────────────────────────────

create table public.exams (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  description   text,
  level         cefr_level not null,
  skill         text,  -- 'reading', 'writing', 'listening', 'speaking_prep'
  exam_type     exam_type not null default 'pdf_practice',
  pdf_path      text,
  time_limit    integer,  -- minutes, null = no limit
  is_published  boolean not null default false,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.exams enable row level security;

create policy "exams_select_student" on public.exams
  for select using (
    is_published = true
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_active = true
    )
  );

create policy "exams_all_admin" on public.exams
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );


-- ─────────────────────────────────────────────────────────────
-- EXAM QUESTIONS
-- ─────────────────────────────────────────────────────────────

create table public.exam_questions (
  id              uuid primary key default uuid_generate_v4(),
  exam_id         uuid not null references public.exams(id) on delete cascade,
  question_type   question_type not null,
  prompt          text not null,
  options         jsonb default '[]',  -- for multiple_choice
  correct_answer  text,               -- for multiple_choice and gap_fill
  points          integer not null default 1,
  order_index     integer not null default 0,
  created_at      timestamptz not null default now()
);

alter table public.exam_questions enable row level security;

create policy "questions_select_student" on public.exam_questions
  for select using (
    exists (
      select 1 from public.exams e
      where e.id = exam_id and e.is_published = true
    )
  );

create policy "questions_all_admin" on public.exam_questions
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );


-- ─────────────────────────────────────────────────────────────
-- EXAM ATTEMPTS
-- ─────────────────────────────────────────────────────────────

create table public.exam_attempts (
  id                  uuid primary key default uuid_generate_v4(),
  exam_id             uuid not null references public.exams(id) on delete cascade,
  student_id          uuid not null references public.profiles(id) on delete cascade,
  started_at          timestamptz not null default now(),
  submitted_at        timestamptz,
  auto_score          integer,        -- 0-100
  ai_score            integer,        -- Claude's grade
  final_score         integer,        -- teacher override or final
  ai_feedback         text,           -- Claude's full feedback
  ai_corrections      jsonb,          -- detailed error breakdown
  teacher_override    integer,
  teacher_notes       text,
  overridden_by       uuid references public.profiles(id) on delete set null,
  overridden_at       timestamptz
);

alter table public.exam_attempts enable row level security;

create policy "attempts_select_own" on public.exam_attempts
  for select using (auth.uid() = student_id);

create policy "attempts_select_admin" on public.exam_attempts
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );

create policy "attempts_insert_own" on public.exam_attempts
  for insert with check (auth.uid() = student_id);

create policy "attempts_update_own" on public.exam_attempts
  for update using (auth.uid() = student_id)
  with check (submitted_at is null);

create policy "attempts_update_admin" on public.exam_attempts
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );


-- ─────────────────────────────────────────────────────────────
-- EXAM ANSWERS
-- ─────────────────────────────────────────────────────────────

create table public.exam_answers (
  id            uuid primary key default uuid_generate_v4(),
  attempt_id    uuid not null references public.exam_attempts(id) on delete cascade,
  question_id   uuid not null references public.exam_questions(id) on delete cascade,
  answer_text   text,
  is_correct    boolean,
  points_earned integer default 0,
  created_at    timestamptz not null default now(),
  unique (attempt_id, question_id)
);

alter table public.exam_answers enable row level security;

create policy "answers_select_own" on public.exam_answers
  for select using (
    exists (
      select 1 from public.exam_attempts a
      where a.id = attempt_id and a.student_id = auth.uid()
    )
  );

create policy "answers_select_admin" on public.exam_answers
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );

create policy "answers_insert_own" on public.exam_answers
  for insert with check (
    exists (
      select 1 from public.exam_attempts a
      where a.id = attempt_id and a.student_id = auth.uid() and a.submitted_at is null
    )
  );


-- ─────────────────────────────────────────────────────────────
-- COMMUNITY POSTS (feed + announcements + weekly challenges)
-- ─────────────────────────────────────────────────────────────

create table public.community_posts (
  id            uuid primary key default uuid_generate_v4(),
  author_id     uuid not null references public.profiles(id) on delete cascade,
  post_type     post_type not null default 'student_post',
  title         text,
  content       text not null,
  image_url     text,
  is_pinned     boolean not null default false,
  reactions     jsonb not null default '{}',  -- { "👍": 5, "🎉": 2 }
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.community_posts enable row level security;

create policy "posts_select" on public.community_posts
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_active = true
    )
  );

create policy "posts_insert_student" on public.community_posts
  for insert with check (
    auth.uid() = author_id
    and (
      post_type = 'student_post'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('admin', 'teacher')
      )
    )
  );

create policy "posts_update_own" on public.community_posts
  for update using (auth.uid() = author_id);

create policy "posts_update_admin" on public.community_posts
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );

create policy "posts_delete_admin" on public.community_posts
  for delete using (
    auth.uid() = author_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );


-- ─────────────────────────────────────────────────────────────
-- POST COMMENTS
-- ─────────────────────────────────────────────────────────────

create table public.post_comments (
  id            uuid primary key default uuid_generate_v4(),
  post_id       uuid not null references public.community_posts(id) on delete cascade,
  author_id     uuid not null references public.profiles(id) on delete cascade,
  parent_id     uuid references public.post_comments(id) on delete cascade,  -- threaded
  content       text not null,
  reactions     jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.post_comments enable row level security;

create policy "post_comments_select" on public.post_comments
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_active = true
    )
  );

create policy "post_comments_insert" on public.post_comments
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.community_posts cp
      where cp.id = post_id and cp.post_type != 'announcement'
    )
  );

create policy "post_comments_update_own" on public.post_comments
  for update using (auth.uid() = author_id);

create policy "post_comments_delete" on public.post_comments
  for delete using (
    auth.uid() = author_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );


-- ─────────────────────────────────────────────────────────────
-- MESSAGES (direct + group broadcast)
-- ─────────────────────────────────────────────────────────────

create table public.conversations (
  id            uuid primary key default uuid_generate_v4(),
  message_type  message_type not null default 'direct',
  target_level  cefr_level,  -- for group_broadcast
  created_by    uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  last_read_at    timestamptz,
  primary key (conversation_id, profile_id)
);

create table public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  content         text,
  file_path       text,
  file_name       text,
  is_read         boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

create policy "conversations_select" on public.conversations
  for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = id and cp.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );

create policy "conversations_insert" on public.conversations
  for insert with check (auth.uid() = created_by);

create policy "participants_select" on public.conversation_participants
  for select using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );

create policy "participants_insert" on public.conversation_participants
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.created_by = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );

create policy "participants_update_own" on public.conversation_participants
  for update using (profile_id = auth.uid());

create policy "messages_select" on public.messages
  for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.profile_id = auth.uid()
    )
  );

create policy "messages_insert" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.profile_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────
-- BLOG POSTS (CMS for public website)
-- ─────────────────────────────────────────────────────────────

create table public.blog_posts (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  title         text not null,
  excerpt       text,
  content       text not null,
  cover_image   text,
  author_id     uuid references public.profiles(id) on delete set null,
  is_published  boolean not null default false,
  published_at  timestamptz,
  tags          text[] default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

create policy "blog_select_public" on public.blog_posts
  for select using (is_published = true);

create policy "blog_select_admin" on public.blog_posts
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );

create policy "blog_all_admin" on public.blog_posts
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );


-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────

create table public.notifications (
  id            uuid primary key default uuid_generate_v4(),
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  body          text not null,
  link          text,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = recipient_id);

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = recipient_id);

create policy "notifications_insert_admin" on public.notifications
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );


-- ─────────────────────────────────────────────────────────────
-- STORAGE BUCKETS (run separately in Supabase dashboard)
-- ─────────────────────────────────────────────────────────────
-- Create these buckets in Supabase Storage:
--   • lesson-videos   (private, max 500MB per file)
--   • lesson-pdfs     (private, max 50MB per file)
--   • homework        (private, max 20MB per file)
--   • exam-pdfs       (private, max 50MB per file)
--   • avatars         (public,  max 5MB per file)
--   • post-images     (public,  max 10MB per file)
--   • chat-files      (private, max 20MB per file)


-- ─────────────────────────────────────────────────────────────
-- TRIGGERS — updated_at auto-update
-- ─────────────────────────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger lessons_updated_at before update on public.lessons
  for each row execute function public.handle_updated_at();

create trigger homework_updated_at before update on public.homework_submissions
  for each row execute function public.handle_updated_at();

create trigger exams_updated_at before update on public.exams
  for each row execute function public.handle_updated_at();

create trigger posts_updated_at before update on public.community_posts
  for each row execute function public.handle_updated_at();

create trigger post_comments_updated_at before update on public.post_comments
  for each row execute function public.handle_updated_at();

create trigger blog_updated_at before update on public.blog_posts
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────
-- TRIGGER — auto-create profile on signup
-- ─────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
