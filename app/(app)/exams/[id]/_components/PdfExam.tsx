"use client"

import { useState, useTransition } from "react"
import {
  ArrowLeft, FileText, Download, Send, Loader2,
  CheckCircle2, XCircle, Star, Target,
} from "lucide-react"
import { submitPdfExam } from "@/app/actions/exams"

type ExamData = {
  id: string
  title: string
  description: string | null
  level: string
  skill: string
  pdf_url: string | null
  time_limit_minutes: number | null
  max_score: number
}

type Attempt = {
  id: string
  score: number | null
  band_score: string | null
  status: string
  submitted_at: string
  claude_feedback: Record<string, unknown> | null
  teacher_feedback: string | null
  teacher_override_score: number | null
}

type PdfResult = {
  submissionId: string
  score: number
  maxScore: number
  band: string
  percentage: number
  summary: string
  strengths: string[]
  improvements: string[]
  detailedFeedback: string
}

const BAND_COLOR: Record<string, string> = {
  A: "#16A34A", B: "#0D9488", C: "#1A3A8C", D: "#D4A017", E: "#EA580C", U: "#DC2626",
}

const BAND_LABEL: Record<string, string> = {
  A: "Sobresaliente", B: "Notable", C: "Bien", D: "Aprobado", E: "Suspenso", U: "No presentado",
}

const SKILL_LABEL: Record<string, string> = {
  reading: "Comprensión lectora",
  writing: "Expresión escrita",
  listening: "Comprensión auditiva",
  speaking_prep: "Preparación oral",
  grammar: "Gramática",
  use_of_english: "Uso del inglés",
}

export function PdfExam({
  exam,
  onBack,
  onComplete,
}: {
  exam: ExamData
  onBack: () => void
  onComplete: (attempt: Attempt) => void
}) {
  const [essay, setEssay] = useState("")
  const [result, setResult] = useState<PdfResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (essay.trim().length < 10) {
      setError("La respuesta es demasiado corta (mínimo 10 caracteres)")
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await submitPdfExam(exam.id, essay)
      if ("error" in res) {
        setError(res.error ?? null)
        return
      }
      const attempt: Attempt = {
        id: res.submissionId,
        score: res.score,
        band_score: res.band,
        status: "graded",
        submitted_at: new Date().toISOString(),
        claude_feedback: {
          summary: res.summary,
          per_question: [],
          strengths: res.strengths,
          improvements: res.improvements,
          detailed_feedback: res.detailedFeedback,
        },
        teacher_feedback: null,
        teacher_override_score: null,
      }
      onComplete(attempt)
      setResult(res)
    })
  }

  // ── Result view ───────────────────────────────────────────────────────────
  if (result) {
    const bc = BAND_COLOR[result.band] ?? BAND_COLOR.U

    return (
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm mb-6 hover:underline"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ArrowLeft size={15} />
          Volver a información
        </button>

        {/* Score hero */}
        <div
          className="p-8 rounded-2xl border text-center mb-6"
          style={{ background: bc + "0E", borderColor: bc + "33" }}
        >
          <div className="text-5xl font-black mb-1" style={{ color: bc }}>
            {result.score}
            <span className="text-2xl font-semibold opacity-50">/{result.maxScore}</span>
          </div>
          <div className="text-sm font-semibold mb-1" style={{ color: bc }}>
            {result.percentage}% — Banda {result.band}: {BAND_LABEL[result.band] ?? result.band}
          </div>
          {result.summary && (
            <p className="text-sm mt-3 leading-relaxed max-w-lg mx-auto"
              style={{ color: "var(--color-text-secondary)" }}>
              {result.summary}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {result.strengths.length > 0 && (
            <div className="p-4 rounded-2xl border" style={{ background: "white", borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Star size={15} className="text-yellow-500" />
                <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>Puntos fuertes</span>
              </div>
              <ul className="space-y-1.5">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    <CheckCircle2 size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.improvements.length > 0 && (
            <div className="p-4 rounded-2xl border" style={{ background: "white", borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Target size={15} style={{ color: "var(--color-accent)" }} />
                <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>A mejorar</span>
              </div>
              <ul className="space-y-1.5">
                {result.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                      style={{ background: "var(--color-accent-50)", color: "var(--color-accent)" }}>{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {result.detailedFeedback && (
          <div className="p-6 rounded-2xl border" style={{ background: "white", borderColor: "var(--color-border)" }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}>
              Feedback detallado
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {result.detailedFeedback}
            </p>
          </div>
        )}
      </div>
    )
  }

  // ── Exam form ─────────────────────────────────────────────────────────────
  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:underline"
        style={{ color: "var(--color-text-muted)" }}
      >
        <ArrowLeft size={15} />
        Volver a información
      </button>

      {/* PDF download */}
      {exam.pdf_url && (
        <div
          className="flex items-center gap-4 p-5 rounded-2xl border mb-6"
          style={{ background: "white", borderColor: "var(--color-border)" }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#FEE2E2" }}
          >
            <FileText size={22} style={{ color: "#C8102E" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              {exam.title}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {SKILL_LABEL[exam.skill] ?? exam.skill} · Nivel {exam.level}
            </p>
          </div>
          <a
            href={exam.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
            style={{ background: "#C8102E" }}
          >
            <Download size={14} />
            Descargar PDF
          </a>
        </div>
      )}

      {/* Instructions */}
      <div
        className="p-5 rounded-2xl border mb-6"
        style={{ background: "var(--color-primary-50)", borderColor: "var(--color-primary-200)" }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-primary)" }}>
          Instrucciones
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-primary-light)" }}>
          Descarga el PDF, realiza las actividades y escribe tus respuestas en el cuadro de texto de abajo.
          La IA analizará tu escritura y te dará feedback inmediato.
          {exam.time_limit_minutes && ` Tiempo recomendado: ${exam.time_limit_minutes} minutos.`}
        </p>
      </div>

      {/* Response textarea */}
      <div
        className="p-6 rounded-2xl border mb-4"
        style={{ background: "white", borderColor: "var(--color-border)" }}
      >
        <label className="block text-sm font-bold mb-3" style={{ color: "var(--color-text)" }}>
          Tus respuestas
        </label>
        <textarea
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          placeholder="Escribe tus respuestas aquí…"
          rows={10}
          className="w-full resize-none px-4 py-3 rounded-xl border text-sm outline-none transition-all"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-bg-alt)",
            color: "var(--color-text)",
            fontFamily: "var(--font-body)",
            lineHeight: "1.7",
          }}
          disabled={isPending}
        />
        <div className="flex justify-between mt-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span>{essay.trim().split(/\s+/).filter(Boolean).length} palabras</span>
          <span>{essay.length} caracteres</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm"
          style={{ background: "var(--color-error-light)", color: "var(--color-error)" }}>
          <XCircle size={15} />
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending || essay.trim().length < 10}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-60"
        style={{ background: "var(--color-primary)" }}
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Analizando con IA…
          </>
        ) : (
          <>
            <Send size={16} />
            Enviar respuestas
          </>
        )}
      </button>
    </div>
  )
}
