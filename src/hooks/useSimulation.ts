import { useState, useCallback, useRef, useEffect } from 'react'
import type { LogEntry, LogType } from '../types/simulation'
import { useScheduledTimers } from '../utils/timer'
import { useSpeedStore } from '../store/speedStore'
import useTimeline from './useTimeline'

const THREAD_COLORS: Record<string, string> = {
  main: 'var(--teal)',
  bg: 'var(--text3)',
  bg1: 'var(--main)',
  bg2: 'var(--purple)',
  bg3: 'var(--amber)',
  actor: 'var(--teal)',
}

let logCounter = 0

export default function useSimulation() {
  const { later, clearAll: clearAllTimers } = useScheduledTimers()
  const timeline = useTimeline()
  const speed = useSpeedStore((s) => s.speed)
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>({})
  const logsRef = useRef(logs)
  logsRef.current = logs

  const log = useCallback((id: string, msg: string, type: LogType = '', thread = '') => {
    const timestamp = new Date().toISOString().slice(14, 23)
    const color = THREAD_COLORS[thread] || 'var(--text3)'
    const entry: LogEntry = {
      id: `log-${++logCounter}`,
      timestamp,
      thread,
      message: msg,
      type,
      color,
    }
    setLogs((prev) => ({
      ...prev,
      [id]: [...(prev[id] || []), entry],
    }))
  }, [])

  const clearLog = useCallback((id: string) => {
    setLogs((prev) => ({ ...prev, [id]: [] }))
  }, [])

  const reset = useCallback(() => {
    clearAllTimers()
    timeline.clear()
    timeline.stopAnimation()
    setLogs({})
  }, [clearAllTimers, timeline])

  useEffect(() => {
    return () => {
      clearAllTimers()
      timeline.stopAnimation()
    }
  }, [clearAllTimers, timeline])

  return {
    later,
    clearAllTimers,
    log,
    clearLog,
    logs,
    timeline,
    speed,
    reset,
  }
}
