'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export function AnalyticsProvider() {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com'

  useEffect(() => {
    if (!posthogKey) return
    const w = window as Window & { posthog?: { init: (k: string, o: object) => void } }
    if (w.posthog?.init) {
      w.posthog.init(posthogKey, { api_host: posthogHost, capture_pageview: true })
    }
  }, [posthogKey, posthogHost])

  if (!posthogKey) return null

  return (
    <Script
      src={`${posthogHost}/static/array.js`}
      strategy="afterInteractive"
      onLoad={() => {
        const w = window as Window & { posthog?: { init: (k: string, o: object) => void } }
        w.posthog?.init(posthogKey, { api_host: posthogHost, capture_pageview: true })
      }}
    />
  )
}
