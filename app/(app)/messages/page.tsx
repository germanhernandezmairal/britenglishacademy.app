import type { Metadata } from "next"
import { MessageCircle } from "lucide-react"

export const metadata: Metadata = { title: "Mensajes | Brit English School" }

export default function MessagesPage() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <h1
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
      >
        Mensajes
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
        Comunícate con tu profesor directamente.
      </p>
      <div
        className="flex flex-col items-center justify-center py-20 rounded-2xl border"
        style={{ background: "white", borderColor: "var(--color-border)" }}
      >
        <MessageCircle size={40} className="mb-4 opacity-20" style={{ color: "var(--color-primary)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
          Próximamente — la mensajería está en camino
        </p>
      </div>
    </div>
  )
}
