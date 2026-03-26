import { useState, useEffect, useCallback, useRef } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import ThreadContainer from '../../shared/ThreadContainer'
import TaskBlock from '../../shared/TaskBlock'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'
import WarningBox from '../../shared/WarningBox'

const WRITERS = ['SDK-Thread-1', 'SDK-Thread-2', 'SDK-Thread-3']
const COLORS = ['var(--main)', 'var(--purple)', 'var(--amber)']
const DIMS = ['var(--main-dim)', 'var(--purple-dim)', 'var(--amber-dim)']

interface WriterTask {
  writer: string
  color: string
  label: string
  faded: boolean
}

export default function LocksScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [writerTasks, setWriterTasks] = useState<WriterTask[]>([])
  const [buffer, setBuffer] = useState<{ name: string; color: string }[]>([])
  const [lockState, setLockState] = useState<{ icon: string; label: string }>({
    icon: '🔓',
    label: 'unlocked',
  })
  const [showWarning, setShowWarning] = useState(false)
  const corruptRef = useRef(false)

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    corruptRef.current = false
    setWriterTasks([])
    setBuffer([])
    setLockState({ icon: '🔓', label: 'unlocked' })
    setShowWarning(false)
    clearLog('locks')
  }, [reset, clearLog])

  const handleDemo = useCallback(
    (mode: 'nolock' | 'nslock' | 'unfair') => {
      handleReset()
      timeline.clear()
      timeline.animate(2500)

      log(
        'locks',
        mode === 'nolock'
          ? 'No lock — concurrent writes to analytics buffer'
          : `${mode === 'nslock' ? 'NSLock' : 'os_unfair_lock'} — serialized writes`,
        mode === 'nolock' ? 'warn' : 'ok',
        '',
      )

      let serialOffset = 0

      WRITERS.forEach((w, i) => {
        for (let j = 0; j < 4; j++) {
          const wi = i
          const wj = j
          const wcol = COLORS[i]
          const wdim = DIMS[i]
          const baseDelay =
            mode === 'nolock' ? Math.random() * 1200 : serialOffset++ * 180 + wi * 60

          later(() => {
            const evLabel = `track("event_${wi * 4 + wj + 1}")`
            setWriterTasks((prev) => [
              ...prev.filter((t) => t.writer !== w),
              { writer: w, color: wcol, label: evLabel, faded: false },
            ])

            if (mode !== 'nolock') {
              setLockState({ icon: '🔒', label: `locked by ${w}` })
              timeline.record(w, 'track(event)', wcol, wdim)
            } else {
              timeline.record(w, 'RACE write', wcol, wdim)
            }

            later(() => {
              setWriterTasks((prev) =>
                prev.map((t) =>
                  t.writer === w && t.label === evLabel ? { ...t, faded: true } : t,
                ),
              )

              const evName = `event_${wi * 4 + wj + 1}`
              const corrupt = mode === 'nolock' && Math.random() < 0.3

              if (corrupt) {
                corruptRef.current = true
                log('locks', `${w}: CORRUPT WRITE — race on analyticsEvents`, 'error', 'bg')
                setShowWarning(true)
              } else {
                setBuffer((prev) => [...prev, { name: evName, color: wcol }])
                if (mode !== 'nolock') {
                  setLockState({ icon: '🔓', label: 'unlocked' })
                }
                log(
                  'locks',
                  `${w}: ${mode !== 'nolock' ? 'lock.lock() → ' : ''}append(${evName})${mode !== 'nolock' ? ' → lock.unlock()' : ''}`,
                  'ok',
                  'bg',
                )
              }
            }, 160)
          }, baseDelay)
        }
      })
    },
    [later, log, timeline, handleReset],
  )

  return (
    <>
      <div className="controls">
        <button className="sim-btn-danger" onClick={() => handleDemo('nolock')}>
          ⚠ No lock (crash)
        </button>
        <button className="sim-btn-primary" onClick={() => handleDemo('nslock')}>
          ▶ NSLock
        </button>
        <button className="sim-btn-primary" onClick={() => handleDemo('unfair')}>
          ▶ os_unfair_lock
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        <strong>Real world:</strong> An SDK analytics buffer collects events from multiple threads.
        Without a lock, simultaneous writes corrupt the array.{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>NSLock</code> is simple and safe;{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>os_unfair_lock</code> is faster
        but requires careful use.
      </InfoCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div>
          <div className="section-heading">Writer threads</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {WRITERS.map((w, i) => {
              const task = writerTasks.find((t) => t.writer === w)
              return (
                <ThreadContainer key={w} label={w} color={COLORS[i]}>
                  {task && (
                    <TaskBlock
                      label={task.label}
                      color={task.color}
                      dimColor={DIMS[i]}
                      borderColor={task.color + '44'}
                      running={!task.faded}
                      faded={task.faded}
                    />
                  )}
                </ThreadContainer>
              )
            })}
          </div>
        </div>
        <div>
          <div className="section-heading">Lock state</div>
          <div className="actor-box">
            <div style={{ fontSize: 28, textAlign: 'center', padding: '8px 0' }}>
              {lockState.icon}
            </div>
            <div
              style={{
                textAlign: 'center',
                fontFamily: 'var(--mono)',
                fontSize: 12,
                color: 'var(--text2)',
              }}
            >
              {lockState.label}
            </div>
          </div>
        </div>
        <div>
          <div className="section-heading">Buffer</div>
          <div className="actor-box">
            <div
              style={{
                fontSize: 11,
                fontFamily: 'var(--mono)',
                color: 'var(--text3)',
                marginBottom: 6,
              }}
            >
              analyticsEvents: [Event]
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 40 }}>
              {buffer.map((ev, i) => (
                <div
                  key={i}
                  className="queue-item"
                  style={{ color: ev.color, borderColor: ev.color + '44', fontSize: 10 }}
                >
                  {ev.name}
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                fontFamily: 'var(--mono)',
                color: 'var(--text2)',
              }}
            >
              count: <span style={{ color: 'var(--green)' }}>{buffer.length}</span>
            </div>
          </div>
        </div>
      </div>

      {showWarning && (
        <WarningBox title="Data corruption — concurrent array mutation">
          Two threads wrote simultaneously — an event was lost or the array structure corrupted. In
          production: crash (EXC_BAD_ACCESS) or silently dropped analytics events.
        </WarningBox>
      )}

      <Timeline
        sceneId="locks"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={2500}
      />

      <LogPanel id="locks" entries={logs['locks'] || []} />
    </>
  )
}
