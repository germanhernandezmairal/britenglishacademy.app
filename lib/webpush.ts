type PushSub = { endpoint: string; p256dh: string; auth: string }

export async function sendPush(subscriptions: PushSub[], payload: { title: string; body: string; url: string }) {
  if (subscriptions.length === 0) return
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    console.log("[Push dev]", payload)
    return
  }
  try {
    const webpush = (await import("web-push")).default
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL ?? "gerhm19@gmail.com"}`,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )
    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
      )
    )
  } catch (err) {
    console.error("[Push error]", err)
  }
}
