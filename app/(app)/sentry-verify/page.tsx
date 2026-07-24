/**
 * TEMPORARY — DELETE AFTER VERIFICATION.
 *
 * PR #26 made `instrumentation.ts`'s `onRequestError` resolve the user id from
 * the request cookies, so server-side error events should now carry
 * `User: <uuid>`. Neither CI nor unit tests can prove that: `onRequestError` is
 * only invoked by a real Next server, and the Sentry tunnel only runs on a
 * deployed build. This route forces one such error on Production so the event
 * can be inspected in Sentry (project `sentry-aqua-yacht`).
 *
 * Two gates keep it inert for everyone else:
 *   1. It lives under `(app)`, whose layout redirects anonymous visitors to
 *      /login — so it cannot be reached without a session (which is also what
 *      supplies the cookie the fix decodes).
 *   2. It throws only when handed the exact `?boom=` token below. Any other
 *      request renders a plain notice.
 *
 * Not linked from anywhere in the UI.
 */

const BOOM_TOKEN = "a41f7c2e9b"

export const dynamic = "force-dynamic"

export default async function SentryVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ boom?: string }>
}) {
  const params = await searchParams

  if (params.boom === BOOM_TOKEN) {
    throw new Error(
      `SENTRY_PROD_SERVER_USER_VERIFY ${new Date().toISOString()}`
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Sentry verification</h1>
      <p className="mt-2 text-sm opacity-70">
        Temporary diagnostic page. Nothing to do here.
      </p>
    </div>
  )
}
