import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { ArrowLeft, BookOpen, Plus } from "lucide-react"
import { LessonRow } from "./_components/LessonRow"

export const metadata: Metadata = { title: "Lecciones | Admin | Brit English Academy" }

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  A1: { bg: "#FFF8E7", text: "#D4A017" }, A2: { bg: "#FFF8E7", text: "#D4A017" },
  B1: { bg: "#EEF1FA", text: "#1A3A8C" }, B2: { bg: "#EEF1FA", text: "#1A3A8C" },
  C1: { bg: "#D5DCF3", text: "#012169" }, C2: { bg: "#D5DCF3", text: "#012169" },
}

export default async function AdminLessonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!me || !["admin", "teacher"].includes(me.role)) redirect("/dashboard")

  const admin = await createAdminClient()
  const { data: lessons } = await admin
    .from("lessons")
    .select("id, title, description, level, video_url, is_published, order_index, created_at")
    .order("level", { ascending: true })
    .order("order_index", { ascending: true })

  const list = lessons ?? []
  const publishedCount = list.filter((l) => l.is_published).length

  // Group by level
  const byLevel: Record<string, typeof list> = {}
  for (const lesson of list) {
    const l = lesson.level ?? "Sin nivel"
    if (!byLevel[l]) byLevel[l] = []
    byLevel[l].push(lesson)
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
            Lecciones
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {publishedCount} publicadas · {list.length} en total
          </p>
        </div>
        <Link
          href="/admin/lessons/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: "var(--color-primary)", color: "#fff" }}
        >
          <Plus size={15} /> Nueva lección
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border"
          style={{ background: "white", borderColor: "var(--color-border)" }}>
          <BookOpen size={40} className="mb-4 opacity-20" style={{ color: "var(--color-primary)" }} />
          <p className="text-sm font-medium mb-4" style={{ color: "var(--color-text-muted)" }}>
            Aún no hay lecciones creadas.
          </p>
          <Link
            href="/admin/lessons/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--color-primary)", color: "#fff" }}
          >
            <Plus size={14} /> Crear primera lección
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
                    {byLevel[levelKey].length} lección{byLevel[levelKey].length !== 1 ? "es" : ""}
                  </span>
                </div>
                <div
                  className="rounded-2xl border overflow-hidden divide-y"
                  style={{ background: "white", borderColor: "var(--color-border)", borderWidth: 1 }}
                >
                  {byLevel[levelKey].map((lesson) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={{
                        id: lesson.id,
                        title: lesson.title,
                        description: lesson.description,
                        level: lesson.level,
                        video_url: lesson.video_url,
                        is_published: lesson.is_published,
                        order_index: lesson.order_index,
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
