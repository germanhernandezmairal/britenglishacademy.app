import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    // Mirrors the "@/*" path mapping in tsconfig.json. Vitest does not read
    // tsconfig paths by itself.
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    // Playwright owns e2e/*.spec.ts. Keep the two runners from collecting
    // each other's files.
    include: ["lib/**/*.test.ts", "proxy.test.ts"],
    environment: "node",
  },
})
