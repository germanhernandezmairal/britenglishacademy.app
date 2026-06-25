"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  MessageCircle, Plus, Megaphone, Search, Loader2, X, Send,
} from "lucide-react"
import {
  getOrCreateDirectConversation,
  broadcastToLevel,
  searchUsers,
} from "@/app/actions/messages"
import type { ConversationSummary } from "../page"

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]

type CurrentUser = {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
  level: string | null
}

type UserResult = {
  id: string
  full_name: string
  avatar_url: string | null
  level: string | null
  role: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return "ahora"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}d`
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
}

function AvatarInitials({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
      style={{ width: size, height: size, background: "var(--color-primary-100)", color: "var(--color-primary)" }}
    >
      {initials}
    </div>
  )
}

// ── New conversation modal ────────────────────────────────────────────────────
function NewConversationModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery]           = useState("")
  const [results, setResults]       = useState<UserResult[]>([])
  const [searching, startSearch]    = useTransition()
  const [creating, startCreate]     = useTransition()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const q = query.trim()
    const timeout = setTimeout(() => {
      if (!q) { setResults([]); return }
      startSearch(async () => {
        const res = await searchUsers(query)
        setResults(res.users as UserResult[])
      })
    }, q ? 300 : 0)
    return () => clearTimeout(timeout)
  }, [query])

  function handleSelect(userId: string) {
    startCreate(async () => {
      const res = await getOrCreateDirectConversation(userId)
      if ("error" in res) return
      onClose()
      router.push(`/messages/${res.conversationId}`)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.4)" }}>
      <div
        className="w-full max-w-md rounded-2xl p-5"
        style={{ background: "white", boxShadow: "var(--shadow-xl)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}>
            Nueva conversación
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-60" style={{ color: "var(--color-text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre…"
            className="w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: "var(--color-border)", background: "var(--color-bg-alt)", color: "var(--color-text)" }}
          />
          {searching && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: "var(--color-text-muted)" }} />}
        </div>

        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
          {results.length === 0 && query.trim() && !searching && (
            <p className="text-xs text-center py-6" style={{ color: "var(--color-text-muted)" }}>
              Sin resultados para «{query}»
            </p>
          )}
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => handleSelect(u.id)}
              disabled={creating}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80 transition-opacity text-left disabled:opacity-50"
              style={{ background: "var(--color-bg-alt)" }}
            >
              <AvatarInitials name={u.full_name} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>{u.full_name}</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {u.role === "admin" ? "Profesor" : `Nivel ${u.level ?? "—"}`}
                </p>
              </div>
              {creating && <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: "var(--color-primary)" }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Broadcast modal (admin only) ─────────────────────────────────────────────
function BroadcastModal({ onClose }: { onClose: () => void }) {
  const [level, setLevel]     = useState("B1")
  const [subject, setSubject] = useState("")
  const [msg, setMsg]         = useState("")
  const [error, setError]     = useState<string | null>(null)
  const [isPending, start]    = useTransition()
  const router = useRouter()

  function handleSend() {
    if (!subject.trim() || !msg.trim()) { setError("Completa todos los campos"); return }
    setError(null)
    start(async () => {
      const res = await broadcastToLevel(level, subject, msg)
      if ("error" in res) { setError(res.error ?? null); return }
      onClose()
      router.push(`/messages/${res.conversationId}`)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.4)" }}>
      <div
        className="w-full max-w-md rounded-2xl p-5"
        style={{ background: "white", boxShadow: "var(--shadow-xl)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}>
            Broadcast al nivel
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-60" style={{ color: "var(--color-text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Level selector */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className="px-3 py-1 rounded-lg text-xs font-bold border transition-all"
              style={{
                borderColor: level === l ? "var(--color-primary)" : "var(--color-border)",
                background: level === l ? "var(--color-primary)" : "var(--color-bg-alt)",
                color: level === l ? "white" : "var(--color-text-muted)",
              }}
            >
              {l}
            </button>
          ))}
        </div>

        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Asunto…"
          maxLength={100}
          className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none mb-2"
          style={{ borderColor: "var(--color-border)", background: "var(--color-bg-alt)", color: "var(--color-text)" }}
        />
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Escribe tu mensaje…"
          rows={4}
          maxLength={2000}
          className="w-full resize-none px-3 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: "var(--color-border)", background: "var(--color-bg-alt)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}
        />

        {error && <p className="text-xs mt-2" style={{ color: "var(--color-error)" }}>{error}</p>}

        <button
          onClick={handleSend}
          disabled={isPending || !subject.trim() || !msg.trim()}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "var(--color-primary)" }}
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Enviar broadcast
        </button>
      </div>
    </div>
  )
}

// ── Conversation row ──────────────────────────────────────────────────────────
function ConversationRow({ conv, onClick }: { conv: ConversationSummary; onClick: () => void }) {
  const isDirect    = conv.type === "direct"
  const name        = isDirect ? (conv.other_user?.full_name ?? "Usuario desconocido") : (conv.subject ?? `Nivel ${conv.level_filter}`)
  const subtitle    = isDirect
    ? (conv.other_user?.role === "admin" ? "Profesor" : `Nivel ${conv.other_user?.level ?? "—"}`)
    : `Broadcast · Nivel ${conv.level_filter}`
  const timeStr     = conv.last_message ? timeAgo(conv.last_message.created_at) : timeAgo(conv.updated_at)
  const preview     = conv.last_message
    ? `${conv.last_message.sender_name}: ${conv.last_message.content}`
    : "Inicia la conversación"

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all hover:opacity-80 text-left"
      style={{ background: "white", border: "1px solid var(--color-border)" }}
    >
      {isDirect
        ? <AvatarInitials name={name} />
        : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-primary-50)" }}
          >
            <Megaphone size={18} style={{ color: "var(--color-primary)" }} />
          </div>
        )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "var(--color-text)", fontWeight: conv.unread_count > 0 ? 700 : 600 }}
          >
            {name}
          </p>
          <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: "var(--color-text-muted)" }}>
            {timeStr}
          </span>
        </div>
        <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
          {subtitle}
        </p>
        <p className="text-xs truncate mt-0.5" style={{ color: conv.unread_count > 0 ? "var(--color-text)" : "var(--color-text-muted)", fontWeight: conv.unread_count > 0 ? 500 : 400 }}>
          {preview}
        </p>
      </div>

      {conv.unread_count > 0 && (
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
          style={{ background: "var(--color-primary)" }}
        >
          {conv.unread_count > 9 ? "9+" : conv.unread_count}
        </div>
      )}
    </button>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function InboxList({
  conversations,
  currentUser,
}: {
  conversations: ConversationSummary[]
  currentUser: CurrentUser
}) {
  const [showNew, setShowNew]         = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const router = useRouter()
  const isAdmin = currentUser.role === "admin"

  return (
    <>
      {/* Modals */}
      {showNew && <NewConversationModal onClose={() => setShowNew(false)} />}
      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-black mb-1"
            style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
          >
            Mensajes
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {conversations.length > 0
              ? `${conversations.length} conversación${conversations.length !== 1 ? "es" : ""}`
              : "Ninguna conversación todavía"}
          </p>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowBroadcast(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all hover:opacity-70"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)", background: "white" }}
            >
              <Megaphone size={13} />
              Broadcast
            </button>
          )}
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-80"
            style={{ background: "var(--color-primary)" }}
          >
            <Plus size={14} />
            Nuevo
          </button>
        </div>
      </div>

      {/* List */}
      {conversations.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl border"
          style={{ background: "white", borderColor: "var(--color-border)" }}
        >
          <MessageCircle size={36} className="mb-3 opacity-20" style={{ color: "var(--color-primary)" }} />
          <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>
            No tienes mensajes todavía
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Usa el botón «Nuevo» para iniciar una conversación
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conv) => (
            <ConversationRow
              key={conv.id}
              conv={conv}
              onClick={() => router.push(`/messages/${conv.id}`)}
            />
          ))}
        </div>
      )}
    </>
  )
}
