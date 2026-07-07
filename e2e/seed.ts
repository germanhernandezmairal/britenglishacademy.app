// Idempotent seeding for the e2e money-path test. Talks to Supabase REST/admin
// API directly with fetch (no supabase-js → no WS polyfill needed on Node 20).

export const STUDENT_EMAIL = "e2e.student@example.test"
export const STUDENT_PASSWORD = "E2ePass123!"
export const EXAM_TITLE = "[E2E] B2 Grammar Money Path"

// Fixed UUIDs keep the seed idempotent across runs.
const EXAM_ID = "e2e00000-0000-4000-8000-000000000001"
const Q1_ID = "e2e00000-0000-4000-8000-0000000000a1"
const Q2_ID = "e2e00000-0000-4000-8000-0000000000a2"
const Q3_ID = "e2e00000-0000-4000-8000-0000000000a3"

export const ANSWERS = { q1Correct: "went", q2Correct: "since", q3Correct: "quickly" }

const QUESTIONS = [
  {
    id: Q1_ID,
    type: "mcq",
    question: "Choose the correct verb: \"She ___ to London yesterday.\"",
    options: ["went", "goes", "gone", "going"],
    correct_answer: "went",
    max_score: 1,
  },
  {
    id: Q2_ID,
    type: "gap_fill",
    question: "Complete with one word: \"I have lived here ___ 2010.\"",
    correct_answer: "since",
    max_score: 1,
  },
  {
    id: Q3_ID,
    type: "mcq",
    question: "Pick the synonym of \"rapidly\".",
    options: ["slowly", "quickly", "rarely", "seldom"],
    correct_answer: "quickly",
    max_score: 1,
  },
]

function env(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`[seed] missing env ${name}`)
  return v
}

export async function seedDatabase(): Promise<void> {
  const url = env("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "")
  const key = env("SUPABASE_SERVICE_ROLE_KEY")
  const h = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  }

  // 1. Ensure the confirmed student auth user exists.
  let userId: string | undefined
  const createRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      email: STUDENT_EMAIL,
      password: STUDENT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "E2E Student" },
    }),
  })
  const createJson = await createRes.json()
  if (createRes.ok && createJson.id) {
    userId = createJson.id
  } else {
    // Already exists → look up + reset password.
    const listRes = await fetch(`${url}/auth/v1/admin/users?per_page=200`, { headers: h })
    if (!listRes.ok) throw new Error(`[seed] could not list auth users: ${await listRes.text()}`)
    const listJson = await listRes.json()
    userId = (listJson.users || []).find((u: { email: string }) => u.email === STUDENT_EMAIL)?.id
    if (!userId) throw new Error(`[seed] could not create or find ${STUDENT_EMAIL}: ${JSON.stringify(createJson)}`)
    const resetRes = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: h,
      body: JSON.stringify({ password: STUDENT_PASSWORD, email_confirm: true }),
    })
    if (!resetRes.ok) throw new Error(`[seed] password reset failed: ${await resetRes.text()}`)
  }

  // 2. Upsert the profile (covers both "trigger created the row" and "it didn't").
  const profileRes = await fetch(`${url}/rest/v1/profiles`, {
    method: "POST",
    headers: { ...h, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: userId,
      full_name: "E2E Student",
      role: "student",
      level: "B2",
      is_active: true,
    }),
  })
  if (!profileRes.ok) throw new Error(`[seed] profile upsert failed: ${await profileRes.text()}`)

  // 3. Reset prior submissions for this exam, then upsert the published exam.
  const deleteRes = await fetch(`${url}/rest/v1/exam_submissions?exam_id=eq.${EXAM_ID}`, { method: "DELETE", headers: h })
  if (!deleteRes.ok) throw new Error(`[seed] submissions cleanup failed: ${await deleteRes.text()}`)
  const examRes = await fetch(`${url}/rest/v1/exams`, {
    method: "POST",
    headers: { ...h, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: EXAM_ID,
      title: EXAM_TITLE,
      description: "Seeded interactive exam for the e2e money-path test.",
      level: "B2",
      skill: "grammar",
      exam_type: "interactive",
      is_published: true,
      max_score: 3,
      time_limit_minutes: null,
      questions: QUESTIONS,
      created_by: userId,
    }),
  })
  if (!examRes.ok) throw new Error(`[seed] exam upsert failed: ${await examRes.text()}`)
}
