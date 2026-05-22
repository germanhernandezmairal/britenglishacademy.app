"use client"

import { useState, useTransition } from "react"
import {
  FileText, Download, ChevronDown, ChevronUp, CheckCircle2,
  Clock, AlertCircle, Trash2, Loader2, Star, Target, Lightbulb,
} from "lucide-react"
import { deleteHomeworkSubmission } from "@/app/actions/homework"

type GrammarError = {
  type: string
  original: string
  correction: string
  explanation: string
}

type ClaudeFeedback = {
  summary: string
  score_estimate: number
  strengths: string[]
  focus_areas: string[]
  errors: GrammarError[]
}

type Submission = {
  id: string
  title: string
  description: string | null
  file_name: string
  file_size: number | null
  file_type: string
  status: "pending" | "under_review" | "corrected"
  submitted_at: string
  reviewed_at: string | null
  claude_feedback: ClaudeFeedback | null
  teacher_feedback: string | null
  downloadUrl: string | null
  correctedDownloadUrl: string | null
}

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    color: "#D4A017",
    bg: "#FFF8E7",
    icon: Clock,
  },
  under_review: {
    label: "En revisión",
    color: "#1A3A8C",
    bg: "#EEF1FA",
    icon: AlertCircle,
  },
  corrected: {
    label: "Corregido",
    color: "#16A34A",
    bg: "#D1FAE5",
    icon: CheckCircle2,
  },
} as const

function scoreColor(score: number) {
  if (score >= 80) return "#16A34A"
  if (score >= 60) return "#D4A017"
  return "#DC2626"
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function SubmissionCard({ submission, onDeleted }: {
  submission: Submission
  onDeleted: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const cfg = STATUS_CONFIG[submission.status]
  const StatusIcon = cfg.icon
  const feedback = submission.claude_feedback

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteHomeworkSubmission(submission.id)
      if (!("error" in result)) onDeleted(submission.id)
    })
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "white", borderColor: "var(--color-border)" }}
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* File icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: "var(--color-primary-50)" }}
          >
            <FileText size={18} style={{ color: "var(--color-primary)" }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold leading-snug" style={{ color: "var(--color-text)" }}>
                {submission.title}
              </h3>
              {/* Status badge */}
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                <StatusIcon size={11} />
                {cfg.label}
              </span>
            </div>

            {submission.description && (
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--color-text-muted)" }}>
                {submission.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {formatDate(submission.submitted_at)}
              </span>
              {submission.file_size && (
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {formatBytes(submission.file_size)}
                </span>
              )}

              {/* Download link */}
              {submission.downloadUrl && (
                <a
                  href={submission.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                  style={{ color: "var(--color-primary)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={11} />
                  Descargar
                </a>
              )}
            </div>
          </div>
        </div>

        {/* AI feedback + teacher feedback expand trigger */}
        {(feedback || submission.teacher_feedback || submission.correctedDownloadUrl) && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: expanded ? "var(--color-primary-50)" : "var(--color-bg-alt)",
              color: "var(--color-primary)",
            }}
          >
            <span className="flex items-center gap-1.5">
              {feedback && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: `${scoreColor(feedback.score_estimate)}22`,
                    color: scoreColor(feedback.score_estimate),
                  }}
                >
                  Puntuación IA: {feedback.score_estimate}/100
                </span>
              )}
              {submission.teacher_feedback && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#D1FAE5", color: "#16A34A" }}
                >
                  Revisado por profesor
                </span>
              )}
            </span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* Expandable feedback panel */}
      {expanded && (
        <div
          className="border-t px-5 pb-5 pt-4 space-y-5"
          style={{ borderColor: "var(--color-border)" }}
        >
          {/* Claude AI feedback */}
          {feedback && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--color-primary-100)" }}
                >
                  <Lightbulb size={14} style={{ color: "var(--color-primary)" }} />
                </div>
                <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                  Análisis de IA
                </span>
                <span
                  className="text-lg font-black ml-auto"
                  style={{ color: scoreColor(feedback.score_estimate) }}
                >
                  {feedback.score_estimate}
                  <span className="text-xs font-semibold opacity-60">/100</span>
                </span>
              </div>

              {/* Summary */}
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {feedback.summary}
              </p>

              {/* Strengths */}
              {feedback.strengths.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star size={13} style={{ color: "var(--color-gold-light)" }} />
                    <span className="text-xs font-bold" style={{ color: "var(--color-text)" }}>
                      Puntos fuertes
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs leading-relaxed"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        <CheckCircle2 size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Focus areas */}
              {feedback.focus_areas.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Target size={13} style={{ color: "var(--color-accent)" }} />
                    <span className="text-xs font-bold" style={{ color: "var(--color-text)" }}>
                      Áreas a mejorar
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {feedback.focus_areas.map((a, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs leading-relaxed"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                          style={{ background: "var(--color-accent-50)", color: "var(--color-accent)" }}
                        >
                          {i + 1}
                        </span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errors */}
              {feedback.errors.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: "var(--color-text)" }}>
                    Correcciones principales
                  </p>
                  <div className="space-y-2">
                    {feedback.errors.map((err, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl"
                        style={{ background: "var(--color-bg-alt)" }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                            style={{ background: "var(--color-accent-100)", color: "var(--color-accent)" }}
                          >
                            {err.type}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-xs">
                          <span className="line-through opacity-60" style={{ color: "var(--color-text)" }}>
                            {err.original}
                          </span>
                          <span>→</span>
                          <span className="font-semibold" style={{ color: "#16A34A" }}>
                            {err.correction}
                          </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                          {err.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Teacher feedback */}
          {submission.teacher_feedback && (
            <div
              className="p-4 rounded-xl border"
              style={{ background: "#F0FDF4", borderColor: "#6EE7B7" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={15} className="text-green-600" />
                <span className="text-sm font-bold" style={{ color: "#166534" }}>
                  Corrección del profesor
                </span>
                {submission.reviewed_at && (
                  <span className="text-xs ml-auto" style={{ color: "#16A34A" }}>
                    {formatDate(submission.reviewed_at)}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#166534" }}>
                {submission.teacher_feedback}
              </p>
              {submission.correctedDownloadUrl && (
                <a
                  href={submission.correctedDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold hover:underline"
                  style={{ color: "#166534" }}
                >
                  <Download size={12} />
                  Descargar archivo corregido
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete (pending only) */}
      {submission.status === "pending" && (
        <div
          className="px-5 py-3 border-t flex items-center justify-end gap-3"
          style={{ borderColor: "var(--color-border)", background: "var(--color-bg-alt)" }}
        >
          {confirmDelete ? (
            <>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                ¿Confirmar eliminación?
              </span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-60"
                style={{ background: "var(--color-error)" }}
              >
                {isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Eliminar
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity"
              style={{ color: "var(--color-text-muted)" }}
            >
              <Trash2 size={13} />
              Eliminar envío
            </button>
          )}
        </div>
      )}
    </div>
  )
}
