"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type Question = {
  id: string
  type: "mcq" | "gap_fill" | "open_text"
  question: string
  options?: string[]
  correct_answer?: string
  max_score: number
}

type PerQuestion = { question_id: string; earned: number; feedback: string }

type ClaudeFeedback = {
  summary: string
  per_question: PerQuestion[]
  strengths: string[]
  improvements: string[]
  detailed_feedback?: string
}

function getBand(pct: number): string {
  if (pct >= 90) return "A"
  if (pct >= 80) return "B"
  if (pct >= 70) return "C"
  if (pct >= 60) return "D"
  if (pct >= 40) return "E"
  return "U"
}

async function gradeOpenText(
  questions: Question[],
  answers: Record<string, string>,
  level: string,
  skill: string
): Promise<ClaudeFeedback> {
  const fallback: ClaudeFeedback = {
    summary: "Análisis de IA no disponible.",
    per_question: questions.map((q) => ({
      question_id: q.id,
      earned: Math.round(q.max_score * 0.5),
      feedback: "Revisión manual pendiente.",
    })),
    strengths: [],
    improvements: [],
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fallback

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default
    const anthropic = new Anthropic({ apiKey })

    const body = questions
      .map(
        (q) =>
          `Question ID: ${q.id}\nQuestion: ${q.question}\nMax score: ${q.max_score}\nStudent answer: ${answers[q.id] ?? "(no answer)"}`
      )
      .join("\n\n")

    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are a CEFR-certified English teacher grading a ${level}-level student's ${skill} exam. Return ONLY valid JSON (no markdown):
{"summary":"2-3 sentence assessment in Spanish","per_question":[{"question_id":"uuid","earned":7,"feedback":"1-2 sentences in Spanish"}],"strengths":["..."],"improvements":["..."]}
earned must not exceed each question's max_score.`,
      messages: [{ role: "user", content: `Grade these answers:\n\n${body}` }],
    })

    const raw = res.content[0].type === "text" ? res.content[0].text.trim() : ""
    return JSON.parse(raw) as ClaudeFeedback
  } catch {
    return fallback
  }
}

async function gradePdfResponse(
  essay: string,
  level: string,
  skill: string,
  maxScore: number
): Promise<{ score: number; band: string; summary: string; strengths: string[]; improvements: string[]; detailed_feedback: string }> {
  const fallback = {
    score: 0,
    band: "U",
    summary: "Análisis de IA no disponible.",
    strengths: [] as string[],
    improvements: [] as string[],
    detailed_feedback: "",
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fallback

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default
    const anthropic = new Anthropic({ apiKey })

    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are a CEFR-certified English teacher grading a ${level}-level student's ${skill} exam response. Return ONLY valid JSON (no markdown):
{"score":72,"band":"C","summary":"2-3 sentence assessment in Spanish","strengths":["..."],"improvements":["..."],"detailed_feedback":"Detailed paragraph in Spanish"}
score is 0-${maxScore}. band: A≥90%, B≥80%, C≥70%, D≥60%, E≥40%, U<40% of ${maxScore}.`,
      messages: [{ role: "user", content: `Grade this exam response:\n\n${essay.slice(0, 6000)}` }],
    })

    const raw = res.content[0].type === "text" ? res.content[0].text.trim() : ""
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export async function submitInteractiveExam(
  examId: string,
  answers: Record<string, string>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: exam } = await supabase
    .from("exams")
    .select("id, level, skill, questions, max_score, is_published")
    .eq("id", examId)
    .single()

  if (!exam?.is_published) return { error: "Examen no encontrado" }

  const questions = (Array.isArray(exam.questions) ? exam.questions : []) as Question[]

  // Auto-score MCQ and gap_fill
  let autoScore = 0
  const openTextQs: Question[] = []
  const autoGraded: Record<string, { correct: string; earned: number; max_score: number }> = {}

  for (const q of questions) {
    if (q.type === "mcq") {
      const got = (answers[q.id] ?? "").trim()
      const exp = (q.correct_answer ?? "").trim()
      const earned = got === exp ? q.max_score : 0
      autoScore += earned
      autoGraded[q.id] = { correct: exp, earned, max_score: q.max_score }
    } else if (q.type === "gap_fill") {
      const got = (answers[q.id] ?? "").trim().toLowerCase()
      const exp = (q.correct_answer ?? "").trim().toLowerCase()
      const earned = got === exp ? q.max_score : 0
      autoScore += earned
      autoGraded[q.id] = { correct: q.correct_answer ?? "", earned, max_score: q.max_score }
    } else {
      openTextQs.push(q)
    }
  }

  let claudeFeedback: ClaudeFeedback = { summary: "", per_question: [], strengths: [], improvements: [] }
  let claudeScore = 0

  if (openTextQs.length > 0) {
    claudeFeedback = await gradeOpenText(openTextQs, answers, exam.level, exam.skill)
    claudeScore = claudeFeedback.per_question.reduce((s, p) => s + p.earned, 0)
  }

  const totalScore = autoScore + claudeScore
  const pct = exam.max_score > 0 ? (totalScore / exam.max_score) * 100 : 0
  const band = getBand(pct)

  const { data: submission, error: insertError } = await supabase
    .from("exam_submissions")
    .insert({
      exam_id: examId,
      student_id: user.id,
      answers,
      score: totalScore,
      band_score: band,
      claude_feedback: claudeFeedback,
      status: "graded",
      graded_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (insertError || !submission) return { error: "Error al guardar el examen" }

  revalidatePath(`/exams/${examId}`)
  revalidatePath("/exams")
  revalidatePath("/dashboard")

  return {
    success: true as const,
    submissionId: submission.id,
    score: totalScore,
    maxScore: exam.max_score,
    band,
    percentage: Math.round(pct),
    claudeFeedback,
    autoGraded,
  }
}

export async function submitPdfExam(examId: string, essay: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  if (essay.trim().length < 10) return { error: "La respuesta es demasiado corta" }

  const { data: exam } = await supabase
    .from("exams")
    .select("id, level, skill, max_score, is_published")
    .eq("id", examId)
    .single()

  if (!exam?.is_published) return { error: "Examen no encontrado" }

  const grading = await gradePdfResponse(essay.trim(), exam.level, exam.skill, exam.max_score)
  const pct = exam.max_score > 0 ? (grading.score / exam.max_score) * 100 : 0
  const band = grading.band || getBand(pct)

  const { data: submission, error: insertError } = await supabase
    .from("exam_submissions")
    .insert({
      exam_id: examId,
      student_id: user.id,
      answers: { essay: essay.trim() },
      score: grading.score,
      band_score: band,
      claude_feedback: {
        summary: grading.summary,
        per_question: [],
        strengths: grading.strengths,
        improvements: grading.improvements,
        detailed_feedback: grading.detailed_feedback,
      },
      status: "graded",
      graded_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (insertError || !submission) return { error: "Error al guardar el examen" }

  revalidatePath(`/exams/${examId}`)
  revalidatePath("/exams")
  revalidatePath("/dashboard")

  return {
    success: true as const,
    submissionId: submission.id,
    score: grading.score,
    maxScore: exam.max_score,
    band,
    percentage: Math.round(pct),
    summary: grading.summary,
    strengths: grading.strengths,
    improvements: grading.improvements,
    detailedFeedback: grading.detailed_feedback,
  }
}
