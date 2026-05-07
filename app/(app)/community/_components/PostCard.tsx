"use client"

import { useState, useTransition } from "react"
import {
  Trash2, MessageCircle, ChevronDown, ChevronUp,
  Megaphone, Trophy, Send, Loader2, CornerDownRight,
} from "lucide-react"
import { toggleReaction, addComment, deleteComment, deletePost } from "@/app/actions/community"

type Author = {
  id: string
  full_name: string
  avatar_url: string | null
  level: string | null
  role: string
}

type CommentData = {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  created_at: string
  author: Author | null
}

type PostData = {
  id: string
  content: string
  type: "student_post" | "announcement" | "weekly_challenge"
  is_pinned: boolean
  level_filter: string | null
  created_at: string
  ai_banner_url: string | null
  author: Author
  reactions: Record<string, number>
  userReactions: string[]
  comments: CommentData[]
  replies: CommentData[]
  comment_count: number
}

type CurrentUser = {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
  level: string | null
}

const EMOJIS = ["❤️", "👏", "🔥", "😊", "🤔"]

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

// ── Single comment row ───────────────────────────────────────────────────────
function CommentRow({
  comment,
  currentUser,
  onDelete,
  onReply,
  isReply = false,
}: {
  comment: CommentData
  currentUser: CurrentUser
  onDelete: (id: string) => void
  onReply?: (id: string) => void
  isReply?: boolean
}) {
  const [deleting, startDelete] = useTransition()
  const authorName = comment.author?.full_name ?? "Usuario"
  const canDelete = currentUser.role === "admin" || comment.author_id === currentUser.id

  function handleDelete() {
    startDelete(async () => {
      await deleteComment(comment.id)
      onDelete(comment.id)
    })
  }

  return (
    <div className={`flex gap-2.5 ${isReply ? "pl-7" : ""}`}>
      <AvatarInitials name={authorName} size={28} />
      <div className="flex-1 min-w-0">
        <div
          className="px-3 py-2 rounded-xl text-sm"
          style={{ background: "var(--color-bg-alt)", color: "var(--color-text)" }}
        >
          <span className="font-semibold mr-1.5 text-xs" style={{ color: "var(--color-text)" }}>
            {authorName}
          </span>
          {comment.content}
        </div>
        <div className="flex items-center gap-3 mt-0.5 px-1">
          <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            {timeAgo(comment.created_at)}
          </span>
          {!isReply && onReply && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-[11px] font-semibold hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              Responder
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-[11px] hover:opacity-60 disabled:opacity-40"
              style={{ color: "var(--color-text-muted)" }}
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Reply / comment input ────────────────────────────────────────────────────
function CommentInput({
  postId,
  parentId,
  currentUser,
  placeholder,
  onAdded,
  onCancel,
}: {
  postId: string
  parentId?: string
  currentUser: CurrentUser
  placeholder: string
  onAdded: (comment: CommentData) => void
  onCancel?: () => void
}) {
  const [text, setText] = useState("")
  const [isPending, start] = useTransition()

  function submit() {
    const trimmed = text.trim()
    if (!trimmed) return
    start(async () => {
      const res = await addComment(postId, trimmed, parentId)
      if ("error" in res) return
      // res.comment shape matches CommentData
      onAdded(res.comment as unknown as CommentData)
      setText("")
      if (onCancel) onCancel()
    })
  }

  return (
    <div className="flex gap-2 items-start">
      <AvatarInitials name={currentUser.full_name} size={28} />
      <div className="flex-1 relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={1}
          maxLength={500}
          disabled={isPending}
          className="w-full resize-none text-sm px-3 py-2 pr-10 rounded-xl border outline-none transition-all disabled:opacity-50"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-bg-alt)",
            color: "var(--color-text)",
            fontFamily: "var(--font-body)",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit() }
          }}
        />
        <button
          onClick={submit}
          disabled={!text.trim() || isPending}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 disabled:opacity-40 hover:opacity-70 transition-opacity"
          style={{ color: "var(--color-primary)" }}
        >
          {isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </button>
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="text-xs mt-2 hover:opacity-60"
          style={{ color: "var(--color-text-muted)" }}
        >
          Cancelar
        </button>
      )}
    </div>
  )
}

// ── Main PostCard ────────────────────────────────────────────────────────────
export function PostCard({
  post,
  currentUser,
  onDeleted,
}: {
  post: PostData
  currentUser: CurrentUser
  onDeleted: (id: string) => void
}) {
  const [reactions, setReactions]           = useState(post.reactions)
  const [userReactions, setUserReactions]   = useState(new Set(post.userReactions))
  const [comments, setComments]             = useState<CommentData[]>(post.comments)
  const [replies, setReplies]               = useState<CommentData[]>(post.replies)
  const [showComments, setShowComments]     = useState(false)
  const [replyingTo, setReplyingTo]         = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete]   = useState(false)
  const [, startReaction]                   = useTransition()
  const [deleting, startDelete]             = useTransition()

  const isAdmin   = currentUser.role === "admin"
  const isAuthor  = post.author.id === currentUser.id
  const canDelete = isAdmin || isAuthor
  const totalComments = comments.length + replies.length

  // ── Type-specific card styles ──────────────────────────────────────────────
  const isAnnouncement = post.type === "announcement"
  const isChallenge    = post.type === "weekly_challenge"

  function handleReaction(emoji: string) {
    const had = userReactions.has(emoji)
    // Optimistic update
    setReactions((prev) => {
      const next = { ...prev }
      next[emoji] = Math.max(0, (next[emoji] ?? 0) + (had ? -1 : 1))
      if (next[emoji] === 0) delete next[emoji]
      return next
    })
    setUserReactions((prev) => {
      const next = new Set(prev)
      had ? next.delete(emoji) : next.add(emoji)
      return next
    })
    startReaction(async () => {
      const res = await toggleReaction(post.id, emoji)
      if ("error" in res) {
        // Revert
        setReactions((prev) => {
          const next = { ...prev }
          next[emoji] = Math.max(0, (next[emoji] ?? 0) + (had ? 1 : -1))
          if (next[emoji] === 0) delete next[emoji]
          return next
        })
        setUserReactions((prev) => {
          const next = new Set(prev)
          had ? next.add(emoji) : next.delete(emoji)
          return next
        })
      }
    })
  }

  function handleDeletePost() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    startDelete(async () => {
      await deletePost(post.id)
      onDeleted(post.id)
    })
  }

  function handleCommentAdded(comment: CommentData) {
    if (comment.parent_id) {
      setReplies((prev) => [...prev, comment])
    } else {
      setComments((prev) => [...prev, comment])
      if (!showComments) setShowComments(true)
    }
  }

  function handleCommentDeleted(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id))
    setReplies((prev) => prev.filter((c) => c.id !== id))
  }

  // ── Banner colour / accent ─────────────────────────────────────────────────
  const bannerBg    = isAnnouncement ? "var(--color-primary)" : isChallenge ? "#C8102E" : undefined
  const bannerBorder = isAnnouncement ? "var(--color-primary)" : isChallenge ? "#C8102E" : "var(--color-border)"

  return (
    <article
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "white",
        borderColor: bannerBorder,
        boxShadow: (isAnnouncement || isChallenge) ? "0 2px 12px rgba(0,0,0,.08)" : "none",
      }}
    >
      {/* Type banner */}
      {(isAnnouncement || isChallenge) && (
        <div
          className="flex items-center gap-2 px-5 py-2.5"
          style={{ background: bannerBg }}
        >
          {isAnnouncement
            ? <Megaphone size={13} className="text-white opacity-90" />
            : <Trophy size={13} className="text-white opacity-90" />}
          <span className="text-xs font-bold text-white">
            {isAnnouncement ? "Anuncio" : "Reto semanal"}
          </span>
        </div>
      )}

      <div className="px-5 py-4">
        {/* Author row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <AvatarInitials name={post.author.full_name} />
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: "var(--color-text)" }}>
                {post.author.full_name}
              </p>
              <div className="flex items-center gap-1.5">
                {post.author.level && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}
                  >
                    {post.author.level}
                  </span>
                )}
                <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                  {timeAgo(post.created_at)}
                </span>
              </div>
            </div>
          </div>

          {canDelete && (
            <button
              onClick={handleDeletePost}
              disabled={deleting}
              className="p-1.5 rounded-lg hover:opacity-60 disabled:opacity-40 transition-opacity text-xs"
              style={{ color: confirmDelete ? "var(--color-error)" : "var(--color-text-muted)" }}
              title={confirmDelete ? "Confirmar eliminación" : "Eliminar publicación"}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          )}
        </div>

        {confirmDelete && !deleting && (
          <div className="flex items-center gap-2 mb-3 text-xs">
            <span style={{ color: "var(--color-error)" }}>¿Eliminar esta publicación?</span>
            <button
              onClick={handleDeletePost}
              className="font-semibold hover:underline"
              style={{ color: "var(--color-error)" }}
            >
              Sí, eliminar
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="hover:underline"
              style={{ color: "var(--color-text-muted)" }}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Content */}
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap mb-4"
          style={{ color: "var(--color-text)" }}
        >
          {post.content}
        </p>

        {/* Reaction bar */}
        <div className="flex items-center gap-1 flex-wrap mb-3">
          {EMOJIS.map((emoji) => {
            const count = reactions[emoji] ?? 0
            const active = userReactions.has(emoji)
            return (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all"
                style={{
                  background: active ? "var(--color-primary-50)" : "var(--color-bg-alt)",
                  border: `1px solid ${active ? "var(--color-primary-200)" : "var(--color-border)"}`,
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span>{emoji}</span>
                {count > 0 && (
                  <span
                    className="text-[11px]"
                    style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)" }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Comments toggle */}
        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
          style={{ color: "var(--color-text-muted)" }}
        >
          <MessageCircle size={13} />
          <span>
            {totalComments > 0 ? `${totalComments} comentario${totalComments !== 1 ? "s" : ""}` : "Comentar"}
          </span>
          {totalComments > 0 && (showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div
          className="px-5 pb-4 pt-1 flex flex-col gap-3 border-t"
          style={{ borderColor: "var(--color-border)", background: "var(--color-bg-alt)" }}
        >
          {/* Existing top-level comments + their replies */}
          {comments.map((comment) => {
            const commentReplies = replies.filter((r) => r.parent_id === comment.id)
            return (
              <div key={comment.id} className="flex flex-col gap-2">
                <CommentRow
                  comment={comment}
                  currentUser={currentUser}
                  onDelete={handleCommentDeleted}
                  onReply={(id) => setReplyingTo(replyingTo === id ? null : id)}
                />

                {/* Replies */}
                {commentReplies.map((reply) => (
                  <div key={reply.id} className="flex items-start gap-1.5 pl-7">
                    <CornerDownRight size={12} className="mt-1.5 flex-shrink-0" style={{ color: "var(--color-text-muted)" }} />
                    <div className="flex-1">
                      <CommentRow
                        comment={reply}
                        currentUser={currentUser}
                        onDelete={handleCommentDeleted}
                        isReply
                      />
                    </div>
                  </div>
                ))}

                {/* Reply input */}
                {replyingTo === comment.id && (
                  <div className="pl-7">
                    <CommentInput
                      postId={post.id}
                      parentId={comment.id}
                      currentUser={currentUser}
                      placeholder={`Responder a ${comment.author?.full_name ?? ""}…`}
                      onAdded={handleCommentAdded}
                      onCancel={() => setReplyingTo(null)}
                    />
                  </div>
                )}
              </div>
            )
          })}

          {/* New top-level comment input */}
          <CommentInput
            postId={post.id}
            currentUser={currentUser}
            placeholder="Escribe un comentario…"
            onAdded={handleCommentAdded}
          />
        </div>
      )}
    </article>
  )
}
