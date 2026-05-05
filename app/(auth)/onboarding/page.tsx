import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { completeOnboarding } from "@/app/actions/auth"
import AuthCard from "@/components/shared/AuthCard"

export const metadata: Metadata = {
  title: "Configura tu perfil",
  description: "Dinos tu nivel de inglés para personalizar tu experiencia.",
}

const LEVELS = [
  { value: "A1", label: "A1 — Principiante", desc: "Conozco palabras básicas" },
  { value: "A2", label: "A2 — Elemental", desc: "Puedo comunicarme en situaciones simples" },
  { value: "B1", label: "B1 — Intermedio", desc: "Manejo el inglés en situaciones cotidianas" },
  { value: "B2", label: "B2 — Intermedio alto", desc: "Me expreso con fluidez sobre temas familiares" },
  { value: "C1", label: "C1 — Avanzado", desc: "Utilizo el inglés de forma flexible y eficaz" },
  { value: "C2", label: "C2 — Maestría", desc: "Domino el inglés a nivel nativo" },
] as const

const ERROR_MESSAGES: Record<string, string> = {
  select_level: "Por favor selecciona tu nivel de inglés.",
  save_failed: "Error al guardar tu perfil. Inténtalo de nuevo.",
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("level")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.level) redirect("/dashboard")

  return (
    <AuthCard
      title="¿Cuál es tu nivel de inglés?"
      subtitle="Esto nos ayuda a personalizar tu experiencia de aprendizaje"
    >
      {errorMessage && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm"
          style={{ background: "var(--color-error-light)", color: "var(--color-error)" }}
        >
          {errorMessage}
        </div>
      )}

      <form action={completeOnboarding} className="space-y-3">
        {LEVELS.map((level) => (
          <label
            key={level.value}
            className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-blue-300 has-[:checked]:border-[#012169] has-[:checked]:bg-[#EEF1FA]"
            style={{ borderColor: "var(--color-border)" }}
          >
            <input
              type="radio"
              name="level"
              value={level.value}
              className="mt-0.5 accent-[#012169]"
              required
            />
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {level.label}
              </div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {level.desc}
              </div>
            </div>
          </label>
        ))}

        <div className="pt-2">
          <label className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--color-text-secondary)" }}>
            Objetivos de aprendizaje{" "}
            <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(opcional)</span>
          </label>
          <textarea
            name="learning_goals"
            rows={3}
            placeholder="Ej: Aprobar el B2 Cambridge, mejorar para el trabajo, viajar..."
            className="w-full px-4 py-3 rounded-lg border text-sm outline-none resize-none"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg)",
              color: "var(--color-text)",
            }}
          />
        </div>

        <button type="submit" className="btn btn-primary w-full py-3 text-sm rounded-lg mt-2">
          Empezar a aprender
        </button>
      </form>
    </AuthCard>
  )
}
