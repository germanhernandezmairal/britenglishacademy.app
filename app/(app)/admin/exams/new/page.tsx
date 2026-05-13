import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import { ExamForm } from "../_components/ExamForm"

export const metadata: Metadata = { title: "Nuevo Examen | Admin | Brit English School" }

export default async function NewExamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!me || !["admin", "teacher"].includes(me.role)) redirect("/dashboard")

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/exams" className="flex items-center gap-1.5 text-xs font-medium hover:underline"
          style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={13} /> Exámenes
        </Link>
      </div>

      <h1
        className="text-2xl font-bold mb-6"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
      >
        Nuevo examen
      </h1>

      <div
        className="p-6 rounded-2xl border"
        style={{ background: "white", borderColor: "var(--color-border)" }}
      >
        <ExamForm />
      </div>
    </div>
  )
}
