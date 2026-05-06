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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, level, role")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  if (!profile.level) {
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
