import { test, expect } from "@playwright/test"
import { STUDENT_EMAIL, STUDENT_PASSWORD, EXAM_TITLE, ANSWERS } from "./seed"

test("student logs in, takes the interactive exam, and scores 3/3", async ({ page }) => {
  // 1. Log in.
  await page.goto("/login")
  await page.fill("#email", STUDENT_EMAIL)
  await page.fill("#password", STUDENT_PASSWORD)
  await page.getByRole("button", { name: "Entrar" }).click()
  await page.waitForURL("**/dashboard")

  // 2. Open the seeded exam from the list.
  await page.goto("/exams")
  await page.getByText(EXAM_TITLE).click()
  await expect(page.getByRole("heading", { name: EXAM_TITLE })).toBeVisible()

  // 3. Start the attempt.
  await page.getByRole("button", { name: /Empezar examen/ }).click()

  // 4. Answer all three questions with the known-correct values.
  //    MCQ options render as <label> wrapping an sr-only radio + a visible <span>.
  await page.getByText(ANSWERS.q1Correct, { exact: true }).click()
  await page.getByPlaceholder("Escribe tu respuesta…").fill(ANSWERS.q2Correct)
  await page.getByText(ANSWERS.q3Correct, { exact: true }).click()

  // 5. Submit.
  await page.getByRole("button", { name: /Enviar examen/ }).click()

  // 6. Assert the deterministic full-score result.
  await expect(page.getByText("100% — Banda A: Sobresaliente")).toBeVisible()
  await expect(page.getByText("Desglose por pregunta")).toBeVisible()
})
