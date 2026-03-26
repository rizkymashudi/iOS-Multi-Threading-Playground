import { useState, useEffect, useCallback, useRef } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'

const CALLER_COUNT = 5
const COLORS = ['var(--main)', 'var(--purple)', 'var(--teal)', 'var(--amber)', 'var(--red)']

interface CallerState {
  color: string
  label: string
  result: string
  done: boolean
}

export default function SwiftActorsScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [unsafeCount, setUnsafeCount] = useState(0)
  const [safeCount, setSafeCount] = useState(0)
  const unsafeRef = useRef(0)
  const safeRef = useRef(0)
  const [unsafeCallers, setUnsafeCallers] = useState<CallerState[]>([])
  const [safeCallers, setSafeCallers] = useState<CallerState[]>([])

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    unsafeRef.current = 0
    safeRef.current = 0
    setUnsafeCount(0)
    setSafeCount(0)
    setUnsafeCallers([])
    setSafeCallers([])
    clearLog('actor')
  }, [reset, clearLog])

  const handleRun = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(1800)

    log('actor', `Sending ${CALLER_COUNT} concurrent increment() calls to each counter`, '')

    for (let i = 0; i < CALLER_COUNT; i++) {
      const col = COLORS[i]
      const baseDelay = Math.random() * 600

      // Unsafe — race
      later(() => {
        setUnsafeCallers((prev) => [
          ...prev,
          {
            color: col,
            label: `caller-${i + 1} increment()`,
            result: '',
            done: false,
          },
        ])
        const readVal = unsafeRef.current
        const tlDone = timeline.record('Unsafe.increment', `caller-${i + 1}`, col, col + '22')

        later(
          () => {
            const glitch = Math.random() < 0.35
            if (!glitch) unsafeRef.current = readVal + 1
            const val = unsafeRef.current
            setUnsafeCount(val)
            tlDone()
            setUnsafeCallers((prev) =>
              prev.map((c) =>
                c.label === `caller-${i + 1} increment()` && !c.done
                  ? {
                      ...c,
                      done: true,
                      result: `→ ${val}${glitch ? ' ⚠ lost write' : ''}`,
                    }
                  : c,
              ),
            )
            if (glitch) {
              log('actor', `caller-${i + 1}: RACE — write lost! count=${val}`, 'error', 'bg')
            }
          },
          200 + Math.random() * 200,
        )
      }, baseDelay)

      // Safe actor — serialize
      later(() => {
        setSafeCallers((prev) => [
          ...prev,
          {
            color: col,
            label: `caller-${i + 1} await counter.increment()`,
            result: '',
            done: false,
          },
        ])
        const tlDone = timeline.record('actor.increment', `caller-${i + 1}`, col, col + '22')

        later(
          () => {
            safeRef.current = safeRef.current + 1
            const val = safeRef.current
            setSafeCount(val)
            tlDone()
            setSafeCallers((prev) =>
              prev.map((c) =>
                c.label === `caller-${i + 1} await counter.increment()` && !c.done
                  ? { ...c, done: true, result: `→ ${val} ✓` }
                  : c,
              ),
            )
            log('actor', `caller-${i + 1}: actor serialized — count=${val}`, 'ok', 'actor')
          },
          i * 280 + 100,
        )
      }, baseDelay + 50)
    }
  }, [later, log, timeline, handleReset])

  return (
    <>
      <div className="controls">
        <button className="sim-btn-primary" onClick={handleRun}>
          ▶ Send Concurrent Requests
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        <strong>Real world:</strong> A shopping cart shared across multiple screens uses an{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>actor</code> to protect its items
        array. Concurrent add/remove calls from different views are automatically serialized — no
        data races, enforced at compile time.
      </InfoCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div className="section-heading">Without actor (❌ race)</div>
          <div className="actor-box">
            <div className="actor-title" style={{ color: 'var(--red)' }}>
              class UnsafeCounter
            </div>
            <div
              style={{
                fontSize: 13,
                fontFamily: 'var(--mono)',
                color: 'var(--text2)',
                marginBottom: 8,
              }}
            >
              var count = <span style={{ color: 'var(--red)' }}>{unsafeCount}</span>
            </div>
            <div className="actor-queue">
              {unsafeCallers.map((c, i) => (
                <div
                  key={i}
                  className="actor-task"
                  style={{
                    borderColor: c.color + '44',
                    opacity: c.done ? 0.35 : 1,
                  }}
                >
                  <div className="task-dot" style={{ background: c.color }} />
                  <span style={{ color: c.color }}>{c.done ? c.label.split(' ')[0] : c.label}</span>
                  {c.result && <span>{c.result}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="section-heading">With actor (✓ safe)</div>
          <div className="actor-box">
            <div className="actor-title" style={{ color: 'var(--teal)' }}>
              actor SafeCounter
            </div>
            <div
              style={{
                fontSize: 13,
                fontFamily: 'var(--mono)',
                color: 'var(--text2)',
                marginBottom: 8,
              }}
            >
              var count = <span style={{ color: 'var(--teal)' }}>{safeCount}</span>
            </div>
            <div className="actor-queue">
              {safeCallers.map((c, i) => (
                <div
                  key={i}
                  className="actor-task"
                  style={{
                    borderColor: c.color + '44',
                    opacity: c.done ? 0.35 : 1,
                  }}
                >
                  <div className="task-dot" style={{ background: c.color }} />
                  <span style={{ color: c.color }}>{c.done ? c.label.split(' ')[0] : c.label}</span>
                  {c.result && <span>{c.result}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Timeline
        sceneId="actor"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={1800}
      />

      <LogPanel id="actor" entries={logs['actor'] || []} />
    </>
  )
}
