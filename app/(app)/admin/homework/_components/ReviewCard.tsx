"use client"

import { useState } from "react"
import { Download, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import { updateHomeworkStatus } from "@/app/actions/admin"

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  A1: { bg: "#FFF8E7", text: "#D4A017" }, A2: { bg: "#FFF8E7", text: "#D4A017" },
  B1: { bg: "#EEF1FA", text: "#1A3A8C" }, B2: { bg: "#EEF1FA", text: "#1A3A8C" },
  C1: { bg: "#D5DCF3", text: "#012169" }, C2: { bg: "#D5DCF3", text: "#012169" },
}

type ClaudeFeedback = {
  summary: string
  score_estimate: number
  strengths: string[]
  focus_areas: string[]
  errors: Array<{ type: string; original: string; correction: string; explanation: string }>
}

type Submission = {
  id: string
  title: string
  description: string | null
  file_name: string
  file_size: number | null
  status: "pending" | "under_review" | "corrected"
  submitted_at: string
  reviewed_at: string | null
  teacher_feedback: string | null
  claude_feedback: ClaudeFeedback | null
  download_url: string | null
  student: { full_name: string; level: string | null }
}

const STATUS_COLORS = {
  pending:      { bg: "#FFF8E7", text: "#D4A017", label: "Pendiente" },
  under_review: { bg: "#EEF1FA", text: "#1A3A8C", label: "En revisión" },
  corrected:    { bg: "#D1FAE5", text: "#16A34A", label: "Corregido" },
}

function formatBytes(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ReviewCard({ submission }: { submission: Submission }) {
  const [status, setStatus] = useState(submission.status)
  const [feedback, setFeedback] = useState(submission.teacher_feedback ?? "")
  const [expanded, setExpanded] = useState(submission.status === "pending")
  const [showAI, setShowAI] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sc = STATUS_COLORS[status]
  const lc = submission.student.level ? LEVEL_COLORS[submission.student.level] : null

  async function handleSave(newStatus: typeof status) {
    if (saving) return
    setSaving(true)
    setError(null)
    const result = await updateHomeworkStatus(submission.id, newStatus, feedback)
    if (result.error) {
      setError(result.error)
    } else {
      setStatus(newStatus)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const submittedDate = new Date(submission.submitted_at).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  })

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "white", borderColor: "var(--color-border)" }}
    >
      {/* Card header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-bold truncate" style={{ color: "var(--color-text)" }}>
              {submission.title}
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: sc.bg, color: sc.text }}
            >
              {sc.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span className="font-medium" style={{ color: "var(--color-text)" }}>
              {submission.student.full_name}
            </span>
            {lc && (
              <span
                className="font-bold px-1.5 py-0.5 rounded text-[10px]"
                style={{ background: lc.bg, color: lc.text }}
              >
                {submission.student.level}
              </span>
            )}
            <span>·</span>
            <span>{submittedDate}</span>
            {submission.file_size && <span>· {formatBytes(submission.file_size)}</span>}
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} style={{ color: "var(--color-text-muted)" }} />
        ) : (
          <ChevronDown size={16} style={{ color: "var(--color-text-muted)" }} />
        )}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: "var(--color-border)" }}>
          {/* Description */}
          {submission.description && (
            <p className="text-sm pt-4" style={{ color: "var(--color-text-muted)" }}>
              {submission.description}
            </p>
          )}

          {/* File download */}
          {submission.download_url && (
            <a
              href={submission.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all hover:shadow-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-primary)", background: "#EEF1FA" }}
            >
              <Download size={14} />
              {submission.file_name}
            </a>
          )}

          {/* Claude AI feedback */}
          {submission.claude_feedback && (
            <div>
              <button
                onClick={() => setShowAI((p) => !p)}
                className="flex items-center gap-2 text-xs font-semibold mb-2"
                style={{ color: "var(--color-primary)" }}
              >
                <Sparkles size={13} />
                Análisis de IA
                {showAI ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showAI && (
                <div
                  className="p-4 rounded-xl border space-y-3 text-xs"
                  style={{ background: "#EEF1FA", borderColor: "#A6B4E4" }}
                >
                  <p style={{ color: "var(--color-text)" }}>{submission.claude_feedback.summary}</p>

                  {submission.claude_feedback.strengths.length > 0 && (
                    <div>
                      <p className="font-semibold mb-1" style={{ color: "#16A34A" }}>Puntos fuertes</p>
                      <ul className="space-y-0.5">
                        {submission.claude_feedback.strengths.map((s, i) => (
                          <li key={i} style={{ color: "var(--color-text)" }}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {submission.claude_feedback.focus_areas.length > 0 && (
                    <div>
                      <p className="font-semibold mb-1" style={{ color: "#D4A017" }}>Áreas de mejora</p>
                      <ul className="space-y-0.5">
                        {submission.claude_feedback.focus_areas.map((s, i) => (
                          <li key={i} style={{ color: "var(--color-text)" }}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {submission.claude_feedback.errors.length > 0 && (
                    <div>
                      <p className="font-semibold mb-1" style={{ color: "var(--color-crimson)" }}>
                        Errores principales
                      </p>
                      <div className="space-y-1.5">
                        {submission.claude_feedback.errors.map((err, i) => (
                          <div key={i} className="p-2 rounded-lg bg-white/60">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="line-through opacity-60">{err.original}</span>
                              <span>→</span>
                              <span className="font-semibold text-green-700">{err.correction}</span>
                            </div>
                            <p className="opacity-70">{err.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Teacher feedback */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--color-text)" }}
            >
              Notas del profesor
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="Añade correcciones, comentarios o notas para el alumno..."
              className="w-full text-sm px-3 py-2.5 rounded-xl border outline-none resize-none"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-bg)",
                color: "var(--color-text)",
              }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {status === "pending" && (
              <button
                onClick={() => handleSave("under_review")}
                disabled={saving}
                className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90"
                style={{ background: "var(--color-primary)" }}
              >
                {saving ? "Guardando…" : "Marcar en revisión"}
              </button>
            )}

            {(status === "pending" || status === "under_review") && (
              <button
                onClick={() => handleSave("corrected")}
                disabled={saving}
                className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90"
                style={{ background: "#16A34A" }}
              >
                {saving ? "Guardando…" : "Marcar como corregido"}
              </button>
            )}

            {status !== "pending" && (
              <button
                onClick={() => handleSave("pending")}
                disabled={saving}
                className="text-sm font-semibold px-4 py-2 rounded-xl border transition-all hover:opacity-80"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
              >
                Resetear a pendiente
              </button>
            )}

            {feedback !== (submission.teacher_feedback ?? "") && (
              <button
                onClick={() => handleSave(status)}
                disabled={saving}
                className="text-sm font-semibold px-4 py-2 rounded-xl border transition-all hover:shadow-sm"
                style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", background: "#EEF1FA" }}
              >
                {saving ? "Guardando…" : "Guardar notas"}
              </button>
            )}

            {saved && (
              <span className="text-xs font-semibold" style={{ color: "#16A34A" }}>
                ✓ Guardado
              </span>
            )}
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
