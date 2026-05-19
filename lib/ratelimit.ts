import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

function buildRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

function buildLimiter(prefix: string, requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`): Ratelimit | null {
  const redis = buildRedis()
  if (!redis) return null
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(requests, window), analytics: false, prefix })
}

// 5 login attempts per 15 minutes per IP
export function getLoginLimiter() { return buildLimiter("rl:login", 5, "15 m") }

// 3 signup attempts per hour per IP
export function getSignupLimiter() { return buildLimiter("rl:signup", 3, "1 h") }
