"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function toggleLessonCompletion(lessonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { data: existing } = await supabase
    .from("lesson_completions")
    .select("id")
    .eq("student_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle()

  if (existing) {
    await supabase.from("lesson_completions").delete().eq("id", existing.id)
  } else {
    await supabase.from("lesson_completions").insert({ student_id: user.id, lesson_id: lessonId })
  }

  revalidatePath(`/lessons/${lessonId}`)
  revalidatePath("/lessons")
  revalidatePath("/dashboard")
  return { completed: !existing }
}

export async function addLessonComment(lessonId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const trimmed = content.trim()
  if (trimmed.length < 2) return { error: "Comentario muy corto" }
  if (trimmed.length > 1000) return { error: "Comentario demasiado largo" }

  const { data, error } = await supabase
    .from("lesson_comments")
    .insert({ lesson_id: lessonId, author_id: user.id, content: trimmed })
    .select("id, content, created_at, author:profiles(id, full_name, avatar_url)")
    .single()

  if (error || !data) return { error: "No se pudo publicar el comentario" }
  revalidatePath(`/lessons/${lessonId}`)
  return { success: true, comment: data }
}

export async function deleteLessonComment(commentId: string, lessonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  await supabase
    .from("lesson_comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id)

  revalidatePath(`/lessons/${lessonId}`)
  return { success: true }
}
