'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun, BookOpen, GraduationCap, RotateCcw, Menu, X, LayoutDashboard } from 'lucide-react'
import { motion } from 'framer-motion'
import useThemeStore, { selectDark, selectToggleTheme } from '@/stores/useThemeStore'
import { motionProps, useReducedMotion } from '@/lib/motion/useReducedMotion'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { NavUser } from '@/components/layouts/_parts/nav-user'
import { SrsBadge } from '@/components/layouts/_parts/srs-badge'
import { getHeaderNavItems } from '@/lib/navigation-model'
import { isNavigationItemActive } from '@/lib/navigation-model'
import type { NavigationContext } from '@/lib/navigation'

interface HeaderProps {
  navigation?: NavigationContext
  isAuthenticated?: boolean
}

const GUEST_CONTEXT: NavigationContext = {
  isAuthenticated: false,
  onboardingCompleted: false,
  email: null,
  fullName: null,
  avatarUrl: null,
}

export default function Header({ navigation, isAuthenticated = false }: HeaderProps) {
  const dark = useThemeStore(selectDark)
  const toggle = useThemeStore(selectToggleTheme)
  const reducedMotion = useReducedMotion()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null)
  const context = navigation ?? (isAuthenticated ? { ...GUEST_CONTEXT, isAuthenticated: true } : GUEST_CONTEXT)

  useEffect(() => {
    if (!mobileOpen) return
    firstMobileLinkRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  const navItems = getHeaderNavItems(context)
  const icons = { book: BookOpen, learn: GraduationCap, review: RotateCcw, dashboard: LayoutDashboard }

  return (
    <header className="sticky top-0 z-40 border-b border-(--border-primary)/60 bg-(--bg-primary)/70 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-3 no-underline">
          <div className="relative h-9 w-9">
            <div className="absolute inset-0 rotate-3 rounded-xl bg-(--accent) transition-transform duration-300 group-hover:rotate-6" />
            <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-(--accent) shadow-sm">
              <span className="font-display text-sm font-black tracking-tight text-white">ie</span>
            </div>
          </div>
          <span className="hidden font-display text-[15px] font-bold tracking-tight text-(--text-primary) transition-colors group-hover:text-(--accent) sm:block">English Pathway</span>
        </Link>

        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-3 sm:flex" aria-label="Main navigation">
            {navItems.map(({ href, label, icon }) => {
              const Icon = icons[icon]
              const active = isNavigationItemActive(pathname, href)
              return (
              <Link key={href} href={href} aria-current={active ? 'page' : undefined} className="inline-flex items-center gap-1.5 text-sm font-medium text-(--text-secondary) no-underline transition-colors hover:text-(--accent) aria-[current=page]:text-(--accent)">
                <Icon className="h-4 w-4" aria-hidden="true" /> {label} {href === '/review' && <SrsBadge />}
              </Link>
              )
            })}
          </nav>

          {context.isAuthenticated ? (
            <NavUser email={context.email} fullName={context.fullName} avatarUrl={context.avatarUrl} compact showDashboard={context.onboardingCompleted} />
          ) : (
            <>
              <Link href="/login" className="inline-flex text-sm font-medium text-(--text-secondary) no-underline transition-colors hover:text-(--accent)">
                <span className="hidden sm:inline">Sign In</span><span className="sm:hidden">Login</span>
              </Link>
              <Link href="/register?redirectTo=%2Fonboarding" className="inline-flex rounded-lg bg-(--accent) px-3 py-1.5 text-sm font-bold text-white no-underline transition-colors hover:bg-(--accent-hover)">Register</Link>
            </>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 rounded-xl border border-(--border-primary) bg-(--bg-tertiary)/80 px-2 py-1.5">
                <motion.div key={dark ? 'sun' : 'moon'} {...(reducedMotion ? motionProps(true) : { initial: { y: 8, opacity: 0, rotate: -20 }, animate: { y: 0, opacity: 1, rotate: 0 }, transition: { duration: 0.2 } })}>
                  {dark ? <Sun className="h-4 w-4" style={{ color: 'var(--reward)' }} /> : <Moon className="h-4 w-4 text-(--text-muted)" />}
                </motion.div>
                <Switch checked={dark} onCheckedChange={toggle} aria-label="Toggle dark mode" />
              </div>
            </TooltipTrigger>
            <TooltipContent>{dark ? 'Light mode' : 'Dark mode'}</TooltipContent>
          </Tooltip>

          <button ref={menuButtonRef} type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-(--border-primary) text-(--text-primary) sm:hidden" aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => setMobileOpen((open) => !open)}>
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-navigation" className="border-t border-(--border-primary)/60 bg-(--bg-primary) px-6 py-3 sm:hidden" aria-label="Mobile navigation">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {navItems.map(({ href, label, icon }, index) => {
              const Icon = icons[icon]
              const active = isNavigationItemActive(pathname, href)
              return (
              <Link key={href} ref={index === 0 ? firstMobileLinkRef : undefined} href={href} aria-current={active ? 'page' : undefined} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium text-(--text-secondary) no-underline hover:bg-(--bg-tertiary) hover:text-(--accent) aria-[current=page]:bg-(--accent-soft) aria-[current=page]:text-(--accent)">
                <Icon className="h-4 w-4" aria-hidden="true" /> {label} {href === '/review' && <SrsBadge />}
              </Link>
              )
            })}
          </div>
        </nav>
      )}
    </header>
  )
}
