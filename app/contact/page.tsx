import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/public/SiteHeader"
import { SiteFooter } from "@/components/public/SiteFooter"
import { AnimateIn } from "@/components/shared/AnimateIn"
import { ContactForm } from "./_components/ContactForm"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.britenglishschool.com"

export const metadata: Metadata = {
  title: "Contacto | Brit English School Tarragona",
  description:
    "Contacta con Brit English School en Tarragona. Rambla Nova 62. Test de nivel gratuito. Clases presenciales y online de inglés A1–C2.",
  alternates: { canonical: `${BASE}/contact` },
  openGraph: {
    title: "Contacto — Brit English School Tarragona",
    description:
      "Rambla Nova 62, Tarragona. Llámanos, escríbenos por WhatsApp o solicita tu test de nivel gratuito.",
    url: `${BASE}/contact`,
  },
}

const CONTACT_INFO = [
  {
    icon: "📍",
    label: "Dirección",
    value: "Rambla Nova 62, 4ª planta\n43003 Tarragona",
    href: null,
  },
  {
    icon: "📞",
    label: "Teléfono",
    value: "+34 877 072 975",
    href: "tel:+34877072975",
  },
  {
    icon: "✉️",
    label: "Email",
    value: "info@britenglishschool.com",
    href: "mailto:info@britenglishschool.com",
  },
  {
    icon: "💬",
    label: "WhatsApp",
    value: "Escribir por WhatsApp",
    href: "https://wa.me/34877072975",
  },
]

const HOURS = [
  { day: "Lunes – Viernes", time: "9:00 – 21:00", closed: false },
  { day: "Sábado", time: "9:00 – 14:00", closed: false },
  { day: "Domingo", time: "Cerrado", closed: true },
]

const FAQ = [
  {
    q: "¿Cómo sé cuál es mi nivel de inglés?",
    a: "Hacemos un test de nivel gratuito (30 minutos) con uno de nuestros profesores. Puedes solicitarlo a través de este formulario o por WhatsApp.",
  },
  {
    q: "¿Cuándo empieza el próximo grupo?",
    a: "Abrimos nuevos grupos cada mes. Contacta con nosotros para saber qué grupos tienen plazas disponibles para tu nivel y horario.",
  },
  {
    q: "¿Ofrecéis clases particulares además de grupos?",
    a: "Sí. Disponemos de clases particulares (1:1) para alumnos que necesitan una preparación más intensiva o tienen horarios especiales.",
  },
  {
    q: "¿Se puede combinar presencial y online?",
    a: "Sí. Muchos alumnos combinan sesiones presenciales y online según sus viajes o agenda. Consúltanos tu situación concreta.",
  },
]

export default function ContactPage() {
  return (
    <div style={{ background: "var(--color-bg)" }}>
      <SiteHeader />

      {/* Hero */}
      <section
        className="py-16 md:py-20"
        style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, #1A3A8C 70%)",
        }}
      >
        <div className="container-wide">
          <AnimateIn>
            <h1
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)", color: "white" }}
            >
              Contacto
            </h1>
            <p className="text-lg max-w-xl" style={{ color: "rgba(255,255,255,0.8)" }}>
              ¿Tienes dudas sobre cursos, nivel o precios? Escríbenos y te respondemos en menos
              de 24 horas.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Main grid */}
      <section className="py-16">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Sidebar: Contact info */}
            <div className="lg:col-span-2 space-y-4">
              <AnimateIn direction="left">
                <h2
                  className="text-xl font-bold mb-6"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Cómo encontrarnos
                </h2>

                {CONTACT_INFO.map((info) => (
                  <div
                    key={info.label}
                    className="flex items-start gap-4 p-4 rounded-xl border"
                    style={{ background: "var(--color-bg-alt)", borderColor: "var(--color-border)" }}
                  >
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <div
                        className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {info.label}
                      </div>
                      {info.href ? (
                        <a
                          href={info.href}
                          target={info.href.startsWith("http") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="text-sm font-medium transition-colors hover:underline whitespace-pre-line"
                          style={{ color: "var(--color-primary)" }}
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium whitespace-pre-line">{info.value}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Hours */}
                <div
                  className="p-5 rounded-xl border mt-2"
                  style={{ background: "var(--color-bg-alt)", borderColor: "var(--color-border)" }}
                >
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <span>🕐</span> Horario de atención
                  </h3>
                  <div className="space-y-2">
                    {HOURS.map((h) => (
                      <div key={h.day} className="flex justify-between text-sm">
                        <span style={{ color: "var(--color-text-secondary)" }}>{h.day}</span>
                        <span
                          className="font-medium"
                          style={{
                            color: h.closed
                              ? "var(--color-text-muted)"
                              : "var(--color-text)",
                          }}
                        >
                          {h.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WhatsApp CTA */}
                <a
                  href="https://wa.me/34877072975"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 mt-2"
                  style={{ background: "#25D366" }}
                >
                  <span>💬</span> Escribir por WhatsApp ahora
                </a>
              </AnimateIn>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-3">
              <AnimateIn direction="right">
                <div
                  className="p-8 rounded-2xl border"
                  style={{
                    background: "var(--color-bg)",
                    borderColor: "var(--color-border)",
                    boxShadow: "var(--shadow-md)",
                  }}
                >
                  <h2
                    className="text-xl font-bold mb-2"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Envíanos un mensaje
                  </h2>
                  <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
                    Rellena el formulario y te respondemos en &lt;24h.
                  </p>
                  <ContactForm />
                </div>
              </AnimateIn>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16" style={{ background: "var(--color-bg-alt)" }}>
        <div className="container-wide max-w-3xl">
          <AnimateIn>
            <h2
              className="text-2xl font-bold mb-8 text-center"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Preguntas frecuentes
            </h2>
            <div className="space-y-4">
              {FAQ.map((item) => (
                <div
                  key={item.q}
                  className="p-5 rounded-xl border"
                  style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
                >
                  <h3 className="font-semibold text-sm mb-2">{item.q}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
