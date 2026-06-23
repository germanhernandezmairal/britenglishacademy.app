"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send, Loader2, Megaphone } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { sendMessage, markConversationAsRead } from "@/app/actions/messages"

type UserProfile = {
  id: string
  full_name: string
  avatar_url: string | null
  level: string | null
  role: string
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender: UserProfile | null
}

function AvatarInitials({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
      style={{ width: size, height: size, background: "var(--color-primary-100)", color: "var(--color-primary)" }}
    >
      {initials}
    </div>
  )
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
}

function formatDay(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Hoy"
  if (d.toDateString() === yesterday.toDateString()) return "Ayer"
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
}

export function ConversationView({
  conversationId,
  conversationType,
  title,
  levelFilter,
  initialMessages,
  currentUser,
  otherUser,
}: {
  conversationId: string
  conversationType: "direct" | "broadcast"
  title: string
  levelFilter: string | null
  initialMessages: Message[]
  currentUser: UserProfile
  otherUser: UserProfile | null
}) {
  const [messages, setMessages]   = useState<Message[]>(initialMessages)
  const [input, setInput]         = useState("")
  const [isPending, start]        = useTransition()
  const [error, setError]         = useState<string | null>(null)
  const bottomRef                 = useRef<HTMLDivElement>(null)
  const textareaRef               = useRef<HTMLTextAreaElement>(null)
  const router                    = useRouter()

  const isAdmin       = currentUser.role === "admin"
  const canSend       = conversationType === "direct" || isAdmin
  const isBroadcast   = conversationType === "broadcast"

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    ;(async () => {
      // Realtime postgres_changes is RLS-filtered: the socket must be authenticated
      // as the current user, or the server filters out every message event. A fresh
      // browser client recovers its session asynchronously, so we must push the access
      // token to realtime BEFORE subscribing — otherwise the channel joins as `anon`
      // and no events are delivered. See bug F3-3.
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) supabase.realtime.setAuth(session.access_token)
      if (cancelled) return

      channel = supabase
        .channel(`conv:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload) => {
            const raw = payload.new as {
              id: string; conversation_id: string; sender_id: string; content: string; created_at: string
            }

            // Don't double-add own optimistic messages
            if (raw.sender_id === currentUser.id) return

            // Fetch sender profile for the incoming message. Under RLS a student
            // can't read another user's profile, so fall back to the known peer
            // (otherUser) for direct conversations; ConversationView renders
            // "Usuario" if still null. The correct name resolves on reload (the
            // server fetches sender profiles via the admin client).
            const { data: sender } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url, level, role")
              .eq("id", raw.sender_id)
              .maybeSingle()

            const resolvedSender =
              sender ?? (raw.sender_id === otherUser?.id ? otherUser : null)

            setMessages((prev) => [...prev, { ...raw, sender: resolvedSender }])
            markConversationAsRead(conversationId)
          }
        )
        .subscribe()
    })()

    return () => { cancelled = true; if (channel) supabase.removeChannel(channel) }
  }, [conversationId, currentUser.id, otherUser])

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || !canSend) return
    setError(null)

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: trimmed,
      created_at: new Date().toISOString(),
      sender: currentUser,
    }
    setMessages((prev) => [...prev, optimistic])
    setInput("")
    textareaRef.current?.focus()

    start(async () => {
      const res = await sendMessage(conversationId, trimmed)
      if ("error" in res) {
        setError(res.error ?? null)
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
        return
      }
      // Replace temp with real id
      if (res.success && res.message) {
        setMessages((prev) =>
          prev.map((m) => m.id === optimistic.id ? { ...res.message!, sender: currentUser } : m)
        )
      }
    })
  }

  // Group messages by date for day separators
  const grouped: { day: string; messages: Message[] }[] = []
  for (const msg of messages) {
    const day = formatDay(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (!last || last.day !== day) {
      grouped.push({ day, messages: [msg] })
    } else {
      last.messages.push(msg)
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "100vh" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ background: "white", borderColor: "var(--color-border)" }}
      >
        <button
          onClick={() => router.push("/messages")}
          className="p-1.5 rounded-lg hover:opacity-60 transition-opacity"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ArrowLeft size={18} />
        </button>

        {isBroadcast ? (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-primary-50)" }}
          >
            <Megaphone size={16} style={{ color: "var(--color-primary)" }} />
          </div>
        ) : (
          <AvatarInitials name={otherUser?.full_name ?? title} size={36} />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "var(--color-text)" }}>{title}</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {isBroadcast
              ? `Broadcast · Nivel ${levelFilter}`
              : (otherUser?.role === "admin" ? "Profesor" : `Nivel ${otherUser?.level ?? "—"}`)}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1" style={{ background: "var(--color-bg)" }}>
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {canSend ? "Empieza la conversación escribiendo un mensaje" : "No hay mensajes todavía"}
            </p>
          </div>
        )}

        {grouped.map(({ day, messages: dayMsgs }) => (
          <div key={day}>
            {/* Day separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
              <span className="text-[11px] font-medium px-2" style={{ color: "var(--color-text-muted)" }}>{day}</span>
              <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
            </div>

            {/* Messages in this day */}
            <div className="flex flex-col gap-2">
              {dayMsgs.map((msg, i) => {
                const isMine = msg.sender_id === currentUser.id
                const prevMsg = i > 0 ? dayMsgs[i - 1] : null
                const showAvatar = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id)

                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar (others only, grouped) */}
                    {!isMine && (
                      <div style={{ width: 28, flexShrink: 0 }}>
                        {showAvatar && <AvatarInitials name={msg.sender?.full_name ?? "?"} size={28} />}
                      </div>
                    )}

                    <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                      {/* Sender name for others (grouped) */}
                      {showAvatar && !isMine && (
                        <span className="text-[11px] px-1" style={{ color: "var(--color-text-muted)" }}>
                          {msg.sender?.full_name ?? "Usuario"}
                        </span>
                      )}

                      {/* Bubble */}
                      <div
                        className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words"
                        style={
                          isMine
                            ? {
                                background: "var(--color-primary)",
                                color: "white",
                                borderBottomRightRadius: 4,
                              }
                            : {
                                background: "white",
                                color: "var(--color-text)",
                                border: "1px solid var(--color-border)",
                                borderBottomLeftRadius: 4,
                              }
                        }
                      >
                        {msg.content}
                      </div>

                      {/* Time */}
                      <span className="text-[10px] px-1" style={{ color: "var(--color-text-muted)" }}>
                        {formatTime(msg.created_at)}
                        {msg.id.startsWith("temp-") && " · enviando…"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {canSend ? (
        <div
          className="flex-shrink-0 border-t px-4 py-3"
          style={{ background: "white", borderColor: "var(--color-border)" }}
        >
          {error && (
            <p className="text-xs mb-2" style={{ color: "var(--color-error)" }}>{error}</p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe un mensaje…"
              rows={1}
              maxLength={2000}
              disabled={isPending}
              className="flex-1 resize-none text-sm px-4 py-2.5 rounded-2xl border outline-none transition-all disabled:opacity-50"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-bg-alt)",
                color: "var(--color-text)",
                fontFamily: "var(--font-body)",
                maxHeight: 120,
                overflowY: "auto",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isPending}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all disabled:opacity-40 hover:opacity-80"
              style={{ background: "var(--color-primary)" }}
            >
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: "var(--color-text-muted)" }}>
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      ) : (
        <div
          className="flex-shrink-0 border-t px-4 py-3 text-center"
          style={{ background: "var(--color-bg-alt)", borderColor: "var(--color-border)" }}
        >
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Este canal es solo lectura para estudiantes
          </p>
        </div>
      )}
    </div>
  )
}
