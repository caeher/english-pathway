'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import useThemeStore from '@/stores/useThemeStore'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { AnalyticsProvider } from '@/lib/analytics/provider'
import { migratePersistKeys } from '@/lib/storage/migrate-persist'

function ThemeInit() {
  const { dark } = useThemeStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return null
}

function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function PersistMigration() {
  useEffect(() => {
    migratePersistKeys()
  }, [])

  return null
}

function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={300}>
      <AnalyticsProvider />
      <ThemeInit />
      <PersistMigration />
      <ScrollToTop />
      <ServiceWorkerRegister />
      {children}
      <Toaster />
    </TooltipProvider>
  )
}
