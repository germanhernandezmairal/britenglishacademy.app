"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

const ALLOWED_EMOJIS = ["❤️", "👏", "🔥", "😊", "🤔"]

export async function createPost(content: string, type: string = "student_post") {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const trimmed = content.trim()
  if (trimmed.length < 1) return { error: "El mensaje no puede estar vacío" }
  if (trimmed.length > 1000) return { error: "El mensaje no puede superar 1000 caracteres" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const adminTypes = ["announcement", "weekly_challenge"]
  const postType = profile?.role === "admin" && adminTypes.includes(type) ? type : "student_post"
  const isPinned = postType === "announcement"

  const { data: post, error } = await supabase
    .from("posts")
    .insert({ author_id: user.id, content: trimmed, type: postType, is_pinned: isPinned })
    .select("id")
    .single()

  if (error || !post) return { error: "No se pudo publicar" }

  revalidatePath("/community")
  return { success: true, postId: post.id }
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const [postRes, profileRes] = await Promise.all([
    supabase.from("posts").select("author_id").eq("id", postId).single(),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ])

  if (!postRes.data) return { error: "Post no encontrado" }
  if (postRes.data.author_id !== user.id && profileRes.data?.role !== "admin")
    return { error: "No autorizado" }

  await supabase.from("posts").delete().eq("id", postId)
  revalidatePath("/community")
  return { success: true }
}

export async function toggleReaction(postId: string, emoji: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }
  if (!ALLOWED_EMOJIS.includes(emoji)) return { error: "Emoji no válido" }

  const { data: existing } = await supabase
    .from("post_reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle()

  if (existing) {
    await supabase.from("post_reactions").delete().eq("id", existing.id)
    return { reacted: false }
  }

  await supabase.from("post_reactions").insert({ post_id: postId, user_id: user.id, emoji })
  return { reacted: true }
}

export async function addComment(postId: string, content: string, parentId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const trimmed = content.trim()
  if (trimmed.length < 1) return { error: "El comentario no puede estar vacío" }
  if (trimmed.length > 500) return { error: "Máximo 500 caracteres" }

  const { data: comment, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, author_id: user.id, content: trimmed, parent_id: parentId ?? null })
    .select("id, post_id, author_id, parent_id, content, created_at")
    .single()

  if (error || !comment) return { error: "No se pudo publicar el comentario" }

  const { data: author } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", user.id)
    .single()

  revalidatePath("/community")
  return { success: true, comment: { ...comment, author: author ?? null } }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  await supabase
    .from("post_comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id)

  revalidatePath("/community")
  return { success: true }
}
