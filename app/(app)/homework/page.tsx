import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { HomeworkView } from "./_components/HomeworkView"

export const metadata: Metadata = { title: "Mis deberes | Brit English School" }

const SIGNED_URL_EXPIRY = 3600 // 1 hour

export default async function HomeworkPage() {
  const supabase = await createClient()
  const adminSupabase = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: rows } = await supabase
    .from("homework_submissions")
    .select(
      "id, title, description, file_name, file_url, file_size, file_type, " +
      "claude_feedback, corrected_file_url, teacher_feedback, status, submitted_at, reviewed_at"
    )
    .eq("student_id", user.id)
    .order("submitted_at", { ascending: false })

  // Generate signed download URLs for all files in parallel
  const submissions = await Promise.all(
    (rows ?? []).map(async (row) => {
      const [fileRes, correctedRes] = await Promise.all([
        adminSupabase.storage
          .from("homework")
          .createSignedUrl(row.file_url, SIGNED_URL_EXPIRY),
        row.corrected_file_url
          ? adminSupabase.storage
              .from("homework")
              .createSignedUrl(row.corrected_file_url, SIGNED_URL_EXPIRY)
          : Promise.resolve({ data: null }),
      ])

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        file_name: row.file_name,
        file_size: row.file_size,
        file_type: row.file_type,
        status: row.status as "pending" | "under_review" | "corrected",
        submitted_at: row.submitted_at,
        reviewed_at: row.reviewed_at,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        claude_feedback: (row.claude_feedback as any) ?? null,
        teacher_feedback: row.teacher_feedback,
        downloadUrl: fileRes.data?.signedUrl ?? null,
        correctedDownloadUrl: correctedRes.data?.signedUrl ?? null,
      }
    })
  )

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <HomeworkView initialSubmissions={submissions} />
    </div>
  )
}
