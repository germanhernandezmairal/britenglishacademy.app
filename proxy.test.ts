import { describe, expect, it } from "vitest"
import { config } from "./proxy"

/**
 * Next compiles matcher strings with path-to-regexp, not `new RegExp`. The
 * matcher here is already regex-flavoured, so anchoring it is a close enough
 * approximation to assert which paths are in and out. This is a regression
 * guard on the exclusion list, not a reimplementation of Next's router.
 */
function matches(pathname: string): boolean {
  const pattern = config.matcher[0]
  return new RegExp(`^${pattern}$`).test(pathname)
}

describe("proxy matcher", () => {
  it("excludes the Sentry tunnel route", () => {
    // Sentry docs: under Turbopack, client-side event recording fails if
    // middleware intercepts the tunnel route.
    expect(matches("/monitoring")).toBe(false)
  })

  it("still matches authenticated app routes", () => {
    expect(matches("/dashboard")).toBe(true)
    expect(matches("/exams")).toBe(true)
    expect(matches("/admin/lessons")).toBe(true)
  })

  it("still matches the marketing homepage and auth pages", () => {
    expect(matches("/")).toBe(true)
    expect(matches("/login")).toBe(true)
  })

  it("still excludes static assets", () => {
    expect(matches("/_next/static/chunk.js")).toBe(false)
    expect(matches("/favicon.ico")).toBe(false)
    expect(matches("/hero.png")).toBe(false)
  })
})
