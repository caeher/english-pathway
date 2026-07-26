'use client'

import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/motion/page-transition'
import { motionProps, useReducedMotion } from '@/lib/motion/useReducedMotion'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div className="flex min-h-0 flex-col" {...(reducedMotion ? motionProps(true) : pageTransition)}>
      {children}
    </motion.div>
  )
}
