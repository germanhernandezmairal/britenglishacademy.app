# Runbook — Brit English Academy

Operational procedures for the live platform. Written for calm moments so they're
usable during incidents. Stack: **Next.js (App Router) on Vercel** + **Supabase**
(Postgres, Auth, Storage) + Claude/Resend/Replicate/Upstash.

---

## Deploy

Deploys are driven by Git → Vercel.

- **Production:** merge to `main`. Vercel builds and promotes automatically.
- **Preview:** every push / open PR gets its own preview URL (safe to share, isolated).
- **Manual (rare):** `vercel --prod` from a clean working tree if the Git integration is down.

**Pre-merge gate:** CI (`.github/workflows/ci.yml`) runs lint + typecheck; Vercel runs the build.
Don't merge red.

## Rollback

Vercel keeps every previous production build — rollback is instant re-promotion, no rebuild.

1. Vercel dashboard → project → **Deployments**.
2. Find the last known-good production deployment.
3. **⋯ → Promote to Production** (or "Instant Rollback").
4. Confirm the site loads and the broken behavior is gone.

> If the bad deploy included a **database migration**, rolling back code is not enough —
> see "Database migrations" below. Code rollback + incompatible schema = still broken.

**Practice it once** when nothing is on fire, so the steps are muscle memory.

## Database migrations

Migrations live in `supabase/migrations/` and are applied to prod manually (via `psql`
with the pooler connection string, or the Supabase SQL editor).

**Rules:**
- **Additive first.** `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`; backfill; switch reads;
  drop the old column in a *later* migration. Never destructive-in-one-shot.
- Each migration should be safe to run twice (idempotent: `IF NOT EXISTS` / `IF EXISTS`).
- For anything risky, write the **down**-migration (how to reverse) in a comment at the top,
  and test it against a scratch copy before touching prod.

## Backup & restore

Supabase takes automatic daily backups (Project → Database → Backups; PITR on paid tiers).

**Restore drill (do this once, to a scratch project — not prod):**
1. Supabase dashboard → Database → Backups → pick a backup → Restore.
2. Point a scratch env's `NEXT_PUBLIC_SUPABASE_URL` / keys at the restored project.
3. Smoke-test login + one read. Time how long the whole thing took. Write it here.

> "You don't have backups until you've restored one." Until the drill is done, treat
> backup as unproven.

## Key / secret rotation

All secrets live in **Vercel → Project → Settings → Environment Variables** (and locally in
`.env.local`, which is gitignored). Never commit secrets. Inventory:

| Variable | Provider | Where to rotate |
|----------|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Project → API. Anon key is public-by-design (RLS protects data). |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Project → API → "Reset" the service_role key. **Secret — bypasses RLS.** |
| `ANTHROPIC_API_KEY` | Anthropic | console.anthropic.com → API Keys → revoke + recreate. |
| `RESEND_API_KEY` | Resend | resend.com dashboard → API Keys. |
| `REPLICATE_API_TOKEN` | Replicate | replicate.com → account → API tokens. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash | console.upstash.com → database → REST. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | self (web-push) | regenerate with `npx web-push generate-vapid-keys` (invalidates existing push subscriptions). |

**Rotation procedure (any key):**
1. Generate the new value in the provider console.
2. Update it in Vercel env vars (Production + Preview as needed).
3. Redeploy (or trigger a new deploy) so functions pick up the new value.
4. Revoke the old value at the provider.
5. Update your local `.env.local`.

**If a secret leaks:** rotate immediately (steps above), then check the provider's usage
logs for abuse. A leaked key is compromised the moment it's exposed — deletion from code
does not un-leak it.

## Common incidents — first checks

- **Site 500s after deploy** → check Vercel deployment logs; if migration-related, verify the
  schema matches the code, else roll back (above).
- **Feature silently shows empty state** → likely a Supabase query returning `{ data: null }`
  on a schema mismatch (this repo's recurring failure mode — see `docs/bug-hunt-findings.md`).
  Probe the table with the service role.
- **AI grading returns "Análisis de IA no disponible"** → `ANTHROPIC_API_KEY` missing or out of
  credits. Check the Anthropic console.
- **Uploads fail** → confirm the Supabase storage bucket exists and the service-role client is
  used for writes (`lib/supabase/server.ts`).
