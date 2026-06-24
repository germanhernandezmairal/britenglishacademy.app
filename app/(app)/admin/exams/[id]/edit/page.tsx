import type { Metadata } from "next"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import { ExamForm, type ExamFormData } from "../../_components/ExamForm"
import type { Question } from "../../_components/QuestionEditor"

export const metadata: Metadata = { title: "Editar Examen | Admin | Brit English Academy" }

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!me || !["admin", "teacher"].includes(me.role)) redirect("/dashboard")

  const admin = await createAdminClient()
  const { data: exam } = await admin
    .from("exams")
    .select("id, title, description, level, skill, exam_type, time_limit_minutes, max_score, is_published, questions, pdf_url")
    .eq("id", id)
    .single()

  if (!exam) notFound()

  const formData: ExamFormData = {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    level: exam.level,
    skill: exam.skill,
    exam_type: exam.exam_type,
    time_limit_minutes: exam.time_limit_minutes,
    max_score: exam.max_score,
    is_published: exam.is_published,
    questions: (Array.isArray(exam.questions) ? exam.questions : []) as Question[],
    pdf_url: exam.pdf_url,
  }

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/exams" className="flex items-center gap-1.5 text-xs font-medium hover:underline"
          style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={13} /> Exámenes
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
        Editar examen
      </h1>
      <div className="p-6 rounded-2xl border" style={{ background: "white", borderColor: "var(--color-border)" }}>
        <ExamForm exam={formData} />
      </div>
    </div>
  )
}
