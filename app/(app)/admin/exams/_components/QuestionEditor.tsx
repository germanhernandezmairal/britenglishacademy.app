"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react"

export type Question = {
  id: string
  type: "mcq" | "gap_fill" | "open_text"
  question: string
  options?: string[]
  correct_answer?: string
  max_score: number
}

const TYPES = [
  { value: "mcq", label: "Opción múltiple" },
  { value: "gap_fill", label: "Rellenar hueco" },
  { value: "open_text", label: "Respuesta abierta (IA)" },
] as const

const INPUT =
  "w-full px-3 py-2 text-sm rounded-lg border outline-none transition-all focus:ring-2 focus:ring-blue-200"

function newQuestion(): Question {
  return { id: crypto.randomUUID(), type: "mcq", question: "", options: ["", ""], correct_answer: "", max_score: 10 }
}

export function QuestionEditor({
  name,
  totalName,
  initial = [],
}: {
  name: string
  totalName: string
  initial?: Question[]
}) {
  const [questions, setQuestions] = useState<Question[]>(initial)

  function update(idx: number, patch: Partial<Question>) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)))
  }

  function changeType(idx: number, type: Question["type"]) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q
        if (type === "mcq") return { ...q, type, options: q.options ?? ["", ""], correct_answer: "" }
        if (type === "gap_fill") return { ...q, type, options: undefined, correct_answer: "" }
        return { ...q, type, options: undefined, correct_answer: undefined }
      })
    )
  }

  function setOption(qIdx: number, oIdx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q
        const options = [...(q.options ?? [])]
        const prevVal = options[oIdx]
        options[oIdx] = value
        // keep correct_answer in sync if it pointed at the edited option
        const correct_answer = q.correct_answer === prevVal ? value : q.correct_answer
        return { ...q, options, correct_answer }
      })
    )
  }

  function addOption(qIdx: number) {
    setQuestions((prev) => prev.map((q, i) => (i === qIdx ? { ...q, options: [...(q.options ?? []), ""] } : q)))
  }

  function removeOption(qIdx: number, oIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q
        const removed = (q.options ?? [])[oIdx]
        const options = (q.options ?? []).filter((_, j) => j !== oIdx)
        const correct_answer = q.correct_answer === removed ? "" : q.correct_answer
        return { ...q, options, correct_answer }
      })
    )
  }

  function move(idx: number, dir: -1 | 1) {
    setQuestions((prev) => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  const total = questions.reduce((s, q) => s + (Number(q.max_score) || 0), 0)

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(questions)} readOnly />
      <input type="hidden" name={totalName} value={String(total)} readOnly />

      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium" style={{ color: "var(--color-text)" }}>
          Preguntas ({questions.length}) · {total} puntos
        </label>
        <button
          type="button"
          onClick={() => setQuestions((p) => [...p, newQuestion()])}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: "var(--color-primary)" }}
        >
          <Plus size={13} /> Añadir pregunta
        </button>
      </div>

      {questions.length === 0 && (
        <p className="text-xs py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          Aún no hay preguntas. Añade al menos una.
        </p>
      )}

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className="p-4 rounded-xl border"
            style={{ background: "var(--color-bg-alt)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>#{i + 1}</span>
              <div className="ml-auto flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} className="p-1 rounded hover:opacity-70" style={{ color: "var(--color-text-muted)" }} aria-label="Subir"><ChevronUp size={14} /></button>
                <button type="button" onClick={() => move(i, 1)} className="p-1 rounded hover:opacity-70" style={{ color: "var(--color-text-muted)" }} aria-label="Bajar"><ChevronDown size={14} /></button>
                <button type="button" onClick={() => setQuestions((p) => p.filter((_, j) => j !== i))} className="p-1 rounded hover:opacity-70" style={{ color: "var(--color-crimson)" }} aria-label="Eliminar"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_110px] gap-2 mb-2">
              <select
                value={q.type}
                onChange={(e) => changeType(i, e.target.value as Question["type"])}
                className={INPUT}
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input
                type="number"
                min={1}
                value={q.max_score}
                onChange={(e) => update(i, { max_score: parseInt(e.target.value, 10) || 1 })}
                placeholder="Puntos"
                className={INPUT}
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              />
            </div>

            <textarea
              value={q.question}
              onChange={(e) => update(i, { question: e.target.value })}
              rows={2}
              placeholder="Enunciado de la pregunta…"
              className={INPUT + " resize-none mb-2"}
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            />

            {q.type === "mcq" && (
              <div className="space-y-1.5">
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Marca la opción correcta:
                </p>
                {(q.options ?? []).map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={!!opt && q.correct_answer === opt}
                      onChange={() => update(i, { correct_answer: opt })}
                      style={{ accentColor: "var(--color-primary)" }}
                    />
                    <input
                      value={opt}
                      onChange={(e) => setOption(i, oIdx, e.target.value)}
                      placeholder={`Opción ${oIdx + 1}`}
                      className={INPUT}
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    />
                    {(q.options ?? []).length > 2 && (
                      <button type="button" onClick={() => removeOption(i, oIdx)} className="p-1 rounded hover:opacity-70" style={{ color: "var(--color-text-muted)" }} aria-label="Quitar opción"><Trash2 size={13} /></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addOption(i)} className="text-xs font-semibold mt-1" style={{ color: "var(--color-primary)" }}>
                  + Añadir opción
                </button>
              </div>
            )}

            {q.type === "gap_fill" && (
              <input
                value={q.correct_answer ?? ""}
                onChange={(e) => update(i, { correct_answer: e.target.value })}
                placeholder="Respuesta correcta (exacta, sin distinción de mayúsculas)"
                className={INPUT}
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              />
            )}

            {q.type === "open_text" && (
              <p className="text-xs italic" style={{ color: "var(--color-text-muted)" }}>
                Se calificará automáticamente con IA según el nivel y la destreza del examen.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
