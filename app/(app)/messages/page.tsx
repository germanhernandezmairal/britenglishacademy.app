import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { InboxList } from "./_components/InboxList"

export const metadata: Metadata = { title: "Mensajes | Brit English School" }

export type ConversationSummary = {
  id: string
  type: "direct" | "broadcast"
  subject: string | null
  level_filter: string | null
  updated_at: string
  last_message: { content: string; created_at: string; sender_name: string } | null
  unread_count: number
  other_user: {
    id: string
    full_name: string
    avatar_url: string | null
    level: string | null
    role: string
  } | null
}

export default async function MessagesPage() {
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

  // Direct conversations: participation rows for this user
  const { data: myParts } = await admin
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", user.id)

  const directConvIds = (myParts ?? []).map((p) => p.conversation_id)
  const readMap: Record<string, string> = {}
  for (const p of myParts ?? []) readMap[p.conversation_id] = p.last_read_at

  // Broadcast conversations visible to this user's level
  const broadcastQ = admin
    .from("conversations")
    .select("id, type, subject, level_filter, updated_at")
    .eq("type", "broadcast")

  const { data: broadcastConvs } = await (
    profile.role === "admin"
      ? broadcastQ.order("updated_at", { ascending: false })
      : broadcastQ.eq("level_filter", profile.level).order("updated_at", { ascending: false })
  )

  // Direct conversation details
  const { data: directConvs } = directConvIds.length > 0
    ? await admin
        .from("conversations")
        .select("id, type, subject, level_filter, updated_at")
        .in("id", directConvIds)
        .eq("type", "direct")
    : { data: [] as { id: string; type: string; subject: string | null; level_filter: string | null; updated_at: string }[] }

  // Other participants' profiles for direct conversations
  const { data: otherParts } = directConvIds.length > 0
    ? await admin
        .from("conversation_participants")
        .select("conversation_id, user:profiles(id, full_name, avatar_url, level, role)")
        .in("conversation_id", directConvIds)
        .neq("user_id", user.id)
    : { data: [] as { conversation_id: string; user: unknown }[] }

  const otherUserMap: Record<string, ConversationSummary["other_user"]> = {}
  for (const row of otherParts ?? []) {
    const u = Array.isArray(row.user) ? row.user[0] : row.user
    if (u) otherUserMap[row.conversation_id] = u as NonNullable<ConversationSummary["other_user"]>
  }

  // Recent messages for all conversations → last message preview + unread count
  const allConvIds = [
    ...(directConvs ?? []).map((c) => c.id),
    ...(broadcastConvs ?? []).map((c) => c.id),
  ]

  const { data: msgs } = allConvIds.length > 0
    ? await admin
        .from("messages")
        .select("id, conversation_id, sender_id, content, created_at, sender:profiles(full_name)")
        .in("conversation_id", allConvIds)
        .order("created_at", { ascending: false })
        .limit(300)
    : { data: [] as Record<string, unknown>[] }

  const lastMsgMap: Record<string, { content: string; created_at: string; sender_name: string }> = {}
  const unreadMap: Record<string, number> = {}

  for (const msg of (msgs ?? []) as Record<string, unknown>[]) {
    const convId = msg.conversation_id as string
    if (!lastMsgMap[convId]) {
      const s = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
      lastMsgMap[convId] = {
        content: msg.content as string,
        created_at: msg.created_at as string,
        sender_name: (s as { full_name: string } | null)?.full_name ?? "Usuario",
      }
    }
    const lastRead = readMap[convId]
    if (
      msg.sender_id !== user.id &&
      (!lastRead || (msg.created_at as string) > lastRead)
    ) {
      unreadMap[convId] = (unreadMap[convId] ?? 0) + 1
    }
  }

  const conversations: ConversationSummary[] = [
    ...(directConvs ?? []).map((c) => ({
      id: c.id,
      type: "direct" as const,
      subject: c.subject,
      level_filter: c.level_filter,
      updated_at: c.updated_at,
      last_message: lastMsgMap[c.id] ?? null,
      unread_count: unreadMap[c.id] ?? 0,
      other_user: otherUserMap[c.id] ?? null,
    })),
    ...(broadcastConvs ?? []).map((c) => ({
      id: c.id,
      type: "broadcast" as const,
      subject: c.subject,
      level_filter: c.level_filter,
      updated_at: c.updated_at,
      last_message: lastMsgMap[c.id] ?? null,
      unread_count: unreadMap[c.id] ?? 0,
      other_user: null,
    })),
  ].sort((a, b) => {
    const ta = a.last_message?.created_at ?? a.updated_at
    const tb = b.last_message?.created_at ?? b.updated_at
    return new Date(tb).getTime() - new Date(ta).getTime()
  })

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto">
      <InboxList
        conversations={conversations}
        currentUser={{
          id: user.id,
          full_name: profile.full_name ?? "",
          avatar_url: profile.avatar_url ?? null,
          role: profile.role ?? "student",
          level: profile.level ?? null,
        }}
      />
    </div>
  )
}
