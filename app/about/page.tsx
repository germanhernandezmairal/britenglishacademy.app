import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/public/SiteHeader"
import { SiteFooter } from "@/components/public/SiteFooter"
import { AnimateIn } from "@/components/shared/AnimateIn"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.BritEnglishAcademy.com"

export const metadata: Metadata = {
  title: "Sobre Nosotros | Brit English Academy Tarragona",
  description:
    "Conoce al equipo de Brit English Academy. Centro preparador Cambridge oficial en Tarragona desde 2014. Profesores nativos y CELTA certificados.",
  alternates: { canonical: `${BASE}/about` },
  openGraph: {
    title: "Sobre Nosotros — Brit English Academy",
    description:
      "Más de 10 años formando a alumnos en Tarragona. Profesores nativos CELTA, 98% tasa de éxito Cambridge, centro preparador oficial.",
    url: `${BASE}/about`,
  },
}

const STATS = [
  { value: "10+", label: "Años de experiencia" },
  { value: "500+", label: "Alumnos formados" },
  { value: "98%", label: "Tasa de éxito Cambridge" },
  { value: "4.9/5", label: "Valoración Google" },
]

const TEAM = [
  {
    name: "Sarah Mitchell",
    role: "Directora Académica · Native Speaker",
    origin: "Londres, UK",
    bio: "Licenciada en Lingüística Aplicada por la Universidad de Cambridge. DELTA certificada con 12 años de experiencia enseñando inglés en España. Especialista en preparación C1 y C2.",
    certs: ["DELTA", "Cambridge Assessor", "IELTS Examiner"],
    initials: "SM",
  },
  {
    name: "James Thornton",
    role: "Profesor Senior · Cambridge Examiner",
    origin: "Manchester, UK",
    bio: "Examinador oficial Cambridge para FCE y CAE. Máster en TESOL por la Universidad de Edimburgo. 9 años formando estudiantes para certificaciones Cambridge en España.",
    certs: ["CELTA", "Cambridge Oral Examiner", "TESOL MA"],
    initials: "JT",
  },
  {
    name: "Elena García",
    role: "Especialista B1–B2 · Bilingüe",
    origin: "Tarragona",
    bio: "Bilingüe español-inglés, formada en la Universidad de Sussex (UK). Experta en errores comunes de hispanohablantes. Coordinadora del programa de corrección con IA.",
    certs: ["CAE C1", "CELTA", "IA en Educación"],
    initials: "EG",
  },
  {
    name: "Tom Hargreaves",
    role: "Especialista Online · IELTS",
    origin: "Bristol, UK",
    bio: "Responsable del campus digital de Brit English. Desarrolla materiales multimedia y lidera los cursos online. Especialista en preparación IELTS y Business English.",
    certs: ["CELTA", "IELTS Trainer", "Business English"],
    initials: "TH",
  },
]

const VALUES = [
  {
    icon: "🎯",
    title: "Resultados reales",
    desc: "No prometemos lo que no podemos cumplir. El 98% de nuestros alumnos aprueba el examen Cambridge en el primer intento.",
  },
  {
    icon: "👥",
    title: "Grupos reducidos",
    desc: "Máximo 8 alumnos por clase. Creemos que la atención personalizada es irrenunciable.",
  },
  {
    icon: "🤖",
    title: "Tecnología al servicio",
    desc: "Usamos IA (Claude) para acelerar el aprendizaje, no para sustituir a los profesores.",
  },
  {
    icon: "❤️",
    title: "Comunidad cercana",
    desc: "Nuestros alumnos forman parte de nuestra comunidad. El aprendizaje es también un viaje social.",
  },
]

export default function AboutPage() {
  return (
    <div style={{ background: "var(--color-bg)" }}>
      <SiteHeader />

      {/* Hero */}
      <section
        className="py-20 md:py-28"
        style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, #1A3A8C 70%)",
        }}
      >
        <div className="container-wide">
          <AnimateIn>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{
                background: "rgba(212,160,23,0.2)",
                color: "#F0C842",
                border: "1px solid rgba(212,160,23,0.3)",
              }}
            >
              🏴󠁧󠁢󠁥󠁮󠁧󠁿 Centro preparador Cambridge oficial desde 2014
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold mb-5"
              style={{ fontFamily: "var(--font-display)", color: "white" }}
            >
              Más de una década
              <br />
              <span style={{ color: "var(--color-gold-light)" }}>formando futuros bilingües</span>
            </h1>
            <p className="text-lg max-w-2xl" style={{ color: "rgba(255,255,255,0.8)" }}>
              Somos una academia familiar con grandes resultados. Profesores nativos, grupos
              reducidos y una metodología que combina lo mejor de la enseñanza tradicional con
              tecnología de última generación.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: "var(--color-primary)" }}>
        <div className="container-wide py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <AnimateIn key={stat.label} delay={i * 0.1} direction="none">
                <div className="text-center">
                  <div
                    className="text-3xl font-bold mb-1"
                    style={{ color: "var(--color-gold-light)", fontFamily: "var(--font-display)" }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {stat.label}
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20" style={{ background: "var(--color-bg-alt)" }}>
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateIn direction="left">
              <div>
                <h2
                  className="text-3xl font-bold mb-5"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Nuestra misión
                </h2>
                <p
                  className="text-base leading-relaxed mb-5"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Brit English Academy nació con una convicción: el inglés es la llave que abre
                  puertas profesionales, académicas y personales. Nuestros alumnos no solo aprenden
                  un idioma — ganan confianza, oportunidades y un certificado reconocido en todo el
                  mundo.
                </p>
                <p
                  className="text-base leading-relaxed mb-5"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  En 2014, abrimos en Tarragona con 20 alumnos y dos profesores nativos. Hoy, más
                  de 500 alumnos han pasado por nuestras aulas y nuestra plataforma digital. La
                  metodología ha evolucionado — la vocación sigue igual.
                </p>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Somos Cambridge Prep Centre oficial, lo que significa que preparamos y examinamos
                  directamente para B1 Preliminary, B2 First, C1 Advanced y C2 Proficiency.
                </p>
              </div>
            </AnimateIn>

            <AnimateIn direction="right">
              <div className="grid grid-cols-2 gap-4">
                {VALUES.map((v) => (
                  <div
                    key={v.title}
                    className="p-5 rounded-2xl border"
                    style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
                  >
                    <div className="text-3xl mb-3">{v.icon}</div>
                    <h3 className="font-bold text-sm mb-1">{v.title}</h3>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {v.desc}
                    </p>
                  </div>
                ))}
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="container-wide">
          <AnimateIn>
            <div className="text-center mb-12">
              <h2
                className="text-3xl font-bold mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                El equipo
              </h2>
              <p
                className="text-lg max-w-xl mx-auto"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Profesores nativos y bilingües certificados, apasionados por la enseñanza.
              </p>
            </div>
          </AnimateIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TEAM.map((member, i) => (
              <AnimateIn key={member.name} delay={i * 0.1}>
                <div
                  className="p-6 rounded-2xl border flex gap-5"
                  style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-bold text-xl"
                    style={{ background: "var(--color-primary)" }}
                  >
                    {member.initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base mb-0.5">{member.name}</h3>
                    <div
                      className="text-xs font-medium mb-0.5"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {member.role}
                    </div>
                    <div
                      className="text-xs mb-3"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      📍 {member.origin}
                    </div>
                    <p
                      className="text-sm leading-relaxed mb-3"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {member.bio}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {member.certs.map((cert) => (
                        <span
                          key={cert}
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            background: "var(--color-primary-50)",
                            color: "var(--color-primary)",
                          }}
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Cambridge Partnership */}
      <section className="py-20" style={{ background: "var(--color-bg-alt)" }}>
        <div className="container-wide">
          <AnimateIn>
            <div className="max-w-3xl mx-auto text-center">
              <div className="text-5xl mb-6">🎓</div>
              <h2
                className="text-3xl font-bold mb-5"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Cambridge Prep Centre oficial
              </h2>
              <p
                className="text-base leading-relaxed mb-6"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Somos un centro preparador autorizado por Cambridge Assessment English, la entidad
                más prestigiosa en certificaciones de inglés del mundo. Preparamos, examinamos y
                certificamos directamente para los exámenes B1, B2, C1 y C2.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {["B1 Preliminary", "B2 First (FCE)", "C1 Advanced (CAE)", "C2 Proficiency"].map(
                  (exam) => (
                    <div
                      key={exam}
                      className="p-4 rounded-xl border text-center"
                      style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
                    >
                      <div
                        className="text-xs font-bold"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {exam}
                      </div>
                    </div>
                  )
                )}
              </div>
              <Link
                href="/contact"
                className="btn btn-primary text-sm px-8 py-3.5 rounded-xl"
              >
                Consultar próximas convocatorias
              </Link>
            </div>
          </AnimateIn>
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
              ¿Quieres conocernos?
            </h2>
            <p
              className="text-base mb-8 max-w-xl mx-auto"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              Visítanos en Rambla Nova 62, Tarragona, o reserva una primera sesión de orientación
              gratuita.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn btn-accent text-sm px-8 py-4 rounded-xl">
                Contactar ahora
              </Link>
              <Link
                href="/levels"
                className="btn btn-outline-white text-sm px-8 py-4 rounded-xl"
              >
                Ver nuestros cursos
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
