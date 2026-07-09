import type { ErrorEvent } from "@sentry/nextjs"
import { describe, expect, it } from "vitest"
import { isSentryEnabled, scrubEvent } from "./sentry-options"

describe("isSentryEnabled", () => {
  it("is disabled when the DSN is undefined", () => {
    expect(isSentryEnabled(undefined)).toBe(false)
  })

  it("is disabled when the DSN is an empty string", () => {
    expect(isSentryEnabled("")).toBe(false)
  })

  it("is disabled when the DSN is only whitespace", () => {
    expect(isSentryEnabled("   ")).toBe(false)
  })

  it("is enabled when a DSN is present", () => {
    expect(isSentryEnabled("https://abc@o1.ingest.sentry.io/2")).toBe(true)
  })
})

describe("scrubEvent", () => {
  it("drops request body, cookies, headers and query string but keeps the url", () => {
    const event = {
      request: {
        url: "https://example.com/exams/1",
        data: { answers: ["A", "B", "C"] },
        cookies: { "sb-access-token": "secret" },
        headers: { authorization: "Bearer secret" },
        query_string: "email=student%40example.com",
      },
    } as unknown as ErrorEvent

    const scrubbed = scrubEvent(event)

    expect(scrubbed.request?.data).toBeUndefined()
    expect(scrubbed.request?.cookies).toBeUndefined()
    expect(scrubbed.request?.headers).toBeUndefined()
    expect(scrubbed.request?.query_string).toBeUndefined()
    expect(scrubbed.request?.url).toBe("https://example.com/exams/1")
  })

  it("keeps the user id and role but drops email, username and ip", () => {
    const event = {
      user: {
        id: "8f14e45f-ceea-467a-9575-7a1c1d2e3f40",
        role: "student",
        email: "student@example.com",
        username: "student",
        ip_address: "203.0.113.7",
      },
    } as unknown as ErrorEvent

    const scrubbed = scrubEvent(event)

    expect(scrubbed.user?.id).toBe("8f14e45f-ceea-467a-9575-7a1c1d2e3f40")
    expect(scrubbed.user?.role).toBe("student")
    expect(scrubbed.user?.email).toBeUndefined()
    expect(scrubbed.user?.username).toBeUndefined()
    expect(scrubbed.user?.ip_address).toBeUndefined()
  })

  it("drops the server hostname", () => {
    const event = { server_name: "prod-iad1-abc123" } as unknown as ErrorEvent
    expect(scrubEvent(event).server_name).toBeUndefined()
  })

  it("tolerates an event with no request and no user", () => {
    expect(() => scrubEvent({} as ErrorEvent)).not.toThrow()
  })
})
