import { useState, useEffect, useCallback } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import ThreadContainer from '../../shared/ThreadContainer'
import TaskBlock from '../../shared/TaskBlock'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'

interface OpState {
  type: 'read' | 'write'
  label: string
  running: boolean
  done: boolean
}

const OPS = [
  { type: 'read' as const, label: 'read() — sync', delay: 0, dur: 700 },
  { type: 'read' as const, label: 'read() — sync', delay: 80, dur: 600 },
  { type: 'read' as const, label: 'read() — sync', delay: 160, dur: 800 },
  { type: 'write' as const, label: 'write("new") — barrier', delay: 900, dur: 500 },
  { type: 'read' as const, label: 'read() — sync', delay: 1500, dur: 600 },
  { type: 'read' as const, label: 'read() — sync', delay: 1580, dur: 700 },
]

export default function DispatchBarrierScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [ops, setOps] = useState<OpState[]>([])

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    setOps([])
    clearLog('barrier')
  }, [reset, clearLog])

  const handleRun = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(2500)

    OPS.forEach((op) => {
      later(() => {
        const opState: OpState = {
          type: op.type,
          label: op.label,
          running: true,
          done: false,
        }
        setOps((prev) => [...prev, opState])

        if (op.type === 'write') {
          log('barrier', 'BARRIER write acquired — all readers must finish first', 'warn', 'bg')
          const tlBarr = timeline.record(
            'Barrier write',
            'write("new")',
            'var(--red)',
            'var(--red-dim)',
          )
          later(() => {
            tlBarr()
            setOps((prev) =>
              prev.map((o, idx) =>
                idx === prev.length - 1 ? { ...o, running: false, done: true } : o,
              ),
            )
            log('barrier', 'write("new") done — barrier released', 'ok', 'bg')
          }, op.dur)
        } else {
          log('barrier', 'read() running concurrently', '', 'bg')
          const tlRead = timeline.record(
            'Concurrent read',
            'read()',
            'var(--main)',
            'var(--main-dim)',
          )
          later(() => {
            tlRead()
            setOps((prev) => {
              const readIdx = prev.findIndex(
                (o, idx) => o.type === 'read' && o.running && idx >= prev.length - 3,
              )
              if (readIdx >= 0) {
                return prev.map((o, idx) =>
                  idx === readIdx ? { ...o, running: false, done: true } : o,
                )
              }
              return prev
            })
          }, op.dur)
        }
      }, op.delay)
    })
  }, [later, log, timeline, handleReset])

  const preBarrier = ops.filter((_, i) => i < 3)
  const barrierOp = ops.find((o) => o.type === 'write')
  const postBarrier = ops.filter((_, i) => i > 3)

  return (
    <>
      <div className="controls">
        <button className="sim-btn-primary" onClick={handleRun}>
          ▶ Run Reader-Writer
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        <strong>Real world:</strong> A caching layer serves images to multiple UI components reading
        concurrently, but cache invalidation must write exclusively. A{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>barrier</code> flag on the write
        block ensures no reads overlap with it — readers run in parallel, writes run alone.
      </InfoCard>

      <div className="section-heading">Concurrent Queue with Barrier</div>
      <ThreadContainer
        label='DispatchQueue(label: "rw", attributes: .concurrent)'
        color="var(--purple)"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            minHeight: 120,
            width: '100%',
          }}
        >
          {preBarrier.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '4px 0' }}>
              {preBarrier.map((op, i) => (
                <TaskBlock
                  key={`pre-${i}`}
                  label={op.done ? 'read ✓' : op.label}
                  color="var(--main)"
                  dimColor="var(--main-dim)"
                  borderColor="rgba(79,142,247,.25)"
                  running={op.running}
                  faded={op.done}
                />
              ))}
            </div>
          )}

          {barrierOp && (
            <>
              <div
                style={{
                  width: '100%',
                  height: 1,
                  background: 'rgba(240,92,92,.3)',
                  margin: '4px 0',
                }}
              />
              <div style={{ width: '100%' }}>
                <TaskBlock
                  label={barrierOp.done ? 'write complete ✓' : `⛔ BARRIER: ${barrierOp.label}`}
                  color="var(--red)"
                  dimColor="var(--red-dim)"
                  borderColor="rgba(240,92,92,.3)"
                  running={barrierOp.running}
                  faded={barrierOp.done}
                />
              </div>
            </>
          )}

          {postBarrier.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '4px 0' }}>
              {postBarrier.map((op, i) => (
                <TaskBlock
                  key={`post-${i}`}
                  label={op.done ? 'read ✓' : op.label}
                  color="var(--main)"
                  dimColor="var(--main-dim)"
                  borderColor="rgba(79,142,247,.25)"
                  running={op.running}
                  faded={op.done}
                />
              ))}
            </div>
          )}
        </div>
      </ThreadContainer>

      <Timeline
        sceneId="barrier"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={2500}
      />

      <LogPanel id="barrier" entries={logs['barrier'] || []} />
    </>
  )
}
