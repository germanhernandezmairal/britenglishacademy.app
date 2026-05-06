"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X } from "lucide-react"

const NAV_LINKS = [
  { href: "/levels", label: "Cursos" },
  { href: "/about", label: "Nosotros" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contacto" },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="container-wide flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base"
            style={{ background: "var(--color-primary)" }}
          >
            B
          </div>
          <div className="leading-none">
            <div
              className="font-bold text-base"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}
            >
              Brit English
            </div>
            <div
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-accent)" }}
            >
              School
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-[#012169]"
              style={{
                color: pathname === link.href
                  ? "var(--color-primary)"
                  : "var(--color-text-secondary)",
                fontWeight: pathname === link.href ? 600 : 500,
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:bg-gray-50"
            style={{ color: "var(--color-primary)" }}
          >
            Entrar
          </Link>
          <Link href="/signup" className="btn btn-accent text-sm px-5 py-2.5 rounded-lg">
            Empieza gratis
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          style={{ color: "var(--color-text)" }}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t"
          style={{ borderColor: "var(--color-border)", background: "white" }}
        >
          <nav className="container-wide py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  color: pathname === link.href
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
                  background: pathname === link.href ? "var(--color-primary-50)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            ))}
            <div
              className="border-t mt-3 pt-3"
              style={{ borderColor: "var(--color-border)" }}
            >
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                Entrar
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="block mt-1 px-3 py-2.5 rounded-lg text-sm font-medium text-white text-center"
                style={{ background: "var(--color-accent)" }}
              >
                Empieza gratis
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
