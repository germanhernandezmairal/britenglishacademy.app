import { notFound, redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { markConversationAsRead } from "@/app/actions/messages"
import { ConversationView } from "./_components/ConversationView"

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, level, role")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  const admin = await createAdminClient()

  const { data: conv } = await admin
    .from("conversations")
    .select("id, type, subject, level_filter, created_by")
    .eq("id", id)
    .single()

  if (!conv) notFound()

  // Access check
  if (conv.type === "direct") {
    const { data: part } = await admin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("conversation_id", id)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!part) notFound()
  } else {
    // Broadcast: must match level or be admin
    const isAdmin = profile.role === "admin"
    const levelMatch = conv.level_filter === profile.level
    if (!isAdmin && !levelMatch) notFound()
  }

  // Fetch last 60 messages with sender profiles
  const { data: msgs } = await admin
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at, sender:profiles(id, full_name, avatar_url, level, role)")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(60)

  // Other participant for direct conversations
  type OtherUser = { id: string; full_name: string; avatar_url: string | null; level: string | null; role: string }
  let otherUser: OtherUser | null = null
  if (conv.type === "direct") {
    const { data: otherPart } = await admin
      .from("conversation_participants")
      .select("user:profiles(id, full_name, avatar_url, level, role)")
      .eq("conversation_id", id)
      .neq("user_id", user.id)
      .maybeSingle()
    if (otherPart?.user) {
      const u = Array.isArray(otherPart.user) ? otherPart.user[0] : otherPart.user
      otherUser = u as OtherUser
    }
  }

  // Normalize message shape
  const messages = (msgs ?? []).map((m) => {
    const s = Array.isArray(m.sender) ? m.sender[0] : m.sender
    return {
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      created_at: m.created_at,
      sender: (s ?? null) as { id: string; full_name: string; avatar_url: string | null; level: string | null; role: string } | null,
    }
  })

  // Mark as read (upserts participant row for broadcasts too)
  await markConversationAsRead(id)

  const title = conv.type === "direct"
    ? (otherUser?.full_name ?? "Conversación")
    : (conv.subject ?? `Nivel ${conv.level_filter}`)

  return (
    <ConversationView
      conversationId={id}
      conversationType={conv.type as "direct" | "broadcast"}
      title={title}
      levelFilter={conv.level_filter ?? null}
      initialMessages={messages}
      currentUser={{
        id: user.id,
        full_name: profile.full_name ?? "",
        avatar_url: profile.avatar_url ?? null,
        role: profile.role ?? "student",
        level: profile.level ?? null,
      }}
      otherUser={otherUser}
    />
  )
}
