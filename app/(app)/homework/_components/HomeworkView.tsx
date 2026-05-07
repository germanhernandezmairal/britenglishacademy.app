"use client"

import { useState } from "react"
import { Plus, ClipboardList, X } from "lucide-react"
import { UploadForm } from "./UploadForm"
import { SubmissionCard } from "./SubmissionCard"

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

export function HomeworkView({ initialSubmissions }: { initialSubmissions: Submission[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [isModalOpen, setIsModalOpen] = useState(false)

  function handleDeleted(id: string) {
    setSubmissions((prev) => prev.filter((s) => s.id !== id))
  }

  function handleModalClose() {
    setIsModalOpen(false)
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
          >
            Mis deberes
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Sube tus tareas y recibe análisis de IA + corrección del profesor.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "var(--color-primary)" }}
        >
          <Plus size={16} />
          Enviar deberes
        </button>
      </div>

      {/* Submission list */}
      {submissions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl border"
          style={{ background: "white", borderColor: "var(--color-border)" }}
        >
          <ClipboardList
            size={40}
            className="mb-4 opacity-20"
            style={{ color: "var(--color-primary)" }}
          />
          <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Aún no has enviado ningún deber
          </p>
          <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
            Sube tu primera tarea para recibir feedback de IA.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--color-primary)" }}
          >
            <Plus size={16} />
            Enviar mi primer deber
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <SubmissionCard
              key={sub.id}
              submission={sub}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* Upload modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(1,33,105,0.35)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleModalClose() }}
        >
          <div
            className="w-full max-w-lg rounded-2xl shadow-xl"
            style={{ background: "white" }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <h2
                className="text-base font-bold"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
              >
                Enviar deberes
              </h2>
              <button
                onClick={handleModalClose}
                className="p-1.5 rounded-lg transition-colors hover:opacity-60"
                style={{ color: "var(--color-text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5">
              <UploadForm onClose={handleModalClose} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
