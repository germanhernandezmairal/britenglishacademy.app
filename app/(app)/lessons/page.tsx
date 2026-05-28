import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BookOpen, CheckCircle2, Play } from "lucide-react"

export const metadata: Metadata = { title: "Lecciones | Brit English Academy" }

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A1: { bg: "#FFF8E7", text: "#D4A017", border: "#F0C842" },
  A2: { bg: "#FFF8E7", text: "#D4A017", border: "#F0C842" },
  B1: { bg: "#EEF1FA", text: "#1A3A8C", border: "#A6B4E4" },
  B2: { bg: "#EEF1FA", text: "#1A3A8C", border: "#A6B4E4" },
  C1: { bg: "#D5DCF3", text: "#012169", border: "#6B83C8" },
  C2: { bg: "#D5DCF3", text: "#012169", border: "#6B83C8" },
}

export default async function LessonsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("level")
    .eq("id", user.id)
    .single()

  if (!profile?.level) redirect("/onboarding")

  const [lessonsRes, completionsRes] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, title, description, level, video_url, thumbnail_url, order_index")
      .eq("is_published", true)
      .eq("level", profile.level)
      .order("order_index", { ascending: true }),
    supabase
      .from("lesson_completions")
      .select("lesson_id")
      .eq("student_id", user.id),
  ])

  const lessons = lessonsRes.data ?? []
  const completedIds = new Set((completionsRes.data ?? []).map((c) => c.lesson_id))
  const completedCount = completedIds.size
  const levelColor = LEVEL_COLORS[profile.level] ?? LEVEL_COLORS.B1

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
          >
            Lecciones
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Tu plan de estudio para nivel {profile.level}
          </p>
        </div>

        <div
          className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl border"
          style={{ background: levelColor.bg, borderColor: levelColor.border }}
        >
          <span className="text-lg font-bold" style={{ color: levelColor.text }}>
            {profile.level}
          </span>
          <div className="text-xs" style={{ color: levelColor.text }}>
            <span className="font-semibold">{completedCount}</span>
            <span className="opacity-60"> / {lessons.length} completadas</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {lessons.length > 0 && (
        <div className="mb-8">
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: "var(--color-border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(completedCount / lessons.length) * 100}%`,
                background: levelColor.text,
              }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
            {completedCount === lessons.length && lessons.length > 0
              ? "✓ Has completado todas las lecciones de tu nivel"
              : `${lessons.length - completedCount} lección${lessons.length - completedCount !== 1 ? "es" : ""} por completar`}
          </p>
        </div>
      )}

      {/* Lessons grid */}
      {lessons.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl border"
          style={{ background: "white", borderColor: "var(--color-border)" }}
        >
          <BookOpen size={40} className="mb-4 opacity-20" style={{ color: "var(--color-primary)" }} />
          <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Lecciones en camino
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Tu profesor publicará lecciones para el nivel {profile.level} muy pronto.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lessons.map((lesson, index) => {
            const isCompleted = completedIds.has(lesson.id)

            return (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="group flex flex-col rounded-2xl border overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ background: "white", borderColor: "var(--color-border)" }}
              >
                {/* Thumbnail */}
                <div
                  className="relative h-40 flex items-center justify-center"
                  style={{
                    background: isCompleted
                      ? "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)"
                      : `linear-gradient(135deg, ${levelColor.bg} 0%, ${levelColor.border}44 100%)`,
                  }}
                >
                  {lesson.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lesson.thumbnail_url}
                      alt={lesson.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

                  {lesson.video_url && !isCompleted && (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/90 shadow-md group-hover:scale-110 transition-transform z-10">
                      <Play size={20} fill="currentColor" style={{ color: "var(--color-primary)" }} />
                    </div>
                  )}

                  {isCompleted && (
                    <CheckCircle2 size={36} className="text-green-500 drop-shadow z-10" />
                  )}

                  <div
                    className="absolute top-3 left-3 text-xs font-bold px-2 py-0.5 rounded-full z-10"
                    style={{ background: "white", color: "var(--color-text-muted)" }}
                  >
                    #{index + 1}
                  </div>

                  {isCompleted && (
                    <div
                      className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full z-10"
                      style={{ background: "#D1FAE5", color: "#16A34A" }}
                    >
                      Completada
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 flex flex-col flex-1">
                  <h3
                    className="text-sm font-bold leading-snug mb-1 line-clamp-2"
                    style={{ color: "var(--color-text)" }}
                  >
                    {lesson.title}
                  </h3>
                  {lesson.description && (
                    <p
                      className="text-xs leading-relaxed line-clamp-2 mb-3"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {lesson.description}
                    </p>
                  )}
                  <div className="mt-auto">
                    {lesson.video_url ? (
                      <span
                        className="inline-flex items-center gap-1 text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <Play size={11} fill="currentColor" />
                        Vídeo
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <BookOpen size={11} />
                        Lectura
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
