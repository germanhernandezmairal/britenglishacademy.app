import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Brit English School | Academia de Inglés Cambridge en Tarragona",
  description:
    "Centro preparador oficial Cambridge en Tarragona. Clases de inglés para niños, teens, adultos y empresas. B1, B2, C1, C2. 4.9/5 en Google.",
}

const LEVELS = [
  { code: "A1", name: "Principiante", color: "#D4A017" },
  { code: "A2", name: "Elemental", color: "#D4A017" },
  { code: "B1", name: "Intermedio", color: "#1A3A8C" },
  { code: "B2", name: "Intermedio Alto", color: "#1A3A8C" },
  { code: "C1", name: "Avanzado", color: "#012169" },
  { code: "C2", name: "Maestría", color: "#012169" },
]

const FEATURES = [
  {
    icon: "👥",
    title: "Grupos reducidos",
    desc: "Máximo 8 alumnos por clase. Atención real y personalizada garantizada.",
  },
  {
    icon: "🎓",
    title: "Centro Cambridge oficial",
    desc: "Preparamos para B1, B2, C1 y C2. Somos Prep Centre autorizado.",
  },
  {
    icon: "🤖",
    title: "IA integrada",
    desc: "Feedback instantáneo con Claude AI en deberes y exámenes. Progreso acelerado.",
  },
  {
    icon: "📱",
    title: "Plataforma digital",
    desc: "Accede a tus clases, deberes y comunidad desde cualquier dispositivo.",
  },
  {
    icon: "💬",
    title: "Seguimiento individual",
    desc: "Mensajería directa con tu profesor y corrección de deberes personalizada.",
  },
  {
    icon: "🌟",
    title: "4.9/5 en Google",
    desc: "Más de 80 reseñas verificadas. El mejor valorado de Tarragona.",
  },
]

const TESTIMONIALS = [
  {
    name: "María G.",
    level: "C1 Advanced",
    text: "Aprobé el C1 a la primera. Los grupos reducidos hacen una diferencia enorme. Mi profesora conocía exactamente mis puntos débiles.",
    stars: 5,
  },
  {
    name: "Carlos M.",
    level: "B2 First",
    text: "La plataforma digital es fantástica. Puedo ver mis clases grabadas, subir mis deberes y recibir correcciones con inteligencia artificial. Increíble.",
    stars: 5,
  },
  {
    name: "Laura P.",
    level: "B1 Preliminary",
    text: "Mi hijo empezó desde cero y en un año ya tiene el A2. Los profesores son cercanos y la metodología funciona de verdad.",
    stars: 5,
  },
]

export default function HomePage() {
  return (
    <div style={{ background: "var(--color-bg)", color: "var(--color-text)" }}>
      {/* ── Navigation ────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="container-wide flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base"
              style={{ background: "var(--color-primary)" }}
            >
              B
            </div>
            <div className="leading-none">
              <div
                className="font-bold text-base"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-primary)",
                }}
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

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/levels" style={{ color: "var(--color-text-secondary)" }}
              className="hover:text-[#012169] transition-colors">
              Cursos
            </Link>
            <Link href="/about" style={{ color: "var(--color-text-secondary)" }}
              className="hover:text-[#012169] transition-colors">
              Nosotros
            </Link>
            <Link href="/blog" style={{ color: "var(--color-text-secondary)" }}
              className="hover:text-[#012169] transition-colors">
              Blog
            </Link>
            <Link href="/contact" style={{ color: "var(--color-text-secondary)" }}
              className="hover:text-[#012169] transition-colors">
              Contacto
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login"
              className="hidden md:inline-flex text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:bg-gray-50"
              style={{ color: "var(--color-primary)" }}>
              Entrar
            </Link>
            <Link href="/signup"
              className="btn btn-accent text-sm px-5 py-2.5 rounded-lg">
              Empieza gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-24 md:py-36"
        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #1A3A8C 60%, #012169 100%)" }}
      >
        {/* Union Jack subtle pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, white 0px, white 2px, transparent 2px, transparent 40px), repeating-linear-gradient(90deg, white 0px, white 2px, transparent 2px, transparent 40px)",
          }}
        />

        <div className="container-wide relative z-10">
          <div className="max-w-3xl">
            {/* Cambridge badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: "rgba(212,160,23,0.2)", color: "#F0C842", border: "1px solid rgba(212,160,23,0.3)" }}>
              🎓 Centro Preparador Cambridge Oficial · Tarragona
            </div>

            <h1
              className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Domina el inglés.
              <br />
              <span style={{ color: "#F0C842" }}>Certifícate Cambridge.</span>
            </h1>

            <p className="text-lg md:text-xl mb-10 max-w-2xl leading-relaxed"
              style={{ color: "rgba(255,255,255,0.82)" }}>
              La academia mejor valorada de Tarragona. Grupos reducidos, seguimiento
              individual real, plataforma digital con IA y preparación oficial
              para B1, B2, C1 y C2.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup"
                className="btn btn-accent text-base px-8 py-4 rounded-xl">
                Empieza ahora — gratis
              </Link>
              <Link href="/contact"
                className="btn btn-outline text-base px-8 py-4 rounded-xl border-white text-white hover:bg-white hover:text-[#012169]">
                Habla con nosotros
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 mt-10">
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-400 text-lg">★★★★★</span>
                <span className="text-white font-bold">4.9/5</span>
                <span style={{ color: "rgba(255,255,255,0.6)" }} className="text-sm">
                  Google Reviews
                </span>
              </div>
              <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.2)" }} />
              <span style={{ color: "rgba(255,255,255,0.7)" }} className="text-sm">
                +80 opiniones verificadas
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CEFR Levels ───────────────────────────────────────── */}
      <section className="py-20" style={{ background: "var(--color-bg-alt)" }}>
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)" }}>
              Desde A1 hasta C2
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>
              Cursos estructurados siguiendo el Marco Común Europeo de Referencia (MCER).
              Sea cual sea tu nivel, tenemos el curso para ti.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {LEVELS.map((level) => (
              <Link
                key={level.code}
                href={`/levels#${level.code.toLowerCase()}`}
                className="group flex flex-col items-center p-6 rounded-2xl border text-center transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{
                  background: "var(--color-bg)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg mb-3 transition-transform group-hover:scale-110"
                  style={{ background: level.color }}
                >
                  {level.code}
                </div>
                <div className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                  {level.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)" }}>
              Por qué elegir Brit English
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>
              No somos una academia más. Somos el centro que realmente te acompaña
              hasta donde quieres llegar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="p-6 rounded-2xl border transition-all hover:shadow-md"
                style={{
                  background: "var(--color-bg)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="text-3xl mb-4">{feat.icon}</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: "var(--color-text)" }}>
                  {feat.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Platform Preview ───────────────────────────────── */}
      <section
        className="py-20"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{
                  background: "var(--color-primary-50)",
                  color: "var(--color-primary)",
                }}
              >
                🤖 Powered by Claude AI
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-5"
                style={{ fontFamily: "var(--font-display)" }}>
                Aprende más rápido con inteligencia artificial
              </h2>
              <p className="text-base mb-6 leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}>
                Nuestra plataforma utiliza Claude AI para darte feedback gramatical
                instantáneo en tus deberes, evaluar tus exámenes escritos con puntuación
                CEFR, y generarte un resumen semanal personalizado de tu progreso.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Feedback gramatical automático en segundos",
                  "Corrección de exámenes escritos con puntuación B1–C2",
                  "Resumen semanal de progreso personalizado",
                  "Asistente de escritura en lecciones",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <span
                      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs"
                      style={{ background: "var(--color-primary)" }}
                    >
                      ✓
                    </span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn-primary text-sm px-6 py-3 rounded-xl">
                Accede a la plataforma
              </Link>
            </div>

            {/* Mock UI preview */}
            <div
              className="rounded-2xl p-6 border shadow-xl"
              style={{
                background: "var(--color-bg)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs ml-2" style={{ color: "var(--color-text-muted)" }}>
                  AI Feedback — Homework Review
                </span>
              </div>
              <div
                className="rounded-xl p-4 mb-4 text-sm"
                style={{ background: "var(--color-bg-alt)", color: "var(--color-text-secondary)" }}
              >
                <span className="font-medium" style={{ color: "var(--color-text)" }}>
                  Tu texto:{" "}
                </span>
                <span className="line-through" style={{ color: "var(--color-error)" }}>
                  Yesterday I go to the store
                </span>{" "}
                →{" "}
                <span style={{ color: "var(--color-success)" }}>
                  Yesterday I went to the store
                </span>
              </div>
              <div
                className="rounded-xl p-4 text-sm"
                style={{
                  background: "var(--color-primary-50)",
                  borderLeft: "3px solid var(--color-primary)",
                }}
              >
                <div className="font-semibold mb-1" style={{ color: "var(--color-primary)" }}>
                  🤖 Análisis Claude AI
                </div>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  Error de tiempo verbal: usa el pasado simple (went) con marcadores
                  temporales como &quot;yesterday&quot;. Nivel B1 — sigue practicando.
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ background: "var(--color-primary-100)", color: "var(--color-primary)" }}>
                    Gramática: 78/100
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ background: "var(--color-success-light)", color: "var(--color-success)" }}>
                    Vocabulario: ✓
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section className="py-20">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)" }}>
              Lo que dicen nuestros alumnos
            </h2>
            <div className="flex items-center justify-center gap-2">
              <span className="text-yellow-400 text-xl">★★★★★</span>
              <span className="font-bold text-lg">4.9/5</span>
              <span style={{ color: "var(--color-text-muted)" }} className="text-sm">
                · +80 reseñas en Google
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-2xl border"
                style={{
                  background: "var(--color-bg)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5"
                  style={{ color: "var(--color-text-secondary)" }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: "var(--color-primary)" }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {t.level}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, #1A3A8C 100%)",
        }}
      >
        <div className="container-wide text-center">
          <h2
            className="text-3xl md:text-5xl font-bold text-white mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ¿Listo para empezar?
          </h2>
          <p className="text-lg mb-10 max-w-2xl mx-auto"
            style={{ color: "rgba(255,255,255,0.8)" }}>
            Únete a la comunidad de Brit English School. Primera semana gratis.
            Sin compromiso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn btn-accent text-base px-10 py-4 rounded-xl">
              Crear cuenta gratis
            </Link>
            <Link href="/contact"
              className="btn text-base px-10 py-4 rounded-xl border-white text-white hover:bg-white hover:text-[#012169] transition-all"
              style={{ border: "2px solid rgba(255,255,255,0.5)" }}>
              Contactar
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer
        className="py-12 border-t"
        style={{
          background: "var(--color-text)",
          borderColor: "rgba(255,255,255,0.05)",
        }}
      >
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: "var(--color-accent)" }}
                >
                  B
                </div>
                <span className="text-white font-bold text-sm"
                  style={{ fontFamily: "var(--font-display)" }}>
                  Brit English School
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Centro preparador Cambridge oficial en Tarragona.
                Rambla Nova 62, 4ª planta.
              </p>
            </div>

            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Cursos</h4>
              <ul className="space-y-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                <li><Link href="/levels" className="hover:text-white transition-colors">Niveles A1–C2</Link></li>
                <li><Link href="/levels#cambridge" className="hover:text-white transition-colors">Preparación Cambridge</Link></li>
                <li><Link href="/levels#online" className="hover:text-white transition-colors">Cursos online</Link></li>
                <li><Link href="/levels#corporate" className="hover:text-white transition-colors">Formación empresas</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Academia</h4>
              <ul className="space-y-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                <li><Link href="/about" className="hover:text-white transition-colors">Sobre nosotros</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contacto</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Contacto</h4>
              <ul className="space-y-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                <li>📍 Rambla Nova 62, Tarragona</li>
                <li>📞 +34 877 072 975</li>
                <li>✉️ info@britenglishschool.com</li>
                <li>
                  <a
                    href="https://wa.me/34877072975"
                    className="hover:text-white transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    💬 WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div
            className="pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
            style={{
              borderColor: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <span>© 2026 Brit English School. Todos los derechos reservados.</span>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
