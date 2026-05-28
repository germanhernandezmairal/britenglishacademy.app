import type { MetadataRoute } from "next"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.BritEnglishAcademy.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/levels", "/about", "/blog", "/contact"],
        disallow: [
          "/dashboard",
          "/lessons",
          "/homework",
          "/exams",
          "/community",
          "/messages",
          "/admin",
          "/onboarding",
          "/api/",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
