import * as Sentry from "@sentry/nextjs"

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
 * or Server Action. It reads the per-request isolation scope, so the
 * `Sentry.setUser()` call in app/(app)/layout.tsx rides along.
 */
export const onRequestError = Sentry.captureRequestError
