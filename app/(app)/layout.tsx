import * as Sentry from "@sentry/nextjs"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { SentryUser } from "@/components/shared/SentryUser"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, level, role")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  // Attaches user to Sentry for the paths that share this request's async
  // scope: client events (mirrored by <SentryUser> below) and any explicit
  // Sentry.captureException made within this request. NOTE: uncaught SERVER
  // render errors are captured by instrumentation.ts's onRequestError, which
  // runs OUTSIDE this async context and does NOT see this user — those events
  // carry only url/transaction (live-verified 2026-07-21; see docs/tech-debt.md).
  // UUID + role only, never email (students are minors).
  Sentry.setUser({ id: user.id, role: profile.role })

  // Only students declare a CEFR level via onboarding; staff (admin/teacher)
  // have no learner level and must not be funnelled through it.
  if (!profile.level && profile.role === "student") {
    redirect("/onboarding")
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <SentryUser id={user.id} role={profile.role} />
      <DashboardSidebar profile={profile} />
      <main className="lg:pl-64">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  )
}
