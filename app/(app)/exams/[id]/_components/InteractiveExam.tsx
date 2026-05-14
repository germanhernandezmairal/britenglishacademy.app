"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import {
  ArrowLeft, Clock, Send, Loader2, CheckCircle2, XCircle,
  Star, Target, MessageSquare, Trophy,
} from "lucide-react"
import { submitInteractiveExam } from "@/app/actions/exams"

type Question = {
  id: string
  type: "mcq" | "gap_fill" | "open_text"
  question: string
  options?: string[]
  correct_answer?: string
  max_score: number
}

type PerQuestion = { question_id: string; earned: number; feedback: string }

type ExamResult = {
  submissionId: string
  score: number
  maxScore: number
  band: string
  percentage: number
  claudeFeedback: {
    summary: string
    per_question: PerQuestion[]
    strengths: string[]
    improvements: string[]
  }
  autoGraded: Record<string, { correct: string; earned: number; max_score: number }>
}

type ExamData = {
  id: string
  title: string
  questions: Question[]
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

const BAND_COLOR: Record<string, string> = {
  A: "#16A34A", B: "#0D9488", C: "#1A3A8C", D: "#D4A017", E: "#EA580C", U: "#DC2626",
}

const BAND_LABEL: Record<string, string> = {
  A: "Sobresaliente", B: "Notable", C: "Bien", D: "Aprobado", E: "Suspenso", U: "No presentado",
}

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0")
  const sec = (s % 60).toString().padStart(2, "0")
  return `${m}:${sec}`
}

export function InteractiveExam({
  exam,
  onBack,
  onComplete,
}: {
  exam: ExamData
  onBack: () => void
  onComplete: (attempt: Attempt) => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(
    exam.time_limit_minutes ? exam.time_limit_minutes * 60 : null
  )
  const [result, setResult] = useState<ExamResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const hasAutoSubmitted = useRef(false)

  const answeredCount = Object.values(answers).filter((v) => v.trim()).length
  const totalQuestions = exam.questions.length

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return
    const id = setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000)
    return () => clearTimeout(id)
  }, [timeLeft, result])

  // Auto-submit when time expires
  useEffect(() => {
    if (timeLeft === 0 && !result && !isPending && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true
      handleSubmit()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const res = await submitInteractiveExam(exam.id, answers)
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
        claude_feedback: res.claudeFeedback as unknown as Record<string, unknown>,
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
    const pqMap = new Map(result.claudeFeedback.per_question.map((p) => [p.question_id, p]))

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
          {result.claudeFeedback.summary && (
            <p className="text-sm mt-3 leading-relaxed max-w-lg mx-auto" style={{ color: "var(--color-text-secondary)" }}>
              {result.claudeFeedback.summary}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Strengths */}
          {result.claudeFeedback.strengths.length > 0 && (
            <div className="p-4 rounded-2xl border" style={{ background: "white", borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Star size={15} className="text-yellow-500" />
                <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>Puntos fuertes</span>
              </div>
              <ul className="space-y-1.5">
                {result.claudeFeedback.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    <CheckCircle2 size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Improvements */}
          {result.claudeFeedback.improvements.length > 0 && (
            <div className="p-4 rounded-2xl border" style={{ background: "white", borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Target size={15} style={{ color: "var(--color-accent)" }} />
                <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>A mejorar</span>
              </div>
              <ul className="space-y-1.5">
                {result.claudeFeedback.improvements.map((s, i) => (
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

        {/* Per-question breakdown */}
        <div className="p-6 rounded-2xl border" style={{ background: "white", borderColor: "var(--color-border)" }}>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}>
            <Trophy size={16} style={{ color: "var(--color-primary)" }} />
            Desglose por pregunta
          </h3>
          <div className="space-y-3">
            {exam.questions.map((q, i) => {
              const studentAnswer = answers[q.id] ?? "(sin respuesta)"
              const ag = result.autoGraded[q.id]
              const pq = pqMap.get(q.id)
              const earned = ag?.earned ?? pq?.earned ?? 0
              const correct = earned === q.max_score
              const partial = earned > 0 && earned < q.max_score

              return (
                <div key={q.id} className="p-4 rounded-xl" style={{ background: "var(--color-bg-alt)" }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>
                      Q{i + 1}
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: correct ? "#D1FAE5" : partial ? "#FEF3C7" : "#FEE2E2",
                        color: correct ? "#16A34A" : partial ? "#D97706" : "#DC2626",
                      }}
                    >
                      {earned}/{q.max_score}
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: "var(--color-text)" }}>{q.question}</p>

                  <div className="flex flex-wrap items-start gap-3 text-xs">
                    <div>
                      <span className="font-semibold" style={{ color: "var(--color-text-muted)" }}>Tu respuesta: </span>
                      <span className={correct ? "text-green-600 font-semibold" : ""}
                        style={!correct && !partial ? { color: "#DC2626" } : {}}>
                        {studentAnswer}
                      </span>
                    </div>
                    {ag && !correct && ag.correct && (
                      <div>
                        <span className="font-semibold" style={{ color: "var(--color-text-muted)" }}>Correcta: </span>
                        <span className="text-green-600 font-semibold">{ag.correct}</span>
                      </div>
                    )}
                  </div>

                  {pq?.feedback && (
                    <div className="flex items-start gap-1.5 mt-2">
                      <MessageSquare size={11} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-primary)" }} />
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{pq.feedback}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Exam form ─────────────────────────────────────────────────────────────
  const timeWarning = timeLeft !== null && timeLeft <= 300

  return (
    <div>
      {/* Sticky header with timer + progress */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 rounded-2xl border mb-6"
        style={{ background: "white", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm hover:opacity-70"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ArrowLeft size={14} />
          Salir
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {answeredCount}/{totalQuestions} respondidas
          </span>

          {timeLeft !== null && (
            <span
              className="flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-lg"
              style={{
                background: timeWarning ? "#FEF3C7" : "var(--color-primary-50)",
                color: timeWarning ? "#D97706" : "var(--color-primary)",
              }}
            >
              <Clock size={13} />
              {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>

      {timeLeft === 0 && (
        <div className="mb-4 p-3 rounded-xl text-sm font-semibold text-center"
          style={{ background: "#FEE2E2", color: "#DC2626" }}>
          ¡Tiempo agotado! Envía tu examen ahora.
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6 mb-8">
        {exam.questions.map((q, i) => (
          <div
            key={q.id}
            className="p-6 rounded-2xl border"
            style={{ background: "white", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--color-primary-100)", color: "var(--color-primary)" }}
                >
                  {i + 1}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--color-bg-alt)", color: "var(--color-text-muted)" }}>
                  {q.type === "mcq" ? "Opción múltiple" : q.type === "gap_fill" ? "Completar" : "Respuesta libre"}
                  {" · "}{q.max_score} pt{q.max_score !== 1 ? "s" : ""}
                </span>
              </div>
              {answers[q.id]?.trim() && (
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              )}
            </div>

            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-text)" }}>
              {q.question}
            </p>

            {/* MCQ */}
            {q.type === "mcq" && q.options && (
              <div className="space-y-2">
                {q.options.map((opt, j) => {
                  const selected = answers[q.id] === opt
                  return (
                    <label
                      key={j}
                      className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                      style={{
                        borderColor: selected ? "var(--color-primary)" : "var(--color-border)",
                        background: selected ? "var(--color-primary-50)" : "var(--color-bg-alt)",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: selected ? "var(--color-primary)" : "var(--color-border)" }}
                      >
                        {selected && (
                          <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-primary)" }} />
                        )}
                      </div>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={selected}
                        onChange={() => setAnswer(q.id, opt)}
                        className="sr-only"
                      />
                      <span className="text-sm" style={{ color: "var(--color-text)" }}>{opt}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {/* Gap fill */}
            {q.type === "gap_fill" && (
              <input
                type="text"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Escribe tu respuesta…"
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-bg-alt)",
                  color: "var(--color-text)",
                }}
              />
            )}

            {/* Open text */}
            {q.type === "open_text" && (
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Escribe tu respuesta aquí…"
                rows={4}
                className="w-full resize-none px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-bg-alt)",
                  color: "var(--color-text)",
                  fontFamily: "var(--font-body)",
                }}
              />
            )}
          </div>
        ))}
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
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-60"
        style={{ background: "var(--color-primary)" }}
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Calificando con IA…
          </>
        ) : (
          <>
            <Send size={16} />
            Enviar examen ({answeredCount}/{totalQuestions} respondidas)
          </>
        )}
      </button>
    </div>
  )
}
