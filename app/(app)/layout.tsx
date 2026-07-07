import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // --- TEMP DIAGNOSTIC (remove after CI evidence gathered) ---
  {
    const ck = await cookies()
    const authCk = ck.getAll().filter((c) => c.name.includes("auth-token"))
    console.log(
      "[DBG-RSC-LAYOUT]",
      "user=", user ? user.id.slice(0, 8) : "null",
      "err=", userError ? `${userError.name}:${userError.status ?? ""}:${userError.message}` : "none",
      "authCookies=", authCk.map((c) => `${c.name}(${c.value.length})`).join(",") || "NONE",
    )
  }
  // --- END TEMP DIAGNOSTIC ---

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
