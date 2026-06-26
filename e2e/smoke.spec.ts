import { test, expect } from "@playwright/test"

test("homepage renders", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/Brit English Academy/i)
})
