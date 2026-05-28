import type { Metadata } from "next"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import { LessonForm } from "../../_components/LessonForm"

export const metadata: Metadata = { title: "Editar Lección | Admin | Brit English Academy" }

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!me || !["admin", "teacher"].includes(me.role)) redirect("/dashboard")

  const admin = await createAdminClient()
  const { data: lesson } = await admin
    .from("lessons")
    .select("id, title, description, level, video_url, order_index, is_published")
    .eq("id", id)
    .single()

  if (!lesson) notFound()

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/lessons" className="flex items-center gap-1.5 text-xs font-medium hover:underline"
          style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={13} /> Lecciones
        </Link>
      </div>

      <h1
        className="text-2xl font-bold mb-6"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
      >
        Editar lección
      </h1>

      <div
        className="p-6 rounded-2xl border"
        style={{ background: "white", borderColor: "var(--color-border)" }}
      >
        <LessonForm
          lesson={{
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            level: lesson.level,
            video_url: lesson.video_url,
            order_index: lesson.order_index,
            is_published: lesson.is_published,
          }}
        />
      </div>
    </div>
  )
}
