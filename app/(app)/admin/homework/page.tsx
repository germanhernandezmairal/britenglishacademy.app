import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { ArrowLeft, ClipboardList } from "lucide-react"
import { ReviewCard } from "./_components/ReviewCard"

export const metadata: Metadata = { title: "Deberes | Admin | Brit English Academy" }

const SIGNED_URL_EXPIRY = 3600

export default async function AdminHomeworkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!me || !["admin", "teacher"].includes(me.role)) redirect("/dashboard")

  const admin = await createAdminClient()

  const { data: rows } = await admin
    .from("homework_submissions")
    .select("id, title, description, file_url, file_name, file_size, file_type, status, submitted_at, reviewed_at, teacher_feedback, claude_feedback, student_id")
    .order("submitted_at", { ascending: false })

  // Enrich with student profiles
  const studentIds = [...new Set((rows ?? []).map((r) => r.student_id))]
  const { data: studentProfiles } = studentIds.length > 0
    ? await admin.from("profiles").select("id, full_name, level, avatar_url").in("id", studentIds)
    : { data: [] as { id: string; full_name: string; level: string | null; avatar_url: string | null }[] }

  const studentMap: Record<string, { full_name: string; level: string | null }> = {}
  for (const p of studentProfiles ?? []) studentMap[p.id] = p

  // Generate signed URLs
  const submissions = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { data: signedData } = await admin.storage
        .from("homework")
        .createSignedUrl(row.file_url, SIGNED_URL_EXPIRY)

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        file_name: row.file_name,
        file_size: row.file_size,
        status: row.status as "pending" | "under_review" | "corrected",
        submitted_at: row.submitted_at,
        reviewed_at: row.reviewed_at,
        teacher_feedback: row.teacher_feedback,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        claude_feedback: (row.claude_feedback as any) ?? null,
        download_url: signedData?.signedUrl ?? null,
        student: studentMap[row.student_id] ?? { full_name: "Alumno desconocido", level: null },
      }
    })
  )

  const pending      = submissions.filter((s) => s.status === "pending")
  const underReview  = submissions.filter((s) => s.status === "under_review")
  const corrected    = submissions.filter((s) => s.status === "corrected")

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin" className="flex items-center gap-1.5 text-xs font-medium hover:underline"
          style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={13} /> Panel Admin
        </Link>
      </div>

      <div className="mb-8">
        <h1
          className="text-2xl md:text-3xl font-bold mb-1"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
        >
          Cola de Deberes
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {pending.length} pendiente{pending.length !== 1 ? "s" : ""} ·{" "}
          {underReview.length} en revisión ·{" "}
          {corrected.length} corregido{corrected.length !== 1 ? "s" : ""}
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border"
          style={{ background: "white", borderColor: "var(--color-border)" }}>
          <ClipboardList size={40} className="mb-4 opacity-20" style={{ color: "var(--color-primary)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
            No hay envíos de deberes todavía.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold" style={{ color: "#D4A017" }}>Pendientes</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#FFF8E7", color: "#D4A017" }}
                >
                  {pending.length}
                </span>
              </div>
              <div className="space-y-3">
                {pending.map((sub) => <ReviewCard key={sub.id} submission={sub} />)}
              </div>
            </section>
          )}

          {underReview.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>En revisión</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#EEF1FA", color: "var(--color-primary)" }}
                >
                  {underReview.length}
                </span>
              </div>
              <div className="space-y-3">
                {underReview.map((sub) => <ReviewCard key={sub.id} submission={sub} />)}
              </div>
            </section>
          )}

          {corrected.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold" style={{ color: "#16A34A" }}>Corregidos</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#D1FAE5", color: "#16A34A" }}
                >
                  {corrected.length}
                </span>
              </div>
              <div className="space-y-3">
                {corrected.map((sub) => <ReviewCard key={sub.id} submission={sub} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
