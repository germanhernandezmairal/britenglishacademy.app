import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/public/SiteHeader"
import { SiteFooter } from "@/components/public/SiteFooter"
import { AnimateIn } from "@/components/shared/AnimateIn"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.BritEnglishAcademy.com"

export const metadata: Metadata = {
  title: "Cursos de Inglés A1–C2 | Brit English Academy Tarragona",
  description:
    "Cursos de inglés para todos los niveles MCER (A1, A2, B1, B2, C1, C2) en Tarragona. Clases presenciales y online. Preparación Cambridge oficial.",
  alternates: { canonical: `${BASE}/levels` },
  openGraph: {
    title: "Cursos de Inglés A1 a C2 | Brit English Academy Tarragona",
    description:
      "Cursos estructurados MCER para todos los niveles. Preparación Cambridge oficial B1, B2, C1, C2 en Tarragona.",
    url: `${BASE}/levels`,
  },
}

const LEVELS = [
  {
    code: "A1",
    name: "Principiante",
    color: "#D4A017",
    colorLight: "#FFF8E7",
    description:
      "Comienzas desde cero. Aprenderás a presentarte, hablar de tu vida cotidiana y manejar situaciones básicas en inglés.",
    skills: [
      "Presentaciones y saludos en inglés",
      "Números, fechas y la hora",
      "Vocabulario esencial del día a día",
      "Presente simple y continuo",
      "Expresar gustos y preferencias",
    ],
    cambridge: null,
    prepFor: "A2 Key (KET)",
    duration: "8–10 meses",
    sessions: "2 sesiones/semana · 90 min c/u",
    whoFor:
      "Personas sin ningún conocimiento previo de inglés o con conocimiento muy básico olvidado.",
    featured: false,
  },
  {
    code: "A2",
    name: "Elemental",
    color: "#D4A017",
    colorLight: "#FFF8E7",
    description:
      "Consolidas las bases y empiezas a comunicarte en situaciones cotidianas con mayor fluidez.",
    skills: [
      "Pasado simple e irregular verbs",
      "Futuro (will / going to)",
      "Compras, restaurantes, transportes",
      "Escritura de correos sencillos",
      "Comprensión auditiva básica",
    ],
    cambridge: "A2 Key (KET)",
    prepFor: "B1 Preliminary (PET)",
    duration: "8–10 meses",
    sessions: "2 sesiones/semana · 90 min c/u",
    whoFor: "Alumnos que completaron A1 o tienen nociones básicas de inglés.",
    featured: false,
  },
  {
    code: "B1",
    name: "Intermedio",
    color: "#1A3A8C",
    colorLight: "#EEF1FA",
    description:
      "Alcanzas el nivel umbral del Marco Europeo. Puedes desenvolverte en la mayoría de situaciones de viaje y expresar opiniones sencillas.",
    skills: [
      "Present Perfect vs. Past Simple",
      "Condicionales (0, 1, 2)",
      "Voz pasiva y reported speech",
      "Vocabulario académico y laboral básico",
      "Comprensión de textos auténticos",
    ],
    cambridge: "B1 Preliminary (PET)",
    prepFor: "B2 First (FCE)",
    duration: "10–12 meses",
    sessions: "2–3 sesiones/semana",
    whoFor:
      "Alumnos con base elemental sólida que quieren alcanzar el primer nivel reconocido internacionalmente.",
    featured: false,
  },
  {
    code: "B2",
    name: "Intermedio Alto",
    color: "#1A3A8C",
    colorLight: "#EEF1FA",
    description:
      "El nivel más demandado. Comunicas con fluidez sobre una gran variedad de temas y entiendes a hablantes nativos a velocidad normal.",
    skills: [
      "Grammar avanzada: mixed conditionals, inversión",
      "Writing académico y formal",
      "Listening con acentos variados",
      "Debates y argumentación",
      "Vocabulario para CV y entrevistas de trabajo",
    ],
    cambridge: "B2 First (FCE)",
    prepFor: "C1 Advanced (CAE)",
    duration: "10–14 meses",
    sessions: "2–3 sesiones/semana",
    whoFor:
      "Alumnos con nivel intermedio que necesitan el B2 para trabajo, universidad o emigración.",
    featured: true,
  },
  {
    code: "C1",
    name: "Avanzado",
    color: "#012169",
    colorLight: "#D5DCF3",
    description:
      "Dominas el inglés con soltura y precisión. Puedes leer textos técnicos, redactar con matiz y participar en debates al nivel de un nativo.",
    skills: [
      "Expresión idiomática y coloquial avanzada",
      "Writing académico y de investigación",
      "Listening de medios de comunicación nativos",
      "Presentaciones profesionales complejas",
      "Análisis literario y crítico",
    ],
    cambridge: "C1 Advanced (CAE)",
    prepFor: "C2 Proficiency (CPE)",
    duration: "12–18 meses",
    sessions: "2–3 sesiones/semana",
    whoFor:
      "Profesionales, académicos y alumnos con B2 certificado que aspiran a la excelencia.",
    featured: false,
  },
  {
    code: "C2",
    name: "Maestría",
    color: "#012169",
    colorLight: "#D5DCF3",
    description:
      "El nivel más alto del MCER. Equivalente a un hablante nativo culto. Máxima precisión, riqueza léxica y dominio completo del idioma.",
    skills: [
      "Dominio completo de registro y estilo",
      "Textos literarios, filosóficos y científicos",
      "Traducción e interpretación de alto nivel",
      "Discurso público y oratoria",
      "Equivalente a estudios universitarios en UK",
    ],
    cambridge: "C2 Proficiency (CPE)",
    prepFor: null,
    duration: "12–18 meses",
    sessions: "2–3 sesiones/semana",
    whoFor:
      "Alumnos con C1 certificado o nivel near-native que quieren la certificación máxima Cambridge.",
    featured: false,
  },
]

const FORMATS = [
  {
    icon: "🏫",
    title: "Clases presenciales",
    desc: "Grupos reducidos de máximo 8 alumnos en Rambla Nova, Tarragona. Ambiente cercano y real.",
    tag: "Más recomendado",
  },
  {
    icon: "💻",
    title: "Clases online",
    desc: "Videoconferencia en tiempo real con las mismas dinámicas que las clases presenciales. Para alumnos fuera de Tarragona.",
    tag: null,
  },
  {
    icon: "🏢",
    title: "Formación empresas",
    desc: "Inglés corporativo a medida: negociaciones, emails profesionales, presentaciones. En tus instalaciones o remoto.",
    tag: null,
  },
]

export default function LevelsPage() {
  return (
    <div style={{ background: "var(--color-bg)" }}>
      <SiteHeader />

      {/* Hero */}
      <section
        className="py-20 md:py-28"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary) 0%, #1A3A8C 70%)",
        }}
      >
        <div className="container-wide">
          <AnimateIn>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{
                background: "rgba(212,160,23,0.2)",
                color: "var(--color-gold-light)",
                border: "1px solid rgba(212,160,23,0.3)",
              }}
            >
              📚 Niveles A1–C2 según el MCER
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold mb-5"
              style={{ fontFamily: "var(--font-display)", color: "white" }}
            >
              Encuentra tu nivel
            </h1>
            <p className="text-lg max-w-2xl mb-8" style={{ color: "rgba(255,255,255,0.8)" }}>
              Ofrecemos cursos estructurados para todos los niveles del Marco Común Europeo de
              Referencia. Desde cero hasta la certificación Cambridge más alta.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact?subject=test-nivel"
                className="btn btn-accent text-sm px-7 py-3.5 rounded-xl"
              >
                Test de nivel gratuito
              </Link>
              <Link
                href="/signup"
                className="btn btn-outline-white text-sm px-7 py-3.5 rounded-xl"
              >
                Reservar plaza
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Level nav pills */}
      <div
        className="sticky top-16 z-40 border-b overflow-x-auto"
        style={{ background: "white", borderColor: "var(--color-border)" }}
      >
        <div className="container-wide">
          <div className="flex gap-2 py-4 min-w-max">
            {LEVELS.map((l) => (
              <a
                key={l.code}
                href={`#${l.code.toLowerCase()}`}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: l.colorLight, color: l.color }}
              >
                <span>{l.code}</span>
                <span className="font-normal text-xs hidden sm:inline">{l.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Level sections */}
      <div className="py-12">
        {LEVELS.map((level, i) => (
          <section
            key={level.code}
            id={level.code.toLowerCase()}
            className="py-16 border-b"
            style={{
              background: i % 2 === 0 ? "var(--color-bg)" : "var(--color-bg-alt)",
              borderColor: "var(--color-border-subtle)",
            }}
          >
            <div className="container-wide">
              <AnimateIn>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  {/* Left: level info */}
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md"
                        style={{ background: level.color }}
                      >
                        {level.code}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2
                            className="text-2xl font-bold"
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            {level.name}
                          </h2>
                          {level.featured && (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{
                                background: "var(--color-gold-50)",
                                color: "var(--color-gold)",
                              }}
                            >
                              ⭐ Más solicitado
                            </span>
                          )}
                        </div>
                        <div
                          className="text-sm"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          Nivel MCER {level.code}
                        </div>
                      </div>
                    </div>

                    <p
                      className="text-base mb-6 leading-relaxed"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {level.description}
                    </p>

                    <div
                      className="text-sm font-semibold mb-3"
                      style={{ color: "var(--color-text)" }}
                    >
                      ¿Qué aprenderás?
                    </div>
                    <ul className="space-y-2 mb-8">
                      {level.skills.map((skill) => (
                        <li
                          key={skill}
                          className="flex items-start gap-2.5 text-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          <span
                            className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs mt-0.5"
                            style={{ background: level.color }}
                          >
                            ✓
                          </span>
                          {skill}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/signup"
                      className="btn btn-primary text-sm px-6 py-3 rounded-xl"
                    >
                      Apuntarme a {level.code}
                    </Link>
                  </div>

                  {/* Right: meta card */}
                  <div
                    className="rounded-2xl p-6 border"
                    style={{
                      background: "var(--color-bg)",
                      borderColor: "var(--color-border)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div className="space-y-5">
                      {level.cambridge && (
                        <div className="flex items-start gap-3">
                          <span className="text-xl">🎓</span>
                          <div>
                            <div
                              className="text-xs font-semibold uppercase tracking-wider mb-1"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              Examen Cambridge objetivo
                            </div>
                            <div
                              className="font-semibold text-sm"
                              style={{ color: "var(--color-primary)" }}
                            >
                              {level.cambridge}
                              {level.featured && " ⭐"}
                            </div>
                          </div>
                        </div>
                      )}

                      {level.prepFor && (
                        <div className="flex items-start gap-3">
                          <span className="text-xl">🎯</span>
                          <div>
                            <div
                              className="text-xs font-semibold uppercase tracking-wider mb-1"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              {level.cambridge ? "Prepara para el siguiente" : "Prepara para"}
                            </div>
                            <div
                              className="font-semibold text-sm"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {level.prepFor}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <span className="text-xl">⏱</span>
                        <div>
                          <div
                            className="text-xs font-semibold uppercase tracking-wider mb-1"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            Duración estimada
                          </div>
                          <div className="font-semibold text-sm">{level.duration}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="text-xl">📅</span>
                        <div>
                          <div
                            className="text-xs font-semibold uppercase tracking-wider mb-1"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            Sesiones
                          </div>
                          <div className="font-semibold text-sm">{level.sessions}</div>
                        </div>
                      </div>

                      <div
                        className="border-t pt-4"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        <div
                          className="text-xs font-semibold uppercase tracking-wider mb-2"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          ¿Para quién?
                        </div>
                        <p
                          className="text-sm leading-relaxed"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {level.whoFor}
                        </p>
                      </div>

                      <div
                        className="border-t pt-4"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        <Link
                          href="/contact?subject=test-nivel"
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border text-[color:var(--color-primary)] hover:bg-[#0d1b3e] hover:!text-white"
                          style={{
                            borderColor: "var(--color-primary)",
                          }}
                        >
                          ¿No sé si es mi nivel? → Test gratuito
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            </div>
          </section>
        ))}
      </div>

      {/* Course formats */}
      <section id="formats" className="py-20" style={{ background: "var(--color-surface)" }}>
        <div className="container-wide">
          <AnimateIn>
            <div className="text-center mb-12">
              <h2
                className="text-3xl font-bold mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Modalidades de clase
              </h2>
              <p
                className="text-lg max-w-xl mx-auto"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Elige la modalidad que mejor se adapta a tu vida y objetivos.
              </p>
            </div>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FORMATS.map((f, i) => (
              <AnimateIn key={f.title} delay={i * 0.1}>
                <div
                  className="p-7 rounded-2xl border h-full"
                  style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
                >
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-bold text-lg">{f.title}</h3>
                    {f.tag && (
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{
                          background: "var(--color-accent-50)",
                          color: "var(--color-accent)",
                        }}
                      >
                        {f.tag}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {f.desc}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20"
        style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, #1A3A8C 100%)",
        }}
      >
        <div className="container-wide text-center">
          <AnimateIn>
            <h2
              className="text-3xl md:text-4xl font-bold mb-5"
              style={{ fontFamily: "var(--font-display)", color: "white" }}
            >
              ¿Listo para empezar?
            </h2>
            <p
              className="text-base mb-8 max-w-xl mx-auto"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              Haz el test de nivel gratuito y reserva tu plaza en el grupo que mejor encaja
              contigo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact?subject=test-nivel"
                className="btn btn-accent text-sm px-8 py-4 rounded-xl"
              >
                Test de nivel gratuito
              </Link>
              <Link
                href="/signup"
                className="btn btn-outline-white text-sm px-8 py-4 rounded-xl"
              >
                Crear cuenta
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
