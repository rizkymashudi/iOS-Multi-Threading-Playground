import { useRef, useCallback } from 'react'
import { useSpeedStore } from '../store/speedStore'

export function scaledDelay(ms: number, speed: number): number {
  return Math.round(ms / speed)
}

export function useScheduledTimers() {
  const timers = useRef<number[]>([])
  const speed = useSpeedStore((s) => s.speed)

  const later = useCallback(
    (fn: () => void, ms: number) => {
      const t = window.setTimeout(fn, scaledDelay(ms, speed))
      timers.current.push(t)
      return t
    },
    [speed],
  )

  const clearAll = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }, [])

  return { later, clearAll }
}
