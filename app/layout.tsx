import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { cn } from "@/lib/utils"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: {
    default: "Brit English Academy | Academia de Inglés Cambridge en Tarragona",
    template: "%s | Brit English Academy",
  },
  description:
    "Centro preparador Cambridge en Tarragona. Clases de inglés para niños, adultos y empresas. Preparación B1, B2, C1, C2. 4.9/5 en Google.",
  keywords: [
    "academia inglés Tarragona",
    "Cambridge Tarragona",
    "clases inglés Tarragona",
    "preparación Cambridge B2 C1",
    "Brit English Academy",
    "cursos inglés online",
  ],
  authors: [{ name: "Brit English Academy" }],
  creator: "Brit English Academy",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.BritEnglishAcademy.com"
  ),
  openGraph: {
    type: "website",
    locale: "es_ES",
    alternateLocale: "en_GB",
    siteName: "Brit English Academy",
  },
  twitter: { card: "summary_large_image", site: "@BritEnglishAcademy" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#012169",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(inter.variable, playfair.variable)}
    >
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  )
}
