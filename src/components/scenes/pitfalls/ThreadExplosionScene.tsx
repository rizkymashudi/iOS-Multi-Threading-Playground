import { useState, useEffect, useCallback, useRef } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'
import WarningBox from '../../shared/WarningBox'
import ProgressBar from '../../shared/ProgressBar'

const PILL_COLORS = ['#8be9fd', '#bd93f9', '#ffb86c', '#ff5555', '#50fa7b', '#ff79c6']
const FIX_COLORS = ['#8be9fd', '#bd93f9', '#50fa7b']

export default function ThreadExplosionScene() {
  const { log, logs, timeline, reset, clearLog, speed } = useSimulation()
  const [pills, setPills] = useState<{ color: string; label: string }[]>([])
  const [threadCount, setThreadCount] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [warningText, setWarningText] = useState('')
  const [barColor, setBarColor] = useState('var(--amber)')
  const intervalsRef = useRef<number[]>([])

  useEffect(() => {
    return () => {
      reset()
      intervalsRef.current.forEach((iv) => clearInterval(iv))
    }
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    intervalsRef.current.forEach((iv) => clearInterval(iv))
    intervalsRef.current = []
    setPills([])
    setThreadCount(0)
    setShowWarning(false)
    setBarColor('var(--amber)')
    clearLog('explosion')
  }, [reset, clearLog])

  const handleDemo = useCallback(() => {
    handleReset()
    log('explosion', 'Calling concurrent.async { concurrent.sync { } } repeatedly...', 'warn', '')
    timeline.clear()
    timeline.animate(5000)

    let i = 0
    let count = 0
    const iv = window.setInterval(() => {
      if (i >= 52) {
        clearInterval(iv)
        log(
          'explosion',
          `Thread explosion! ${count} threads created — system thrashing`,
          'error',
          '',
        )
        setShowWarning(true)
        setWarningText(
          `GCD spawned ${count} threads because each sync { } blocked a thread, forcing new ones. This exhausts the 64-thread limit, causing priority inversion, memory pressure, and eventual watchdog termination.`,
        )
        return
      }
      const color = PILL_COLORS[i % PILL_COLORS.length]
      const label = `T${i}`
      setPills((prev) => [...prev, { color, label }])
      count++
      setThreadCount(count)
      if (count >= 50) setBarColor('var(--red)')
      if (i % 8 === 0) {
        log('explosion', `Thread ${i} spawned — queue saturated, spawning more`, 'warn', 'bg')
        timeline.record('Thread pool', `T${i} spawned (blocked)`, color, color + '22')()
      }
      i++
    }, 80 / speed)
    intervalsRef.current.push(iv)
  }, [log, timeline, speed, handleReset])

  const handleFix = useCallback(() => {
    handleReset()
    log('explosion', 'Using async — no threads blocked, cooperative pool reuses threads', 'ok', '')
    timeline.clear()
    timeline.animate(2500)

    let peak = 0
    const iv = window.setInterval(() => {
      if (peak < 4) {
        const color = FIX_COLORS[peak % FIX_COLORS.length]
        setPills((prev) => [...prev, { color, label: `T${peak}` }])
        setThreadCount((prev) => prev + 1)
        peak++
      } else {
        clearInterval(iv)
        log('explosion', `Only ${peak} threads used — async allows pool reuse`, 'ok', '')
      }
    }, 400 / speed)
    intervalsRef.current.push(iv)
  }, [log, timeline, speed, handleReset])

  return (
    <>
      <div className="controls">
        <button className="sim-btn-danger" onClick={handleDemo}>
          ⚠ Create Thread Explosion
        </button>
        <button className="sim-btn-primary" onClick={handleFix}>
          ▶ Show Fix (async)
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        Calling <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>.sync</code> on a
        concurrent queue from within a concurrent task blocks a thread, forcing GCD to spawn a new
        thread to compensate. This cascades into hundreds of threads — exhausting system resources.
      </InfoCard>

      <div className="section-heading">Active Threads</div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 5,
          minHeight: 80,
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: 12,
          alignContent: 'flex-start',
        }}
      >
        {pills.map((p, i) => (
          <div key={i} className="thread-pill" style={{ background: p.color }}>
            {p.label}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>
        Thread count:{' '}
        <span style={{ fontFamily: 'var(--mono)', color: 'var(--amber)', fontWeight: 600 }}>
          {threadCount}
        </span>{' '}
        / 64 (system limit)
      </div>
      <ProgressBar percent={(threadCount / 64) * 100} color={barColor} />

      {showWarning && (
        <WarningBox title="Thread explosion — system resource exhaustion">{warningText}</WarningBox>
      )}

      <Timeline
        sceneId="explosion"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={5000}
      />

      <LogPanel id="explosion" entries={logs['explosion'] || []} />
    </>
  )
}
