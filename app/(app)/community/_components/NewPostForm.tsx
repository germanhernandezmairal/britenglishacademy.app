"use client"

import { useState, useTransition } from "react"
import { Send, Loader2, Megaphone, Trophy, BookOpen, X } from "lucide-react"
import { createPost } from "@/app/actions/community"

type CurrentUser = {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
  level: string | null
}

type CommentData = {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  created_at: string
  author: CurrentUser | null
}

type PostData = {
  id: string
  content: string
  type: "student_post" | "announcement" | "weekly_challenge"
  is_pinned: boolean
  level_filter: string | null
  created_at: string
  ai_banner_url: string | null
  author: CurrentUser
  reactions: Record<string, number>
  userReactions: string[]
  comments: CommentData[]
  replies: CommentData[]
  comment_count: number
}

const MAX_CHARS = 1000

const TYPE_OPTIONS = [
  { value: "student_post",     label: "Post",     icon: BookOpen,  color: "var(--color-primary)" },
  { value: "announcement",     label: "Anuncio",  icon: Megaphone, color: "#D4A017" },
  { value: "weekly_challenge", label: "Reto",     icon: Trophy,    color: "#C8102E" },
] as const

function AvatarInitials({ name, size = 36 }: { name: string; size?: number }) {
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

export function NewPostForm({
  currentUser,
  onPosted,
}: {
  currentUser: CurrentUser
  onPosted: (post: PostData) => void
}) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [type, setType] = useState<"student_post" | "announcement" | "weekly_challenge">("student_post")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isAdmin = currentUser.role === "admin"
  const charsLeft = MAX_CHARS - content.length
  const canSubmit = content.trim().length > 0 && charsLeft >= 0

  function handleSubmit() {
    if (!canSubmit) return
    setError(null)
    startTransition(async () => {
      const result = await createPost(content, type)
      if ("error" in result && result.error) {
        setError(result.error)
        return
      }
      const optimistic: PostData = {
        id: (result as { postId?: string }).postId ?? `temp-${Date.now()}`,
        content: content.trim(),
        type,
        is_pinned: type === "announcement",
        level_filter: null,
        created_at: new Date().toISOString(),
        ai_banner_url: null,
        author: currentUser,
        reactions: {},
        userReactions: [],
        comments: [],
        replies: [],
        comment_count: 0,
      }
      onPosted(optimistic)
      setContent("")
      setType("student_post")
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-sm mb-6"
        style={{ background: "white", borderColor: "var(--color-border)" }}
        onClick={() => setOpen(true)}
      >
        <AvatarInitials name={currentUser.full_name} />
        <span className="flex-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          ¿Qué quieres compartir hoy?
        </span>
        {isAdmin && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
              Admin
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="p-5 rounded-2xl border mb-6"
      style={{ background: "white", borderColor: "var(--color-border)", boxShadow: "var(--shadow-md)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AvatarInitials name={currentUser.full_name} />
          <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            {currentUser.full_name}
          </span>
        </div>
        <button
          onClick={() => { setOpen(false); setContent(""); setError(null) }}
          className="p-1.5 rounded-lg hover:opacity-60"
          style={{ color: "var(--color-text-muted)" }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Admin type selector */}
      {isAdmin && (
        <div className="flex gap-2 mb-3">
          {TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const selected = type === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                style={{
                  borderColor: selected ? opt.color : "var(--color-border)",
                  background: selected ? opt.color + "18" : "var(--color-bg-alt)",
                  color: selected ? opt.color : "var(--color-text-muted)",
                }}
              >
                <Icon size={12} />
                {opt.label}
              </button>
            )
          })}
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Comparte tu progreso, pregunta algo, o motiva a tus compañeros…"
        rows={4}
        maxLength={MAX_CHARS}
        autoFocus
        disabled={isPending}
        className="w-full resize-none text-sm px-4 py-3 rounded-xl border outline-none transition-all disabled:opacity-50"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-bg-alt)",
          color: "var(--color-text)",
          fontFamily: "var(--font-body)",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.metaKey) handleSubmit()
        }}
      />

      {error && (
        <p className="text-xs mt-1.5" style={{ color: "var(--color-error)" }}>{error}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        <span
          className="text-xs"
          style={{ color: charsLeft < 100 ? "var(--color-warning)" : "var(--color-text-muted)" }}
        >
          {charsLeft} caracteres restantes
        </span>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "var(--color-primary)" }}
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Publicar
        </button>
      </div>
    </div>
  )
}
