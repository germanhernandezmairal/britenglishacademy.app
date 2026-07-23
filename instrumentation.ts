import * as Sentry from "@sentry/nextjs"
import { getUserIdFromCookieHeader } from "@/lib/observability/request-user"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

/**
 * Next calls this for every uncaught error in a Server Component, Route Handler
 * or Server Action. It runs OUTSIDE the request's render async context, so the
 * `Sentry.setUser()` in app/(app)/layout.tsx does NOT reach it. We instead
 * resolve the user id from the request cookies (a local, no-network decode) and
 * set it on a fresh isolation scope so it can't leak across concurrent errors.
 * Id only — the JWT carries no app role. See lib/observability/request-user.ts.
 */
export async function onRequestError(
  ...args: Parameters<typeof Sentry.captureRequestError>
) {
  const [, request] = args
  const cookie = request?.headers?.cookie
  const userId = await getUserIdFromCookieHeader(
    Array.isArray(cookie) ? cookie.join("; ") : cookie
  )

  await Sentry.withIsolationScope(async (scope) => {
    if (userId) {
      scope.setUser({ id: userId })
    }
    Sentry.captureRequestError(...args)
  })
}
