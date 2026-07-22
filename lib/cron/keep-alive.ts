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
