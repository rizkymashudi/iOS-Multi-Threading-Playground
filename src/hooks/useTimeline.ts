import { useState, useRef, useCallback } from 'react'
import type { TLEvent } from '../types/timeline'

export default function useTimeline() {
  const [events, setEvents] = useState<TLEvent[]>([])
  const [elapsedMs, setElapsedMs] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const animFrame = useRef<number | null>(null)

  const clear = useCallback(() => {
    setEvents([])
    setElapsedMs(0)
    startTimeRef.current = performance.now()
    if (animFrame.current) {
      cancelAnimationFrame(animFrame.current)
      animFrame.current = null
    }
  }, [])

  const record = useCallback((lane: string, label: string, color: string, dimColor: string) => {
    const now = performance.now()
    const base = startTimeRef.current ?? now
    const ev: TLEvent = {
      lane,
      label,
      color,
      dimColor,
      startMs: now - base,
      endMs: null,
    }
    setEvents((prev) => [...prev, ev])

    return () => {
      ev.endMs = performance.now() - base
      setEvents((prev) => [...prev])
    }
  }, [])

  const animate = useCallback((stopAfterMs: number) => {
    if (animFrame.current) cancelAnimationFrame(animFrame.current)

    const loop = () => {
      const base = startTimeRef.current ?? performance.now()
      const elapsed = performance.now() - base
      setElapsedMs(elapsed)
      if (elapsed < (stopAfterMs || 6000)) {
        animFrame.current = requestAnimationFrame(loop)
      }
    }

    animFrame.current = requestAnimationFrame(loop)
  }, [])

  const stopAnimation = useCallback(() => {
    if (animFrame.current) {
      cancelAnimationFrame(animFrame.current)
      animFrame.current = null
    }
  }, [])

  return { events, elapsedMs, record, clear, animate, stopAnimation }
}
