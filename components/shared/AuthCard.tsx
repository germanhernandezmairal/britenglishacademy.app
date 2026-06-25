import Link from "next/link"

interface AuthCardProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--color-bg-alt)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
              style={{ background: "var(--color-primary)" }}
            >
              B
            </div>
            <div className="text-left">
              <div
                className="font-bold text-lg leading-none"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}
              >
                Brit English
              </div>
              <div className="text-xs font-medium uppercase tracking-widest"
                style={{ color: "var(--color-accent)" }}>
                School
              </div>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-lg"
          style={{
            background: "var(--color-bg)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div className="mb-6">
            <h1
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
            >
              {title}
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {subtitle}
            </p>
          </div>

          {children}
        </div>

        {/* Cambridge badge */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--color-text-muted)" }}
        >
          Centro preparador oficial Cambridge · 4.9/5 ⭐ en Google
        </p>
      </div>
    </div>
  )
}
