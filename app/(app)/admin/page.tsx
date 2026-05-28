import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import {
  Users, ClipboardList, BookOpen, GraduationCap,
  ArrowRight, Clock, CheckCircle2, AlertCircle,
} from "lucide-react"

export const metadata: Metadata = { title: "Panel Admin | Brit English Academy" }

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  A1: { bg: "#FFF8E7", text: "#D4A017" },
  A2: { bg: "#FFF8E7", text: "#D4A017" },
  B1: { bg: "#EEF1FA", text: "#1A3A8C" },
  B2: { bg: "#EEF1FA", text: "#1A3A8C" },
  C1: { bg: "#D5DCF3", text: "#012169" },
  C2: { bg: "#D5DCF3", text: "#012169" },
}

const HW_STATUS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending:      { label: "Pendiente",   color: "#D4A017", icon: Clock },
  under_review: { label: "En revisión", color: "#1A3A8C", icon: AlertCircle },
  corrected:    { label: "Corregido",   color: "#16A34A", icon: CheckCircle2 },
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()

  if (!profile || !["admin", "teacher"].includes(profile.role)) redirect("/dashboard")

  const admin = await createAdminClient()

  const [
    totalStudentsRes,
    activeStudentsRes,
    pendingHwRes,
    underReviewHwRes,
    publishedLessonsRes,
    publishedExamsRes,
    recentHwRes,
    levelBreakdownRes,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("is_active", true),
    admin.from("homework_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("homework_submissions").select("id", { count: "exact", head: true }).eq("status", "under_review"),
    admin.from("lessons").select("id", { count: "exact", head: true }).eq("is_published", true),
    admin.from("exams").select("id", { count: "exact", head: true }).eq("is_published", true),
    admin
      .from("homework_submissions")
      .select("id, title, status, submitted_at, student_id")
      .order("submitted_at", { ascending: false })
      .limit(6),
    admin
      .from("profiles")
      .select("level")
      .eq("role", "student")
      .eq("is_active", true)
      .not("level", "is", null),
  ])

  const totalStudents = totalStudentsRes.count ?? 0
  const activeStudents = activeStudentsRes.count ?? 0
  const pendingHw = pendingHwRes.count ?? 0
  const underReviewHw = underReviewHwRes.count ?? 0
  const publishedLessons = publishedLessonsRes.count ?? 0
  const publishedExams = publishedExamsRes.count ?? 0
  const recentHw = recentHwRes.data ?? []

  // Enrich recent homework with student names
  const studentIds = [...new Set(recentHw.map((h) => h.student_id))]
  const { data: studentProfiles } = studentIds.length > 0
    ? await admin.from("profiles").select("id, full_name, level").in("id", studentIds)
    : { data: [] as { id: string; full_name: string; level: string | null }[] }

  const studentMap: Record<string, { full_name: string; level: string | null }> = {}
  for (const p of studentProfiles ?? []) studentMap[p.id] = p

  // Level breakdown
  const levelCount: Record<string, number> = {}
  for (const row of levelBreakdownRes.data ?? []) {
    if (row.level) levelCount[row.level] = (levelCount[row.level] ?? 0) + 1
  }

  const STAT_CARDS = [
    { label: "Alumnos activos", value: activeStudents, sub: `de ${totalStudents} totales`, icon: Users, color: "var(--color-primary)", bg: "#EEF1FA", href: "/admin/students" },
    { label: "Deberes pendientes", value: pendingHw + underReviewHw, sub: `${pendingHw} sin revisar`, icon: ClipboardList, color: "#D4A017", bg: "#FFF8E7", href: "/admin/homework" },
    { label: "Lecciones publicadas", value: publishedLessons, sub: "lecciones activas", icon: BookOpen, color: "var(--color-primary)", bg: "#EEF1FA", href: "/admin/lessons" },
    { label: "Exámenes publicados", value: publishedExams, sub: "exámenes activos", icon: GraduationCap, color: "var(--color-crimson)", bg: "#FEF2F2", href: "/admin/exams" },
  ]

  const QUICK_LINKS = [
    { href: "/admin/students", label: "Gestionar Alumnos", icon: Users, desc: "Niveles, estado, perfiles" },
    { href: "/admin/homework", label: "Cola de Deberes", icon: ClipboardList, desc: `${pendingHw} pendientes de revisión` },
    { href: "/admin/lessons", label: "Gestionar Lecciones", icon: BookOpen, desc: "Crear, editar, publicar" },
    { href: "/admin/exams", label: "Gestionar Exámenes", icon: GraduationCap, desc: "Crear, editar, publicar" },
  ]

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl md:text-3xl font-bold mb-1"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
        >
          Panel de Administración
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Visión general de la escuela
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(({ label, value, sub, icon: Icon, color, bg, href }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col p-5 rounded-2xl border transition-all hover:shadow-sm hover:-translate-y-0.5"
            style={{ background: "white", borderColor: "var(--color-border)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: bg }}
            >
              <Icon size={20} style={{ color }} />
            </div>
            <div className="text-2xl font-bold mb-0.5" style={{ color: "var(--color-text)" }}>
              {value}
            </div>
            <div className="text-xs font-semibold mb-0.5" style={{ color: "var(--color-text)" }}>
              {label}
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {sub}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick links + level breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick links */}
          <div
            className="p-6 rounded-2xl border"
            style={{ background: "white", borderColor: "var(--color-border)" }}
          >
            <h2
              className="text-base font-bold mb-4"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
            >
              Accesos directos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_LINKS.map(({ href, label, icon: Icon, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-sm hover:border-blue-200"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "#EEF1FA" }}
                  >
                    <Icon size={17} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                      {label}
                    </div>
                    <div className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                      {desc}
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: "var(--color-text-muted)" }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent homework */}
          <div
            className="p-6 rounded-2xl border"
            style={{ background: "white", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-base font-bold"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
              >
                Últimos deberes
              </h2>
              <Link
                href="/admin/homework"
                className="text-xs font-semibold flex items-center gap-1 hover:underline"
                style={{ color: "var(--color-primary)" }}
              >
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>

            {recentHw.length === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: "var(--color-text-muted)" }}>
                No hay envíos de deberes todavía.
              </p>
            ) : (
              <div className="space-y-2">
                {recentHw.map((hw) => {
                  const cfg = HW_STATUS[hw.status] ?? HW_STATUS.pending
                  const StatusIcon = cfg.icon
                  const student = studentMap[hw.student_id]
                  return (
                    <Link
                      key={hw.id}
                      href="/admin/homework"
                      className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm"
                      style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
                    >
                      <StatusIcon size={16} style={{ color: cfg.color }} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
                          {hw.title}
                        </div>
                        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {student?.full_name ?? "Alumno"}{" "}
                          {student?.level && (
                            <span
                              className="font-bold px-1 rounded"
                              style={{
                                background: LEVEL_COLORS[student.level]?.bg ?? "#EEF1FA",
                                color: LEVEL_COLORS[student.level]?.text ?? "#1A3A8C",
                              }}
                            >
                              {student.level}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: cfg.color + "18", color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Level breakdown */}
        <div>
          <div
            className="p-6 rounded-2xl border"
            style={{ background: "white", borderColor: "var(--color-border)" }}
          >
            <h2
              className="text-base font-bold mb-4"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
            >
              Alumnos por nivel
            </h2>

            {Object.keys(LEVEL_COLORS).map((level) => {
              const count = levelCount[level] ?? 0
              const max = Math.max(...Object.values(levelCount), 1)
              const pct = Math.round((count / max) * 100)
              const lc = LEVEL_COLORS[level]
              return (
                <div key={level} className="mb-4 last:mb-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span
                      className="font-bold px-2 py-0.5 rounded"
                      style={{ background: lc.bg, color: lc.text }}
                    >
                      {level}
                    </span>
                    <span className="font-semibold" style={{ color: "var(--color-text-muted)" }}>
                      {count} alumno{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ background: lc.bg }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: lc.text }}
                    />
                  </div>
                </div>
              )
            })}

            {activeStudents === 0 && (
              <p className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>
                Aún no hay alumnos activos.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
