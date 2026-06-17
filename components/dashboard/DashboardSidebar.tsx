"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard, BookOpen, ClipboardList, GraduationCap,
  Users, MessageCircle, Settings2, Menu, X, LogOut, ChevronRight,
} from "lucide-react"
import { logout } from "@/app/actions/auth"
import { PushNotificationToggle } from "@/components/shared/PushNotificationToggle"

type Profile = {
  full_name: string
  level: string | null
  role: string
}

const NAV = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/lessons", label: "Lecciones", icon: BookOpen, exact: false },
  { href: "/homework", label: "Deberes", icon: ClipboardList, exact: false },
  { href: "/exams", label: "Exámenes", icon: GraduationCap, exact: false },
  { href: "/community", label: "Comunidad", icon: Users, exact: false },
  { href: "/messages", label: "Mensajes", icon: MessageCircle, exact: false },
]

const LEVEL_COLOR: Record<string, { bg: string; text: string }> = {
  A1: { bg: "#FFF8E7", text: "#D4A017" },
  A2: { bg: "#FFF8E7", text: "#D4A017" },
  B1: { bg: "#EEF1FA", text: "#1A3A8C" },
  B2: { bg: "#EEF1FA", text: "#1A3A8C" },
  C1: { bg: "#D5DCF3", text: "#012169" },
  C2: { bg: "#D5DCF3", text: "#012169" },
}

function NavContent({ profile, onNav }: { profile: Profile; onNav?: () => void }) {
  const pathname = usePathname()
  const isAdmin = profile.role === "admin" || profile.role === "teacher"
  const firstName = profile.full_name.split(" ")[0]
  const levelColor = profile.level ? LEVEL_COLOR[profile.level] : { bg: "#EEF1FA", text: "#1A3A8C" }

  return (
    <div className="flex flex-col h-full">
      {/* Logo — BRIT ENGLISH text mark (matches public SiteHeader) */}
      <div
        className="flex items-center px-5 py-5 border-b flex-shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Link href="/dashboard" className="flex items-center gap-1" onClick={onNav}>
          <span
            className="text-lg font-extrabold tracking-tight leading-none"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}
          >
            BRIT
          </span>
          <span
            className="text-lg font-light leading-none"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text-secondary)",
              letterSpacing: "0.18em",
            }}
          >
            ENGLISH
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNav}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? "var(--color-primary-50)" : "transparent",
                color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
              }}
            >
              <Icon size={18} className="flex-shrink-0" />
              {label}
              {active && (
                <ChevronRight
                  size={14}
                  className="ml-auto"
                  style={{ color: "var(--color-primary)" }}
                />
              )}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div
              className="my-3 border-t"
              style={{ borderColor: "var(--color-border)" }}
            />
            <Link
              href="/admin"
              onClick={onNav}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: pathname.startsWith("/admin") ? "var(--color-primary-50)" : "transparent",
                color: pathname.startsWith("/admin") ? "var(--color-primary)" : "var(--color-text-secondary)",
              }}
            >
              <Settings2 size={18} className="flex-shrink-0" />
              Panel Admin
            </Link>
          </>
        )}
      </nav>

      {/* User section */}
      <div
        className="p-3 border-t flex-shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="flex items-center gap-3 p-3 rounded-xl mb-2"
          style={{ background: "var(--color-bg-alt)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "var(--color-primary)" }}
          >
            {firstName[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-semibold truncate"
              style={{ color: "var(--color-text)" }}
            >
              {profile.full_name}
            </div>
            {profile.level && (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ background: levelColor.bg, color: levelColor.text }}
              >
                {profile.level}
              </span>
            )}
          </div>
        </div>

        <PushNotificationToggle />

        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:bg-red-50"
            style={{ color: "var(--color-text-muted)" }}
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}

export function DashboardSidebar({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-xl border shadow-sm"
        style={{ background: "white", borderColor: "var(--color-border)" }}
        onClick={() => setOpen(!open)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 border-r transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "white", borderColor: "var(--color-border)" }}
      >
        <NavContent profile={profile} onNav={() => setOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 border-r"
        style={{ background: "white", borderColor: "var(--color-border)" }}
      >
        <NavContent profile={profile} />
      </aside>
    </>
  )
}
