import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import * as Sentry from "@sentry/nextjs"

type ErrorReporter = (error: unknown) => void

const reportToSentry: ErrorReporter = (error) => {
  Sentry.captureException(error)
}

/**
 * Upstash validates its credentials eagerly and rejects any value carrying
 * stray whitespace, so a trailing newline in the stored env var is fatal rather
 * than cosmetic. One had crept into the Production `UPSTASH_REDIS_REST_URL`,
 * which threw on construction and 500'd every login for weeks. Trim on read:
 * the env store is edited by hand, so it will happen again.
 */
function readCredential(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

function buildRedis(): Redis | null {
  const url = readCredential("UPSTASH_REDIS_REST_URL")
  const token = readCredential("UPSTASH_REDIS_REST_TOKEN")
  if (!url || !token) return null
  return new Redis({ url, token })
}

/**
 * Never throws. Rate limiting is a safeguard on the auth flow, not a
 * precondition for it — a broken limiter must degrade to "no limiting", not
 * take the flow down with it. Absent credentials are the normal no-limiter case
 * (local dev, CI, previews); anything else is a real fault and gets reported.
 */
function buildLimiter(
  prefix: string,
  requests: number,
  window: `${number} ${"s" | "m" | "h" | "d"}`,
  onError: ErrorReporter
): Ratelimit | null {
  try {
    const redis = buildRedis()
    if (!redis) return null
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      analytics: false,
      prefix,
    })
  } catch (error) {
    onError(error)
    return null
  }
}

// 5 login attempts per 15 minutes per IP
export function getLoginLimiter(onError: ErrorReporter = reportToSentry) {
  return buildLimiter("rl:login", 5, "15 m", onError)
}

// 3 signup attempts per hour per IP
export function getSignupLimiter(onError: ErrorReporter = reportToSentry) {
  return buildLimiter("rl:signup", 3, "1 h", onError)
}

/** The slice of `Ratelimit` callers need — keeps the fakes in the tests honest. */
type RateLimiter = {
  limit: (identifier: string) => Promise<{ success: boolean }>
}

/**
 * Returns whether the request may proceed. Fails **open**: if Upstash is
 * unreachable or misconfigured we report it and let the request through, since
 * Supabase applies its own auth throttling underneath. Never throws, so callers
 * can treat it as a plain boolean gate.
 */
export async function checkRateLimit(
  limiter: RateLimiter | null,
  identifier: string,
  onError: ErrorReporter = reportToSentry
): Promise<boolean> {
  if (!limiter) return true

  try {
    const { success } = await limiter.limit(identifier)
    return success
  } catch (error) {
    onError(error)
    return true
  }
}
