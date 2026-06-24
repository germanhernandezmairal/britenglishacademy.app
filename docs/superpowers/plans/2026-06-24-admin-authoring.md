# Admin Authoring (F2-3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins author exam questions/PDFs and lesson vocabulary/PDF resources through the admin panels, producing the JSON shapes the existing student pages already consume.

**Architecture:** Authoring-only. The student grading flow (`app/actions/exams.ts`) and all consumers already exist and are unchanged. We add client editor components that serialize to hidden form inputs, extend the `app/actions/admin.ts` server actions to parse and persist that JSON, add an exam edit route, and add a public `resources` storage bucket + a `uploadResource` action for PDFs.

**Tech Stack:** Next.js App Router (RSC + server actions), React 19 client components, TypeScript, Supabase (`@supabase/supabase-js` service-role for writes/storage), Tailwind + inline `style` CSS-var tokens, lucide-react icons. UI copy in Spanish.

## Global Constraints

- Verification pattern (no unit-test framework in repo): each task ends with `npx tsc --noEmit` clean, plus a service-role probe or browser check where stated, then a commit.
- Data shapes are FIXED by consumers — match exactly:
  - `Question = { id: string; type: "mcq"|"gap_fill"|"open_text"; question: string; options?: string[]; correct_answer?: string; max_score: number }`
  - `VocabItem = { word: string; definition: string; example?: string }`
  - `PdfResource = { name: string; url: string; size?: number }`
  - `exam.pdf_url` = single public URL string.
- All admin server actions reuse the existing `getAdminUser()` gate in `app/actions/admin.ts` (admin/teacher only).
- Storage uploads use the **service-role** client (`createAdminClient` from `lib/supabase/server`), mirroring `app/actions/homework.ts`.
- Match existing form conventions: Tailwind utilities + inline `style` with `var(--color-*)` tokens; the `FIELD` / `INPUT` class constants already used in `ExamForm`/`LessonForm`.
- Project root for all commands is the `brit-english-school/` subfolder. Branch: `fix/flow4-admin-authoring`.
- Test users (live prod): admin `qa.admin@example.com`, student `qa.student@example.com`, password `TestPass123!`. Service key + URL in `.env.local`.

---

### Task 1: Create the public `resources` storage bucket

**Files:**
- Create (scratch, gitignored): `_resources_bucket.mjs`

**Interfaces:**
- Produces: a Supabase storage bucket named `resources`, `public: true`.

- [ ] **Step 1: Write the bucket-creation script**

Create `_resources_bucket.mjs`:

```js
import { readFileSync } from 'node:fs'
const env = {}
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const SVC = env.SUPABASE_SERVICE_ROLE_KEY
const H = { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json' }

// Create (idempotent: 200 on create, 400 "already exists" is fine)
const r = await fetch(`${URL}/storage/v1/bucket`, {
  method: 'POST', headers: H,
  body: JSON.stringify({ id: 'resources', name: 'resources', public: true }),
})
console.log('create resources bucket:', r.status, JSON.stringify(await r.json()))

// Verify it exists and is public
const g = await fetch(`${URL}/storage/v1/bucket/resources`, { headers: H })
console.log('verify:', g.status, JSON.stringify(await g.json()))
```

- [ ] **Step 2: Run it**

Run: `node _resources_bucket.mjs`
Expected: create prints `200 {...}` (or `400 {"error":...already exists}` on re-run); verify prints `200 {"id":"resources",...,"public":true}`.

- [ ] **Step 3: Commit** (script is gitignored under `/_*` — nothing to commit; record in findings doc instead in Task 9). No commit for this task.

---

### Task 2: `uploadResource` server action

**Files:**
- Create: `app/actions/uploads.ts`

**Interfaces:**
- Produces: `uploadResource(formData: FormData): Promise<{ url: string; name: string; size: number } | { error: string }>` — reads `file` (File) and `prefix` (string, e.g. `"exam-pdfs"` / `"lesson-pdfs"`); uploads to the `resources` bucket; returns the public URL.

- [ ] **Step 1: Write the action**

Create `app/actions/uploads.ts`:

```ts
"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"

const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB
const ALLOWED_PREFIXES = ["exam-pdfs", "lesson-pdfs"]

async function isStaff(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  return !!profile && ["admin", "teacher"].includes(profile.role)
}

export async function uploadResource(
  formData: FormData
): Promise<{ url: string; name: string; size: number } | { error: string }> {
  if (!(await isStaff())) return { error: "No autorizado" }

  const file = formData.get("file") as File | null
  const prefix = (formData.get("prefix") as string | null) ?? ""

  if (!file || file.size === 0) return { error: "Debes seleccionar un archivo" }
  if (file.size > MAX_FILE_BYTES) return { error: "El archivo no puede superar 20 MB" }
  if (file.type !== "application/pdf") return { error: "Solo se permiten archivos PDF" }
  if (!ALLOWED_PREFIXES.includes(prefix)) return { error: "Destino inválido" }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const path = `${prefix}/${Date.now()}-${crypto.randomUUID()}-${safeName}`
  const buffer = await file.arrayBuffer()

  const admin = await createAdminClient()
  const { error: uploadError } = await admin.storage
    .from("resources")
    .upload(path, buffer, { contentType: "application/pdf", upsert: false })

  if (uploadError) {
    return { error: "Error al subir el archivo. Verifica que el bucket 'resources' existe." }
  }

  const { data } = admin.storage.from("resources").getPublicUrl(path)
  return { url: data.publicUrl, name: file.name, size: file.size }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Probe-test the upload** (uses the existing `_hw.txt`? No — needs a PDF). Create a throwaway probe `_uptest_res.mjs`:

```js
import { readFileSync } from 'node:fs'
const env = {}
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL, SVC = env.SUPABASE_SERVICE_ROLE_KEY
const H = { apikey: SVC, Authorization: `Bearer ${SVC}` }
// minimal valid PDF
const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')
const path = `exam-pdfs/_probe-${Date.now()}.pdf`
const up = await fetch(`${URL}/storage/v1/object/resources/${path}`, {
  method: 'POST', headers: { ...H, 'Content-Type': 'application/pdf' }, body: pdf,
})
console.log('upload:', up.status)
const pub = `${URL}/storage/v1/object/public/resources/${path}`
const get = await fetch(pub)
console.log('public GET:', get.status, '(expect 200 — bucket is public)')
await fetch(`${URL}/storage/v1/object/resources/${path}`, { method: 'DELETE', headers: H })
console.log('cleaned')
```

Run: `node _uptest_res.mjs` then `rm _uptest_res.mjs`
Expected: `upload: 200`, `public GET: 200`. Confirms the bucket is public and serves uploaded PDFs.

- [ ] **Step 4: Commit**

```bash
git add app/actions/uploads.ts
git commit -m "feat(admin): add uploadResource action + public resources bucket"
```

---

### Task 3: `PdfUploadField` shared client component

**Files:**
- Create: `app/(app)/admin/_components/PdfUploadField.tsx`

**Interfaces:**
- Consumes: `uploadResource` from `@/app/actions/uploads`.
- Produces: `PdfUploadField` component.
  ```ts
  type PdfResource = { name: string; url: string; size?: number }
  function PdfUploadField(props: {
    prefix: "exam-pdfs" | "lesson-pdfs"
    multiple?: boolean            // false → single (exam pdf_url); true → list (lesson pdf_resources)
    name: string                  // hidden input name; single → url string, multiple → JSON array
    initial?: PdfResource[]
  }): JSX.Element
  ```
  Renders a hidden `<input name={name}>` whose value is, for `multiple`, `JSON.stringify(PdfResource[])`; for single, the bare `url` string (or `""`).

- [ ] **Step 1: Write the component**

Create `app/(app)/admin/_components/PdfUploadField.tsx`:

```tsx
"use client"

import { useRef, useState } from "react"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { uploadResource } from "@/app/actions/uploads"

export type PdfResource = { name: string; url: string; size?: number }

export function PdfUploadField({
  prefix,
  multiple = false,
  name,
  initial = [],
}: {
  prefix: "exam-pdfs" | "lesson-pdfs"
  multiple?: boolean
  name: string
  initial?: PdfResource[]
}) {
  const [items, setItems] = useState<PdfResource[]>(initial)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setUploading(true)
    const next: PdfResource[] = multiple ? [...items] : []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("prefix", prefix)
      const res = await uploadResource(fd)
      if ("error" in res) { setError(res.error); break }
      next.push({ name: res.name, url: res.url, size: res.size })
      if (!multiple) break
    }
    setItems(next)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  function remove(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const hiddenValue = multiple ? JSON.stringify(items) : (items[0]?.url ?? "")

  return (
    <div>
      <input type="hidden" name={name} value={hiddenValue} readOnly />

      <div className="space-y-2 mb-3">
        {items.map((item, i) => (
          <div
            key={item.url + i}
            className="flex items-center gap-3 p-3 rounded-xl border"
            style={{ background: "var(--color-bg-alt)", borderColor: "var(--color-border)" }}
          >
            <FileText size={16} style={{ color: "#C8102E" }} className="flex-shrink-0" />
            <span className="flex-1 min-w-0 text-sm truncate" style={{ color: "var(--color-text)" }}>
              {item.name}
            </span>
            {item.size ? (
              <span className="text-xs flex-shrink-0" style={{ color: "var(--color-text-muted)" }}>
                {(item.size / 1024).toFixed(0)} KB
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => remove(i)}
              className="p-1 rounded-md hover:opacity-70 flex-shrink-0"
              style={{ color: "var(--color-text-muted)" }}
              aria-label="Quitar"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {(multiple || items.length === 0) && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80 disabled:opacity-60"
          style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? "Subiendo…" : multiple ? "Subir PDF" : "Subir PDF"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-xs mt-2" style={{ color: "var(--color-crimson)" }}>{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (Component not yet imported anywhere — compiles standalone.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/admin/_components/PdfUploadField.tsx"
git commit -m "feat(admin): add shared PdfUploadField component"
```

---

### Task 4: `QuestionEditor` client component

**Files:**
- Create: `app/(app)/admin/exams/_components/QuestionEditor.tsx`

**Interfaces:**
- Produces: `QuestionEditor` component + exported `Question` type.
  ```ts
  type Question = { id: string; type: "mcq"|"gap_fill"|"open_text"; question: string; options?: string[]; correct_answer?: string; max_score: number }
  function QuestionEditor(props: { name: string; totalName: string; initial?: Question[] }): JSX.Element
  ```
  Writes hidden `<input name={name}>` = `JSON.stringify(Question[])` and hidden `<input name={totalName}>` = summed `max_score` (the derived exam `max_score`). Shows the running total read-only.

- [ ] **Step 1: Write the component**

Create `app/(app)/admin/exams/_components/QuestionEditor.tsx`:

```tsx
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
    const patch: Partial<Question> = { type }
    if (type === "mcq") { patch.options = questions[idx].options ?? ["", ""]; patch.correct_answer = "" }
    else if (type === "gap_fill") { patch.options = undefined; patch.correct_answer = "" }
    else { patch.options = undefined; patch.correct_answer = undefined }
    update(idx, patch)
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
                onChange={(e) => update(i, { max_score: parseInt(e.target.value) || 0 })}
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/admin/exams/_components/QuestionEditor.tsx"
git commit -m "feat(admin): add exam QuestionEditor component"
```

---

### Task 5: Wire ExamForm + extend createExam / add updateExam

**Files:**
- Modify: `app/(app)/admin/exams/_components/ExamForm.tsx` (full rewrite)
- Modify: `app/actions/admin.ts` (`createExam`; add `updateExam`)

**Interfaces:**
- Consumes: `QuestionEditor`, `Question` (Task 4); `PdfUploadField`, `PdfResource` (Task 3).
- Produces:
  - `ExamForm(props: { exam?: ExamFormData })` where
    `ExamFormData = { id: string; title: string; description: string|null; level: string; skill: string; exam_type: string; time_limit_minutes: number|null; max_score: number; is_published: boolean; questions: Question[]; pdf_url: string|null }`.
  - `updateExam(examId: string, formData: FormData): Promise<{ success: true } | { error: string }>` in `admin.ts`.

- [ ] **Step 1: Extend `createExam` and add `updateExam` in `app/actions/admin.ts`**

Replace the existing `createExam` function (lines 184–215) with the two functions below. A shared `parseExamForm` helper does the parsing/validation.

```ts
type ExamQuestion = {
  id: string
  type: "mcq" | "gap_fill" | "open_text"
  question: string
  options?: string[]
  correct_answer?: string
  max_score: number
}

function parseExamForm(formData: FormData):
  | { error: string }
  | {
      values: {
        title: string; description: string | null; level: string; skill: string
        exam_type: string; time_limit_minutes: number | null; max_score: number
        is_published: boolean; questions: ExamQuestion[]; pdf_url: string | null
      }
    } {
  const title = (formData.get("title") as string ?? "").trim()
  const description = (formData.get("description") as string ?? "").trim() || null
  const level = formData.get("level") as string
  const skill = formData.get("skill") as string
  const exam_type = formData.get("exam_type") as string
  const timeLimitRaw = (formData.get("time_limit_minutes") as string ?? "").trim()
  const time_limit_minutes = timeLimitRaw ? (parseInt(timeLimitRaw) || null) : null
  const is_published = formData.get("is_published") === "true"
  const pdf_url = (formData.get("pdf_url") as string ?? "").trim() || null

  if (title.length < 2) return { error: "El título es obligatorio" }
  if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)) return { error: "Nivel inválido" }
  if (!["reading", "writing", "listening", "speaking_prep", "grammar", "use_of_english"].includes(skill))
    return { error: "Habilidad inválida" }
  if (!["pdf_practice", "interactive"].includes(exam_type)) return { error: "Tipo inválido" }

  let questions: ExamQuestion[] = []
  if (exam_type === "interactive") {
    try {
      questions = JSON.parse((formData.get("questions") as string) || "[]")
    } catch {
      return { error: "Preguntas con formato inválido" }
    }
    if (!Array.isArray(questions) || questions.length === 0)
      return { error: "Añade al menos una pregunta" }
    for (const q of questions) {
      if (!q.question?.trim()) return { error: "Cada pregunta necesita un enunciado" }
      if (!(Number(q.max_score) >= 1)) return { error: "Cada pregunta necesita puntos (≥1)" }
      if (q.type === "mcq") {
        const opts = (q.options ?? []).filter((o) => o?.trim())
        if (opts.length < 2) return { error: "Las preguntas de opción múltiple necesitan ≥2 opciones" }
        if (!q.correct_answer || !opts.includes(q.correct_answer))
          return { error: "Marca la opción correcta en cada pregunta de opción múltiple" }
      } else if (q.type === "gap_fill") {
        if (!q.correct_answer?.trim()) return { error: "Las preguntas de hueco necesitan respuesta correcta" }
      }
    }
  } else {
    // pdf_practice
    if (!pdf_url) return { error: "Sube el PDF del examen" }
  }

  // Interactive max_score is derived from questions; PDF uses the manual field.
  const max_score =
    exam_type === "interactive"
      ? questions.reduce((s, q) => s + (Number(q.max_score) || 0), 0)
      : (parseInt(formData.get("max_score") as string ?? "100") || 100)

  return {
    values: { title, description, level, skill, exam_type, time_limit_minutes, max_score, is_published, questions, pdf_url },
  }
}

export async function createExam(formData: FormData) {
  const auth = await getAdminUser()
  if (!auth) return { error: "No autorizado" }

  const parsed = parseExamForm(formData)
  if ("error" in parsed) return parsed
  const v = parsed.values

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from("exams")
    .insert({
      title: v.title, description: v.description, level: v.level, skill: v.skill,
      exam_type: v.exam_type, time_limit_minutes: v.time_limit_minutes, max_score: v.max_score,
      is_published: v.is_published, questions: v.questions, pdf_url: v.pdf_url,
    })
    .select("id")
    .single()

  if (error || !data) return { error: "Error al crear el examen" }
  revalidatePath("/admin/exams")
  revalidatePath("/exams")
  return { success: true, id: data.id }
}

export async function updateExam(examId: string, formData: FormData) {
  const auth = await getAdminUser()
  if (!auth) return { error: "No autorizado" }

  const parsed = parseExamForm(formData)
  if ("error" in parsed) return parsed
  const v = parsed.values

  const admin = await createAdminClient()
  const { error } = await admin
    .from("exams")
    .update({
      title: v.title, description: v.description, level: v.level, skill: v.skill,
      exam_type: v.exam_type, time_limit_minutes: v.time_limit_minutes, max_score: v.max_score,
      is_published: v.is_published, questions: v.questions, pdf_url: v.pdf_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", examId)

  if (error) return { error: "Error al actualizar el examen" }
  revalidatePath("/admin/exams")
  revalidatePath("/exams")
  revalidatePath(`/exams/${examId}`)
  return { success: true }
}
```

- [ ] **Step 2: Rewrite `ExamForm.tsx`**

Replace the whole file `app/(app)/admin/exams/_components/ExamForm.tsx` with:

```tsx
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
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (The `new` exam page imports `ExamForm` with no props — still valid since `exam` is optional.)

- [ ] **Step 4: Commit**

```bash
git add app/actions/admin.ts "app/(app)/admin/exams/_components/ExamForm.tsx"
git commit -m "feat(admin): author exam questions + PDF; derive max_score; add updateExam"
```

---

### Task 6: Exam edit page + ExamRow edit link

**Files:**
- Create: `app/(app)/admin/exams/[id]/edit/page.tsx`
- Modify: `app/(app)/admin/exams/_components/ExamRow.tsx`

**Interfaces:**
- Consumes: `ExamForm`, `ExamFormData` (Task 5).

- [ ] **Step 1: Create the edit page**

Create `app/(app)/admin/exams/[id]/edit/page.tsx`:

```tsx
import type { Metadata } from "next"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import { ExamForm, type ExamFormData } from "../../_components/ExamForm"
import type { Question } from "../../_components/QuestionEditor"

export const metadata: Metadata = { title: "Editar Examen | Admin | Brit English Academy" }

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!me || !["admin", "teacher"].includes(me.role)) redirect("/dashboard")

  const admin = await createAdminClient()
  const { data: exam } = await admin
    .from("exams")
    .select("id, title, description, level, skill, exam_type, time_limit_minutes, max_score, is_published, questions, pdf_url")
    .eq("id", id)
    .single()

  if (!exam) notFound()

  const formData: ExamFormData = {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    level: exam.level,
    skill: exam.skill,
    exam_type: exam.exam_type,
    time_limit_minutes: exam.time_limit_minutes,
    max_score: exam.max_score,
    is_published: exam.is_published,
    questions: (Array.isArray(exam.questions) ? exam.questions : []) as Question[],
    pdf_url: exam.pdf_url,
  }

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/exams" className="flex items-center gap-1.5 text-xs font-medium hover:underline"
          style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={13} /> Exámenes
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
        Editar examen
      </h1>
      <div className="p-6 rounded-2xl border" style={{ background: "white", borderColor: "var(--color-border)" }}>
        <ExamForm exam={formData} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add an edit link to `ExamRow.tsx`**

In `app/(app)/admin/exams/_components/ExamRow.tsx`:

Change the import line:
```tsx
import { Clock, Eye, EyeOff, Trash2 } from "lucide-react"
```
to:
```tsx
import Link from "next/link"
import { Clock, Eye, EyeOff, Trash2, Pencil } from "lucide-react"
```

Then, inside the `Actions` block, add the edit link as the first child (before the publish toggle button):
```tsx
        <Link
          href={`/admin/exams/${exam.id}/edit`}
          title="Editar"
          className="p-2 rounded-lg transition-all hover:opacity-70"
          style={{ background: "var(--color-bg-alt)", color: "var(--color-text-muted)" }}
        >
          <Pencil size={15} />
        </Link>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/admin/exams/[id]/edit/page.tsx" "app/(app)/admin/exams/_components/ExamRow.tsx"
git commit -m "feat(admin): exam edit page + edit link in ExamRow"
```

---

### Task 7: `VocabularyEditor` client component

**Files:**
- Create: `app/(app)/admin/lessons/_components/VocabularyEditor.tsx`

**Interfaces:**
- Produces: `VocabularyEditor` + exported `VocabItem` type.
  ```ts
  type VocabItem = { word: string; definition: string; example?: string }
  function VocabularyEditor(props: { name: string; initial?: VocabItem[] }): JSX.Element
  ```
  Writes hidden `<input name={name}>` = `JSON.stringify(VocabItem[])`.

- [ ] **Step 1: Write the component**

Create `app/(app)/admin/lessons/_components/VocabularyEditor.tsx`:

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/admin/lessons/_components/VocabularyEditor.tsx"
git commit -m "feat(admin): add lesson VocabularyEditor component"
```

---

### Task 8: Wire LessonForm + extend createLesson/updateLesson + lesson edit page

**Files:**
- Modify: `app/(app)/admin/lessons/_components/LessonForm.tsx`
- Modify: `app/actions/admin.ts` (`createLesson`, `updateLesson`)
- Modify: `app/(app)/admin/lessons/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `VocabularyEditor`, `VocabItem` (Task 7); `PdfUploadField`, `PdfResource` (Task 3).
- Produces: `LessonForm` accepts an extended `LessonData` with `vocabulary: VocabItem[]` and `pdf_resources: PdfResource[]`.

- [ ] **Step 1: Add a parse helper + extend lesson actions in `app/actions/admin.ts`**

Add this helper near the top (after `getAdminUser`):

```ts
type LessonJson<T> = T[]
function parseJsonArray<T>(raw: FormDataEntryValue | null): LessonJson<T> {
  if (typeof raw !== "string" || !raw.trim()) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? (v as T[]) : []
  } catch {
    return []
  }
}
```

In `createLesson`, after computing `is_published` and before the validation block, add:
```ts
  const vocabulary = parseJsonArray(formData.get("vocabulary"))
  const pdf_resources = parseJsonArray(formData.get("pdf_resources"))
```
and change the `.insert({...})` object to include them:
```ts
    .insert({ title, description, level, video_url, order_index, is_published, vocabulary, pdf_resources, created_by: auth.userId })
```

In `updateLesson`, likewise add after `is_published`:
```ts
  const vocabulary = parseJsonArray(formData.get("vocabulary"))
  const pdf_resources = parseJsonArray(formData.get("pdf_resources"))
```
and change the `.update({...})` object to include them:
```ts
    .update({ title, description, level, video_url, order_index, is_published, vocabulary, pdf_resources, updated_at: new Date().toISOString() })
```

- [ ] **Step 2: Extend `LessonForm.tsx`**

In `app/(app)/admin/lessons/_components/LessonForm.tsx`:

Add imports after the existing `createLesson, updateLesson` import:
```tsx
import { VocabularyEditor, type VocabItem } from "./VocabularyEditor"
import { PdfUploadField, type PdfResource } from "@/app/(app)/admin/_components/PdfUploadField"
```

Extend the `LessonData` type to add the two fields:
```tsx
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
```

Insert these two sections in the JSX between the Video URL block and the Published block (after the closing `</div>` of the video field, before `{/* Published */}`):
```tsx
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
```

- [ ] **Step 3: Load vocabulary + pdf_resources in the lesson edit page**

In `app/(app)/admin/lessons/[id]/edit/page.tsx`:

Change the select to include the two columns:
```tsx
    .select("id, title, description, level, video_url, order_index, is_published, vocabulary, pdf_resources")
```

Change the `<LessonForm lesson={{...}} />` props object to pass them (add after `is_published: lesson.is_published,`):
```tsx
            vocabulary: Array.isArray(lesson.vocabulary) ? lesson.vocabulary : [],
            pdf_resources: Array.isArray(lesson.pdf_resources) ? lesson.pdf_resources : [],
```

(The `new` lesson page renders `<LessonForm />` with no `lesson` prop — still valid since the new fields are read via `lesson?.vocabulary ?? []`.)

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/actions/admin.ts "app/(app)/admin/lessons/_components/LessonForm.tsx" "app/(app)/admin/lessons/[id]/edit/page.tsx"
git commit -m "feat(admin): author lesson vocabulary + PDF resources"
```

---

### Task 9: End-to-end verification against live Supabase + docs

**Files:**
- Create (scratch, gitignored): `_f4.mjs`
- Modify: `docs/bug-hunt-findings.md`

**Interfaces:** none (verification + docs).

- [ ] **Step 1: Start the dev server**

Run (background): `npm run dev`
Expected: ready on http://localhost:3000. (If a stale-`.next` reload loop appears, delete `.next` and restart — known F: drive issue.)

- [ ] **Step 2: Browser-author an interactive exam as QA admin**

Using the Playwright harness pattern (`_harness.mjs` login as `qa.admin@example.com`), drive `/admin/exams/new`:
- fill title `[QA] F4 Interactive`, level B2, skill writing, type **Interactivo**
- add an MCQ (2 options, mark correct), a gap_fill (correct answer), an open_text; points 10 each
- submit; expect redirect to `/admin/exams`.

Then verify persistence with `_f4.mjs` (service-role read):
```js
import { readFileSync } from 'node:fs'
const env = {}
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL, SVC = env.SUPABASE_SERVICE_ROLE_KEY
const H = { apikey: SVC, Authorization: `Bearer ${SVC}` }
const r = await fetch(`${URL}/rest/v1/exams?select=id,title,exam_type,max_score,questions,pdf_url&title=like.*F4*&order=created_at.desc`, { headers: H })
console.log(JSON.stringify(await r.json(), null, 2))
```
Run: `node _f4.mjs`
Expected: the interactive row has `questions` length 3, `max_score` = 30 (sum), `pdf_url` null.

- [ ] **Step 3: Browser-author a PDF exam + a lesson as QA admin**

- `/admin/exams/new`: title `[QA] F4 PDF`, type **PDF**, upload a small PDF, max_score 100, submit. Re-run `node _f4.mjs`; expect the PDF row has a `pdf_url` under `.../public/resources/exam-pdfs/...` and `questions` `[]`.
- `/admin/lessons/new`: title `[QA] F4 Lesson`, level B2, add 1 vocab item + upload 1 PDF resource, publish, submit. Add a lessons probe to `_f4.mjs` (select `vocabulary, pdf_resources` where title like `*F4*`); expect 1 vocab item and 1 pdf_resource with a public URL.
- Open both public PDF URLs in the browser; expect HTTP 200 / PDF renders.

- [ ] **Step 4: Take the content as QA student**

Log in as `qa.student@example.com` (level B2). Visit `/exams`:
- open the interactive exam, answer MCQ correctly + gap_fill correctly + write open-text, submit. Expect a graded result; MCQ+gap_fill auto-scored (20/30 if open-text falls back, or full AI grade if credits present).
- open the PDF exam, download the PDF, write an essay, submit. Expect a graded result (AI or fallback).
- Visit `/lessons`, open the F4 lesson; expect the vocabulary card + the downloadable PDF resource render.

- [ ] **Step 5: Update the findings doc**

In `docs/bug-hunt-findings.md`, replace the `## Flow 4 — Admin panels` `_(pending)_` section with a summary: F3-2 fixed; F2-3 closed (exam question/PDF authoring + edit page; lesson vocabulary/PDF authoring; public `resources` bucket); note "no schema drift in Flow 4". Append to the **Cleanup checklist**:
```
- [ ] Delete `[QA] F4 *` exams (interactive + PDF) and their exam_submissions
- [ ] Delete `[QA] F4 Lesson` and its lesson_completions
- [ ] Delete uploaded test PDFs under resources/exam-pdfs/ and resources/lesson-pdfs/
- [ ] Keep the `resources` storage bucket (real feature dependency — do NOT delete)
```

- [ ] **Step 6: Clean up scratch + commit docs**

Run: `rm -f _f4.mjs`
```bash
git add docs/bug-hunt-findings.md
git commit -m "docs: record Flow 4 admin-authoring completion + cleanup items"
```

- [ ] **Step 7 (deferred, needs Anthropic credits):** After credits are added to the Anthropic account and the key is live in `.env.local`/Vercel, re-take the interactive exam's open_text question and the PDF exam, and confirm `claude_feedback.summary` is real content (not "Análisis de IA no disponible"). This verifies the pre-existing AI grading path end-to-end (F2-9).

---

## Self-Review

**Spec coverage:**
- Public `resources` bucket → Task 1. `uploadResource` → Task 2. ✓
- Exam QuestionEditor + PDF mutual-exclusion + derived max_score → Tasks 4, 5. ✓
- `updateExam` + exam edit route + ExamRow edit link → Tasks 5, 6. ✓
- Lesson VocabularyEditor + PdfResources + edit-page preload → Tasks 7, 8. ✓
- Video stays YouTube-only → unchanged in Task 8. ✓
- Validation rules (interactive ≥1 q, mcq ≥2 opts + correct, gap_fill answer, PDF requires pdf_url) → Task 5 `parseExamForm`. ✓
- Grading unchanged; AI verification deferred → Task 9 Step 7. ✓
- Testing plan (probe + browser, QA users, cleanup) → Task 9. ✓

**Placeholder scan:** No TBD/TODO; all code blocks complete; the one deferred step (AI grading) is explicitly gated on external credits, not a code gap.

**Type consistency:** `Question`/`VocabItem`/`PdfResource` identical across Tasks 3/4/7 and the actions; `ExamFormData` defined in Task 5 and consumed in Task 6; `uploadResource` return union (`{url,name,size}` | `{error}`) matches its consumer in Task 3. ✓
