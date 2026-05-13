"use client"

import { useState } from "react"
import Link from "next/link"
import { Play, BookOpen, Eye, EyeOff, Pencil, Trash2 } from "lucide-react"
import { toggleLessonPublished, deleteLesson } from "@/app/actions/admin"

type Lesson = {
  id: string
  title: string
  description: string | null
  level: string
  video_url: string | null
  is_published: boolean
  order_index: number
}

export function LessonRow({ lesson }: { lesson: Lesson }) {
  const [published, setPublished] = useState(lesson.is_published)
  const [deleted, setDeleted] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (deleted) return null

  async function handleTogglePublished() {
    if (publishLoading) return
    setPublishLoading(true)
    setError(null)
    const result = await toggleLessonPublished(lesson.id, published)
    if (result.error) setError(result.error)
    else setPublished(!published)
    setPublishLoading(false)
  }

  async function handleDelete() {
    if (deleteLoading) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleteLoading(true)
    setError(null)
    const result = await deleteLesson(lesson.id)
    if (result.error) setError(result.error)
    else setDeleted(true)
    setDeleteLoading(false)
    setConfirmDelete(false)
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: lesson.video_url ? "#EEF1FA" : "var(--color-bg-alt)" }}
      >
        {lesson.video_url
          ? <Play size={16} style={{ color: "var(--color-primary)" }} />
          : <BookOpen size={16} style={{ color: "var(--color-text-muted)" }} />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
            #{lesson.order_index + 1} {lesson.title}
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{
              background: published ? "#D1FAE5" : "var(--color-bg-alt)",
              color: published ? "#16A34A" : "var(--color-text-muted)",
            }}
          >
            {published ? "Publicada" : "Borrador"}
          </span>
        </div>
        {lesson.description && (
          <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {lesson.description}
          </p>
        )}
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Publish toggle */}
        <button
          onClick={handleTogglePublished}
          disabled={publishLoading}
          title={published ? "Despublicar" : "Publicar"}
          className="p-2 rounded-lg transition-all hover:opacity-70"
          style={{
            background: published ? "#D1FAE520" : "#FFF8E7",
            color: published ? "#16A34A" : "#D4A017",
          }}
        >
          {published ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>

        {/* Edit */}
        <Link
          href={`/admin/lessons/${lesson.id}/edit`}
          className="p-2 rounded-lg transition-all hover:opacity-70"
          style={{ background: "#EEF1FA", color: "var(--color-primary)" }}
          title="Editar"
        >
          <Pencil size={15} />
        </Link>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleteLoading}
          title={confirmDelete ? "Confirmar eliminar" : "Eliminar"}
          className="p-2 rounded-lg transition-all hover:opacity-70"
          style={{
            background: confirmDelete ? "#FEE2E2" : "var(--color-bg-alt)",
            color: confirmDelete ? "#DC2626" : "var(--color-text-muted)",
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
