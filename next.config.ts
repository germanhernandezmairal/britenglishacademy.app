import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "www.BritEnglishAcademy.com",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  async headers() {
    // Baseline security headers applied to every route. A full CSP is deferred
    // until the inline-script/style surface is audited (Tailwind + Next).
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Quiet locally, verbose in CI.
  silent: !process.env.CI,
  telemetry: false,

  // Route Sentry events through our own domain so ad blockers do not silently
  // discard client-side errors. Must stay in sync with the exclusion in
  // proxy.ts's matcher.
  tunnelRoute: "/monitoring",

  sourcemaps: {
    // Deterministic rather than relying on undocumented behaviour: CI has no
    // auth token and `npm run build` must not fail. Vercel gets the token from
    // the Sentry Marketplace integration.
    disable: !process.env.SENTRY_AUTH_TOKEN,
    // Do not leave source maps sitting in .next/static to be served publicly.
    deleteSourcemapsAfterUpload: true,
  },
});
