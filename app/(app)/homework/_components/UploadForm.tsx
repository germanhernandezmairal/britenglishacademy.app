"use client"

import { useState, useRef, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, X, AlertCircle, Loader2 } from "lucide-react"
import { submitHomework } from "@/app/actions/homework"
import { LottiePlayer } from "@/components/shared/LottiePlayer"
import successAnimation from "@/public/animations/success.json"

const ACCEPTED = ".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png"
const MAX_MB = 20

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type Status = "idle" | "uploading" | "success" | "error"

export function UploadForm({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  const handleFile = useCallback((f: File) => {
    if (f.size > MAX_MB * 1024 * 1024) {
      setErrorMsg(`El archivo supera los ${MAX_MB} MB permitidos`)
      return
    }
    setFile(f)
    setErrorMsg(null)
  }, [])

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    if (picked) handleFile(picked)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) { setErrorMsg("Selecciona un archivo antes de enviar"); return }

    const formData = new FormData(e.currentTarget)
    formData.set("file", file)

    setStatus("uploading")
    setErrorMsg(null)

    startTransition(async () => {
      const result = await submitHomework(formData)
      if ("error" in result && result.error) {
        setStatus("error")
        setErrorMsg(result.error)
      } else {
        setStatus("success")
        router.refresh()
      }
    })
  }

  const isLoading = isPending || status === "uploading"

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <LottiePlayer
          animationData={successAnimation}
          loop={false}
          autoplay
          style={{ width: 120, height: 120 }}
          onComplete={onClose}
        />
        <h3 className="text-base font-bold mb-1 mt-2" style={{ color: "var(--color-text)" }}>
          ¡Deberes enviados!
        </h3>
        <p className="text-sm mb-2" style={{ color: "var(--color-text-muted)" }}>
          Tu profesor los revisará pronto.
        </p>
        <p className="text-xs mb-6" style={{ color: "var(--color-text-muted)" }}>
          El análisis de IA ya está disponible en tu lista.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--color-primary)" }}
        >
          Cerrar
        </button>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
          Título <span style={{ color: "var(--color-accent)" }}>*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          minLength={2}
          maxLength={120}
          placeholder="Ej: Writing Task – My Weekend"
          disabled={isLoading}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all disabled:opacity-50"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-bg-alt)",
            color: "var(--color-text)",
          }}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
          Descripción <span className="font-normal" style={{ color: "var(--color-text-muted)" }}>(opcional)</span>
        </label>
        <textarea
          name="description"
          rows={2}
          maxLength={500}
          placeholder="Añade contexto o instrucciones relevantes…"
          disabled={isLoading}
          className="w-full resize-none px-4 py-2.5 rounded-xl border text-sm outline-none transition-all disabled:opacity-50"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-bg-alt)",
            color: "var(--color-text)",
            fontFamily: "var(--font-body)",
          }}
        />
      </div>

      {/* Drop zone */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
          Archivo <span style={{ color: "var(--color-accent)" }}>*</span>
        </label>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all"
          style={{
            borderColor: isDragging ? "var(--color-primary)" : "var(--color-border)",
            background: isDragging ? "var(--color-primary-50)" : "var(--color-bg-alt)",
            opacity: isLoading ? 0.6 : 1,
            pointerEvents: isLoading ? "none" : "auto",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            onChange={onFileChange}
            className="sr-only"
          />

          {file ? (
            <div className="flex items-center gap-3 w-full">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--color-primary-100)" }}
              >
                <FileText size={18} style={{ color: "var(--color-primary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                  {file.name}
                </div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {formatBytes(file.size)}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="p-1.5 rounded-lg"
                style={{ color: "var(--color-text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <Upload size={28} className="mb-2" style={{ color: "var(--color-primary)" }} />
              <p className="text-sm font-medium text-center" style={{ color: "var(--color-text)" }}>
                Arrastra tu archivo aquí o{" "}
                <span style={{ color: "var(--color-primary)", textDecoration: "underline" }}>
                  selecciona
                </span>
              </p>
              <p className="text-xs mt-1 text-center" style={{ color: "var(--color-text-muted)" }}>
                PDF, Word, TXT, JPG, PNG · Máx. {MAX_MB} MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: "var(--color-error-light)", color: "var(--color-error)" }}
        >
          <AlertCircle size={15} className="flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading || !file}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "var(--color-primary)" }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analizando con IA…
            </>
          ) : (
            <>
              <Upload size={16} />
              Enviar deberes
            </>
          )}
        </button>
      </div>
    </form>
  )
}
