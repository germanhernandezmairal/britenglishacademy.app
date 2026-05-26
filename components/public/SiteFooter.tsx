"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

const colVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

export function SiteFooter() {
  return (
    <footer
      className="py-12 border-t"
      style={{ background: "var(--color-primary-dark)", borderColor: "rgba(255,255,255,0.05)" }}
    >
      <div className="container-wide">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10"
          variants={colVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.div variants={itemVariants}>
            <div className="mb-4">
              <Image
                src="/imgs/english-school-logo.webp"
                alt="Brit English School"
                width={56}
                height={56}
              />
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.82)" }}>
              Centro preparador Cambridge oficial en Tarragona.
              Rambla Nova 62, 4ª planta.
            </p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: "white" }}>Cursos</h4>
            <ul className="space-y-2 text-xs" style={{ color: "rgba(255,255,255,0.82)" }}>
              <li><Link href="/levels" className="hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.82)" }}>Niveles A1–C2</Link></li>
              <li><Link href="/levels#cambridge" className="hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.82)" }}>Preparación Cambridge</Link></li>
              <li><Link href="/levels#online" className="hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.82)" }}>Cursos online</Link></li>
              <li><Link href="/levels#corporate" className="hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.82)" }}>Formación empresas</Link></li>
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: "white" }}>Academia</h4>
            <ul className="space-y-2 text-xs" style={{ color: "rgba(255,255,255,0.82)" }}>
              <li><Link href="/about" className="hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.82)" }}>Sobre nosotros</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.82)" }}>Blog</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.82)" }}>Contacto</Link></li>
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: "white" }}>Contacto</h4>
            <ul className="space-y-2 text-xs" style={{ color: "rgba(255,255,255,0.82)" }}>
              <li>📍 Rambla Nova 62, Tarragona</li>
              <li>📞 +34 877 072 975</li>
              <li>✉️ info@britenglishschool.com</li>
              <li>
                <a
                  href="https://wa.me/34877072975"
                  className="hover:text-white transition-colors"
                  style={{ color: "rgba(255,255,255,0.82)" }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  💬 WhatsApp
                </a>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        <motion.div
          className="pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
          style={{
            borderColor: "rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.5)",
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <span>© 2026 Brit English School. Todos los derechos reservados.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
