'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { COOKIE_CONSENT_EVENT, hasAnalyticsConsent } from '@/lib/consent/client'

export function AnalyticsProvider() {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com'
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false)

  useEffect(() => {
    const update = () => setAnalyticsAllowed(hasAnalyticsConsent())
    update()
    window.addEventListener(COOKIE_CONSENT_EVENT, update)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, update)
  }, [])

  useEffect(() => {
    if (!posthogKey || !analyticsAllowed) return
    const w = window as Window & { posthog?: { init: (k: string, o: object) => void } }
    if (w.posthog?.init) {
      w.posthog.init(posthogKey, { api_host: posthogHost, capture_pageview: true })
    }
  }, [analyticsAllowed, posthogKey, posthogHost])

  if (!posthogKey || !analyticsAllowed) return null

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
