'use client'

import { Menu, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import useThemeStore, { selectDark, selectToggleTheme } from '@/stores/useThemeStore'
import { cn } from '@/lib/helpers'

interface AppNavbarProps {
  title?: string
  onToggleSidebar?: () => void
  className?: string
}

export function AppNavbar({ title, onToggleSidebar, className }: AppNavbarProps) {
  const dark = useThemeStore(selectDark)
  const toggle = useThemeStore(selectToggleTheme)

  return (
    <header
      className={cn(
        'flex h-(--app-header-h) shrink-0 items-center justify-between border-b border-(--border-primary) bg-(--bg-primary)/80 backdrop-blur-xl px-4 lg:px-6',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {title && (
          <h1 className="font-display font-bold text-lg text-(--text-primary)">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {dark ? (
          <Moon className="h-4 w-4 text-(--text-muted)" />
        ) : (
          <Sun className="h-4 w-4 text-(--reward)" />
        )}
        <Switch checked={dark} onCheckedChange={toggle} aria-label="Toggle theme" />
      </div>
    </header>
  )
}
