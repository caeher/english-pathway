'use client'

import { useEffect, useState } from 'react'
import { Download, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type BannerState = 'install' | 'update' | 'ios' | null

export default function PwaProvider() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [banner, setBanner] = useState<BannerState>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // In development mode, unregister any active service worker to prevent HMR chunk caching issues
    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          void registration.unregister()
        }
      }).catch(() => {})
      return
    }

    let cancelled = false
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      if (sessionStorage.getItem('english-pathway-pwa-dismissed') !== '1') {
        window.setTimeout(() => setBanner('install'), 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    void navigator.serviceWorker.register('/sw.js').then((nextRegistration) => {
      if (cancelled) return
      setRegistration(nextRegistration)
      if (nextRegistration.waiting) setBanner('update')

      nextRegistration.addEventListener('updatefound', () => {
        const worker = nextRegistration.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) setBanner('update')
        })
      })
    }).catch(() => {})

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    if (isIos && !isStandalone && sessionStorage.getItem('english-pathway-pwa-dismissed') !== '1') {
      window.setTimeout(() => setBanner('ios'), 3000)
    }

    return () => {
      cancelled = true
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  async function install() {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
    setBanner(null)
  }

  function dismiss() {
    sessionStorage.setItem('english-pathway-pwa-dismissed', '1')
    setBanner(null)
  }

  function update() {
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
  }

  if (!banner) return null

  return (
    <aside role="status" className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-(--border-primary) bg-(--bg-card) p-4 shadow-xl">
      {banner === 'update' ? <RefreshCw className="h-5 w-5 shrink-0 text-(--accent)" /> : <Download className="h-5 w-5 shrink-0 text-(--accent)" />}
      <p className="flex-1 text-sm text-(--text-secondary)">
        {banner === 'update' && 'A new version is ready.'}
        {banner === 'install' && 'Install English Pathway for faster access.'}
        {banner === 'ios' && 'Add English Pathway to your Home Screen from the Share menu.'}
      </p>
      {banner === 'update' && <Button size="sm" onClick={update}>Refresh</Button>}
      {banner === 'install' && <Button size="sm" onClick={install}>Install</Button>}
      <Button variant="ghost" size="icon" aria-label="Dismiss" onClick={dismiss}><X className="h-4 w-4" /></Button>
    </aside>
  )
}
