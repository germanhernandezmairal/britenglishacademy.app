"use client"

import { useState } from "react"
import { NewPostForm } from "./NewPostForm"
import { PostCard } from "./PostCard"

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

const TABS = [
  { id: "all",              label: "Todo" },
  { id: "weekly_challenge", label: "Retos" },
  { id: "announcement",     label: "Anuncios" },
  { id: "mine",             label: "Míos" },
] as const

type TabId = (typeof TABS)[number]["id"]

export function CommunityFeed({
  initialPosts,
  currentUser,
}: {
  initialPosts: PostData[]
  currentUser: CurrentUser
}) {
  const [posts, setPosts]   = useState<PostData[]>(initialPosts)
  const [activeTab, setActiveTab] = useState<TabId>("all")

  function handlePosted(post: PostData) {
    setPosts((prev) => [post, ...prev])
  }

  function handleDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const filtered = posts.filter((p) => {
    if (activeTab === "all")              return true
    if (activeTab === "mine")             return p.author?.id === currentUser.id
    return p.type === activeTab
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-black mb-1"
          style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
        >
          Comunidad
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Comparte tu progreso, pregunta dudas y motiva a tus compañeros.
        </p>
      </div>

      {/* New post form */}
      <NewPostForm currentUser={currentUser} onPosted={handlePosted} />

      {/* Filter tabs */}
      <div
        className="flex gap-1 p-1 rounded-2xl mb-5"
        style={{ background: "var(--color-bg-alt)", border: "1px solid var(--color-border)" }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: active ? "white" : "transparent",
                color: active ? "var(--color-primary)" : "var(--color-text-muted)",
                boxShadow: active ? "0 1px 3px rgba(0,0,0,.08)" : "none",
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl border"
          style={{ background: "white", borderColor: "var(--color-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {activeTab === "mine"
              ? "Todavía no has publicado nada."
              : "No hay publicaciones en esta categoría."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
