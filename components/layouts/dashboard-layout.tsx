'use client'

import { useState } from 'react'
import { cn } from '@/lib/helpers'
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
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div
      className="flex h-screen overflow-hidden bg-(--bg-primary)"
      style={{ '--app-header-h': '4rem' } as React.CSSProperties}
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

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AppNavbar
          title={title}
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setMobileOpen((v) => !v)
            } else {
              setCollapsed((v) => !v)
            }
          }}
        />
        <main id="main-content" tabIndex={-1} className={cn('flex-1 overflow-y-auto p-4 lg:p-6 outline-none')}>{children}</main>
      </div>
    </div>
  )
}
