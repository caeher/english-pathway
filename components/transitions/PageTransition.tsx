'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/helpers'
import { pageTransition } from '@/lib/motion/page-transition'
import { motionProps, useReducedMotion } from '@/lib/motion/useReducedMotion'

export type PageTransitionLayout = 'content' | 'fill' | 'viewport'

const layoutClasses: Record<PageTransitionLayout, string> = {
  content: 'flex min-h-0 flex-col',
  fill: 'flex h-0 min-h-0 flex-1 flex-col overflow-hidden',
  viewport: 'flex h-full min-h-0 flex-col',
}

interface PageTransitionProps {
  children: React.ReactNode
  layout?: PageTransitionLayout
}

export default function PageTransition({ children, layout = 'content' }: PageTransitionProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className={cn(layoutClasses[layout])}
      {...(reducedMotion ? motionProps(true) : pageTransition)}
    >
      {children}
    </motion.div>
  )
}
