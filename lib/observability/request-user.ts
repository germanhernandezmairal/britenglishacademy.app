import { createServerClient, parseCookieHeader } from "@supabase/ssr"

/**
 * The slice of the Supabase client this module uses. `getSession()` decodes the
 * auth cookie **locally** — no network call, no server-side validation — which
 * is what keeps this safe to run inside the error path (see below).
 */
type SessionReader = {
  auth: {
    getSession: () => Promise<{
      data: { session: { user?: { id?: string } | null } | null }
    }>
  }
}

type ClientFactory = (cookieHeader: string) => SessionReader

/**
 * Resolves the current user's id from a raw request `cookie` header, for use in
 * `instrumentation.ts`'s `onRequestError`. That hook runs OUTSIDE the request's
 * render async context, so the `Sentry.setUser()` from `app/(app)/layout.tsx`
 * never reaches it — server error events would otherwise carry no user.
 *
 * We attach the id ONLY. `getSession()` reads it from the cookie's JWT without a
 * network round-trip, so error reporting adds no DB dependency (the error path is
 * exactly where the DB may be the failure). The JWT's `role` claim is the Postgres
 * role, not our app role, so role stays client-side. Any failure — missing env,
 * malformed cookie, format drift — resolves to `null`; reporting must never throw.
 */
export async function getUserIdFromCookieHeader(
  cookieHeader: string | undefined,
  createClient: ClientFactory = defaultCreateClient
): Promise<string | null> {
  if (!cookieHeader) {
    return null
  }

  try {
    const supabase = createClient(cookieHeader)
    const { data } = await supabase.auth.getSession()
    return data.session?.user?.id ?? null
  } catch {
    return null
  }
}

function defaultCreateClient(cookieHeader: string): SessionReader {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // parseCookieHeader types `value` as optional; getAll wants a string.
          return parseCookieHeader(cookieHeader).map(({ name, value }) => ({
            name,
            value: value ?? "",
          }))
        },
        setAll() {
          // Read-only: the error path never mutates the session.
        },
      },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  ) as unknown as SessionReader
}
