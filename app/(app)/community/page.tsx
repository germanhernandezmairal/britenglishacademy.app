import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CommunityFeed } from "./_components/CommunityFeed"

export const metadata: Metadata = { title: "Comunidad | Brit English Academy" }

export default async function CommunityPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("level, role, full_name, avatar_url")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  // Build posts query with level filter for students
  let postsQuery = supabase
    .from("posts")
    .select("id, content, type, is_pinned, level_filter, created_at, ai_banner_url, author:profiles(id, full_name, avatar_url, level, role)")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30)

  if (profile.role !== "admin" && profile.level) {
    postsQuery = postsQuery.or(`level_filter.is.null,level_filter.eq.${profile.level}`)
  }

  const { data: posts } = await postsQuery
  const postIds = (posts ?? []).map((p) => p.id)

  // Parallel: reactions + comments
  const [reactionsRes, commentsRes] = await Promise.all([
    postIds.length > 0
      ? supabase.from("post_reactions").select("post_id, emoji, user_id").in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string; emoji: string; user_id: string }[] }),
    postIds.length > 0
      ? supabase
          .from("post_comments")
          .select("id, post_id, author_id, parent_id, content, created_at, author:profiles(id, full_name, avatar_url)")
          .in("post_id", postIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ])

  const allReactions = reactionsRes.data ?? []
  const allComments = (commentsRes.data ?? []) as Record<string, unknown>[]

  // Build reaction stats: postId → { counts, userReacted }
  const reactionStats: Record<string, { counts: Record<string, number>; userReacted: string[] }> = {}
  for (const postId of postIds) reactionStats[postId] = { counts: {}, userReacted: [] }
  for (const r of allReactions) {
    const s = reactionStats[r.post_id]
    if (!s) continue
    s.counts[r.emoji] = (s.counts[r.emoji] ?? 0) + 1
    if (r.user_id === user.id) s.userReacted.push(r.emoji)
  }

  // Group comments: top-level and replies by post
  const commentsByPost: Record<string, typeof allComments> = {}
  const repliesByPost: Record<string, typeof allComments> = {}
  for (const postId of postIds) {
    commentsByPost[postId] = []
    repliesByPost[postId] = []
  }
  for (const c of allComments) {
    const pid = c.post_id as string
    if (c.parent_id) repliesByPost[pid]?.push(c)
    else commentsByPost[pid]?.push(c)
  }

  const enrichedPosts = (posts ?? []).map((p) => ({
    id: p.id,
    content: p.content,
    type: p.type as "student_post" | "announcement" | "weekly_challenge",
    is_pinned: p.is_pinned,
    level_filter: p.level_filter,
    created_at: p.created_at,
    ai_banner_url: p.ai_banner_url,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    author: (Array.isArray(p.author) ? p.author[0] : p.author) as any,
    reactions: reactionStats[p.id]?.counts ?? {},
    userReactions: reactionStats[p.id]?.userReacted ?? [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comments: (commentsByPost[p.id] ?? []) as any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    replies: (repliesByPost[p.id] ?? []) as any[],
    comment_count: (commentsByPost[p.id]?.length ?? 0) + (repliesByPost[p.id]?.length ?? 0),
  }))

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto">
      <CommunityFeed
        initialPosts={enrichedPosts}
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
