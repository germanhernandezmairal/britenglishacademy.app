"use client"

import { useState, useTransition, useRef } from "react"
import { MessageSquare, Send, Trash2 } from "lucide-react"
import { addLessonComment, deleteLessonComment } from "@/app/actions/lessons"

type Author = { id: string; full_name: string; avatar_url: string | null }
type Comment = {
  id: string
  content: string
  created_at: string
  author: Author | Author[] | null
}

function resolveAuthor(raw: Author | Author[] | null): Author | null {
  if (!raw) return null
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
      style={{ background: "var(--color-primary-100)", color: "var(--color-primary)" }}
    >
      {initials}
    </div>
  )
}

export function CommentsSection({
  lessonId,
  comments: initialComments,
  currentUserId,
}: {
  lessonId: string
  comments: Comment[]
  currentUserId: string
}) {
  const [comments, setComments] = useState(initialComments)
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setError(null)

    startTransition(async () => {
      const result = await addLessonComment(lessonId, text)
      if ("error" in result && result.error) {
        setError(result.error)
        return
      }
      setText("")
      textareaRef.current?.focus()
    })
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      await deleteLessonComment(commentId, lessonId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    })
  }

  return (
    <div
      className="p-6 rounded-2xl border"
      style={{ background: "white", borderColor: "var(--color-border)" }}
    >
      <h2
        className="text-base font-bold mb-5 flex items-center gap-2"
        style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
      >
        <MessageSquare size={18} style={{ color: "var(--color-primary)" }} />
        Preguntas y comentarios
        {comments.length > 0 && (
          <span
            className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}
          >
            {comments.length}
          </span>
        )}
      </h2>

      {comments.length === 0 ? (
        <div className="text-center py-8 mb-4">
          <MessageSquare
            size={28}
            className="mx-auto mb-2 opacity-20"
            style={{ color: "var(--color-primary)" }}
          />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Sé el primero en comentar esta lección
          </p>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => {
            const author = resolveAuthor(comment.author)
            const isOwn = author?.id === currentUserId

            return (
              <div key={comment.id} className="flex gap-3">
                {author ? (
                  <AvatarInitials name={author.full_name} />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    style={{ background: "var(--color-border)" }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      {author?.full_name ?? "Estudiante"}
                    </span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {comment.content}
                  </p>
                </div>
                {isOwn && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={isPending}
                    className="flex-shrink-0 p-1.5 rounded-lg opacity-40 hover:opacity-100 transition-opacity"
                    style={{ color: "var(--color-error)" }}
                    title="Eliminar comentario"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe tu pregunta o comentario… (Enter para enviar)"
          rows={2}
          maxLength={1000}
          className="flex-1 resize-none text-sm px-4 py-3 rounded-xl border outline-none transition-all"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-bg-alt)",
            color: "var(--color-text)",
            fontFamily: "var(--font-body)",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e as unknown as React.FormEvent)
            }
          }}
        />
        <button
          type="submit"
          disabled={isPending || !text.trim()}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: "var(--color-primary)" }}
        >
          <Send size={15} />
          Enviar
        </button>
      </form>

      {error && (
        <p className="text-xs mt-2" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      )}
    </div>
  )
}
