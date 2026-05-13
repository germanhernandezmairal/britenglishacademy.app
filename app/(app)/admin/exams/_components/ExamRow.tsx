"use client"

import { useState } from "react"
import { Clock, Eye, EyeOff, Trash2 } from "lucide-react"
import { toggleExamPublished, deleteExam } from "@/app/actions/admin"

const TYPE_LABELS: Record<string, string> = {
  interactive:  "Interactivo",
  pdf_practice: "PDF",
}

type Exam = {
  id: string
  title: string
  skill: string
  exam_type: string
  time_limit_minutes: number | null
  max_score: number
  is_published: boolean
  skill_label: string
}

export function ExamRow({ exam }: { exam: Exam }) {
  const [published, setPublished] = useState(exam.is_published)
  const [deleted, setDeleted] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (deleted) return null

  async function handleToggle() {
    if (publishLoading) return
    setPublishLoading(true)
    setError(null)
    const result = await toggleExamPublished(exam.id, published)
    if (result.error) setError(result.error)
    else setPublished(!published)
    setPublishLoading(false)
  }

  async function handleDelete() {
    if (deleteLoading) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleteLoading(true)
    setError(null)
    const result = await deleteExam(exam.id)
    if (result.error) setError(result.error)
    else setDeleted(true)
    setDeleteLoading(false)
    setConfirmDelete(false)
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
            {exam.title}
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{
              background: published ? "#D1FAE5" : "var(--color-bg-alt)",
              color: published ? "#16A34A" : "var(--color-text-muted)",
            }}
          >
            {published ? "Publicado" : "Borrador"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {exam.skill_label}
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>·</span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {TYPE_LABELS[exam.exam_type] ?? exam.exam_type}
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>·</span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {exam.max_score} pts
          </span>
          {exam.time_limit_minutes && (
            <>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>·</span>
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                <Clock size={11} /> {exam.time_limit_minutes} min
              </span>
            </>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleToggle}
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
