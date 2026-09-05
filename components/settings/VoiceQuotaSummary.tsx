'use client'

import { useEffect, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { Surface } from '@/components/ui'
import { formatDuration } from '@/lib/credits/audio-countdown'
import { isRegisteredSep2026PromoActive } from '@/lib/credits/promos'
import type { UsageCredits } from '@/lib/credits/usage'

export default function VoiceQuotaSummary() {
  const [credits, setCredits] = useState<UsageCredits | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    void fetch('/api/credits')
      .then(async (response) => {
        if (!response.ok) {
          setError(true)
          return
        }
        setCredits(await response.json() as UsageCredits)
        setError(false)
      })
      .catch(() => setError(true))
  }, [])

  const remainingLabel = credits?.voiceQuota?.isUnlimited
    ? 'Unlimited'
    : credits !== null
      ? formatDuration(credits.audioSecondsRemaining)
      : null

  const promoRemaining = credits?.voiceQuota?.promoRemainingSeconds ?? 0
  const showPromoNote = isRegisteredSep2026PromoActive() && promoRemaining > 0

  return (
    <Surface as="section" padding="lg" className="space-y-4" aria-labelledby="voice-quota-heading">
      <div>
        <h2 id="voice-quota-heading" className="flex items-center gap-2 font-display font-bold text-(--text-primary)">
          <Volume2 className="h-4 w-4 text-(--accent)" aria-hidden="true" /> Voice tutor time
        </h2>
        <p className="mt-1 text-sm text-(--text-secondary)">Remaining voice time for AI tutor sessions on /learn.</p>
      </div>
      {error && <p className="text-sm text-(--text-muted)">Voice credits could not be loaded.</p>}
      {!error && remainingLabel === null && <p className="text-sm text-(--text-muted)">Loading voice balance…</p>}
      {!error && remainingLabel !== null && (
        <div className="rounded-xl bg-(--bg-secondary)/50 p-4">
          <p className="text-sm text-(--text-muted)">Remaining</p>
          <p className="mt-1 font-display text-2xl font-black text-(--text-primary)">{remainingLabel}</p>
          {showPromoNote && (
            <p className="mt-2 text-xs text-(--text-secondary)">
              Includes 2 bonus hours for registered users until Sep 30.
            </p>
          )}
        </div>
      )}
    </Surface>
  )
}
