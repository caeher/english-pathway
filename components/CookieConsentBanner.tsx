'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { COOKIE_CONSENT_EVENT, getCookieConsent, setCookieConsent } from '@/lib/consent/client'

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => setVisible(getCookieConsent() === null)
    update()
    window.addEventListener(COOKIE_CONSENT_EVENT, update)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, update)
  }, [])

  if (!visible) return null

  return (
    <aside role="dialog" aria-labelledby="cookie-consent-title" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-(--border-primary) bg-(--bg-card) p-5 shadow-xl">
      <h2 id="cookie-consent-title" className="font-display text-lg font-black text-(--text-primary)">Choose optional analytics</h2>
      <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">Essential storage keeps sign-in and accessibility working. Optional analytics helps us improve English Pathway and stays off until you choose it. <Link href="/legal/cookies" className="font-bold text-(--accent) hover:underline">Read the cookie policy</Link>.</p>
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => setCookieConsent('essential')}>Use essential only</Button>
        <Button type="button" onClick={() => setCookieConsent('analytics')}>Allow analytics</Button>
      </div>
    </aside>
  )
}
