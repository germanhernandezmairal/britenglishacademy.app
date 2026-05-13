-- ============================================================
-- Migration 001 — Messaging tables
-- Run in: Supabase Dashboard → SQL Editor → New query
-- Safe to run on a fresh DB or if the old messaging tables exist.
-- ============================================================

-- Drop old tables if they were created with the wrong column names
drop table if exists public.messages                  cascade;
drop table if exists public.conversation_participants cascade;
drop table if exists public.conversations             cascade;

-- Drop old enum if present
drop type if exists public.message_type cascade;

-- ─────────────────────────────────────────────────────────────
-- CREATE ALL THREE TABLES FIRST (policies come after)
-- ─────────────────────────────────────────────────────────────

create table public.conversations (
  id           uuid        primary key default uuid_generate_v4(),
  type         text        not null default 'direct' check (type in ('direct', 'broadcast')),
  subject      text,
  level_filter text,
  created_by   uuid        not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  user_id         uuid        not null references public.profiles(id)       on delete cascade,
  last_read_at    timestamptz,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id              uuid        primary key default uuid_generate_v4(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  sender_id       uuid        not null references public.profiles(id)      on delete cascade,
  content         text,
  created_at      timestamptz not null default now()
);

create index messages_conversation_idx
  on public.messages(conversation_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- ENABLE RLS
-- ─────────────────────────────────────────────────────────────

alter table public.conversations             enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages                  enable row level security;

-- ─────────────────────────────────────────────────────────────
-- RLS POLICIES — conversations
-- ─────────────────────────────────────────────────────────────

create policy "conversations_select" on public.conversations
  for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = id and cp.user_id = auth.uid()
    )
    or (
      type = 'broadcast'
      and (
        level_filter = (select level::text from public.profiles where id = auth.uid())
        or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','teacher'))
      )
    )
  );

create policy "conversations_insert" on public.conversations
  for insert with check (auth.uid() = created_by);

create policy "conversations_update" on public.conversations
  for update using (
    created_by = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','teacher'))
  );

-- ─────────────────────────────────────────────────────────────
-- RLS POLICIES — conversation_participants
-- ─────────────────────────────────────────────────────────────

create policy "participants_select" on public.conversation_participants
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','teacher'))
  );

create policy "participants_insert" on public.conversation_participants
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.created_by = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','teacher'))
  );

create policy "participants_update" on public.conversation_participants
  for update using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','teacher'))
  );

-- ─────────────────────────────────────────────────────────────
-- RLS POLICIES — messages
-- ─────────────────────────────────────────────────────────────

create policy "messages_select" on public.messages
  for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.type = 'broadcast'
        and (
          c.level_filter = (select level::text from public.profiles where id = auth.uid())
          or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','teacher'))
        )
    )
  );

create policy "messages_insert" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and (
      exists (
        select 1 from public.conversation_participants cp
        where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
      )
      or exists (
        select 1 from public.conversations c
        join public.profiles p on p.id = auth.uid()
        where c.id = conversation_id and c.type = 'broadcast' and p.role in ('admin','teacher')
      )
    )
  );

-- ─────────────────────────────────────────────────────────────
-- Realtime — enable for live chat
-- ─────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
