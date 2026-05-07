"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const trimmed = content.trim()
  if (!trimmed || trimmed.length > 2000) return { error: "Mensaje inválido" }

  const admin = await createAdminClient()

  // Verify access: must be a participant, or admin sending to a broadcast
  const { data: conv } = await admin
    .from("conversations")
    .select("type, level_filter")
    .eq("id", conversationId)
    .single()

  if (!conv) return { error: "Conversación no encontrada" }

  if (conv.type === "broadcast") {
    const { data: prof } = await admin.from("profiles").select("role").eq("id", user.id).single()
    if (prof?.role !== "admin") return { error: "No autorizado" }
  } else {
    const { data: part } = await admin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!part) return { error: "No autorizado" }
  }

  const { data: msg, error } = await admin
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, content: trimmed })
    .select("id, conversation_id, sender_id, content, created_at")
    .single()

  if (error || !msg) return { error: "No se pudo enviar" }

  await Promise.all([
    admin.from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId),
    admin.from("conversation_participants")
      .upsert(
        { conversation_id: conversationId, user_id: user.id, last_read_at: new Date().toISOString() },
        { onConflict: "conversation_id,user_id" }
      ),
  ])

  return { success: true, message: msg }
}

export async function getOrCreateDirectConversation(otherUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }
  if (otherUserId === user.id) return { error: "No puedes mensajearte a ti mismo" }

  const admin = await createAdminClient()

  // Find existing direct conversation shared by both users
  const { data: myConvs } = await admin
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id)

  const myConvIds = (myConvs ?? []).map((r) => r.conversation_id)

  if (myConvIds.length > 0) {
    const { data: shared } = await admin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", myConvIds)

    for (const row of shared ?? []) {
      const { data: conv } = await admin
        .from("conversations")
        .select("id")
        .eq("id", row.conversation_id)
        .eq("type", "direct")
        .maybeSingle()
      if (conv) return { conversationId: conv.id }
    }
  }

  const { data: newConv, error } = await admin
    .from("conversations")
    .insert({ type: "direct", created_by: user.id })
    .select("id")
    .single()

  if (error || !newConv) return { error: "No se pudo crear" }

  await admin.from("conversation_participants").insert([
    { conversation_id: newConv.id, user_id: user.id },
    { conversation_id: newConv.id, user_id: otherUserId },
  ])

  return { conversationId: newConv.id }
}

export async function broadcastToLevel(level: string, subject: string, firstMessage: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const admin = await createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return { error: "Solo admins" }

  const trimmedSubject = subject.trim()
  const trimmedMsg = firstMessage.trim()
  if (!trimmedSubject || !trimmedMsg) return { error: "Asunto y mensaje requeridos" }

  const { data: conv, error } = await admin
    .from("conversations")
    .insert({ type: "broadcast", level_filter: level, subject: trimmedSubject, created_by: user.id })
    .select("id")
    .single()

  if (error || !conv) return { error: "No se pudo crear el broadcast" }

  await Promise.all([
    admin.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      content: trimmedMsg,
    }),
    admin.from("conversation_participants").insert({
      conversation_id: conv.id,
      user_id: user.id,
    }),
    admin.from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conv.id),
  ])

  return { conversationId: conv.id }
}

export async function markConversationAsRead(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const admin = await createAdminClient()
  await admin.from("conversation_participants").upsert(
    { conversation_id: conversationId, user_id: user.id, last_read_at: new Date().toISOString() },
    { onConflict: "conversation_id,user_id" }
  )
}

export async function searchUsers(query: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { users: [] }

  if (!query.trim()) return { users: [] }

  const admin = await createAdminClient()
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, level, role")
    .neq("id", user.id)
    .ilike("full_name", `%${query.trim()}%`)
    .order("full_name")
    .limit(10)

  return { users: data ?? [] }
}
