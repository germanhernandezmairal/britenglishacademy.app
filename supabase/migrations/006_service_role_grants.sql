-- ============================================================
-- 006 — Service role grants
-- ============================================================
-- In production Supabase, the service_role has implicit access to all
-- public tables via Supabase's infrastructure setup. In a fresh local
-- Supabase instance (supabase start) those implicit grants are absent,
-- so the service_role key cannot do DML via PostgREST.
--
-- This migration makes local parity explicit without affecting production.
-- ============================================================

grant usage on schema public to service_role;
grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
alter default privileges in schema public grant all privileges on tables    to service_role;
alter default privileges in schema public grant all privileges on sequences to service_role;
