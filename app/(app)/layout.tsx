import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, level, role")
    .eq("id", user.id)
    .single()

  // --- TEMP DIAGNOSTIC (remove after CI evidence gathered) ---
  console.log(
    "[DBG-RSC-PROFILE2]",
    "user=", user.id.slice(0, 8),
    "profile=", profile ? JSON.stringify(profile) : "NULL",
    "profileErr=", profileError ? `${profileError.code}:${profileError.message}` : "none",
  )
  // --- END TEMP DIAGNOSTIC ---

  if (!profile) {
    redirect("/login")
  }

  // Only students declare a CEFR level via onboarding; staff (admin/teacher)
  // have no learner level and must not be funnelled through it.
  if (!profile.level && profile.role === "student") {
    redirect("/onboarding")
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <DashboardSidebar profile={profile} />
      <main className="lg:pl-64">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  )
}
