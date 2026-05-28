import { createClient } from "@supabase/supabase-js"
import { sendEmail, tplHomeworkSubmitted, tplHomeworkCorrected, tplAnnouncement } from "./email"
import { sendPush } from "./webpush"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function emailsForUsers(userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {}
  const db = adminDb()
  const { data: { users } } = await db.auth.admin.listUsers({ perPage: 1000 })
  const map: Record<string, string> = {}
  for (const u of users) {
    if (userIds.includes(u.id) && u.email) map[u.id] = u.email
  }
  return map
}

async function subsForUsers(userIds: string[]) {
  if (userIds.length === 0) return []
  const { data } = await adminDb()
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", userIds)
  return (data ?? []) as { endpoint: string; p256dh: string; auth: string }[]
}

async function staffIds(): Promise<string[]> {
  const { data } = await adminDb()
    .from("profiles")
    .select("id")
    .in("role", ["admin", "teacher"])
    .eq("is_active", true)
  return (data ?? []).map((r: { id: string }) => r.id)
}

async function activeStudentIds(): Promise<string[]> {
  const { data } = await adminDb()
    .from("profiles")
    .select("id")
    .eq("role", "student")
    .eq("is_active", true)
  return (data ?? []).map((r: { id: string }) => r.id)
}

export async function notifyHomeworkSubmitted(studentId: string, studentName: string, title: string) {
  try {
    const ids = await staffIds()
    if (ids.length === 0) return
    const [emailMap, subs] = await Promise.all([emailsForUsers(ids), subsForUsers(ids)])
    const emails = Object.values(emailMap)
    await Promise.all([
      emails.length > 0 && sendEmail(emails, `Nuevo deber: ${studentName}`, tplHomeworkSubmitted(studentName, title, APP_URL)),
      sendPush(subs, { title: "Nuevo deber enviado", body: `${studentName} · ${title}`, url: `${APP_URL}/admin/homework` }),
    ])
  } catch (err) {
    console.error("[notifyHomeworkSubmitted]", err)
  }
}

export async function notifyHomeworkCorrected(studentId: string, studentName: string, title: string) {
  try {
    const [emailMap, subs] = await Promise.all([emailsForUsers([studentId]), subsForUsers([studentId])])
    const email = emailMap[studentId]
    await Promise.all([
      email && sendEmail(email, "Tu tarea ha sido corregida — Brit English Academy", tplHomeworkCorrected(studentName, title, APP_URL)),
      sendPush(subs, { title: "Tarea corregida", body: title, url: `${APP_URL}/homework` }),
    ])
  } catch (err) {
    console.error("[notifyHomeworkCorrected]", err)
  }
}

export async function notifyAnnouncement(content: string) {
  try {
    const ids = await activeStudentIds()
    if (ids.length === 0) return
    const [emailMap, subs] = await Promise.all([emailsForUsers(ids), subsForUsers(ids)])
    const emails = Object.values(emailMap)
    await Promise.all([
      emails.length > 0 && sendEmail(emails, "Nuevo anuncio — Brit English Academy", tplAnnouncement(content, APP_URL)),
      sendPush(subs, { title: "Nuevo anuncio", body: content.slice(0, 100), url: `${APP_URL}/community` }),
    ])
  } catch (err) {
    console.error("[notifyAnnouncement]", err)
  }
}
