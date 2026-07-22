import { describe, expect, it } from "vitest"
import { KEEP_ALIVE_TABLE, isAuthorizedCronRequest, runKeepAlivePing } from "./keep-alive"

describe("isAuthorizedCronRequest", () => {
  it("rejects when the secret is undefined", () => {
    expect(isAuthorizedCronRequest("Bearer anything", undefined)).toBe(false)
  })

  it("rejects when the secret is an empty string", () => {
    expect(isAuthorizedCronRequest("Bearer ", "")).toBe(false)
  })

  it("rejects when the secret is only whitespace", () => {
    expect(isAuthorizedCronRequest("Bearer    ", "   ")).toBe(false)
  })

  it("rejects a missing Authorization header", () => {
    expect(isAuthorizedCronRequest(null, "s3cret")).toBe(false)
  })

  it("rejects a header with the wrong secret", () => {
    expect(isAuthorizedCronRequest("Bearer wrong", "s3cret")).toBe(false)
  })

  it("rejects a bare secret without the Bearer scheme", () => {
    expect(isAuthorizedCronRequest("s3cret", "s3cret")).toBe(false)
  })

  it("rejects a correct secret of a different length", () => {
    expect(isAuthorizedCronRequest("Bearer s3cretX", "s3cret")).toBe(false)
  })

  it("accepts the exact Bearer token", () => {
    expect(isAuthorizedCronRequest("Bearer s3cret", "s3cret")).toBe(true)
  })
})

describe("KEEP_ALIVE_TABLE", () => {
  it("targets the anon-readable blog_posts table", () => {
    // blog_posts is the only table with a policy that carries no auth
    // predicate by design (blog_select_public: is_published = true), so the
    // ping needs no service-role key.
    expect(KEEP_ALIVE_TABLE).toBe("blog_posts")
  })
})

describe("runKeepAlivePing", () => {
  it("reports ok when the query resolves without an error", async () => {
    const result = await runKeepAlivePing(async () => ({ error: null }))

    expect(result.ok).toBe(true)
    expect(typeof result.durationMs).toBe("number")
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it("reports ok even when the query matches zero rows", async () => {
    // A zero-row result still reached Postgres, which is all the keep-alive
    // needs. The health signal is the error channel, not the row count.
    const result = await runKeepAlivePing(async () => ({ error: null }))

    expect(result.ok).toBe(true)
  })

  it("reports failure when the query returns a Postgres error", async () => {
    const result = await runKeepAlivePing(async () => ({
      error: { message: "permission denied for table blog_posts" },
    }))

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected a failed ping")
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error.message).toContain("permission denied")
  })

  it("reports failure when the query itself throws", async () => {
    const result = await runKeepAlivePing(async () => {
      throw new Error("fetch failed")
    })

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected a failed ping")
    expect(result.error.message).toContain("fetch failed")
  })

  it("wraps a non-Error rejection in an Error", async () => {
    const result = await runKeepAlivePing(async () => {
      throw "database is paused"
    })

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected a failed ping")
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error.message).toContain("database is paused")
  })
})
