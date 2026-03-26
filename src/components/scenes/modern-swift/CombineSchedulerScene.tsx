import { useState, useEffect, useCallback, useRef } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import TaskBlock from '../../shared/TaskBlock'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'

interface PipeStep {
  label: string
  color: string
  dim: string
  border: string
  threadNote: string
  active: boolean
  done: boolean
}

const CORRECT_STEPS: Omit<PipeStep, 'active' | 'done'>[] = [
  {
    label: 'publisher.sink',
    color: 'var(--main)',
    dim: 'var(--main-dim)',
    border: 'rgba(79,142,247,.25)',
    threadNote: 'DispatchQueue.global (subscribe)',
  },
  {
    label: '.subscribe(on: .global)',
    color: 'var(--main)',
    dim: 'var(--main-dim)',
    border: 'rgba(79,142,247,.25)',
    threadNote: 'DispatchQueue.global',
  },
  {
    label: '.map { parse() }',
    color: 'var(--purple)',
    dim: 'var(--purple-dim)',
    border: 'rgba(167,139,250,.25)',
    threadNote: 'DispatchQueue.global (background)',
  },
  {
    label: '.receive(on: .main)',
    color: 'var(--amber)',
    dim: 'var(--amber-dim)',
    border: 'rgba(245,166,35,.25)',
    threadNote: 'hopping to main...',
  },
  {
    label: '.sink { label.text = $0 }',
    color: 'var(--teal)',
    dim: 'var(--teal-dim)',
    border: 'rgba(45,212,168,.25)',
    threadNote: 'DispatchQueue.main ✓',
  },
]

const BAD_STEPS: Omit<PipeStep, 'active' | 'done'>[] = [
  {
    label: 'publisher.sink',
    color: 'var(--main)',
    dim: 'var(--main-dim)',
    border: 'rgba(79,142,247,.25)',
    threadNote: 'DispatchQueue.global',
  },
  {
    label: '.map { parse() }',
    color: 'var(--purple)',
    dim: 'var(--purple-dim)',
    border: 'rgba(167,139,250,.25)',
    threadNote: 'DispatchQueue.global (background)',
  },
  {
    label: '.sink { label.text = $0 } ⚠',
    color: 'var(--red)',
    dim: 'var(--red-dim)',
    border: 'rgba(240,92,92,.25)',
    threadNote: 'DispatchQueue.global (WRONG — UI on bg!)',
  },
]

export default function CombineSchedulerScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [steps, setSteps] = useState<PipeStep[]>([])
  const [threadLabel, setThreadLabel] = useState('// thread: —')
  const stepsRef = useRef<Omit<PipeStep, 'active' | 'done'>[]>([])

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    setSteps([])
    setThreadLabel('// thread: —')
    clearLog('combine')
  }, [reset, clearLog])

  const runPipeline = useCallback(
    (pipeSteps: Omit<PipeStep, 'active' | 'done'>[]) => {
      stepsRef.current = pipeSteps
      let delay = 0
      pipeSteps.forEach((step) => {
        later(() => {
          setSteps((prev) => [
            ...prev.map((s) => ({ ...s, active: false })),
            { ...step, active: true, done: false },
          ])
          setThreadLabel(`// thread: ${step.threadNote}`)
          log(
            'combine',
            `${step.label} — ${step.threadNote}`,
            step.threadNote.includes('main') ? 'ok' : '',
            '',
          )
          later(() => {
            setSteps((prev) =>
              prev.map((s) =>
                s.label === step.label && s.active ? { ...s, active: false, done: true } : s,
              ),
            )
          }, 600)
        }, delay)
        delay += 750
      })
    },
    [later, log],
  )

  const handleCorrect = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(4500)
    log('combine', 'Publisher emitted — running correct pipeline', 'ok', '')
    runPipeline(CORRECT_STEPS)
  }, [log, timeline, handleReset, runPipeline])

  const handleBad = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(3000)
    log('combine', 'Publisher emitted — missing receive(on: .main)!', 'warn', '')
    runPipeline(BAD_STEPS)
    later(() => {
      log('combine', 'VIOLATION: UILabel.text called from background thread!', 'error', '')
      log('combine', 'Fix: add .receive(on: DispatchQueue.main) before .sink', 'warn', '')
    }, 2500)
  }, [later, log, timeline, handleReset, runPipeline])

  return (
    <>
      <div className="controls">
        <button className="sim-btn-primary" onClick={handleCorrect}>
          ▶ Trigger Publisher
        </button>
        <button className="sim-btn-danger" onClick={handleBad}>
          ⚠ Without receive(on:)
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        <strong>Real world:</strong> A stock ticker app subscribes to price updates. Heavy JSON
        parsing runs on a background queue via{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>subscribe(on:)</code>, then price
        labels update on main via{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>receive(on:)</code>. Always add{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
          .receive(on: DispatchQueue.main)
        </code>{' '}
        before touching UI in your sink.
      </InfoCard>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="section-heading">Pipeline flow</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '14px 16px',
            minHeight: 60,
          }}
        >
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'contents' }}>
              {i > 0 && <span style={{ color: 'var(--text3)', fontSize: 14 }}>→</span>}
              <TaskBlock
                label={step.label}
                color={step.color}
                dimColor={step.dim}
                borderColor={step.border}
                running={step.active}
                faded={step.done}
              />
            </div>
          ))}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--text3)',
            fontFamily: 'var(--mono)',
          }}
        >
          {threadLabel}
        </div>
      </div>

      <Timeline
        sceneId="combine"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={4500}
      />

      <LogPanel id="combine" entries={logs['combine'] || []} />
    </>
  )
}
