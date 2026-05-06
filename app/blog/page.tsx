import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/public/SiteHeader"
import { SiteFooter } from "@/components/public/SiteFooter"
import { AnimateIn } from "@/components/shared/AnimateIn"

export const metadata: Metadata = {
  title: "Blog de Inglés | Brit English School",
  description:
    "Consejos, guías y recursos para aprender inglés y preparar tus exámenes Cambridge. Por los profesores de Brit English School Tarragona.",
}

type Category = "Gramática" | "Cambridge" | "Vocabulario" | "Tips" | "Empresas"

interface BlogPost {
  slug: string
  title: string
  excerpt: string
  category: Category
  author: string
  date: string
  readTime: string
  featured?: boolean
}

const POSTS: BlogPost[] = [
  {
    slug: "como-aprobar-b2-first-primera",
    title: "Cómo aprobar el B2 First a la primera: guía completa 2026",
    excerpt:
      "Todo lo que necesitas saber para preparar el FCE de Cambridge: estructura del examen, errores más comunes y estrategias que realmente funcionan.",
    category: "Cambridge",
    author: "James Thornton",
    date: "28 abril 2026",
    readTime: "8 min",
    featured: true,
  },
  {
    slug: "errores-comunes-hispanohablantes",
    title: "5 errores que cometen los hispanohablantes en inglés (y cómo evitarlos)",
    excerpt:
      "False friends, tiempos verbales y preposiciones: los hispanohablantes cometemos los mismos errores. Aprende a detectarlos y corregirlos de una vez.",
    category: "Gramática",
    author: "Elena García",
    date: "21 abril 2026",
    readTime: "6 min",
    featured: true,
  },
  {
    slug: "present-perfect-vs-simple-past",
    title: "Present Perfect vs. Simple Past: la guía definitiva para hispanohablantes",
    excerpt:
      "La diferencia que más confunde a los estudiantes de inglés de nivel B1-B2. Con ejemplos prácticos y reglas claras.",
    category: "Gramática",
    author: "Sarah Mitchell",
    date: "14 abril 2026",
    readTime: "5 min",
  },
  {
    slug: "guia-c1-advanced",
    title: "Guía completa del C1 Advanced (CAE): lo que nadie te cuenta",
    excerpt:
      "El CAE es mucho más exigente que el FCE. Aquí tienes todo sobre el formato, los criterios de evaluación y cómo prepararte en 12 meses.",
    category: "Cambridge",
    author: "James Thornton",
    date: "7 abril 2026",
    readTime: "10 min",
  },
  {
    slug: "mejorar-pronunciacion-30-dias",
    title: "Cómo mejorar tu pronunciación en inglés en 30 días",
    excerpt:
      "Un plan práctico con ejercicios diarios para sonar más natural en inglés. Incluye recursos gratuitos y técnicas de los profesores nativos.",
    category: "Tips",
    author: "Tom Hargreaves",
    date: "31 marzo 2026",
    readTime: "7 min",
  },
  {
    slug: "ingles-empresas-por-que-invertir",
    title: "Inglés para empresas: por qué es la mejor inversión para tu equipo",
    excerpt:
      "El inglés ya no es un diferenciador, es un requisito. Cómo implementar un programa de formación que dé resultados medibles.",
    category: "Empresas",
    author: "Sarah Mitchell",
    date: "24 marzo 2026",
    readTime: "5 min",
  },
]

const CATEGORY_COLORS: Record<Category, { bg: string; text: string }> = {
  Gramática: { bg: "var(--color-primary-50)", text: "var(--color-primary)" },
  Cambridge: { bg: "var(--color-gold-50)", text: "var(--color-gold)" },
  Vocabulario: { bg: "var(--color-success-light)", text: "var(--color-success)" },
  Tips: { bg: "var(--color-accent-50)", text: "var(--color-accent)" },
  Empresas: { bg: "#F0F4FF", text: "#1A3A8C" },
}

const CATEGORIES: Category[] = ["Gramática", "Cambridge", "Vocabulario", "Tips", "Empresas"]

export default function BlogPage() {
  const featured = POSTS.filter((p) => p.featured)
  const rest = POSTS.filter((p) => !p.featured)

  return (
    <div style={{ background: "var(--color-bg)" }}>
      <SiteHeader />

      {/* Hero */}
      <section
        className="py-20 md:py-24"
        style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, #1A3A8C 70%)",
        }}
      >
        <div className="container-wide">
          <AnimateIn>
            <h1
              className="text-4xl md:text-5xl font-bold text-white mb-5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Blog de inglés
            </h1>
            <p className="text-lg max-w-xl" style={{ color: "rgba(255,255,255,0.8)" }}>
              Consejos, guías y recursos para aprender inglés y aprobar Cambridge. Publicado por
              nuestros profesores.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Category pills */}
      <div className="border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="container-wide overflow-x-auto">
          <div className="flex gap-2 py-4 min-w-max">
            <span
              className="px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer"
              style={{ background: "var(--color-primary)", color: "white" }}
            >
              Todos
            </span>
            {CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-opacity hover:opacity-80"
                style={{
                  background: CATEGORY_COLORS[cat].bg,
                  color: CATEGORY_COLORS[cat].text,
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="container-wide py-16">
        {/* Featured posts */}
        {featured.length > 0 && (
          <div className="mb-16">
            <AnimateIn>
              <h2
                className="text-xs font-semibold uppercase tracking-wider mb-6"
                style={{ color: "var(--color-text-muted)" }}
              >
                Artículos destacados
              </h2>
            </AnimateIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featured.map((post, i) => (
                <AnimateIn key={post.slug} delay={i * 0.1}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block p-7 rounded-2xl border h-full transition-all hover:shadow-md hover:-translate-y-0.5"
                    style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: CATEGORY_COLORS[post.category].bg,
                          color: CATEGORY_COLORS[post.category].text,
                        }}
                      >
                        {post.category}
                      </span>
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        ⭐ Destacado
                      </span>
                    </div>
                    <h3
                      className="font-bold text-lg mb-3 leading-snug group-hover:text-[#012169] transition-colors"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {post.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-5"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {post.excerpt}
                    </p>
                    <div
                      className="flex items-center gap-3 text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <span>{post.author}</span>
                      <span>·</span>
                      <span>{post.date}</span>
                      <span>·</span>
                      <span>⏱ {post.readTime}</span>
                    </div>
                  </Link>
                </AnimateIn>
              ))}
            </div>
          </div>
        )}

        {/* Rest of posts */}
        <div>
          <AnimateIn>
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-6"
              style={{ color: "var(--color-text-muted)" }}
            >
              Últimos artículos
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((post, i) => (
              <AnimateIn key={post.slug} delay={i * 0.1}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block p-6 rounded-2xl border h-full transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
                >
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-4"
                    style={{
                      background: CATEGORY_COLORS[post.category].bg,
                      color: CATEGORY_COLORS[post.category].text,
                    }}
                  >
                    {post.category}
                  </span>
                  <h3
                    className="font-bold text-base mb-2 leading-snug group-hover:text-[#012169] transition-colors"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {post.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed mb-4"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {post.excerpt}
                  </p>
                  <div
                    className="flex items-center gap-2 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>⏱ {post.readTime}</span>
                  </div>
                </Link>
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter CTA */}
      <section className="py-16" style={{ background: "var(--color-surface)" }}>
        <div className="container-wide">
          <AnimateIn>
            <div className="max-w-xl mx-auto text-center">
              <div className="text-3xl mb-4">📬</div>
              <h2
                className="text-2xl font-bold mb-3"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Recibe los mejores artículos
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
                Un email al mes con el contenido más útil para mejorar tu inglés. Sin spam.
              </p>
              <Link href="/signup" className="btn btn-primary text-sm px-8 py-3.5 rounded-xl">
                Crear cuenta gratuita
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
