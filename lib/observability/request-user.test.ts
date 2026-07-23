import { describe, expect, it } from "vitest"
import { getUserIdFromCookieHeader } from "./request-user"

// A fake Supabase client factory. getSession() decodes the auth cookie locally,
// so these tests stand in for that decode without depending on its cookie format.
function clientReturning(session: { user?: { id?: string } | null } | null) {
  return () => ({
    auth: { getSession: async () => ({ data: { session } }) },
  })
}

describe("getUserIdFromCookieHeader", () => {
  it("returns the user id when a session is present", async () => {
    const id = "60714bd7-b8fc-49d5-a325-6176c03aa3e8"
    const factory = clientReturning({ user: { id } })

    expect(await getUserIdFromCookieHeader("sb-x-auth-token=abc", factory)).toBe(id)
  })

  it("returns null when there is no session", async () => {
    const factory = clientReturning(null)

    expect(await getUserIdFromCookieHeader("sb-x-auth-token=abc", factory)).toBeNull()
  })

  it("returns null when getSession throws (never rethrows into the error path)", async () => {
    const factory = () => ({
      auth: {
        getSession: async () => {
          throw new Error("supabase unreachable")
        },
      },
    })

    expect(await getUserIdFromCookieHeader("sb-x-auth-token=abc", factory)).toBeNull()
  })

  it("returns null and builds no client when the cookie header is missing", async () => {
    let built = false
    const factory = () => {
      built = true
      return { auth: { getSession: async () => ({ data: { session: null } }) } }
    }

    expect(await getUserIdFromCookieHeader(undefined, factory)).toBeNull()
    expect(built).toBe(false)
  })
})
