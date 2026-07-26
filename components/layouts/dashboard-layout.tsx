'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  PANEL_CONTENT_COLUMN_CLASS,
  PANEL_MAIN_CLASS,
  PANEL_SHELL_STYLE,
} from '@/lib/layout/panel-shell'
import { getAccountPageTitle } from '@/lib/navigation-model'
import { AppSidebar } from './_parts/app-sidebar'
import { AppNavbar } from './_parts/app-navbar'
import type { NavItem } from './_parts/sidebar-body'

interface DashboardLayoutProps {
  children: React.ReactNode
  navItems: NavItem[]
  title?: string
  email?: string | null
  fullName?: string | null
  avatarUrl?: string | null
}

export function DashboardLayout({
  children,
  navItems,
  title,
  email,
  fullName,
  avatarUrl,
}: DashboardLayoutProps) {
  const pathname = usePathname()
  const resolvedTitle = title ?? getAccountPageTitle(pathname)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('panel-shell')
    return () => document.documentElement.classList.remove('panel-shell')
  }, [])

  return (
    <div
      className="flex h-dvh max-h-dvh min-h-0 overflow-hidden bg-(--bg-primary)"
      style={PANEL_SHELL_STYLE}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-(--accent) focus:text-white focus:rounded-xl focus:font-bold focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      <AppSidebar
        items={navItems}
        email={email}
        fullName={fullName}
        avatarUrl={avatarUrl}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={PANEL_CONTENT_COLUMN_CLASS}>
        <AppNavbar
          title={resolvedTitle}
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setMobileOpen((v) => !v)
            } else {
              setCollapsed((v) => !v)
            }
          }}
        />
        <main id="main-content" tabIndex={-1} className={PANEL_MAIN_CLASS}>{children}</main>
      </div>
    </div>
  )
}
