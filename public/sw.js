self.addEventListener("push", (event) => {
  let data = { title: "Brit English Academy", body: "", url: "/" }
  try { data = { ...data, ...event.data?.json() } } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: { url: data.url },
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const url = event.notification.data?.url ?? "/"
        for (const client of clientList) {
          if (client.url === url && "focus" in client) return client.focus()
        }
        return clients.openWindow(url)
      })
  )
})
