import { createServerClient } from "@supabase/ssr"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // noop in Server Components
          }
        },
      },
    }
  )
}

// True service-role client. Must NOT use cookies/createServerClient — that loads
// the caller's session and sends the user's JWT as Authorization, so the request
// runs as the authenticated user (RLS applies) instead of service_role. Using the
// plain supabase-js client with the service key and no session bypasses RLS as intended.
export function createAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
