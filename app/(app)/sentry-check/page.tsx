import Link from "next/link"
import { SentryCheckClient } from "./SentryCheckClient"

/**
 * TEMPORARY — Sentry live-verification route. DELETE after confirming issues
 * arrive in Sentry (see docs/superpowers/plans/2026-07-08-sentry-error-tracking.md
 * Task 7 Step 5).
 *
 * Lives under (app) so the layout's Sentry.setUser({ id, role }) (server) and
 * <SentryUser> (client) attach identity — this route proves both the un-minified
 * trace AND the scrubber (user.id + role present, no email) in one shot.
 *
 * - "?boom=server" throws during server render -> onRequestError -> Sentry.
 * - The button throws in the browser -> window.onerror -> /monitoring tunnel.
 */
export default async function SentryCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ boom?: string }>
}) {
  const { boom } = await searchParams

  if (boom === "server") {
    throw new Error("SENTRY_VERIFY: server-side throw from /sentry-check")
  }

  return (
    <div style={{ padding: "2rem", display: "grid", gap: "1rem", maxWidth: "32rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Sentry verification</h1>
      <p>Temporary route — delete after verification.</p>
      <Link href="/sentry-check?boom=server" style={{ textDecoration: "underline" }}>
        Trigger server error
      </Link>
      <SentryCheckClient />
    </div>
  )
}
