import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Skip Supabase auth check if env vars are not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  let refreshed = false
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          refreshed = true
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: getUserError } = await supabase.auth.getUser()

  // --- TEMP DIAGNOSTIC (remove after CI evidence gathered) ---
  const dbg: Record<string, string> = {}
  const authCookie = request.cookies
    .getAll()
    .find((c) => /sb-.*-auth-token(\.0)?$/.test(c.name))
  dbg["x-dbg-user"] = user ? "1" : "0"
  dbg["x-dbg-refreshed"] = refreshed ? "1" : "0"
  dbg["x-dbg-err"] = getUserError ? `${getUserError.name}:${getUserError.status ?? ""}:${getUserError.message}`.slice(0, 120) : "none"
  dbg["x-dbg-cklen"] = String(authCookie?.value.length ?? -1)
  dbg["x-dbg-nowsec"] = String(Math.floor(Date.now() / 1000))
  try {
    if (authCookie) {
      const raw = authCookie.value.startsWith("base64-")
        ? Buffer.from(authCookie.value.slice(7), "base64").toString("utf8")
        : decodeURIComponent(authCookie.value)
      const sess = JSON.parse(raw)
      dbg["x-dbg-expat"] = String(sess.expires_at ?? "?")
      dbg["x-dbg-hasrt"] = sess.refresh_token ? "1" : "0"
    } else {
      dbg["x-dbg-expat"] = "nocookie"
      dbg["x-dbg-hasrt"] = "0"
    }
  } catch (e) {
    dbg["x-dbg-expat"] = "parsefail:" + (e as Error).message.slice(0, 40)
    dbg["x-dbg-hasrt"] = "?"
  }
  const stamp = (res: NextResponse) => {
    for (const [k, v] of Object.entries(dbg)) res.headers.set(k, v)
    return res
  }
  // --- END TEMP DIAGNOSTIC ---

  const { pathname } = request.nextUrl

  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/lessons") ||
    pathname.startsWith("/homework") ||
    pathname.startsWith("/exams") ||
    pathname.startsWith("/community") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/admin")

  if (isAppRoute && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("redirectTo", pathname)
    return stamp(redirectWithSession(loginUrl, supabaseResponse))
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = "/dashboard"
    return stamp(redirectWithSession(dashboardUrl, supabaseResponse))
  }

  return stamp(supabaseResponse)
}

// A redirect creates a brand-new response, so any refreshed Supabase auth
// cookies that getUser() wrote onto `supabaseResponse` are lost unless we copy
// them across. Dropping them desyncs the browser from the rotated refresh token
// and, with rotation enabled, produces a /login <-> /dashboard redirect loop.
function redirectWithSession(url: URL, supabaseResponse: NextResponse): NextResponse {
  const redirectResponse = NextResponse.redirect(url)
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })
  return redirectResponse
}
