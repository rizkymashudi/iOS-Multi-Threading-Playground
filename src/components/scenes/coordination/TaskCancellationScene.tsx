import { useState, useEffect, useCallback, useRef } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'

interface StepEntry {
  label: string
  state: 'ok' | 'cancel' | 'pending'
}

const STEPS = [
  { label: 'Checkpoint 1: guard !isCancelled', ms: 200, phase: 'pre-network' },
  { label: 'await searchAPI(query: "paket")', ms: 800, phase: 'network' },
  { label: 'Checkpoint 2: checkCancellation()', ms: 1200, phase: 'post-network' },
  { label: 'parse(results)', ms: 400, phase: 'parse' },
  { label: 'Checkpoint 3: guard !isCancelled', ms: 300, phase: 'pre-ui' },
  { label: 'MainActor: updateResults()', ms: 200, phase: 'ui' },
]

export default function TaskCancellationScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [taskState, setTaskState] = useState<'idle' | 'running' | 'cancelled' | 'completed'>('idle')
  const [checkpoint, setCheckpoint] = useState('—')
  const [steps, setSteps] = useState<StepEntry[]>([])
  const runningRef = useRef(false)

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    runningRef.current = false
    setTaskState('idle')
    setCheckpoint('—')
    setSteps([])
    clearLog('taskcancellation')
  }, [reset, clearLog])

  const handleCancel = useCallback(() => {
    if (!runningRef.current) return
    runningRef.current = false
    setTaskState('cancelled')
    log('taskcancellation', 'searchTask.cancel() — user navigated away', 'error', 'main')
  }, [log])

  const handleRun = useCallback(() => {
    handleReset()
    runningRef.current = true
    setTaskState('running')
    timeline.clear()
    timeline.animate(3500)

    log('taskcancellation', 'Task { await searchAPI("paket data") } started', '', 'main')
    const tlTask = timeline.record('searchTask', 'running', 'var(--main)', 'var(--main-dim)')

    let cumulativeMs = 0

    STEPS.forEach((step, idx) => {
      cumulativeMs += step.ms

      later(() => {
        if (!runningRef.current && step.phase !== 'pre-network') {
          setSteps((prev) => [...prev, { label: step.label, state: 'cancel' }])
          setCheckpoint('cancelled at: ' + step.label)
          log(
            'taskcancellation',
            `${step.label} → Task.isCancelled = true, stopping`,
            'error',
            'bg',
          )
          if (idx === STEPS.length - 1 || !runningRef.current) {
            tlTask()
            timeline.record('searchTask', 'CANCELLED', 'var(--red)', 'var(--red-dim)')()
          }
          return
        }

        setSteps((prev) => [...prev, { label: step.label, state: 'ok' }])
        setCheckpoint(step.label)

        const isCheckpoint = step.phase.startsWith('pre') || step.phase === 'post-network'
        if (isCheckpoint) {
          timeline.record(
            'Checkpoints',
            step.label.split(':')[0],
            'var(--amber)',
            'var(--amber-dim)',
          )()
        } else {
          timeline.record('Work', step.label, 'var(--main)', 'var(--main-dim)')()
        }
        log('taskcancellation', `${step.label} — isCancelled=false, continue`, 'ok', 'bg')

        if (idx === STEPS.length - 1) {
          tlTask()
          setTaskState('completed')
          log('taskcancellation', 'Search complete — UI updated on main thread', 'ok', 'main')
        }
      }, cumulativeMs)
    })
  }, [later, log, timeline, handleReset])

  const stateColor =
    taskState === 'running'
      ? 'var(--main)'
      : taskState === 'cancelled'
        ? 'var(--red)'
        : taskState === 'completed'
          ? 'var(--teal)'
          : 'var(--teal)'

  const stateText = taskState === 'completed' ? 'completed ✓' : taskState

  return (
    <>
      <div className="controls">
        <button className="sim-btn-primary" onClick={handleRun}>
          ▶ Start Search
        </button>
        <button className="sim-btn-danger" onClick={handleCancel}>
          ⏸ Cancel (user navigates away)
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        <strong>Real world:</strong> User types in a search box, triggering an API call. They
        navigate away before results arrive. The in-flight{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>Task</code> must be cancelled to
        avoid updating a deallocated screen. Watch{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>Task.isCancelled</code>{' '}
        checkpoints stop work early.
      </InfoCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div className="section-heading">Task state</div>
          <div className="actor-box">
            <div
              style={{
                fontSize: 11,
                color: 'var(--text3)',
                fontFamily: 'var(--mono)',
                marginBottom: 8,
              }}
            >
              searchTask: Task&lt;Void, Never&gt;
            </div>
            <div
              style={{
                fontSize: 22,
                fontFamily: 'var(--mono)',
                fontWeight: 700,
                color: stateColor,
                textAlign: 'center',
                padding: '12px 0',
              }}
            >
              {stateText}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--text2)',
                fontFamily: 'var(--mono)',
                marginTop: 4,
                textAlign: 'center',
              }}
            >
              {checkpoint}
            </div>
          </div>
        </div>
        <div>
          <div className="section-heading">Checkpoints</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {steps.map((s, i) => {
              const stCol = s.state === 'ok' ? 'var(--teal)' : 'var(--red)'
              const icon = s.state === 'ok' ? '✓' : '✗'
              return (
                <div key={i} className="actor-task" style={{ borderColor: stCol + '44' }}>
                  <div className="task-dot" style={{ background: stCol }} />
                  <span style={{ color: stCol }}>{icon}</span>{' '}
                  <span style={{ color: 'var(--text2)' }}>{s.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Timeline
        sceneId="taskcancellation"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={3500}
      />

      <LogPanel id="taskcancellation" entries={logs['taskcancellation'] || []} />
    </>
  )
}
