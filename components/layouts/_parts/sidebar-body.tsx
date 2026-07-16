'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/helpers'
import { ScrollArea } from '@/components/ui/scroll-area'

const NAV_ICONS = {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  FileText,
  Settings,
  BarChart3,
} as const satisfies Record<string, LucideIcon>

export type NavIconName = keyof typeof NAV_ICONS

export interface NavItem {
  label: string
  href: string
  icon: NavIconName
}

interface SidebarBodyProps {
  items: NavItem[]
  collapsed?: boolean
}

export function SidebarBody({ items, collapsed }: SidebarBodyProps) {
  const pathname = usePathname()

  return (
    <ScrollArea className="flex-1 min-h-0">
      <nav className="flex flex-col gap-1 p-3">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = NAV_ICONS[item.icon]
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors no-underline',
                isActive
                  ? 'bg-(--accent-soft) text-(--accent)'
                  : 'text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary)',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </ScrollArea>
  )
}
