'use client'

import Link from 'next/link'
import { Moon, Sun, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'
import useThemeStore from '@/stores/useThemeStore'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default function Header() {
  const { dark, toggle } = useThemeStore()

  return (
    <header className="sticky top-0 z-40 border-b border-(--border-primary)/60 bg-(--bg-primary)/70 backdrop-blur-2xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-xl bg-(--accent) rotate-3 group-hover:rotate-6 transition-transform duration-300" />
            <div className="relative w-full h-full rounded-xl bg-(--accent) flex items-center justify-center shadow-sm">
              <span className="text-white font-display font-black text-sm tracking-tight">ie</span>
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="font-display font-bold text-(--text-primary) text-[15px] tracking-tight group-hover:text-(--accent) transition-colors">
              English Pathway
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/learn"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-(--text-secondary) hover:text-(--accent) no-underline transition-colors"
          >
            <GraduationCap className="w-4 h-4" /> Learn
          </Link>
          <Link
            href="/login"
            className="inline-flex text-sm font-medium text-(--text-secondary) hover:text-(--accent) no-underline transition-colors"
          >
            <span className="hidden sm:inline">Sign In</span>
            <span className="sm:hidden">Login</span>
          </Link>
          <Link
            href="/register"
            className="inline-flex px-3 py-1.5 rounded-lg text-sm font-bold bg-(--accent) text-white hover:bg-(--accent-hover) no-underline transition-colors"
          >
            Register
          </Link>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-(--bg-tertiary)/80 border border-(--border-primary)">
                <motion.div
                  key={dark ? 'sun' : 'moon'}
                  initial={{ y: 8, opacity: 0, rotate: -20 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {dark
                    ? <Sun className="w-4 h-4" style={{ color: 'var(--reward)' }} />
                    : <Moon className="w-4 h-4 text-(--text-muted)" />
                  }
                </motion.div>
                <Switch
                  checked={dark}
                  onCheckedChange={toggle}
                  aria-label="Toggle dark mode"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {dark ? 'Light mode' : 'Dark mode'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}
