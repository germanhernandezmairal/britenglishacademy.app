"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { motion } from "framer-motion"

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
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
          <Image
            src="/imgs/english-school-logo.webp"
            alt="Brit English School"
            width={44}
            height={44}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {NAV_LINKS.map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
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
            </motion.div>
          ))}
        </nav>

        {/* Desktop CTA */}
        <motion.div
          className="hidden md:flex items-center gap-3"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/login"
            className="btn btn-outline text-sm px-4 py-2"
          >
            Entrar
          </Link>
          <Link href="/signup" className="btn btn-accent text-sm px-5 py-2.5 rounded-lg">
            Empieza gratis
          </Link>
        </motion.div>

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
    </motion.header>
  )
}
