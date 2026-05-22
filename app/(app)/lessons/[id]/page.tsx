import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft, FileText, Download, BookOpen } from "lucide-react"
import { VideoPlayer } from "./_components/VideoPlayer"
import { CompletionButton } from "./_components/CompletionButton"
import { CommentsSection } from "./_components/CommentsSection"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("lessons").select("title").eq("id", id).single()
  return { title: data ? `${data.title} | Brit English School` : "Lección" }
}

type VocabItem = { word: string; definition: string; example?: string }
type PdfResource = { name: string; url: string; size?: number }

export default async function LessonDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [lessonRes, profileRes, completionRes, commentsRes] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, title, description, level, video_url, video_source, thumbnail_url, vocabulary, pdf_resources")
      .eq("id", id)
      .eq("is_published", true)
      .single(),
    supabase
      .from("profiles")
      .select("level, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("lesson_completions")
      .select("id")
      .eq("student_id", user.id)
      .eq("lesson_id", id)
      .maybeSingle(),
    supabase
      .from("lesson_comments")
      .select("id, content, created_at, author:profiles(id, full_name, avatar_url)")
      .eq("lesson_id", id)
      .order("created_at", { ascending: true }),
  ])

  const lesson = lessonRes.data
  const profile = profileRes.data

  if (!lesson) notFound()
  if (!profile) redirect("/login")

  // Students only see lessons at their own level; admins see all
  if (profile.role !== "admin" && lesson.level !== profile.level) notFound()

  const isCompleted = !!completionRes.data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vocabulary: VocabItem[] = Array.isArray(lesson.vocabulary) ? (lesson.vocabulary as any[]) : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfResources: PdfResource[] = Array.isArray(lesson.pdf_resources) ? (lesson.pdf_resources as any[]) : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comments = (commentsRes.data ?? []) as any[]

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Back nav */}
      <Link
        href="/lessons"
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:underline"
        style={{ color: "var(--color-text-muted)" }}
      >
        <ArrowLeft size={15} />
        Volver a lecciones
      </Link>

      {/* Title + badges */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}
          >
            {lesson.level}
          </span>
          {isCompleted && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#D1FAE5", color: "#16A34A" }}
            >
              ✓ Completada
            </span>
          )}
        </div>
        <h1
          className="text-2xl md:text-3xl font-bold leading-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
        >
          {lesson.title}
        </h1>
        {lesson.description && (
          <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            {lesson.description}
          </p>
        )}
      </div>

      {/* Video */}
      {lesson.video_url && (
        <div className="mb-8">
          <VideoPlayer
            videoUrl={lesson.video_url}
            videoSource={lesson.video_source ?? "youtube"}
            title={lesson.title}
          />
        </div>
      )}

      {/* Vocabulary */}
      {vocabulary.length > 0 && (
        <div
          className="mb-8 p-6 rounded-2xl border"
          style={{ background: "white", borderColor: "var(--color-border)" }}
        >
          <h2
            className="text-base font-bold mb-4 flex items-center gap-2"
            style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
          >
            <BookOpen size={18} style={{ color: "var(--color-primary)" }} />
            Vocabulario
          </h2>
          <div className="space-y-3">
            {vocabulary.map((item, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ background: "var(--color-bg-alt)" }}>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-sm" style={{ color: "var(--color-primary)" }}>
                    {item.word}
                  </span>
                  <span className="text-xs mt-0.5 flex-1" style={{ color: "var(--color-text-muted)" }}>
                    — {item.definition}
                  </span>
                </div>
                {item.example && (
                  <p
                    className="text-xs mt-1.5 italic pl-2 border-l-2"
                    style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-primary-200)" }}
                  >
                    &ldquo;{item.example}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDF Resources */}
      {pdfResources.length > 0 && (
        <div
          className="mb-8 p-6 rounded-2xl border"
          style={{ background: "white", borderColor: "var(--color-border)" }}
        >
          <h2
            className="text-base font-bold mb-4 flex items-center gap-2"
            style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
          >
            <FileText size={18} style={{ color: "var(--color-primary)" }} />
            Recursos descargables
          </h2>
          <div className="space-y-2">
            {pdfResources.map((pdf, i) => (
              <a
                key={i}
                href={pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:border-[#A6B4E4]"
                style={{ background: "var(--color-bg-alt)", borderColor: "var(--color-border)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--color-primary-50)" }}
                >
                  <FileText size={16} style={{ color: "#C8102E" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
                    {pdf.name}
                  </div>
                  {pdf.size && (
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {(pdf.size / 1024).toFixed(0)} KB
                    </div>
                  )}
                </div>
                <Download size={15} style={{ color: "var(--color-text-muted)" }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Completion toggle */}
      <div className="mb-10">
        <CompletionButton lessonId={lesson.id} isCompleted={isCompleted} />
      </div>

      {/* Comments */}
      <CommentsSection
        lessonId={lesson.id}
        comments={comments}
        currentUserId={user.id}
      />
    </div>
  )
}
