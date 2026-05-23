import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { Users, GraduationCap, Bot, Heart, MessageCircle, Star } from "lucide-react"
import { SiteHeader } from "@/components/public/SiteHeader"
import { SiteFooter } from "@/components/public/SiteFooter"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.britenglishschool.com"

export const metadata: Metadata = {
  title: "Brit English School | Academia de Inglés Cambridge en Tarragona",
  description:
    "Centro preparador oficial Cambridge en Tarragona. Clases de inglés para niños, teens, adultos y empresas. B1, B2, C1, C2. 4.9/5 en Google.",
  alternates: { canonical: BASE },
  openGraph: {
    title: "Brit English School | Academia de Inglés Cambridge en Tarragona",
    description:
      "Centro preparador oficial Cambridge en Tarragona. Grupos reducidos, IA integrada y preparación oficial para B1, B2, C1 y C2.",
    url: BASE,
  },
}

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": ["EducationalOrganization", "LocalBusiness"],
  name: "Brit English School",
  description:
    "Centro preparador Cambridge oficial en Tarragona. Clases de inglés para todos los niveles MCER (A1–C2).",
  url: BASE,
  telephone: "+34877072975",
  email: "info@britenglishschool.com",
  priceRange: "€€",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rambla Nova 62, 4ª planta",
    addressLocality: "Tarragona",
    postalCode: "43003",
    addressCountry: "ES",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 41.119,
    longitude: 1.245,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "21:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday"],
      opens: "09:00",
      closes: "14:00",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    bestRating: "5",
    reviewCount: "80",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Cursos de Inglés",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Course", name: "Cambridge B1 Preliminary" } },
      { "@type": "Offer", itemOffered: { "@type": "Course", name: "Cambridge B2 First" } },
      { "@type": "Offer", itemOffered: { "@type": "Course", name: "Cambridge C1 Advanced" } },
      { "@type": "Offer", itemOffered: { "@type": "Course", name: "Cambridge C2 Proficiency" } },
    ],
  },
}

const AUTHORITY_STATS = [
  { value: "4.9/5", label: "Google Reviews" },
  { value: "+80", label: "Opiniones verificadas" },
  { value: "Máx. 8", label: "Alumnos por clase" },
  { value: "B1–C2", label: "Exámenes Cambridge" },
]

const FEATURES = [
  {
    Icon: Users,
    title: "Grupos reducidos",
    desc: "Clases con pocos alumnos para garantizar participación, atención real y progreso constante.",
  },
  {
    Icon: GraduationCap,
    title: "Centro Cambridge oficial",
    desc: "Centro homologado para la preparación de exámenes oficiales Cambridge, con simulacros reales y seguimiento individual.",
  },
  {
    Icon: Bot,
    title: "IA integrada",
    desc: "Feedback instantáneo con Claude AI en deberes y exámenes. Progreso acelerado y visible.",
  },
  {
    Icon: Heart,
    title: "Un entorno donde se sienten cómodos",
    desc: "Clases dinámicas, trato cercano y un ambiente donde aprender no genera presión, sino motivación.",
  },
  {
    Icon: MessageCircle,
    title: "Seguimiento individual",
    desc: "Evaluación continua y comunicación directa y cercana con las familias durante todo el curso.",
  },
  {
    Icon: Star,
    title: "4.9/5 en Google",
    desc: "Más de 80 reseñas verificadas. Resultados que hablan por sí solos.",
  },
]

const COURSES = [
  {
    image: "/imgs/fotoclasecyndi.heic-scaled.webp",
    title: "Inglés para Niños",
    desc: "Clases dinámicas y cercanas adaptadas a los más pequeños. Aprenden con motivación, sin presión.",
    href: "/levels",
    tag: "3–12 años",
    imageClassName: "scale-[1.2] group-hover:scale-[1.25]",
  },
  {
    image: "/imgs/INSTAGRAM-CASI-DEFINITIVO-2-copia.webp",
    title: "Adultos y Universitarios",
    desc: "Avanza en tu carrera con un inglés certificado. Grupos reducidos, trato cercano y horarios flexibles.",
    href: "/levels",
    tag: "Todos los niveles",
  },
  {
    image: "/imgs/cursos-verano-1.webp",
    title: "Preparación Cambridge",
    desc: "Supera el B1, B2, C1 o C2 con nuestro método probado y una alta tasa de éxito.",
    href: "/levels",
    tag: "B1 · B2 · C1 · C2",
  },
  {
    image: "/imgs/cursos-individuales-clases-de-dos-familiares-ingles-tarragona-800x534.webp",
    title: "Clases Particulares",
    desc: "Atención real y 100% personalizada. Avanza a tu ritmo con seguimiento individual constante.",
    href: "/contact",
    tag: "1-a-1 · Semi-privado",
  },
]

const LEVELS = [
  { code: "A1", name: "Principiante", color: "var(--color-gold)" },
  { code: "A2", name: "Elemental", color: "var(--color-gold)" },
  { code: "B1", name: "Intermedio", color: "var(--color-primary-light)" },
  { code: "B2", name: "Intermedio Alto", color: "var(--color-primary-light)" },
  { code: "C1", name: "Avanzado", color: "var(--color-primary)" },
  { code: "C2", name: "Maestría", color: "var(--color-primary)" },
]

const TESTIMONIALS = [
  {
    name: "Naïm El Ouariachi",
    level: "Examen Cambridge",
    text: "Me apunté porque siempre he tenido problemas con el inglés. Tenía solo un mes para preparar el examen y gracias a la profesora Ana Mariuta conseguí aprobar y obtener el título. Muy recomendable.",
    stars: 5,
  },
  {
    name: "Jesús Molinero",
    level: "Padre de alumnos",
    text: "Mis dos hijos de 20 y 15 años han podido examinarse de sus respectivos títulos, no sólo aprobándolo, sino que además con muy buena nota.",
    stars: 5,
  },
  {
    name: "Anabel Martínez",
    level: "Alumna",
    text: "No podemos estar más contentos y satisfechos con Brit English: Profesionalidad, didáctica y vocación son un cocktail perfecto.",
    stars: 5,
  },
]

export default function HomePage() {
  return (
    <div style={{ background: "var(--color-bg)", color: "var(--color-text)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <SiteHeader />

      {/* ── 1. HERO — Promise ─────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-24 md:py-36"
        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #1A3A8C 60%, #012169 100%)" }}
      >
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, white 0px, white 2px, transparent 2px, transparent 40px), repeating-linear-gradient(90deg, white 0px, white 2px, transparent 2px, transparent 40px)",
          }}
        />

        <div className="container-wide relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{ background: "rgba(212,160,23,0.2)", color: "#F0C842", border: "1px solid rgba(212,160,23,0.3)" }}>
                🎓 Centro Preparador Cambridge Oficial · Tarragona
              </div>

              <h1
                className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
                style={{ fontFamily: "var(--font-display)", color: "white" }}
              >
                Domina el inglés.
                <br />
                <span style={{ color: "var(--color-gold-light)" }}>Certifícate Cambridge.</span>
              </h1>

              <p className="text-lg md:text-xl mb-10 max-w-2xl leading-relaxed"
                style={{ color: "rgba(255,255,255,0.82)" }}>
                Academia de inglés en Tarragona para niños, adolescentes y adultos.
                Grupos reducidos, seguimiento individual real y comunicación cercana
                y constante con las familias. Centro homologado Cambridge.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact"
                  className="btn btn-accent text-base px-8 py-4 rounded-xl">
                  Haz una prueba de nivel
                </Link>
                <Link href="/contact"
                  className="btn btn-outline-white text-base px-8 py-4 rounded-xl">
                  Habla con nosotros
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-10">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: "var(--color-gold-light)" }} className=" text-lg">★★★★★</span>
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

            <div className="hidden lg:flex justify-center items-center">
              <div className="relative">
                <Image
                  src="/imgs/Ninos-balcon-.webp"
                  alt="Alumnos disfrutando en Brit English School Tarragona"
                  width={580}
                  height={435}
                  className="rounded-2xl shadow-2xl object-cover"
                  priority
                />
                <div
                  className="absolute -bottom-4 -left-4 w-24 h-24 rounded-2xl -z-10"
                  style={{ background: "rgba(212,160,23,0.3)" }}
                />
                <div
                  className="absolute -top-4 -right-4 w-16 h-16 rounded-xl -z-10"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. AUTHORITY — Cambridge trust strip ──────────────── */}
      <section style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="container-wide">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-8">
            {/* Cambridge badge + copy */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 shrink-0 max-w-xl">
              <Image
                src="/imgs/Prep-centre-logo_CMYK.jpg"
                alt="We prepare for Cambridge English Qualifications"
                width={160}
                height={60}
                className="object-contain shrink-0"
              />
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: "var(--color-text)" }}>
                  Centro Preparador homologado de Exámenes Cambridge en Tarragona
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  Preparamos a niños, adolescentes y adultos para los exámenes oficiales de Cambridge con grupos reducidos, seguimiento individual y comunicación constante con las familias.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px self-stretch" style={{ background: "var(--color-border)" }} />

            {/* Stats row */}
            <div className="flex flex-wrap justify-center md:justify-end gap-8">
              {AUTHORITY_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div
                    className="text-xl font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FEATURES — Problem → Solution ─────────────────── */}
      <section className="py-20" style={{ background: "var(--color-bg-alt)" }}>
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)" }}>
              Por qué cada año más familias confían en nosotros
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>
              No somos una academia más. Somos el centro cercano que realmente te acompaña
              y se preocupa por tu progreso.
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
                <feat.Icon size={28} className="mb-4" style={{ color: "var(--color-primary)" }} />
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

      {/* ── 4. COURSES — Choice ───────────────────────────────── */}
      <section className="py-20">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)" }}>
              Nuestros Cursos
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>
              Un programa para cada etapa y objetivo. Encuentra el curso que encaja contigo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {COURSES.map((course) => (
              <Link
                key={course.title}
                href={course.href}
                className="group rounded-2xl overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{
                  background: "var(--color-bg)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={course.image}
                    alt={course.title}
                    fill
                    className={`object-cover transition-transform duration-300 ${course.imageClassName ?? "group-hover:scale-105"}`}
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(1,33,105,0.5) 0%, transparent 60%)" }} />
                  <span
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ background: "rgba(212,160,23,0.85)" }}
                  >
                    {course.tag}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-base mb-2 group-hover:text-[var(--color-primary)] transition-colors"
                    style={{ color: "var(--color-text)" }}>
                    {course.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {course.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. AI PLATFORM — Differentiation ─────────────────── */}
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

      {/* ── 6. CEFR LEVELS — Decision tool ───────────────────── */}
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

      {/* ── 7. TESTIMONIALS — Proof ───────────────────────────── */}
      <section className="py-20">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)" }}>
              Lo que dicen nuestros alumnos
            </h2>
            <div className="flex items-center justify-center gap-2">
              <span style={{ color: "var(--color-gold-light)" }} className=" text-xl">★★★★★</span>
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
                    <span key={i} style={{ color: "var(--color-gold-light)" }} className="">★</span>
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

      {/* ── 8. CTA — Capture ──────────────────────────────────── */}
      <section
        className="py-20"
        style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, #1A3A8C 100%)",
        }}
      >
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2
                className="text-3xl md:text-5xl font-bold mb-5"
                style={{ fontFamily: "var(--font-display)", color: "white" }}
              >
                ¿Listo para empezar?
              </h2>
              <p className="text-lg mb-10"
                style={{ color: "rgba(255,255,255,0.8)" }}>
                Únete a la comunidad de Brit English School. Primera semana gratis.
                Sin compromiso.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/signup" className="btn btn-accent text-base px-10 py-4 rounded-xl">
                  Crear cuenta gratis
                </Link>
                <Link href="/contact"
                  className="btn btn-outline-white text-base px-10 py-4 rounded-xl">
                  Contactar
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <Image
                  src="/imgs/Profesora-hablando-estudiante-800x1200.png"
                  alt="Profesora con alumno en Brit English School"
                  width={340}
                  height={510}
                  className="rounded-2xl shadow-2xl object-cover"
                  style={{ opacity: 0.92 }}
                />
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(1,33,105,0.3) 0%, transparent 60%)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
