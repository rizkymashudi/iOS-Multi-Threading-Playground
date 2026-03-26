import { useState, useEffect, useCallback, useRef } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import ThreadContainer from '../../shared/ThreadContainer'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'
import ProgressBar from '../../shared/ProgressBar'

const THREAD_COUNT = 6
const INCREMENTS_PER_THREAD = 10
const THREAD_COLORS = [
  'var(--main)',
  'var(--purple)',
  'var(--teal)',
  'var(--amber)',
  'var(--red)',
  'var(--green)',
]
export default function DataRaceScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [counter, setCounter] = useState(0)
  const counterRef = useRef(0)
  const [expected] = useState(THREAD_COUNT * INCREMENTS_PER_THREAD)
  const [isSafe, setIsSafe] = useState(false)
  const [threadValues, setThreadValues] = useState<Record<number, string>>({})
  const [showThreads, setShowThreads] = useState(false)

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    counterRef.current = 0
    setCounter(0)
    setIsSafe(false)
    setThreadValues({})
    setShowThreads(false)
    clearLog('race')
  }, [reset, clearLog])

  const handleRaceDemo = useCallback(() => {
    handleReset()
    setShowThreads(true)
    timeline.clear()
    timeline.animate(2500)

    log(
      'race',
      `Launching ${THREAD_COUNT} threads, each incrementing counter ${INCREMENTS_PER_THREAD}x`,
      'warn',
      '',
    )

    for (let t = 0; t < THREAD_COUNT; t++) {
      for (let i = 0; i < INCREMENTS_PER_THREAD; i++) {
        const delay = Math.random() * 1500
        ;((ti) => {
          later(() => {
            const read = counterRef.current
            later(
              () => {
                const glitch = Math.random() < 0.4
                if (!glitch) {
                  counterRef.current = read + 1
                } else {
                  counterRef.current = Math.max(
                    0,
                    counterRef.current + (Math.random() > 0.5 ? 1 : 0),
                  )
                }
                const val = counterRef.current
                setCounter(val)
                setThreadValues((prev) => ({ ...prev, [ti]: `+1 → ${val}` }))
                if (i === INCREMENTS_PER_THREAD - 1) {
                  log(
                    'race',
                    `Thread-${ti + 1}: done. counter=${val} (expected grew by ${INCREMENTS_PER_THREAD})`,
                    'warn',
                    `bg${(ti % 3) + 1}`,
                  )
                }
              },
              80 + Math.random() * 60,
            )
          }, delay)
        })(t)
      }
    }

    later(() => {
      const val = counterRef.current
      const diff = Math.abs(val - expected)
      if (diff > 0) {
        log(
          'race',
          `RACE CONDITION: final=${val}, expected=${expected}, lost ${diff} increments`,
          'error',
          '',
        )
      }
    }, 2200)
  }, [later, log, timeline, expected, handleReset])

  const handleFix = useCallback(() => {
    handleReset()
    setIsSafe(true)
    timeline.clear()
    timeline.animate(1500)

    log('race', 'Using serial DispatchQueue to serialize all increments', 'ok', '')

    const ops: { t: number; delay: number }[] = []
    for (let t = 0; t < THREAD_COUNT; t++) {
      for (let i = 0; i < INCREMENTS_PER_THREAD; i++) {
        ops.push({ t, delay: Math.random() * 1200 })
      }
    }
    ops.sort((a, b) => a.delay - b.delay)

    ops.forEach((op) => {
      later(() => {
        const tlDone = timeline.record(
          'Serial Q',
          `+1 → ${counterRef.current + 1}`,
          'var(--teal)',
          'var(--teal-dim)',
        )
        counterRef.current++
        tlDone()
        setCounter(counterRef.current)
        if (counterRef.current === expected) {
          log('race', `All done! counter=${counterRef.current} — matches expected ✓`, 'ok', '')
        }
      }, op.delay)
    })
  }, [later, log, timeline, expected, handleReset])

  return (
    <>
      <div className="controls">
        <button className="sim-btn-danger" onClick={handleRaceDemo}>
          ⚠ Trigger Data Race
        </button>
        <button className="sim-btn-primary" onClick={handleFix}>
          ▶ Show Fix (Serial Queue)
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        <strong>Real world:</strong> An analytics SDK increments a shared event counter from
        multiple network callback threads. Without synchronization, increments get lost — the final
        count is wrong, and in production you get silent data loss or{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>EXC_BAD_ACCESS</code> crashes.
      </InfoCard>

      <div className="actor-box">
        <div className="actor-title">
          <span style={{ color: 'var(--amber)' }}>var</span>
          <span style={{ color: 'var(--text)' }}>counter: Int = 0</span>
          <span
            className="sendable-check"
            style={
              isSafe
                ? {
                    background: 'var(--teal-dim)',
                    color: 'var(--teal)',
                    border: '1px solid rgba(45,212,168,0.3)',
                  }
                : {
                    background: 'var(--red-dim)',
                    color: 'var(--red)',
                    border: '1px solid rgba(240,92,92,0.3)',
                  }
            }
          >
            {isSafe ? '✓ Thread-safe (serial queue)' : '⚠ Not thread-safe'}
          </span>
        </div>
        <div
          style={{
            fontSize: 26,
            fontFamily: 'var(--mono)',
            fontWeight: 700,
            color: 'var(--text)',
            textAlign: 'center',
            padding: '16px 0',
          }}
        >
          {counter}
        </div>
        <div
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--text3)',
            marginBottom: 8,
          }}
        >
          Expected: {expected}
        </div>
        <ProgressBar percent={(counter / expected) * 100} color="var(--amber)" />
      </div>

      {showThreads && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {Array.from({ length: THREAD_COUNT }, (_, t) => (
            <ThreadContainer key={t} label={`Thread-${t + 1}`} color={THREAD_COLORS[t]}>
              <div style={{ minHeight: 40 }}>
                {threadValues[t] && (
                  <div
                    className="task-block race-flash"
                    style={{
                      background: `${THREAD_COLORS[t]}22`,
                      color: THREAD_COLORS[t],
                      border: `1px solid ${THREAD_COLORS[t]}44`,
                      fontSize: '10.5px',
                    }}
                  >
                    <div className="task-dot" style={{ background: THREAD_COLORS[t] }} />
                    {threadValues[t]}
                  </div>
                )}
              </div>
            </ThreadContainer>
          ))}
        </div>
      )}

      <Timeline
        sceneId="race"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={2500}
      />

      <LogPanel id="race" entries={logs['race'] || []} />
    </>
  )
}
