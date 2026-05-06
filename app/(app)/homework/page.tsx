import type { Metadata } from "next"
import { ClipboardList } from "lucide-react"

export const metadata: Metadata = { title: "Deberes | Brit English School" }

export default function HomeworkPage() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <h1
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
      >
        Deberes
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
        Sube tus deberes y recibe feedback de IA + revisión del profesor.
      </p>
      <div
        className="flex flex-col items-center justify-center py-20 rounded-2xl border"
        style={{ background: "white", borderColor: "var(--color-border)" }}
      >
        <ClipboardList size={40} className="mb-4 opacity-20" style={{ color: "var(--color-accent)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
          Próximamente — el módulo de deberes está en camino
        </p>
      </div>
    </div>
  )
}
