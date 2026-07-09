"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import "./globals.css"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="es">
      <body>
        <main
          className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
          style={{ background: "var(--color-bg)" }}
        >
          <h1
            className="text-2xl font-bold mb-3"
            style={{ color: "var(--color-text)" }}
          >
            Algo ha salido mal
          </h1>

          <p
            className="text-sm mb-8 max-w-md leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Hemos registrado el error y lo estamos revisando. Puedes intentarlo
            de nuevo o volver al inicio.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "var(--color-primary)", color: "#fff" }}
            >
              Reintentar
            </button>

            {/*
              A global error means the root layout itself threw, so the client
              router may be in a broken state. A hard <a> navigation forces a
              full document reload, which is the more reliable recovery path
              than a client-side <Link>. The lint rule is disabled deliberately.
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border"
              style={{
                borderColor: "var(--color-primary)",
                color: "var(--color-primary)",
              }}
            >
              Volver al inicio
            </a>
          </div>

          {error.digest && (
            <p
              className="mt-8 text-xs font-mono"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Ref: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  )
}
