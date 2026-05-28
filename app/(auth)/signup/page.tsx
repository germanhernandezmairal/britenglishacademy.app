import Link from "next/link"
import type { Metadata } from "next"
import { signup, loginWithGoogle } from "@/app/actions/auth"
import AuthCard from "@/components/shared/AuthCard"

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Únete a la comunidad de Brit English Academy.",
}

const ERROR_MESSAGES: Record<string, string> = {
  validation_failed: "Por favor revisa los datos introducidos.",
  already_exists: "Ya existe una cuenta con este email.",
  signup_failed: "Error al crear la cuenta. Inténtalo de nuevo.",
  rate_limited: "Demasiados intentos de registro. Espera una hora antes de volver a intentarlo.",
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const params = await searchParams
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null
  const isSuccess = params.success === "check_email"

  if (isSuccess) {
    return (
      <AuthCard
        title="¡Revisa tu email!"
        subtitle="Te hemos enviado un enlace de verificación"
      >
        <div
          className="text-center py-6"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <div className="text-5xl mb-4">📧</div>
          <p className="text-sm mb-4">
            Hemos enviado un email de confirmación a tu dirección.
            Haz clic en el enlace para activar tu cuenta.
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            ¿No lo ves? Revisa la carpeta de spam.
          </p>
        </div>
        <Link href="/login" className="btn btn-primary w-full py-3 text-sm rounded-lg text-center block">
          Volver al inicio de sesión
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Empieza a aprender hoy"
      subtitle="Crea tu cuenta y únete a la comunidad"
    >
      {errorMessage && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm"
          style={{ background: "var(--color-error-light)", color: "var(--color-error)" }}
        >
          {errorMessage}
        </div>
      )}

      <form action={signup} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--color-text-secondary)" }}>
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            placeholder="Tu nombre"
            className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg)",
              color: "var(--color-text)",
            }}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--color-text-secondary)" }}>
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@email.com"
            className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg)",
              color: "var(--color-text)",
            }}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--color-text-secondary)" }}>
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg)",
              color: "var(--color-text)",
            }}
          />
        </div>

        <button type="submit" className="btn btn-accent w-full py-3 text-sm rounded-lg">
          Crear cuenta
        </button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: "var(--color-border)" }} />
        </div>
        <div className="relative flex justify-center text-xs"
          style={{ color: "var(--color-text-muted)" }}>
          <span style={{ background: "var(--color-bg)", padding: "0 0.75rem" }}>
            o regístrate con
          </span>
        </div>
      </div>

      <form action={loginWithGoogle}>
        <button type="submit"
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border text-sm font-medium transition-all hover:bg-gray-50"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
          <GoogleIcon />
          Google
        </button>
      </form>

      <p className="text-center text-sm mt-5" style={{ color: "var(--color-text-muted)" }}>
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" style={{ color: "var(--color-primary)" }} className="font-medium">
          Inicia sesión
        </Link>
      </p>

      <p className="text-center text-xs mt-4" style={{ color: "var(--color-text-muted)" }}>
        Al registrarte aceptas nuestros{" "}
        <Link href="/terms" style={{ color: "var(--color-primary)" }}>Términos de uso</Link>
        {" "}y{" "}
        <Link href="/privacy" style={{ color: "var(--color-primary)" }}>Política de privacidad</Link>.
      </p>
    </AuthCard>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
