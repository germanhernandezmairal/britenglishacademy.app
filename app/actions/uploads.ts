"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"

const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB
const ALLOWED_PREFIXES = ["exam-pdfs", "lesson-pdfs"]

async function isStaff(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  return !!profile && ["admin", "teacher"].includes(profile.role)
}

export async function uploadResource(
  formData: FormData
): Promise<{ url: string; name: string; size: number } | { error: string }> {
  if (!(await isStaff())) return { error: "No autorizado" }

  const file = formData.get("file") as File | null
  const prefix = (formData.get("prefix") as string | null) ?? ""

  if (!file || file.size === 0) return { error: "Debes seleccionar un archivo" }
  if (file.size > MAX_FILE_BYTES) return { error: "El archivo no puede superar 20 MB" }
  if (file.type !== "application/pdf") return { error: "Solo se permiten archivos PDF" }
  if (!ALLOWED_PREFIXES.includes(prefix)) return { error: "Destino inválido" }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const path = `${prefix}/${Date.now()}-${crypto.randomUUID()}-${safeName}`
  const buffer = await file.arrayBuffer()

  const admin = await createAdminClient()
  const { error: uploadError } = await admin.storage
    .from("resources")
    .upload(path, buffer, { contentType: "application/pdf", upsert: false })

  if (uploadError) {
    return { error: "Error al subir el archivo. Verifica que el bucket 'resources' existe." }
  }

  const { data } = admin.storage.from("resources").getPublicUrl(path)
  return { url: data.publicUrl, name: file.name, size: file.size }
}
