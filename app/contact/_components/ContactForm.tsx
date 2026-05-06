"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { submitContact } from "@/app/actions/contact"

const schema = z.object({
  name: z.string().min(2, "Nombre demasiado corto"),
  email: z.string().email("Email no válido"),
  phone: z.string().optional(),
  level: z.string().min(1, "Selecciona tu nivel"),
  message: z.string().min(10, "Mensaje demasiado corto (mínimo 10 caracteres)"),
})

type FormData = z.infer<typeof schema>

const LEVELS = [
  { value: "no-se", label: "No sé mi nivel — quiero el test gratuito" },
  { value: "A1", label: "A1 — Principiante" },
  { value: "A2", label: "A2 — Elemental" },
  { value: "B1", label: "B1 — Intermedio" },
  { value: "B2", label: "B2 — Intermedio Alto" },
  { value: "C1", label: "C1 — Avanzado" },
  { value: "C2", label: "C2 — Maestría" },
  { value: "empresa", label: "Formación empresas" },
]

const inputStyle = (hasError: boolean) => ({
  borderColor: hasError ? "var(--color-error)" : "var(--color-border)",
  background: "var(--color-bg)",
  color: "var(--color-text)",
})

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const result = await submitContact(data)
    if (result.success) {
      setSubmitted(true)
    } else {
      setServerError(result.error ?? "Error desconocido.")
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h3
          className="text-xl font-bold mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ¡Mensaje enviado!
        </h3>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Nos pondremos en contacto contigo en menos de 24 horas.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--color-text)" }}
          >
            Nombre completo *
          </label>
          <input
            {...register("name")}
            type="text"
            placeholder="María García"
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-[#012169]/20"
            style={inputStyle(!!errors.name)}
          />
          {errors.name && (
            <p className="text-xs mt-1" style={{ color: "var(--color-error)" }}>
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--color-text)" }}
          >
            Email *
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="maria@ejemplo.com"
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-[#012169]/20"
            style={inputStyle(!!errors.email)}
          />
          {errors.email && (
            <p className="text-xs mt-1" style={{ color: "var(--color-error)" }}>
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--color-text)" }}
          >
            Teléfono (opcional)
          </label>
          <input
            {...register("phone")}
            type="tel"
            placeholder="+34 600 000 000"
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-[#012169]/20"
            style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--color-text)" }}
          >
            Nivel actual *
          </label>
          <select
            {...register("level")}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-[#012169]/20"
            style={inputStyle(!!errors.level)}
          >
            <option value="">Selecciona tu nivel...</option>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          {errors.level && (
            <p className="text-xs mt-1" style={{ color: "var(--color-error)" }}>
              {errors.level.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--color-text)" }}
        >
          Mensaje *
        </label>
        <textarea
          {...register("message")}
          rows={4}
          placeholder="Cuéntanos qué necesitas — tipo de clase, horarios preferidos, objetivos..."
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all resize-none focus:ring-2 focus:ring-[#012169]/20"
          style={inputStyle(!!errors.message)}
        />
        {errors.message && (
          <p className="text-xs mt-1" style={{ color: "var(--color-error)" }}>
            {errors.message.message}
          </p>
        )}
      </div>

      {serverError && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{ background: "var(--color-error-light)", color: "var(--color-error)" }}
        >
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full btn btn-primary py-3.5 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Enviando..." : "Enviar mensaje"}
      </button>

      <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
        Te respondemos en menos de 24 horas · Datos protegidos según RGPD
      </p>
    </form>
  )
}
