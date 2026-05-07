import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GraduationCap, Clock, Trophy, RotateCcw } from "lucide-react"

export const metadata: Metadata = { title: "Exámenes | Brit English School" }

const SKILL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  reading:         { label: "Comprensión lectora",  color: "#1A3A8C", bg: "#EEF1FA" },
  writing:         { label: "Expresión escrita",    color: "#C8102E", bg: "#FFF0F2" },
  listening:       { label: "Comprensión auditiva", color: "#D4A017", bg: "#FFF8E7" },
  speaking_prep:   { label: "Preparación oral",     color: "#16A34A", bg: "#D1FAE5" },
  grammar:         { label: "Gramática",             color: "#012169", bg: "#D5DCF3" },
  use_of_english:  { label: "Uso del inglés",       color: "#7C3AED", bg: "#EDE9FE" },
}

const BAND_COLOR: Record<string, string> = {
  A: "#16A34A", B: "#0D9488", C: "#1A3A8C", D: "#D4A017", E: "#EA580C", U: "#DC2626",
}

const TYPE_LABEL: Record<string, string> = {
  interactive: "Interactivo",
  pdf_practice: "PDF",
}

export default async function ExamsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("level")
    .eq("id", user.id)
    .single()

  if (!profile?.level) redirect("/onboarding")

  const [examsRes, submissionsRes] = await Promise.all([
    supabase
      .from("exams")
      .select("id, title, description, level, skill, exam_type, time_limit_minutes, max_score")
      .eq("is_published", true)
      .eq("level", profile.level)
      .order("skill", { ascending: true }),
    supabase
      .from("exam_submissions")
      .select("exam_id, score, band_score")
      .eq("student_id", user.id),
  ])

  const exams = examsRes.data ?? []

  // Build best-score and attempt-count per exam
  const statsMap = new Map<string, { bestScore: number; count: number; bestBand: string }>()
  for (const sub of submissionsRes.data ?? []) {
    const existing = statsMap.get(sub.exam_id)
    if (!existing) {
      statsMap.set(sub.exam_id, { bestScore: sub.score ?? 0, count: 1, bestBand: sub.band_score ?? "U" })
    } else {
      const better = (sub.score ?? 0) > existing.bestScore
      statsMap.set(sub.exam_id, {
        bestScore: better ? (sub.score ?? 0) : existing.bestScore,
        bestBand: better ? (sub.band_score ?? "U") : existing.bestBand,
        count: existing.count + 1,
      })
    }
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl md:text-3xl font-bold mb-1"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
        >
          Exámenes
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Practica con exámenes tipo Cambridge para nivel {profile.level}
        </p>
      </div>

      {exams.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl border"
          style={{ background: "white", borderColor: "var(--color-border)" }}
        >
          <GraduationCap size={40} className="mb-4 opacity-20" style={{ color: "var(--color-primary)" }} />
          <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Exámenes en camino
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Tu profesor publicará exámenes para el nivel {profile.level} muy pronto.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam) => {
            const skill = SKILL_CONFIG[exam.skill] ?? SKILL_CONFIG.grammar
            const stats = statsMap.get(exam.id) ?? null
            const attempted = !!stats

            return (
              <Link
                key={exam.id}
                href={`/exams/${exam.id}`}
                className="group flex flex-col rounded-2xl border overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ background: "white", borderColor: "var(--color-border)" }}
              >
                {/* Colour bar */}
                <div
                  className="h-1.5"
                  style={{ background: skill.color }}
                />

                <div className="p-5 flex flex-col flex-1">
                  {/* Badges row */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: skill.bg, color: skill.color }}
                    >
                      {skill.label}
                    </span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--color-bg-alt)", color: "var(--color-text-muted)" }}
                    >
                      {TYPE_LABEL[exam.exam_type] ?? exam.exam_type}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="text-sm font-bold leading-snug mb-1 flex-1"
                    style={{ color: "var(--color-text)" }}
                  >
                    {exam.title}
                  </h3>

                  {exam.description && (
                    <p
                      className="text-xs leading-relaxed line-clamp-2 mb-3"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {exam.description}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-xs mt-auto pt-3 border-t"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                    {exam.time_limit_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {exam.time_limit_minutes} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <GraduationCap size={11} />
                      {exam.max_score} pts
                    </span>

                    {attempted && stats && (
                      <span
                        className="ml-auto flex items-center gap-1 font-bold"
                        style={{ color: BAND_COLOR[stats.bestBand] ?? "#1A3A8C" }}
                      >
                        {stats.count > 1 ? <RotateCcw size={11} /> : <Trophy size={11} />}
                        {stats.bestScore}/{exam.max_score}
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px]"
                          style={{
                            background: (BAND_COLOR[stats.bestBand] ?? "#1A3A8C") + "18",
                            color: BAND_COLOR[stats.bestBand] ?? "#1A3A8C",
                          }}
                        >
                          {stats.bestBand}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
