"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, GraduationCap, Clock, FileText, RotateCcw,
  Trophy, ChevronDown, ChevronUp, Play,
} from "lucide-react"
import { InteractiveExam } from "./InteractiveExam"
import { PdfExam } from "./PdfExam"

const SKILL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  reading:         { label: "Comprensión lectora",  color: "#1A3A8C", bg: "#EEF1FA" },
  writing:         { label: "Expresión escrita",    color: "#C8102E", bg: "#FFF0F2" },
  listening:       { label: "Comprensión auditiva", color: "#D4A017", bg: "#FFF8E7" },
  speaking_prep:   { label: "Preparación oral",     color: "#16A34A", bg: "#D1FAE5" },
  grammar:         { label: "Gramática",             color: "#012169", bg: "#D5DCF3" },
  use_of_english:  { label: "Uso del inglés",       color: "#7C3AED", bg: "#EDE9FE" },
}

const BAND_COLOR: Record<string, string> = {
  A: "#16A34A", B: "#0D9488", C: "#1A3A8C", D: "#D4A017", E: "#EA580C", U: "#DC2626",
}

const BAND_LABEL: Record<string, string> = {
  A: "Sobresaliente", B: "Notable", C: "Bien", D: "Aprobado", E: "Suspenso", U: "No presentado",
}

type Question = {
  id: string
  type: "mcq" | "gap_fill" | "open_text"
  question: string
  options?: string[]
  correct_answer?: string
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

type ExamData = {
  id: string
  title: string
  description: string | null
  level: string
  skill: string
  exam_type: string
  pdf_url: string | null
  questions: Question[]
  time_limit_minutes: number | null
  max_score: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}

function AttemptRow({ attempt, maxScore }: { attempt: Attempt; maxScore: number }) {
  const [open, setOpen] = useState(false)
  const score = attempt.teacher_override_score ?? attempt.score ?? 0
  const band = attempt.band_score ?? "U"
  const bandColor = BAND_COLOR[band] ?? BAND_COLOR.U
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const feedback = attempt.claude_feedback as any

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer"
        style={{ background: "var(--color-bg-alt)" }}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
          {formatDate(attempt.submitted_at)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
            {score} / {maxScore}
          </span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: bandColor + "22", color: bandColor }}
          >
            {band} — {BAND_LABEL[band] ?? band}
          </span>
          <div
            className="w-16 h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--color-border)" }}
          >
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: bandColor }} />
          </div>
        </div>
        {(feedback?.summary || attempt.teacher_feedback) && (
          open ? <ChevronUp size={14} style={{ color: "var(--color-text-muted)" }} />
               : <ChevronDown size={14} style={{ color: "var(--color-text-muted)" }} />
        )}
      </div>

      {open && (feedback?.summary || attempt.teacher_feedback) && (
        <div className="px-4 py-3 space-y-2 border-t" style={{ borderColor: "var(--color-border)" }}>
          {feedback?.summary && (
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {feedback.summary}
            </p>
          )}
          {attempt.teacher_feedback && (
            <div
              className="p-3 rounded-lg text-xs leading-relaxed"
              style={{ background: "#F0FDF4", color: "#166534" }}
            >
              <span className="font-semibold">Profesor: </span>
              {attempt.teacher_feedback}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ExamDetail({
  exam,
  initialAttempts,
}: {
  exam: ExamData
  initialAttempts: Attempt[]
}) {
  const [attempts, setAttempts] = useState(initialAttempts)
  const [phase, setPhase] = useState<"info" | "attempt">("info")

  const skill = SKILL_CONFIG[exam.skill] ?? SKILL_CONFIG.grammar
  const bestAttempt = attempts.length > 0
    ? attempts.reduce((best, a) => ((a.score ?? 0) > (best.score ?? 0) ? a : best), attempts[0])
    : null

  function handleComplete(newAttempt: Attempt) {
    setAttempts((prev) => [newAttempt, ...prev])
  }

  function handleBack() {
    setPhase("info")
  }

  if (phase === "attempt") {
    return exam.exam_type === "interactive" ? (
      <InteractiveExam exam={exam} onBack={handleBack} onComplete={handleComplete} />
    ) : (
      <PdfExam exam={exam} onBack={handleBack} onComplete={handleComplete} />
    )
  }

  return (
    <div>
      {/* Back nav */}
      <Link
        href="/exams"
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:underline"
        style={{ color: "var(--color-text-muted)" }}
      >
        <ArrowLeft size={15} />
        Volver a exámenes
      </Link>

      {/* Exam header card */}
      <div
        className="p-6 rounded-2xl border mb-6"
        style={{ background: "white", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: skill.bg }}
          >
            <GraduationCap size={26} style={{ color: skill.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: skill.bg, color: skill.color }}
              >
                {skill.label}
              </span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}
              >
                {exam.level}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--color-bg-alt)", color: "var(--color-text-muted)" }}
              >
                {exam.exam_type === "interactive" ? "Interactivo" : "PDF"}
              </span>
            </div>

            <h1
              className="text-xl md:text-2xl font-bold mb-1"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
            >
              {exam.title}
            </h1>

            {exam.description && (
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                {exam.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
              {exam.time_limit_minutes && (
                <span className="flex items-center gap-1.5">
                  <Clock size={13} />
                  {exam.time_limit_minutes} minutos
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Trophy size={13} />
                {exam.max_score} puntos totales
              </span>
              {exam.exam_type === "interactive" && (
                <span className="flex items-center gap-1.5">
                  <FileText size={13} />
                  {exam.questions.length} preguntas
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Best score banner */}
        {bestAttempt && (
          <div
            className="mt-5 flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: (BAND_COLOR[bestAttempt.band_score ?? "U"] ?? "#1A3A8C") + "14",
            }}
          >
            <Trophy size={16} style={{ color: BAND_COLOR[bestAttempt.band_score ?? "U"] }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Mejor puntuación: {bestAttempt.teacher_override_score ?? bestAttempt.score ?? 0}/{exam.max_score}
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: (BAND_COLOR[bestAttempt.band_score ?? "U"] ?? "#1A3A8C") + "22",
                color: BAND_COLOR[bestAttempt.band_score ?? "U"] ?? "#1A3A8C",
              }}
            >
              {bestAttempt.band_score ?? "U"}
            </span>
            <span className="ml-auto text-xs" style={{ color: "var(--color-text-muted)" }}>
              {attempts.length} intento{attempts.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Start button */}
        <button
          onClick={() => setPhase("attempt")}
          className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99]"
          style={{ background: "var(--color-primary)" }}
        >
          <Play size={16} fill="currentColor" />
          {attempts.length > 0 ? "Reintentar examen" : "Empezar examen"}
        </button>
      </div>

      {/* Attempt history */}
      {attempts.length > 0 && (
        <div
          className="p-6 rounded-2xl border"
          style={{ background: "white", borderColor: "var(--color-border)" }}
        >
          <h2
            className="text-base font-bold mb-4 flex items-center gap-2"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
          >
            <RotateCcw size={16} style={{ color: "var(--color-primary)" }} />
            Historial de intentos
          </h2>
          <div className="space-y-2">
            {attempts.map((a) => (
              <AttemptRow key={a.id} attempt={a} maxScore={exam.max_score} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
