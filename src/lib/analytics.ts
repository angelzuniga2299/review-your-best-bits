export function trackEvent(event: string, data?: Record<string, unknown>) {
  try {
    const log = JSON.parse(localStorage.getItem("insignia_events") ?? "[]")
    log.push({ event, data, ts: new Date().toISOString() })
    if (log.length > 200) log.splice(0, log.length - 200)
    localStorage.setItem("insignia_events", JSON.stringify(log))
  } catch {}
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", event, data)
  }
}
