"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { notifyHomeworkCorrected } from "@/lib/notify"

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!profile || !["admin", "teacher"].includes(profile.role)) return null
  return { userId: user.id, role: profile.role as string }
}

export async function updateStudentLevel(studentId: string, level: string) {
  const auth = await getAdminUser()
  if (!auth) return { error: "No autorizado" }

  if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)) return { error: "Nivel inválido" }

  const admin = await createAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({ level, updated_at: new Date().toISOString() })
    .eq("id", studentId)

  if (error) return { error: "Error al actualizar el nivel" }
  revalidatePath("/admin/students")
  revalidatePath("/admin")
  return { success: true }
}

export async function toggleStudentActive(studentId: string, currentlyActive: boolean) {
  const auth = await getAdminUser()
  if (!auth) return { error: "No autorizado" }

  const admin = await createAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({ is_active: !currentlyActive, updated_at: new Date().toISOString() })
    .eq("id", studentId)

  if (error) return { error: "Error al actualizar el estado" }
  revalidatePath("/admin/students")
  revalidatePath("/admin")
  return { success: true, is_active: !currentlyActive }
}

export async function updateHomeworkStatus(
  submissionId: string,
  status: "pending" | "under_review" | "corrected",
  teacherFeedback?: string
) {
  const auth = await getAdminUser()
  if (!auth) return { error: "No autorizado" }

  const admin = await createAdminClient()

  type Payload = Record<string, string | null>
  const payload: Payload = { status }
  if (teacherFeedback !== undefined) {
    payload.teacher_feedback = teacherFeedback.trim() || null
  }
  if (status !== "pending") {
    payload.reviewed_at = new Date().toISOString()
  }

  const { data: submission } = await admin
    .from("homework_submissions")
    .select("student_id, title")
    .eq("id", submissionId)
    .single()

  const { error } = await admin
    .from("homework_submissions")
    .update(payload)
    .eq("id", submissionId)

  if (error) return { error: "Error al actualizar" }

  // Notify student when their homework is corrected
  if (status === "corrected" && submission) {
    const { data: studentProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", submission.student_id)
      .single()
    const studentName = studentProfile?.full_name ?? "Estudiante"
    after(async () => {
      await notifyHomeworkCorrected(submission.student_id, studentName, submission.title)
    })
  }

  revalidatePath("/admin/homework")
  revalidatePath("/admin")
  return { success: true }
}

export async function createLesson(formData: FormData) {
  const auth = await getAdminUser()
  if (!auth) return { error: "No autorizado" }

  const title = (formData.get("title") as string ?? "").trim()
  const description = (formData.get("description") as string ?? "").trim() || null
  const level = formData.get("level") as string
  const video_url = (formData.get("video_url") as string ?? "").trim() || null
  const order_index = parseInt(formData.get("order_index") as string ?? "0") || 0
  const is_published = formData.get("is_published") === "true"

  if (title.length < 2) return { error: "El título es obligatorio (mín. 2 caracteres)" }
  if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)) return { error: "Nivel inválido" }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from("lessons")
    .insert({ title, description, level, video_url, order_index, is_published, created_by: auth.userId })
    .select("id")
    .single()

  if (error || !data) return { error: "Error al crear la lección" }
  revalidatePath("/admin/lessons")
  revalidatePath("/lessons")
  return { success: true, id: data.id }
}

export async function updateLesson(lessonId: string, formData: FormData) {
  const auth = await getAdminUser()
  if (!auth) return { error: "No autorizado" }

  const title = (formData.get("title") as string ?? "").trim()
  const description = (formData.get("description") as string ?? "").trim() || null
  const level = formData.get("level") as string
  const video_url = (formData.get("video_url") as string ?? "").trim() || null
  const order_index = parseInt(formData.get("order_index") as string ?? "0") || 0
  const is_published = formData.get("is_published") === "true"

  if (title.length < 2) return { error: "El título es obligatorio" }

  const admin = await createAdminClient()
  const { error } = await admin
    .from("lessons")
    .update({ title, description, level, video_url, order_index, is_published, updated_at: new Date().toISOString() })
    .eq("id", lessonId)

  if (error) return { error: "Error al actualizar" }
  revalidatePath("/admin/lessons")
  revalidatePath("/lessons")
  revalidatePath(`/lessons/${lessonId}`)
  return { success: true }
}

export async function deleteLesson(lessonId: string) {
  const auth = await getAdminUser()
  if (!auth) return { error: "No autorizado" }

  const admin = await createAdminClient()
  const { error } = await admin.from("lessons").delete().eq("id", lessonId)
  if (error) return { error: "Error al eliminar" }

  revalidatePath("/admin/lessons")
  revalidatePath("/lessons")
  return { success: true }
}

export async function toggleLessonPublished(lessonId: string, isPublished: boolean) {
  const auth = await getAdminUser()
  if (!auth) return { error: "No autorizado" }

  const admin = await createAdminClient()
  const { error } = await admin
    .from("lessons")
    .update({ is_published: !isPublished, updated_at: new Date().toISOString() })
    .eq("id", lessonId)

  if (error) return { error: "Error al cambiar el estado" }
  revalidatePath("/admin/lessons")
  revalidatePath("/lessons")
  return { success: true, is_published: !isPublished }
}

type ExamQuestion = {
  id: string
  type: "mcq" | "gap_fill" | "open_text"
  question: string
  options?: string[]
  correct_answer?: string
  max_score: number
}

function parseExamForm(formData: FormData):
  | { error: string }
  | {
      values: {
        title: string; description: string | null; level: string; skill: string
        exam_type: string; time_limit_minutes: number | null; max_score: number
        is_published: boolean; questions: ExamQuestion[]; pdf_url: string | null
      }
    } {
  const title = (formData.get("title") as string ?? "").trim()
  const description = (formData.get("description") as string ?? "").trim() || null
  const level = formData.get("level") as string
  const skill = formData.get("skill") as string
  const exam_type = formData.get("exam_type") as string
  const timeLimitRaw = (formData.get("time_limit_minutes") as string ?? "").trim()
  const time_limit_minutes = timeLimitRaw ? (parseInt(timeLimitRaw) || null) : null
  const is_published = formData.get("is_published") === "true"
  const pdf_url = (formData.get("pdf_url") as string ?? "").trim() || null

  if (title.length < 2) return { error: "El título es obligatorio" }
  if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)) return { error: "Nivel inválido" }
  if (!["reading", "writing", "listening", "speaking_prep", "grammar", "use_of_english"].includes(skill))
    return { error: "Habilidad inválida" }
  if (!["pdf_practice", "interactive"].includes(exam_type)) return { error: "Tipo inválido" }

  let questions: ExamQuestion[] = []
  if (exam_type === "interactive") {
    try {
      questions = JSON.parse((formData.get("questions") as string) || "[]")
    } catch {
      return { error: "Preguntas con formato inválido" }
    }
    if (!Array.isArray(questions) || questions.length === 0)
      return { error: "Añade al menos una pregunta" }
    for (const q of questions) {
      if (!q.question?.trim()) return { error: "Cada pregunta necesita un enunciado" }
      if (!(Number(q.max_score) >= 1)) return { error: "Cada pregunta necesita puntos (≥1)" }
      if (q.type === "mcq") {
        const opts = (q.options ?? []).filter((o: string) => o?.trim())
        if (opts.length < 2) return { error: "Las preguntas de opción múltiple necesitan ≥2 opciones" }
        if (!q.correct_answer || !opts.includes(q.correct_answer))
          return { error: "Marca la opción correcta en cada pregunta de opción múltiple" }
      } else if (q.type === "gap_fill") {
        if (!q.correct_answer?.trim()) return { error: "Las preguntas de hueco necesitan respuesta correcta" }
      }
    }
  } else {
    // pdf_practice
    if (!pdf_url) return { error: "Sube el PDF del examen" }
  }

  // Interactive max_score is derived from questions; PDF uses the manual field.
  const max_score =
    exam_type === "interactive"
      ? questions.reduce((s, q) => s + (Number(q.max_score) || 0), 0)
      : (parseInt(formData.get("max_score") as string ?? "100") || 100)

  return {
    values: { title, description, level, skill, exam_type, time_limit_minutes, max_score, is_published, questions, pdf_url },
  }
}

export async function createExam(formData: FormData) {
  const auth = await getAdminUser()
  if (!auth) return { error: "No autorizado" }

  const parsed = parseExamForm(formData)
  if ("error" in parsed) return parsed
  const v = parsed.values

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from("exams")
    .insert({
      title: v.title, description: v.description, level: v.level, skill: v.skill,
      exam_type: v.exam_type, time_limit_minutes: v.time_limit_minutes, max_score: v.max_score,
      is_published: v.is_published, questions: v.questions, pdf_url: v.pdf_url,
    })
    .select("id")
    .single()

  if (error || !data) return { error: "Error al crear el examen" }
  revalidatePath("/admin/exams")
  revalidatePath("/exams")
  return { success: true, id: data.id }
}

export async function updateExam(examId: string, formData: FormData) {
  const auth = await getAdminUser()
  if (!auth) return { error: "No autorizado" }

  const parsed = parseExamForm(formData)
  if ("error" in parsed) return parsed
  const v = parsed.values

  const admin = await createAdminClient()
  const { error } = await admin
    .from("exams")
    .update({
      title: v.title, description: v.description, level: v.level, skill: v.skill,
      exam_type: v.exam_type, time_limit_minutes: v.time_limit_minutes, max_score: v.max_score,
      is_published: v.is_published, questions: v.questions, pdf_url: v.pdf_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", examId)

  if (error) return { error: "Error al actualizar el examen" }
  revalidatePath("/admin/exams")
  revalidatePath("/exams")
  revalidatePath(`/exams/${examId}`)
  return { success: true }
}

export async function deleteExam(examId: string) {
  const auth = await getAdminUser()
  if (!auth) return { error: "No autorizado" }

  const admin = await createAdminClient()
  const { error } = await admin.from("exams").delete().eq("id", examId)
  if (error) return { error: "Error al eliminar" }

  revalidatePath("/admin/exams")
  revalidatePath("/exams")
  return { success: true }
}

export async function toggleExamPublished(examId: string, isPublished: boolean) {
  const auth = await getAdminUser()
  if (!auth) return { error: "No autorizado" }

  const admin = await createAdminClient()
  const { error } = await admin
    .from("exams")
    .update({ is_published: !isPublished, updated_at: new Date().toISOString() })
    .eq("id", examId)

  if (error) return { error: "Error al cambiar el estado" }
  revalidatePath("/admin/exams")
  revalidatePath("/exams")
  return { success: true, is_published: !isPublished }
}
