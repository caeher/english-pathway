'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import useThemeStore, { selectDark } from '@/stores/useThemeStore'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { AnalyticsProvider } from '@/lib/analytics/provider'
import { migratePersistKeys } from '@/lib/storage/migrate-persist'
import PwaProvider from '@/components/PwaProvider'
import CookieConsentBanner from '@/components/CookieConsentBanner'

function ThemeInit() {
  const dark = useThemeStore(selectDark)

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

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={300}>
      <AnalyticsProvider />
      <ThemeInit />
      <PersistMigration />
      <ScrollToTop />
      <PwaProvider />
      <CookieConsentBanner />
      {children}
      <Toaster />
    </TooltipProvider>
  )
}
