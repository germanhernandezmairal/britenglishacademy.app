import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Settings2 } from "lucide-react"

export const metadata: Metadata = { title: "Panel Admin | Brit English School" }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
    redirect("/dashboard")
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <h1
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
      >
        Panel de Administración
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
        Gestiona alumnos, lecciones, deberes y exámenes.
      </p>
      <div
        className="flex flex-col items-center justify-center py-20 rounded-2xl border"
        style={{ background: "white", borderColor: "var(--color-border)" }}
      >
        <Settings2 size={40} className="mb-4 opacity-20" style={{ color: "var(--color-primary)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
          Próximamente — el panel admin está en camino
        </p>
      </div>
    </div>
  )
}
