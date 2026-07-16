'use client'

import { cn } from '@/lib/helpers'
import { SidebarHeader } from './sidebar-header'
import { SidebarBody, type NavItem } from './sidebar-body'
import { SidebarFooter } from './sidebar-footer'
import { NavUser } from './nav-user'

interface AppSidebarProps {
  items: NavItem[]
  email?: string | null
  fullName?: string | null
  avatarUrl?: string | null
  collapsed?: boolean
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export function AppSidebar({
  items,
  email,
  fullName,
  avatarUrl,
  collapsed,
  mobileOpen,
  onCloseMobile,
}: AppSidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-(--border-primary) bg-(--bg-card) transition-transform duration-300 lg:static lg:translate-x-0',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SidebarHeader collapsed={collapsed} />
        <SidebarBody items={items} collapsed={collapsed} />
        <SidebarFooter collapsed={collapsed}>
          <NavUser
            email={email}
            fullName={fullName}
            avatarUrl={avatarUrl}
            collapsed={collapsed}
          />
        </SidebarFooter>
      </aside>
    </>
  )
}
