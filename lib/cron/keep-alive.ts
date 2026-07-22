import { timingSafeEqual } from "node:crypto"

/**
 * Vercel attaches `Authorization: Bearer <CRON_SECRET>` to cron invocations
 * whenever a CRON_SECRET env var exists on the project.
 *
 * This gate fails CLOSED: a missing or blank secret rejects every request.
 * That is the opposite of how Upstash / Anthropic / Resend degrade when their
 * env vars are absent, and the difference is deliberate — those variables
 * enable an optional feature, whereas this one IS the access control. A
 * misconfigured deploy must lock the route, never open it to the public.
 */
export function isAuthorizedCronRequest(
  authorizationHeader: string | null,
  secret: string | undefined = process.env.CRON_SECRET
): boolean {
  if (typeof secret !== "string" || secret.trim().length === 0) return false
  if (authorizationHeader === null) return false

  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(authorizationHeader)

  // timingSafeEqual throws on length mismatch, so check length first. The
  // length of a rejected guess leaks either way; the byte comparison is what
  // must not leak, hence the constant-time compare rather than `===`.
  if (expected.length !== actual.length) return false

  return timingSafeEqual(expected, actual)
}

/**
 * blog_posts carries `blog_select_public` (`for select using (is_published =
 * true)`) — the one policy with no auth predicate, because the marketing blog
 * is public. Every other table gates on auth.uid(), current_user_role(), or an
 * active authenticated profile.
 */
export const KEEP_ALIVE_TABLE = "blog_posts"

export type KeepAliveResult =
  | { ok: true; durationMs: number }
  | { ok: false; durationMs: number; error: Error }

/**
 * Runs the supplied query and classifies the outcome.
 *
 * Takes a thunk rather than a Supabase client so this module stays free of
 * Supabase types and the tests need no module mocking.
 *
 * A zero-row result is a SUCCESS. The point is that the query reached Postgres
 * and counted as database activity; how many rows RLS let through is
 * irrelevant to keeping the project awake.
 */
export async function runKeepAlivePing(
  query: () => PromiseLike<{ error: { message: string } | null }>
): Promise<KeepAliveResult> {
  const startedAt = Date.now()

  try {
    const { error } = await query()
    const durationMs = Date.now() - startedAt

    if (error) {
      return { ok: false, durationMs, error: new Error(error.message) }
    }

    return { ok: true, durationMs }
  } catch (cause) {
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      error: cause instanceof Error ? cause : new Error(String(cause)),
    }
  }
}
