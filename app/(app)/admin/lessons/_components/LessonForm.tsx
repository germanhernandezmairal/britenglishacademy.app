"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createLesson, updateLesson } from "@/app/actions/admin"
import { VocabularyEditor, type VocabItem } from "./VocabularyEditor"
import { PdfUploadField, type PdfResource } from "@/app/(app)/admin/_components/PdfUploadField"

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]

type LessonData = {
  id?: string
  title: string
  description: string | null
  level: string
  video_url: string | null
  order_index: number
  is_published: boolean
  vocabulary: VocabItem[]
  pdf_resources: PdfResource[]
}

const FIELD = "block text-sm font-medium mb-1.5"
const INPUT =
  "w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all focus:ring-2 focus:ring-blue-200"

export function LessonForm({ lesson }: { lesson?: LessonData }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!lesson?.id

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const result = isEdit
      ? await updateLesson(lesson!.id!, fd)
      : await createLesson(fd)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push("/admin/lessons")
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className={FIELD} style={{ color: "var(--color-text)" }}>
          Título <span style={{ color: "var(--color-crimson)" }}>*</span>
        </label>
        <input
          name="title"
          required
          minLength={2}
          maxLength={200}
          defaultValue={lesson?.title ?? ""}
          placeholder="Ej: Present Perfect — Uso y práctica"
          className={INPUT}
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        />
      </div>

      {/* Description */}
      <div>
        <label className={FIELD} style={{ color: "var(--color-text)" }}>
          Descripción
        </label>
        <textarea
          name="description"
          rows={3}
          maxLength={1000}
          defaultValue={lesson?.description ?? ""}
          placeholder="Breve descripción del contenido de la lección..."
          className={INPUT + " resize-none"}
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Level */}
        <div>
          <label className={FIELD} style={{ color: "var(--color-text)" }}>
            Nivel <span style={{ color: "var(--color-crimson)" }}>*</span>
          </label>
          <select
            name="level"
            required
            defaultValue={lesson?.level ?? "B1"}
            className={INPUT}
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Order index */}
        <div>
          <label className={FIELD} style={{ color: "var(--color-text)" }}>
            Orden
          </label>
          <input
            name="order_index"
            type="number"
            min={0}
            max={999}
            defaultValue={lesson?.order_index ?? 0}
            className={INPUT}
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          />
        </div>
      </div>

      {/* Video URL */}
      <div>
        <label className={FIELD} style={{ color: "var(--color-text)" }}>
          URL del vídeo (YouTube)
        </label>
        <input
          name="video_url"
          type="url"
          defaultValue={lesson?.video_url ?? ""}
          placeholder="https://www.youtube.com/watch?v=..."
          className={INPUT}
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        />
        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
          Pega la URL de YouTube. Se convertirá automáticamente a embed.
        </p>
      </div>

      {/* Vocabulary */}
      <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
        <VocabularyEditor name="vocabulary" initial={lesson?.vocabulary ?? []} />
      </div>

      {/* PDF resources */}
      <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
          Recursos descargables (PDF)
        </label>
        <PdfUploadField prefix="lesson-pdfs" multiple name="pdf_resources" initial={lesson?.pdf_resources ?? []} />
      </div>

      {/* Published */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_published"
          name="is_published"
          value="true"
          defaultChecked={lesson?.is_published ?? false}
          className="w-4 h-4 rounded"
          style={{ accentColor: "var(--color-primary)" }}
        />
        <label htmlFor="is_published" className="text-sm font-medium cursor-pointer"
          style={{ color: "var(--color-text)" }}>
          Publicar lección inmediatamente
        </label>
      </div>

      {error && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{ background: "#FEE2E2", color: "#DC2626" }}
        >
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "var(--color-primary)" }}
        >
          {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear lección"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/lessons")}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
