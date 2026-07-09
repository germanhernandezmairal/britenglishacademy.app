import type { ErrorEvent } from "@sentry/nextjs"

/**
 * The DSN is the single switch for the whole integration. When it is absent
 * `Sentry.init` is never called, every `captureException` becomes a no-op, and
 * no network client is constructed.
 *
 * This mirrors how Upstash / Anthropic / Resend / Replicate / VAPID behave when
 * their env vars are missing, which is what keeps the money-path E2E gate
 * hermetic in CI.
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

export function isSentryEnabled(dsn: string | undefined = SENTRY_DSN): boolean {
  return typeof dsn === "string" && dsn.trim().length > 0
}

/**
 * Vercel exposes VERCEL_ENV to the server only. The browser bundle needs the
 * NEXT_PUBLIC_ copy, which Next inlines at build time.
 */
export function sentryEnvironment(): string {
  return (
    process.env.NEXT_PUBLIC_VERCEL_ENV ??
    process.env.VERCEL_ENV ??
    "development"
  )
}

/**
 * Defence in depth on top of `sendDefaultPii: false`.
 *
 * Students are minors. Exam answers, chat messages and auth tokens must not
 * leave our infrastructure, so we drop every request-derived field rather than
 * trusting the SDK's defaults not to serialize one into an error. The request
 * URL is kept because the route is the single most useful triage signal and
 * carries no personal data.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.data
    delete event.request.cookies
    delete event.request.headers
    delete event.request.query_string
  }

  if (event.user) {
    delete event.user.ip_address
    delete event.user.email
    delete event.user.username
  }

  delete event.server_name

  return event
}

export function baseSentryOptions() {
  return {
    dsn: SENTRY_DSN,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    environment: sentryEnvironment(),
    beforeSend: scrubEvent,
  }
}
