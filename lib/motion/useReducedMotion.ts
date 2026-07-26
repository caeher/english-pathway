'use client'

import { useEffect, useState } from 'react'

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return reduced
}

export function motionProps(reduced: boolean) {
  if (reduced) {
    return {
      initial: false as const,
      animate: { opacity: 1 },
      transition: { duration: 0 },
    }
  }
  return {}
}

export function optionalMotion<T extends Record<string, unknown>>(reduced: boolean, props: T): T | ReturnType<typeof motionProps> {
  return reduced ? motionProps(true) : props
}
