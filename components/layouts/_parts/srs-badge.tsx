'use client'

import { useEffect, useState } from 'react'

export function SrsBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetchCount = () => {
      fetch('/api/srs/due-count')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setCount(data?.count ?? 0))
        .catch(() => {})
    }

    fetchCount()
    const interval = setInterval(fetchCount, 60_000)
    window.addEventListener('srs-queue-updated', fetchCount)
    return () => {
      clearInterval(interval)
      window.removeEventListener('srs-queue-updated', fetchCount)
    }
  }, [])

  if (count <= 0) return null

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-(--accent) px-1.5 text-[10px] font-bold text-white tabular-nums">
      {count > 99 ? '99+' : count}
    </span>
  )
}
