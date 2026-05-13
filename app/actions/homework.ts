"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { notifyHomeworkSubmitted } from "@/lib/notify"

const ALLOWED_MIME_TYPES = [
  "text/plain",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]

const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB

type ClaudeFeedback = {
  summary: string
  score_estimate: number
  strengths: string[]
  focus_areas: string[]
  errors: Array<{
    type: string
    original: string
    correction: string
    explanation: string
  }>
}

async function analyzeWithClaude(
  fileType: string,
  fileBuffer: ArrayBuffer
): Promise<ClaudeFeedback | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default
    const anthropic = new Anthropic({ apiKey })

    const system = `You are a CEFR-certified English teacher analysing student homework. Return ONLY a valid JSON object with no markdown or code fences, matching this structure exactly:
{"summary":"2-3 sentence assessment","score_estimate":75,"strengths":["strength 1","strength 2"],"focus_areas":["area 1","area 2"],"errors":[{"type":"grammar","original":"wrong text","correction":"correct text","explanation":"why"}]}
score_estimate is an integer 0-100. Limit errors to the 5 most important ones.`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let content: any[]

    if (fileType === "text/plain") {
      const text = new TextDecoder().decode(fileBuffer).trim()
      if (!text) return null
      content = [{ type: "text", text: `Analyse this student homework:\n\n${text.slice(0, 8000)}` }]
    } else if (fileType === "application/pdf") {
      const base64 = Buffer.from(fileBuffer).toString("base64")
      content = [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
        { type: "text", text: "Analyse this student homework PDF." },
      ]
    } else if (fileType === "image/jpeg" || fileType === "image/png") {
      const base64 = Buffer.from(fileBuffer).toString("base64")
      content = [
        { type: "image", source: { type: "base64", media_type: fileType, data: base64 } },
        { type: "text", text: "Analyse the written English text in this student homework image." },
      ]
    } else {
      return null // .doc / .docx — binary, skip AI scan
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content }],
    })

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : ""
    return JSON.parse(raw) as ClaudeFeedback
  } catch {
    return null
  }
}

export async function submitHomework(formData: FormData) {
  const supabase = await createClient()
  const adminSupabase = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const title = (formData.get("title") as string | null)?.trim() ?? ""
  const description = (formData.get("description") as string | null)?.trim() || null
  const file = formData.get("file") as File | null

  if (title.length < 2) return { error: "El título es obligatorio (mínimo 2 caracteres)" }
  if (!file || file.size === 0) return { error: "Debes seleccionar un archivo" }
  if (file.size > MAX_FILE_BYTES) return { error: "El archivo no puede superar 20 MB" }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: "Formato no permitido. Acepta: PDF, Word, TXT, JPG, PNG" }
  }

  const ext = file.name.split(".").pop() ?? "bin"
  const storagePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`
  const fileBuffer = await file.arrayBuffer()

  const { error: uploadError } = await adminSupabase.storage
    .from("homework")
    .upload(storagePath, fileBuffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return { error: "Error al subir el archivo. Asegúrate de que el bucket 'homework' existe en Supabase Storage." }
  }

  const { data: submission, error: insertError } = await supabase
    .from("homework_submissions")
    .insert({
      student_id: user.id,
      title,
      description,
      file_url: storagePath,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      status: "pending",
    })
    .select("id")
    .single()

  if (insertError || !submission) {
    await adminSupabase.storage.from("homework").remove([storagePath])
    return { error: "Error al guardar el envío. Inténtalo de nuevo." }
  }

  // Run Claude pre-scan (non-blocking failure — submission always succeeds)
  const claudeFeedback = await analyzeWithClaude(file.type, fileBuffer)

  if (claudeFeedback) {
    await supabase
      .from("homework_submissions")
      .update({ claude_feedback: claudeFeedback })
      .eq("id", submission.id)
  }

  // Fetch student name then notify staff after response is sent
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single()
  const studentName = profile?.full_name ?? "Estudiante"
  after(async () => { await notifyHomeworkSubmitted(user.id, studentName, title) })

  revalidatePath("/homework")
  revalidatePath("/dashboard")
  return { success: true, submissionId: submission.id }
}

export async function deleteHomeworkSubmission(submissionId: string) {
  const supabase = await createClient()
  const adminSupabase = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: submission } = await supabase
    .from("homework_submissions")
    .select("file_url, student_id, status")
    .eq("id", submissionId)
    .single()

  if (!submission || submission.student_id !== user.id) return { error: "No autorizado" }
  if (submission.status !== "pending") return { error: "Solo puedes eliminar envíos pendientes" }

  await adminSupabase.storage.from("homework").remove([submission.file_url])
  await supabase.from("homework_submissions").delete().eq("id", submissionId)

  revalidatePath("/homework")
  revalidatePath("/dashboard")
  return { success: true }
}
