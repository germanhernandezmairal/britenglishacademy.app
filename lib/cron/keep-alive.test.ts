import { describe, expect, it } from "vitest"
import { isAuthorizedCronRequest } from "./keep-alive"

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
