import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  BookOpen, ClipboardList, GraduationCap, Flame,
  ArrowRight, Clock, CheckCircle2, AlertCircle,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Mi Dashboard | Brit English Academy",
}

const LEVEL_NEXT: Record<string, string> = {
  A1: "A2", A2: "B1", B1: "B2", B2: "C1", C1: "C2", C2: "C2",
}

const LEVEL_COLOR: Record<string, { bg: string; text: string; bar: string }> = {
  A1: { bg: "#FFF8E7", text: "#D4A017", bar: "#D4A017" },
  A2: { bg: "#FFF8E7", text: "#D4A017", bar: "#D4A017" },
  B1: { bg: "#EEF1FA", text: "#1A3A8C", bar: "#1A3A8C" },
  B2: { bg: "#EEF1FA", text: "#1A3A8C", bar: "#1A3A8C" },
  C1: { bg: "#D5DCF3", text: "#012169", bar: "#012169" },
  C2: { bg: "#D5DCF3", text: "#012169", bar: "#012169" },
}

const LEVEL_PROGRESS: Record<string, number> = {
  A1: 8, A2: 25, B1: 42, B2: 60, C1: 78, C2: 95,
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "Pendiente", color: "#D4A017", icon: Clock },
  under_review: { label: "En revisión", color: "#1A3A8C", icon: AlertCircle },
  corrected: { label: "Corregido", color: "#16A34A", icon: CheckCircle2 },
}

const QUICK_ACTIONS = [
  {
    href: "/lessons",
    icon: BookOpen,
    title: "Ver lecciones",
    desc: "Continúa donde lo dejaste",
    color: "var(--color-primary)",
    bg: "#EEF1FA",
  },
  {
    href: "/homework",
    icon: ClipboardList,
    title: "Entregar deberes",
    desc: "Sube tu tarea para revisión",
    color: "var(--color-accent)",
    bg: "#FFF8E7",
  },
  {
    href: "/exams",
    icon: GraduationCap,
    title: "Practicar examen",
    desc: "Ejercicios Cambridge",
    color: "var(--color-crimson)",
    bg: "#FEF2F2",
  },
]

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: typeof BookOpen
  label: string
  value: number | string
  color: string
  bg: string
}) {
  return (
    <div
      className="flex items-center gap-4 p-5 rounded-2xl border"
      style={{ background: "white", borderColor: "var(--color-border)" }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
          {value}
        </div>
        <div className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
          {label}
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [profileRes, completionsRes, homeworkRes, attemptsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, level, login_streak")
      .eq("id", user.id)
      .single(),
    supabase
      .from("lesson_completions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id),
    supabase
      .from("homework_submissions")
      .select("id, title, status, created_at")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("exam_attempts")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id),
  ])

  const profile = profileRes.data
  if (!profile) redirect("/login")

  const lessonsCompleted = completionsRes.count ?? 0
  const examsAttempted = attemptsRes.count ?? 0
  const recentHomework = homeworkRes.data ?? []
  const firstName = profile.full_name.split(" ")[0]
  const level = profile.level ?? "B1"
  const levelColor = LEVEL_COLOR[level] ?? LEVEL_COLOR.B1
  const levelProgress = LEVEL_PROGRESS[level] ?? 50
  const nextLevel = LEVEL_NEXT[level] ?? "C2"

  const hour = new Date().getHours()
  const greeting =
    hour < 13 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches"

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl md:text-3xl font-bold mb-1"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
        >
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Aquí tienes un resumen de tu progreso
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={BookOpen}
          label="Lecciones completadas"
          value={lessonsCompleted}
          color="var(--color-primary)"
          bg="#EEF1FA"
        />
        <StatCard
          icon={ClipboardList}
          label="Deberes enviados"
          value={recentHomework.length > 0 ? recentHomework.length : 0}
          color="var(--color-accent)"
          bg="#FFF8E7"
        />
        <StatCard
          icon={GraduationCap}
          label="Exámenes realizados"
          value={examsAttempted}
          color="var(--color-crimson)"
          bg="#FEF2F2"
        />
        <StatCard
          icon={Flame}
          label="Días seguidos"
          value={profile.login_streak ?? 0}
          color="#EA580C"
          bg="#FFF7ED"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Quick actions + Recent homework */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions */}
          <div
            className="p-6 rounded-2xl border"
            style={{ background: "white", borderColor: "var(--color-border)" }}
          >
            <h2
              className="text-base font-bold mb-4"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
            >
              Accesos rápidos
            </h2>
            <div className="space-y-3">
              {QUICK_ACTIONS.map(({ href, icon: Icon, title, desc, color, bg }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: bg }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      {title}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {desc}
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: "var(--color-text-muted)" }} />
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
                style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
              >
                Últimos deberes
              </h2>
              <Link
                href="/homework"
                className="text-xs font-semibold flex items-center gap-1 hover:underline"
                style={{ color: "var(--color-primary)" }}
              >
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>

            {recentHomework.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList
                  size={32}
                  className="mx-auto mb-3 opacity-30"
                  style={{ color: "var(--color-text-muted)" }}
                />
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Aún no has enviado ningún deber
                </p>
                <Link
                  href="/homework"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold px-4 py-2 rounded-lg text-white"
                  style={{ background: "var(--color-primary)" }}
                >
                  Enviar mi primer deber
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentHomework.map((hw) => {
                  const cfg = STATUS_CONFIG[hw.status] ?? STATUS_CONFIG.pending
                  const StatusIcon = cfg.icon
                  return (
                    <div
                      key={hw.id}
                      className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
                    >
                      <StatusIcon size={18} style={{ color: cfg.color }} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium truncate"
                          style={{ color: "var(--color-text)" }}
                        >
                          {hw.title}
                        </div>
                        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {new Date(hw.created_at).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      </div>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: cfg.color + "18", color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Level progress */}
        <div className="space-y-6">
          <div
            className="p-6 rounded-2xl border"
            style={{ background: "white", borderColor: "var(--color-border)" }}
          >
            <h2
              className="text-base font-bold mb-4"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
            >
              Tu nivel
            </h2>

            {/* Level badge */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{ background: levelColor.bg, color: levelColor.text }}
              >
                {level}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  Nivel actual
                </div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Próximo: <span className="font-bold">{nextLevel}</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: "var(--color-text-muted)" }}>Progreso global</span>
                <span className="font-bold" style={{ color: levelColor.text }}>
                  {levelProgress}%
                </span>
              </div>
              <div
                className="w-full h-2.5 rounded-full overflow-hidden"
                style={{ background: levelColor.bg }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${levelProgress}%`, background: levelColor.bar }}
                />
              </div>
            </div>

            <p className="text-xs mt-4 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              Completa lecciones y supera exámenes para avanzar al siguiente nivel.
            </p>
          </div>

          {/* Tip card */}
          <div
            className="p-5 rounded-2xl border"
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, #1A3A8C 100%)",
              borderColor: "transparent",
            }}
          >
            <div className="text-white text-xs font-semibold uppercase tracking-widest mb-2 opacity-70">
              Consejo del día
            </div>
            <p className="text-white text-sm leading-relaxed">
              La constancia es la clave. Dedica{" "}
              <span className="font-bold">20 minutos al día</span> y verás resultados en 4 semanas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
