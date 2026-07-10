"use client"

/**
 * TEMPORARY — see page.tsx. Throws inside an event handler so the error reaches
 * the browser's window.onerror, which the Sentry global-handlers integration
 * hooks and reports through the /monitoring tunnel route (proves the tunnel).
 */
export function SentryCheckClient() {
  return (
    <button
      type="button"
      onClick={() => {
        throw new Error("SENTRY_VERIFY: client-side throw from /sentry-check")
      }}
      style={{
        justifySelf: "start",
        padding: "0.5rem 1rem",
        border: "1px solid currentColor",
        borderRadius: "0.375rem",
        cursor: "pointer",
      }}
    >
      Trigger client error
    </button>
  )
}
