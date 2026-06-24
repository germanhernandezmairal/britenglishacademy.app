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
