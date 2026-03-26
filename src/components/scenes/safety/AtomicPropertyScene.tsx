import { useState, useEffect, useCallback, useRef } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import ThreadContainer from '../../shared/ThreadContainer'
import TaskBlock from '../../shared/TaskBlock'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'

const THREADS = 4
const OPS = 8
const EXPECTED = THREADS * OPS
const COLORS = ['var(--main)', 'var(--purple)', 'var(--teal)', 'var(--amber)']
const DIMS = ['var(--main-dim)', 'var(--purple-dim)', 'var(--teal-dim)', 'var(--amber-dim)']

interface ThreadTask {
  thread: number
  label: string
  color: string
  faded: boolean
}

export default function AtomicPropertyScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [rawVal, setRawVal] = useState(0)
  const [atomicVal, setAtomicVal] = useState(0)
  const [threadTasks, setThreadTasks] = useState<ThreadTask[]>([])
  const [mode, setMode] = useState<'raw' | 'atomic' | null>(null)
  const rawRef = useRef(0)
  const atomicRef = useRef(0)

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    rawRef.current = 0
    atomicRef.current = 0
    setRawVal(0)
    setAtomicVal(0)
    setThreadTasks([])
    setMode(null)
    clearLog('atomic')
  }, [reset, clearLog])

  const handleDemo = useCallback(
    (demoMode: 'raw' | 'atomic') => {
      handleReset()
      setMode(demoMode)
      timeline.clear()
      timeline.animate(2200)

      log(
        'atomic',
        demoMode === 'raw'
          ? 'var pendingRequests = 0 (not atomic)'
          : '@Atomic var pendingRequests = 0',
        demoMode === 'raw' ? 'warn' : 'ok',
        '',
      )

      for (let t = 0; t < THREADS; t++) {
        for (let o = 0; o < OPS; o++) {
          const ti = t
          const col = COLORS[t]
          const dim = DIMS[t]
          const delay = Math.random() * 1500

          later(() => {
            setThreadTasks((prev) => [
              ...prev.filter((tt) => tt.thread !== ti),
              { thread: ti, label: 'pendingRequests += 1', color: col, faded: false },
            ])
            const tlOp = timeline.record(
              `Thread-${ti + 1}`,
              demoMode === 'raw' ? 'RACE +1' : 'atomic +1',
              col,
              dim,
            )

            later(
              () => {
                tlOp()
                setThreadTasks((prev) =>
                  prev.map((tt) => (tt.thread === ti && !tt.faded ? { ...tt, faded: true } : tt)),
                )

                if (demoMode === 'raw') {
                  const lost = Math.random() < 0.25
                  if (!lost) {
                    rawRef.current++
                  }
                  setRawVal(rawRef.current)
                  if (lost) {
                    log(
                      'atomic',
                      `Thread-${ti + 1}: LOST increment — race condition`,
                      'error',
                      'bg',
                    )
                  }
                } else {
                  atomicRef.current++
                  setAtomicVal(atomicRef.current)
                  if (atomicRef.current === EXPECTED) {
                    log(
                      'atomic',
                      `All increments serialized — pendingRequests=${atomicRef.current} ✓`,
                      'ok',
                      'main',
                    )
                  }
                }
              },
              80 + Math.random() * 60,
            )
          }, delay)
        }
      }
    },
    [later, log, timeline, handleReset],
  )

  return (
    <>
      <div className="controls">
        <button className="sim-btn-danger" onClick={() => handleDemo('raw')}>
          ⚠ Non-atomic (unsafe)
        </button>
        <button className="sim-btn-primary" onClick={() => handleDemo('atomic')}>
          ▶ @Atomic wrapper
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        <strong>Real world:</strong> A localization SDK tracks an active request count (
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>pendingRequests</code>)
        incremented by network callbacks on multiple threads. A custom{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>@Atomic</code> property wrapper
        protects it with a private serial queue.
      </InfoCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <div className="section-heading" style={{ color: 'var(--red)' }}>
            Raw var (not atomic)
          </div>
          <div className="actor-box">
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 12,
                color: 'var(--text3)',
                marginBottom: 8,
              }}
            >
              var pendingRequests = 0
            </div>
            <div
              style={{
                fontSize: 28,
                fontFamily: 'var(--mono)',
                fontWeight: 700,
                color: mode === 'raw' ? 'var(--text)' : 'var(--text)',
                textAlign: 'center',
                padding: '8px 0',
              }}
            >
              {mode === 'raw' ? rawVal : 0}
            </div>
            <div
              style={{
                fontSize: 11,
                textAlign: 'center',
                color: 'var(--text3)',
                fontFamily: 'var(--mono)',
              }}
            >
              expected: {mode ? EXPECTED : 0}
            </div>
          </div>
        </div>
        <div>
          <div className="section-heading" style={{ color: 'var(--green)' }}>
            @Atomic var (safe)
          </div>
          <div className="actor-box">
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 12,
                color: 'var(--text3)',
                marginBottom: 8,
              }}
            >
              @Atomic var pendingRequests = 0
            </div>
            <div
              style={{
                fontSize: 28,
                fontFamily: 'var(--mono)',
                fontWeight: 700,
                color: 'var(--teal)',
                textAlign: 'center',
                padding: '8px 0',
              }}
            >
              {mode === 'atomic' ? atomicVal : 0}
            </div>
            <div
              style={{
                fontSize: 11,
                textAlign: 'center',
                color: 'var(--text3)',
                fontFamily: 'var(--mono)',
              }}
            >
              expected: {mode ? EXPECTED : 0}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 4 }}
      >
        {Array.from({ length: THREADS }, (_, t) => {
          const task = threadTasks.find((tt) => tt.thread === t)
          return (
            <ThreadContainer key={t} label={`NetworkCallback-${t + 1}`} color={COLORS[t]}>
              {task && (
                <TaskBlock
                  label={task.label}
                  color={task.color}
                  dimColor={DIMS[t]}
                  borderColor={task.color + '44'}
                  running={!task.faded}
                  faded={task.faded}
                />
              )}
            </ThreadContainer>
          )
        })}
      </div>

      <Timeline
        sceneId="atomic"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={2200}
      />

      <LogPanel id="atomic" entries={logs['atomic'] || []} />
    </>
  )
}
