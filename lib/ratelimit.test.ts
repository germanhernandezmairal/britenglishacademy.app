import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { checkRateLimit, getLoginLimiter } from "./ratelimit"

const URL_VAR = "UPSTASH_REDIS_REST_URL"
const TOKEN_VAR = "UPSTASH_REDIS_REST_TOKEN"

let savedUrl: string | undefined
let savedToken: string | undefined

beforeEach(() => {
  savedUrl = process.env[URL_VAR]
  savedToken = process.env[TOKEN_VAR]
})

afterEach(() => {
  restore(URL_VAR, savedUrl)
  restore(TOKEN_VAR, savedToken)
})

function restore(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name]
  } else {
    process.env[name] = value
  }
}

describe("getLoginLimiter", () => {
  it("builds a limiter when the credentials carry stray whitespace", () => {
    // Regression: the Production value of UPSTASH_REDIS_REST_URL was stored with
    // a trailing newline, so the Upstash client threw UrlError on construction
    // and every login on prod 500'd (digest 3201808633, 2026-07-24).
    process.env[URL_VAR] = "https://fleet-hookworm-130330.upstash.io\n"
    process.env[TOKEN_VAR] = "  some-token\n"

    expect(getLoginLimiter()).not.toBeNull()
  })

  it("returns null when the credentials are absent", () => {
    delete process.env[URL_VAR]
    delete process.env[TOKEN_VAR]

    expect(getLoginLimiter()).toBeNull()
  })

  it("returns null when the credentials are only whitespace", () => {
    process.env[URL_VAR] = "  \n"
    process.env[TOKEN_VAR] = "\t"

    expect(getLoginLimiter()).toBeNull()
  })

  it("reports and returns null when the url is unusable, instead of throwing", () => {
    process.env[URL_VAR] = "not-a-url"
    process.env[TOKEN_VAR] = "some-token"
    const reported: unknown[] = []

    expect(getLoginLimiter((e) => reported.push(e))).toBeNull()
    expect(reported).toHaveLength(1)
  })
})

describe("checkRateLimit", () => {
  it("allows the request when rate limiting is not configured", async () => {
    expect(await checkRateLimit(null, "1.2.3.4")).toBe(true)
  })

  it("allows the request when the limiter says it is under the cap", async () => {
    const limiter = { limit: async () => ({ success: true }) }

    expect(await checkRateLimit(limiter, "1.2.3.4")).toBe(true)
  })

  it("denies the request when the limiter says the cap is exceeded", async () => {
    const limiter = { limit: async () => ({ success: false }) }

    expect(await checkRateLimit(limiter, "1.2.3.4")).toBe(false)
  })

  it("fails open and reports when the limiter itself errors", async () => {
    // Upstash being unreachable must never take down login.
    const limiter = {
      limit: async () => {
        throw new Error("upstash unreachable")
      },
    }
    const reported: unknown[] = []

    expect(await checkRateLimit(limiter, "1.2.3.4", (e) => reported.push(e))).toBe(true)
    expect(reported).toHaveLength(1)
  })
})
