'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, GraduationCap, RotateCcw, Menu, X, LayoutDashboard } from 'lucide-react'
import { useReducedMotion } from '@/lib/motion/useReducedMotion'
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
  const reducedMotion = useReducedMotion()
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null)
  const context = navigation ?? (isAuthenticated ? { ...GUEST_CONTEXT, isAuthenticated: true } : GUEST_CONTEXT)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  const isScrolled = mounted && scrolled

  return (
    <header className={
      isHomePage
        ? isScrolled
          ? 'sticky top-0 z-40 border-b border-white/20 bg-orange-600/95 text-white backdrop-blur-xl transition-all duration-300 shadow-md'
          : 'sticky top-0 z-40 border-b-0 bg-transparent text-white shadow-none transition-all duration-300'
        : 'sticky top-0 z-40 border-b border-(--border-primary)/60 bg-(--bg-primary)/90 text-(--text-primary) backdrop-blur-2xl transition-all duration-300 shadow-sm'
    }>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-3 no-underline">
          <div className="relative h-9 w-9">
            <div className={
              isHomePage
                ? 'absolute inset-0 rotate-3 rounded-xl bg-white/20 transition-transform duration-300 group-hover:rotate-6'
                : 'absolute inset-0 rotate-3 rounded-xl bg-(--accent) transition-transform duration-300 group-hover:rotate-6'
            } />
            <div className={
              isHomePage
                ? 'relative flex h-full w-full items-center justify-center rounded-xl bg-white text-(--accent) font-black shadow-md'
                : 'relative flex h-full w-full items-center justify-center rounded-xl bg-(--accent) text-white font-black shadow-sm'
            }>
              <span className="font-display text-sm font-black tracking-tight">ie</span>
            </div>
          </div>
          <span className={
            isHomePage
              ? 'hidden font-display text-[15px] font-bold tracking-tight text-white transition-colors group-hover:text-amber-200 sm:block'
              : 'hidden font-display text-[15px] font-bold tracking-tight text-(--text-primary) transition-colors group-hover:text-(--accent) sm:block'
          }>
            English Pathway
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-2 sm:flex" aria-label="Main navigation">
            {navItems.map(({ href, label, icon }) => {
              const Icon = icons[icon]
              const active = isNavigationItemActive(pathname, href)
              return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={
                  isHomePage
                    ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white/90 no-underline transition-colors hover:bg-white/15 hover:text-white aria-[current=page]:bg-white/20 aria-[current=page]:text-amber-200'
                    : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-(--text-secondary) no-underline transition-colors hover:text-(--accent) aria-[current=page]:text-(--accent)'
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" /> {label} {href === '/review' && <SrsBadge />}
              </Link>
              )
            })}
          </nav>

          {context.isAuthenticated ? (
            <NavUser email={context.email} fullName={context.fullName} avatarUrl={context.avatarUrl} compact showDashboard={context.onboardingCompleted} variant={isHomePage ? 'hero' : 'default'} />
          ) : (
            <>
              <Link href="/login" className={
                isHomePage
                  ? 'inline-flex text-sm font-bold text-white/90 no-underline transition-colors hover:text-white'
                  : 'inline-flex text-sm font-medium text-(--text-secondary) no-underline transition-colors hover:text-(--accent)'
              }>
                <span className="hidden sm:inline">Sign In</span><span className="sm:hidden">Login</span>
              </Link>
              <Link href="/register?redirectTo=%2Fonboarding" className={
                isHomePage
                  ? 'inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-(--text-primary) no-underline transition-all hover:-translate-y-0.5 hover:bg-white/95 shadow-md'
                  : 'inline-flex rounded-xl bg-(--accent) px-4 py-2 text-sm font-bold text-white no-underline transition-colors hover:bg-(--accent-hover)'
              }>Register</Link>
            </>
          )}

          <button
            ref={menuButtonRef}
            type="button"
            className={
              isHomePage
                ? 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 text-white hover:bg-white/15 sm:hidden'
                : 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-(--border-primary) text-(--text-primary) sm:hidden'
            }
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-navigation"
          className={
            isHomePage
              ? 'border-t border-white/15 bg-orange-600 text-white px-6 py-3 sm:hidden shadow-lg'
              : 'border-t border-(--border-primary)/60 bg-(--bg-primary) px-6 py-3 sm:hidden'
          }
          aria-label="Mobile navigation"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {navItems.map(({ href, label, icon }, index) => {
              const Icon = icons[icon]
              const active = isNavigationItemActive(pathname, href)
              return (
              <Link
                key={href}
                ref={index === 0 ? firstMobileLinkRef : undefined}
                href={href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMobileOpen(false)}
                className={
                  isHomePage
                    ? 'flex items-center gap-3 rounded-xl px-3 py-3 font-bold text-white no-underline hover:bg-white/15 hover:text-white aria-[current=page]:bg-white/20 aria-[current=page]:text-amber-200'
                    : 'flex items-center gap-3 rounded-xl px-3 py-3 font-medium text-(--text-secondary) no-underline hover:bg-(--bg-tertiary) hover:text-(--accent) aria-[current=page]:bg-(--accent-soft) aria-[current=page]:text-(--accent)'
                }
              >
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
