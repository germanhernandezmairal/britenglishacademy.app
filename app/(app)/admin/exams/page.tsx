import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { ArrowLeft, GraduationCap, Plus } from "lucide-react"
import { ExamRow } from "./_components/ExamRow"

export const metadata: Metadata = { title: "Exámenes | Admin | Brit English Academy" }

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  A1: { bg: "#FFF8E7", text: "#D4A017" }, A2: { bg: "#FFF8E7", text: "#D4A017" },
  B1: { bg: "#EEF1FA", text: "#1A3A8C" }, B2: { bg: "#EEF1FA", text: "#1A3A8C" },
  C1: { bg: "#D5DCF3", text: "#012169" }, C2: { bg: "#D5DCF3", text: "#012169" },
}

const SKILL_LABELS: Record<string, string> = {
  reading: "Comprensión lectora",
  writing: "Expresión escrita",
  listening: "Comprensión auditiva",
  speaking_prep: "Preparación oral",
  grammar: "Gramática",
  use_of_english: "Uso del inglés",
}

export default async function AdminExamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!me || !["admin", "teacher"].includes(me.role)) redirect("/dashboard")

  const admin = await createAdminClient()
  const { data: exams } = await admin
    .from("exams")
    .select("id, title, description, level, skill, exam_type, time_limit_minutes, max_score, is_published, created_at")
    .order("level", { ascending: true })
    .order("skill", { ascending: true })

  const list = exams ?? []
  const publishedCount = list.filter((e) => e.is_published).length

  // Group by level
  const byLevel: Record<string, typeof list> = {}
  for (const exam of list) {
    const l = exam.level ?? "Sin nivel"
    if (!byLevel[l]) byLevel[l] = []
    byLevel[l].push(exam)
  }

  const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"]
  const orderedLevels = [
    ...LEVEL_ORDER.filter((l) => byLevel[l]),
    ...Object.keys(byLevel).filter((l) => !LEVEL_ORDER.includes(l)),
  ]

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin" className="flex items-center gap-1.5 text-xs font-medium hover:underline"
          style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={13} /> Panel Admin
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
          >
            Exámenes
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {publishedCount} publicados · {list.length} en total
          </p>
        </div>
        <Link
          href="/admin/exams/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: "var(--color-primary)" }}
        >
          <Plus size={15} /> Nuevo examen
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border"
          style={{ background: "white", borderColor: "var(--color-border)" }}>
          <GraduationCap size={40} className="mb-4 opacity-20" style={{ color: "var(--color-primary)" }} />
          <p className="text-sm font-medium mb-4" style={{ color: "var(--color-text-muted)" }}>
            Aún no hay exámenes creados.
          </p>
          <Link
            href="/admin/exams/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--color-primary)" }}
          >
            <Plus size={14} /> Crear primer examen
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orderedLevels.map((levelKey) => {
            const lc = LEVEL_COLORS[levelKey]
            return (
              <div key={levelKey}>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-sm font-bold px-3 py-1 rounded-full"
                    style={{ background: lc?.bg ?? "#EEF1FA", color: lc?.text ?? "#1A3A8C" }}
                  >
                    {levelKey}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {byLevel[levelKey].length} examen{byLevel[levelKey].length !== 1 ? "es" : ""}
                  </span>
                </div>
                <div
                  className="rounded-2xl border overflow-hidden divide-y"
                  style={{ background: "white", borderColor: "var(--color-border)" }}
                >
                  {byLevel[levelKey].map((exam) => (
                    <ExamRow
                      key={exam.id}
                      exam={{
                        id: exam.id,
                        title: exam.title,
                        skill: exam.skill,
                        exam_type: exam.exam_type,
                        time_limit_minutes: exam.time_limit_minutes,
                        max_score: exam.max_score,
                        is_published: exam.is_published,
                        skill_label: SKILL_LABELS[exam.skill] ?? exam.skill,
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
