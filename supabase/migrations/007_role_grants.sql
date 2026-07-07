-- ============================================================
-- 007 — anon / authenticated grants (local parity)
-- ============================================================
-- Same rationale as 006 (service_role): in production Supabase the anon and
-- authenticated roles have implicit privileges on public tables via Supabase's
-- infrastructure setup. A fresh local instance (supabase start) lacks them, so
-- authenticated queries fail with "42501 permission denied for table ..." even
-- when an RLS policy would allow the row. (This was previously masked by the
-- profiles policy recursion, which errored at query-rewrite time before the
-- privilege check ran.)
--
-- Table-level privileges are the coarse gate; the RLS policies remain the real
-- per-row access control. Mirrors Supabase's default grants. Does not affect
-- production, which already has these.
-- ============================================================

grant usage on schema public to anon, authenticated;

grant all privileges on all tables     in schema public to anon, authenticated;
grant all privileges on all sequences  in schema public to anon, authenticated;
grant all privileges on all functions  in schema public to anon, authenticated;

alter default privileges in schema public grant all privileges on tables    to anon, authenticated;
alter default privileges in schema public grant all privileges on sequences to anon, authenticated;
alter default privileges in schema public grant all privileges on functions to anon, authenticated;
