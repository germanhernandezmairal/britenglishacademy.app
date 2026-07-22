import * as Sentry from "@sentry/nextjs"
import { NextResponse } from "next/server"
import { KEEP_ALIVE_TABLE, isAuthorizedCronRequest, runKeepAlivePing } from "@/lib/cron/keep-alive"
import { createClient } from "@/lib/supabase/server"

// Never prerender or cache this route — a cached 200 would defeat the entire
// purpose by keeping the database untouched.
export const dynamic = "force-dynamic"

/**
 * Daily keep-alive for the free-tier Supabase project, which auto-pauses after
 * 7 days of inactivity and takes down auth on production AND every preview
 * (one database serves all environments).
 *
 * Uses the same cookie-based anon client that login uses, so a green ping is
 * evidence auth will work — not merely that Postgres accepted a connection.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const supabase = await createClient()

  const result = await runKeepAlivePing(() =>
    supabase.from(KEEP_ALIVE_TABLE).select("id", { count: "exact", head: true })
  )

  if (!result.ok) {
    Sentry.captureException(result.error, { tags: { cron: "keep-alive" } })
    return NextResponse.json({ ok: false, durationMs: result.durationMs }, { status: 503 })
  }

  return NextResponse.json({ ok: true, durationMs: result.durationMs })
}
