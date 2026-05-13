"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { subscribeToNotifications, unsubscribeFromNotifications } from "@/app/actions/subscribe"

type Status = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed"

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(b64)
  return Uint8Array.from(Array.from(raw), (c) => c.charCodeAt(0))
}

export function PushNotificationToggle() {
  const [status, setStatus] = useState<Status>("loading")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported")
      return
    }
    if (Notification.permission === "denied") {
      setStatus("denied")
      return
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription()
        setStatus(sub ? "subscribed" : "unsubscribed")
      })
      .catch(() => setStatus("unsupported"))
  }, [])

  async function handleToggle() {
    if (pending) return
    setPending(true)
    try {
      const reg = await navigator.serviceWorker.ready

      if (status === "subscribed") {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await unsubscribeFromNotifications(sub.endpoint)
          await sub.unsubscribe()
          setStatus("unsubscribed")
        }
      } else {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
          setStatus("denied")
          return
        }
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
        })
        const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
        await subscribeToNotifications({ endpoint: json.endpoint, keys: json.keys })
        setStatus("subscribed")
      }
    } catch (err) {
      console.error("[PushToggle]", err)
    } finally {
      setPending(false)
    }
  }

  if (status === "loading" || status === "unsupported" || status === "denied") return null

  const active = status === "subscribed"

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      title={active ? "Desactivar notificaciones push" : "Activar notificaciones push"}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:opacity-80 disabled:opacity-50"
      style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)" }}
    >
      {pending
        ? <Loader2 size={16} className="animate-spin flex-shrink-0" />
        : active
          ? <Bell size={16} className="flex-shrink-0" />
          : <BellOff size={16} className="flex-shrink-0" />}
      <span>{active ? "Notificaciones activas" : "Activar notificaciones"}</span>
    </button>
  )
}
