import { useEffect } from 'react'

export function useDebouncedProgress<T>(
  progress: T,
  onProgressChange: ((value: T) => void) | undefined,
  finished: boolean,
  delay = 500,
) {
  useEffect(() => {
    if (finished || !onProgressChange) return
    const id = window.setTimeout(() => onProgressChange(progress), delay)
    return () => window.clearTimeout(id)
  }, [progress, finished, onProgressChange, delay])
}
