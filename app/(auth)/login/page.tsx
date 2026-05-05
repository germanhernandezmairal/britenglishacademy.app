import Link from "next/link"
import type { Metadata } from "next"
import { login, loginWithGoogle } from "@/app/actions/auth"
import AuthCard from "@/components/shared/AuthCard"

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description: "Accede a tu aula virtual de Brit English School.",
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Email o contraseña incorrectos. Inténtalo de nuevo.",
  oauth_failed: "Error al conectar con Google. Inténtalo de nuevo.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null

  return (
    <AuthCard
      title="Bienvenido de vuelta"
      subtitle="Accede a tu comunidad de aprendizaje"
    >
      {errorMessage && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm"
          style={{
            background: "var(--color-error-light)",
            color: "var(--color-error)",
          }}
        >
          {errorMessage}
        </div>
      )}

      <form action={login} className="space-y-4">
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
            className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all focus:ring-2"
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
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg)",
              color: "var(--color-text)",
            }}
          />
          <div className="text-right mt-1.5">
            <Link href="/forgot-password" className="text-xs"
              style={{ color: "var(--color-primary)" }}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full py-3 text-sm rounded-lg">
          Entrar
        </button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: "var(--color-border)" }} />
        </div>
        <div className="relative flex justify-center text-xs px-3"
          style={{ color: "var(--color-text-muted)" }}>
          <span style={{ background: "var(--color-bg)", padding: "0 0.75rem" }}>
            o continúa con
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
        ¿No tienes cuenta?{" "}
        <Link href="/signup" style={{ color: "var(--color-primary)" }} className="font-medium">
          Regístrate
        </Link>
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
