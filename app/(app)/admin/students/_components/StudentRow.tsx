"use client"

import { useState } from "react"
import { Flame } from "lucide-react"
import { updateStudentLevel, toggleStudentActive } from "@/app/actions/admin"

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const
type Level = (typeof LEVELS)[number]

const LEVEL_COLORS: Record<Level, { bg: string; text: string }> = {
  A1: { bg: "#FFF8E7", text: "#D4A017" },
  A2: { bg: "#FFF8E7", text: "#D4A017" },
  B1: { bg: "#EEF1FA", text: "#1A3A8C" },
  B2: { bg: "#EEF1FA", text: "#1A3A8C" },
  C1: { bg: "#D5DCF3", text: "#012169" },
  C2: { bg: "#D5DCF3", text: "#012169" },
}

type Student = {
  id: string
  full_name: string
  level: string | null
  is_active: boolean
  login_streak: number
  last_login_at: string | null
  created_at: string
}

export function StudentRow({ student }: { student: Student }) {
  const [level, setLevel] = useState<string>(student.level ?? "")
  const [isActive, setIsActive] = useState(student.is_active)
  const [levelLoading, setLevelLoading] = useState(false)
  const [activeLoading, setActiveLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lc = level ? LEVEL_COLORS[level as Level] : null
  const initials = student.full_name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  async function handleLevelChange(newLevel: string) {
    if (newLevel === level || levelLoading) return
    setLevelLoading(true)
    setError(null)
    const result = await updateStudentLevel(student.id, newLevel)
    if (result.error) {
      setError(result.error)
    } else {
      setLevel(newLevel)
    }
    setLevelLoading(false)
  }

  async function handleToggleActive() {
    if (activeLoading) return
    setActiveLoading(true)
    setError(null)
    const result = await toggleStudentActive(student.id, isActive)
    if (result.error) {
      setError(result.error)
    } else {
      setIsActive(!isActive)
    }
    setActiveLoading(false)
  }

  const joined = new Date(student.created_at).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "2-digit",
  })

  return (
    <div className="px-5 py-4">
      {/* Mobile layout */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: "var(--color-primary)" }}
          >
            {initials}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              {student.full_name}
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Registrado {joined}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={level}
            onChange={(e) => handleLevelChange(e.target.value)}
            disabled={levelLoading}
            className="text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer"
            style={{
              background: lc?.bg ?? "var(--color-bg-alt)",
              color: lc?.text ?? "var(--color-text-muted)",
              borderColor: "var(--color-border)",
            }}
          >
            <option value="">Sin nivel</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>

          <button
            onClick={handleToggleActive}
            disabled={activeLoading}
            className="text-xs font-semibold px-3 py-1 rounded-lg border transition-all"
            style={{
              background: isActive ? "#D1FAE5" : "#FEE2E2",
              color: isActive ? "#16A34A" : "#DC2626",
              borderColor: isActive ? "#A7F3D0" : "#FECACA",
            }}
          >
            {activeLoading ? "..." : isActive ? "Activo" : "Suspendido"}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {/* Desktop layout */}
      <div className="hidden md:grid grid-cols-[1fr_100px_120px_120px_140px] gap-4 items-center">
        {/* Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: "var(--color-primary)" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
              {student.full_name}
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Desde {joined}
            </div>
          </div>
        </div>

        {/* Level selector */}
        <select
          value={level}
          onChange={(e) => handleLevelChange(e.target.value)}
          disabled={levelLoading}
          className="text-xs font-bold px-2 py-1.5 rounded-lg border cursor-pointer w-full"
          style={{
            background: lc?.bg ?? "var(--color-bg-alt)",
            color: lc?.text ?? "var(--color-text-muted)",
            borderColor: "var(--color-border)",
          }}
        >
          <option value="">—</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>

        {/* Streak */}
        <div className="flex items-center gap-1.5 text-sm">
          <Flame size={14} style={{ color: "#EA580C" }} />
          <span className="font-semibold" style={{ color: "var(--color-text)" }}>
            {student.login_streak}
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>días</span>
        </div>

        {/* Active badge */}
        <span
          className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
          style={{
            background: isActive ? "#D1FAE5" : "#FEE2E2",
            color: isActive ? "#16A34A" : "#DC2626",
          }}
        >
          {isActive ? "Activo" : "Suspendido"}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleActive}
            disabled={activeLoading}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
              background: "var(--color-bg-alt)",
            }}
          >
            {activeLoading ? "..." : isActive ? "Suspender" : "Activar"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
    </div>
  )
}
