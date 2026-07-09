"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

/**
 * Mirrors the server-side Sentry.setUser() into the browser SDK so client-side
 * errors carry the same identity. UUID and role only - never email or name.
 * The UUID resolves to a person in Supabase, which is where that mapping belongs.
 */
export function SentryUser({ id, role }: { id: string; role: string }) {
  useEffect(() => {
    Sentry.setUser({ id, role })
    return () => Sentry.setUser(null)
  }, [id, role])

  return null
}
