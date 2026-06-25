"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

export type VocabItem = { word: string; definition: string; example?: string }

const INPUT =
  "w-full px-3 py-2 text-sm rounded-lg border outline-none transition-all focus:ring-2 focus:ring-blue-200"

export function VocabularyEditor({ name, initial = [] }: { name: string; initial?: VocabItem[] }) {
  const [items, setItems] = useState<VocabItem[]>(initial)

  function update(idx: number, patch: Partial<VocabItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  // Serialize, dropping empty rows and empty optional example.
  const clean = items
    .map((it) => ({
      word: it.word.trim(),
      definition: it.definition.trim(),
      ...(it.example?.trim() ? { example: it.example.trim() } : {}),
    }))
    .filter((it) => it.word && it.definition)

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(clean)} readOnly />

      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium" style={{ color: "var(--color-text)" }}>
          Vocabulario ({clean.length})
        </label>
        <button
          type="button"
          onClick={() => setItems((p) => [...p, { word: "", definition: "", example: "" }])}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: "var(--color-primary)" }}
        >
          <Plus size={13} /> Añadir palabra
        </button>
      </div>

      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="p-3 rounded-xl border" style={{ background: "var(--color-bg-alt)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <input
                value={it.word}
                onChange={(e) => update(i, { word: e.target.value })}
                placeholder="Palabra / expresión"
                className={INPUT}
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              />
              <button type="button" onClick={() => setItems((p) => p.filter((_, j) => j !== i))}
                className="p-1.5 rounded hover:opacity-70 flex-shrink-0" style={{ color: "var(--color-crimson)" }} aria-label="Eliminar">
                <Trash2 size={14} />
              </button>
            </div>
            <input
              value={it.definition}
              onChange={(e) => update(i, { definition: e.target.value })}
              placeholder="Definición"
              className={INPUT + " mb-2"}
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            />
            <input
              value={it.example ?? ""}
              onChange={(e) => update(i, { example: e.target.value })}
              placeholder="Ejemplo (opcional)"
              className={INPUT}
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
