import Image from "next/image"
import Link from "next/link"

export function SiteFooter() {
  return (
    <footer
      className="py-12 border-t"
      style={{ background: "var(--color-text)", borderColor: "rgba(255,255,255,0.05)" }}
    >
      <div className="container-wide">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="mb-4">
              <Image
                src="/imgs/english-school-logo.webp"
                alt="Brit English School"
                width={56}
                height={56}
              />
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
  )
}
