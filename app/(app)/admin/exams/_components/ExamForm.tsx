"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createExam, updateExam } from "@/app/actions/admin"
import { QuestionEditor, type Question } from "./QuestionEditor"
import { PdfUploadField, type PdfResource } from "@/app/(app)/admin/_components/PdfUploadField"

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]
const SKILLS = [
  { value: "reading",        label: "Comprensión lectora" },
  { value: "writing",        label: "Expresión escrita" },
  { value: "listening",      label: "Comprensión auditiva" },
  { value: "speaking_prep",  label: "Preparación oral" },
  { value: "grammar",        label: "Gramática" },
  { value: "use_of_english", label: "Uso del inglés" },
]
const EXAM_TYPES = [
  { value: "interactive",  label: "Interactivo (preguntas en plataforma)" },
  { value: "pdf_practice", label: "PDF (alumno escribe respuesta libre)" },
]

const FIELD = "block text-sm font-medium mb-1.5"
const INPUT =
  "w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all focus:ring-2 focus:ring-blue-200"

export type ExamFormData = {
  id: string
  title: string
  description: string | null
  level: string
  skill: string
  exam_type: string
  time_limit_minutes: number | null
  max_score: number
  is_published: boolean
  questions: Question[]
  pdf_url: string | null
}

export function ExamForm({ exam }: { exam?: ExamFormData }) {
  const router = useRouter()
  const isEdit = !!exam?.id
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [examType, setExamType] = useState(exam?.exam_type ?? "interactive")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const result = isEdit ? await updateExam(exam!.id, fd) : await createExam(fd)

    if (result && "error" in result && result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.push("/admin/exams")
  }

  const initialPdf: PdfResource[] = exam?.pdf_url ? [{ name: "PDF del examen", url: exam.pdf_url }] : []

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className={FIELD} style={{ color: "var(--color-text)" }}>
          Título <span style={{ color: "var(--color-crimson)" }}>*</span>
        </label>
        <input
          name="title" required minLength={2} maxLength={200}
          defaultValue={exam?.title ?? ""}
          placeholder="Ej: Cambridge B2 — Reading & Use of English Part 1"
          className={INPUT}
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        />
      </div>

      {/* Description */}
      <div>
        <label className={FIELD} style={{ color: "var(--color-text)" }}>Descripción</label>
        <textarea
          name="description" rows={2} maxLength={500}
          defaultValue={exam?.description ?? ""}
          placeholder="Instrucciones o contexto del examen..."
          className={INPUT + " resize-none"}
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={FIELD} style={{ color: "var(--color-text)" }}>
            Nivel <span style={{ color: "var(--color-crimson)" }}>*</span>
          </label>
          <select name="level" required defaultValue={exam?.level ?? "B2"} className={INPUT}
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className={FIELD} style={{ color: "var(--color-text)" }}>
            Habilidad <span style={{ color: "var(--color-crimson)" }}>*</span>
          </label>
          <select name="skill" required defaultValue={exam?.skill ?? "writing"} className={INPUT}
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            {SKILLS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Exam type (controlled) */}
      <div>
        <label className={FIELD} style={{ color: "var(--color-text)" }}>
          Tipo de examen <span style={{ color: "var(--color-crimson)" }}>*</span>
        </label>
        <select
          name="exam_type" required value={examType}
          onChange={(e) => setExamType(e.target.value)}
          className={INPUT}
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          {EXAM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={FIELD} style={{ color: "var(--color-text)" }}>Tiempo límite (min)</label>
          <input
            name="time_limit_minutes" type="number" min={0} max={480}
            defaultValue={exam?.time_limit_minutes ?? ""}
            placeholder="Dejar vacío = sin límite" className={INPUT}
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          />
        </div>
        {/* Manual max_score only for PDF; interactive derives it from questions */}
        {examType === "pdf_practice" && (
          <div>
            <label className={FIELD} style={{ color: "var(--color-text)" }}>Puntuación máxima</label>
            <input
              name="max_score" type="number" min={1} max={1000}
              defaultValue={exam?.max_score ?? 100} className={INPUT}
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            />
          </div>
        )}
      </div>

      {/* Type-specific authoring */}
      {examType === "interactive" ? (
        <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
          <QuestionEditor name="questions" totalName="max_score" initial={exam?.questions ?? []} />
        </div>
      ) : (
        <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
          <label className={FIELD} style={{ color: "var(--color-text)" }}>
            PDF del examen <span style={{ color: "var(--color-crimson)" }}>*</span>
          </label>
          <PdfUploadField prefix="exam-pdfs" name="pdf_url" initial={initialPdf} />
        </div>
      )}

      {/* Published */}
      <div className="flex items-center gap-3">
        <input type="checkbox" id="is_published_exam" name="is_published" value="true"
          defaultChecked={exam?.is_published ?? false}
          className="w-4 h-4 rounded" style={{ accentColor: "var(--color-primary)" }} />
        <label htmlFor="is_published_exam" className="text-sm font-medium cursor-pointer" style={{ color: "var(--color-text)" }}>
          Publicar examen inmediatamente
        </label>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "#FEE2E2", color: "#DC2626" }}>
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "var(--color-primary)" }}>
          {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear examen"}
        </button>
        <button type="button" onClick={() => router.push("/admin/exams")}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
