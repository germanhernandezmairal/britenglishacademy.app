import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ExamDetail } from "./_components/ExamDetail"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("exams").select("title").eq("id", id).single()
  return { title: data ? `${data.title} | Brit English Academy` : "Examen" }
}

export default async function ExamDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [examRes, profileRes, submissionsRes] = await Promise.all([
    supabase
      .from("exams")
      .select("id, title, description, level, skill, exam_type, pdf_url, questions, time_limit_minutes, max_score, is_published")
      .eq("id", id)
      .single(),
    supabase
      .from("profiles")
      .select("level, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("exam_submissions")
      .select("id, score, band_score, status, submitted_at, claude_feedback, teacher_feedback, teacher_override_score")
      .eq("exam_id", id)
      .eq("student_id", user.id)
      .order("submitted_at", { ascending: false }),
  ])

  const exam = examRes.data
  const profile = profileRes.data

  if (!exam?.is_published) notFound()
  if (!profile) redirect("/login")
  if (profile.role !== "admin" && exam.level !== profile.level) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questions = (Array.isArray(exam.questions) ? exam.questions : []) as any[]

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <ExamDetail
        exam={{
          id: exam.id,
          title: exam.title,
          description: exam.description,
          level: exam.level,
          skill: exam.skill,
          exam_type: exam.exam_type,
          pdf_url: exam.pdf_url,
          questions,
          time_limit_minutes: exam.time_limit_minutes,
          max_score: exam.max_score,
        }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialAttempts={(submissionsRes.data ?? []) as any[]}
      />
    </div>
  )
}
