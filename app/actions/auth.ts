"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const signupSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

const onboardingSchema = z.object({
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  learning_goals: z.string().optional(),
})

export async function login(formData: FormData): Promise<never> {
  const supabase = await createClient()

  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    redirect("/login?error=invalid_credentials")
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    redirect("/login?error=invalid_credentials")
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function loginWithGoogle(): Promise<never> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  })

  if (error || !data.url) {
    redirect("/login?error=oauth_failed")
  }

  redirect(data.url)
}

export async function signup(formData: FormData): Promise<never> {
  const supabase = await createClient()

  const raw = {
    full_name: formData.get("full_name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    redirect("/signup?error=validation_failed")
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes("already registered")) {
      redirect("/signup?error=already_exists")
    }
    redirect("/signup?error=signup_failed")
  }

  redirect("/signup?success=check_email")
}

export async function completeOnboarding(formData: FormData): Promise<never> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const raw = {
    level: formData.get("level") as string,
    learning_goals: formData.get("learning_goals") as string | undefined,
  }

  const parsed = onboardingSchema.safeParse(raw)
  if (!parsed.success) {
    redirect("/onboarding?error=select_level")
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      level: parsed.data.level,
      learning_goals: parsed.data.learning_goals ?? null,
    })
    .eq("id", user.id)

  if (error) {
    redirect("/onboarding?error=save_failed")
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function logout(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/")
}
