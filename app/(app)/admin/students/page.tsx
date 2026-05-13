import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { ArrowLeft, Users } from "lucide-react"
import { StudentRow } from "./_components/StudentRow"

export const metadata: Metadata = { title: "Alumnos | Admin | Brit English School" }

export default async function AdminStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!me || !["admin", "teacher"].includes(me.role)) redirect("/dashboard")

  const admin = await createAdminClient()
  const { data: students } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, level, is_active, learning_goals, login_streak, last_login_at, created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false })

  const list = students ?? []
  const activeCount = list.filter((s) => s.is_active).length

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-xs font-medium hover:underline"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ArrowLeft size={13} /> Panel Admin
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
          >
            Alumnos
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {activeCount} activos · {list.length} en total
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl border"
          style={{ background: "white", borderColor: "var(--color-border)" }}
        >
          <Users size={40} className="mb-4 opacity-20" style={{ color: "var(--color-primary)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
            Aún no hay alumnos registrados.
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: "white", borderColor: "var(--color-border)" }}
        >
          {/* Table header */}
          <div
            className="hidden md:grid grid-cols-[1fr_100px_120px_120px_140px] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)", background: "var(--color-bg-alt)" }}
          >
            <span>Alumno</span>
            <span>Nivel</span>
            <span>Racha</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {list.map((student) => (
              <StudentRow
                key={student.id}
                student={{
                  id: student.id,
                  full_name: student.full_name,
                  level: student.level,
                  is_active: student.is_active,
                  login_streak: student.login_streak ?? 0,
                  last_login_at: student.last_login_at,
                  created_at: student.created_at,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
