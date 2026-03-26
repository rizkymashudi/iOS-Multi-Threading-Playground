import { useState, useEffect, useCallback } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import ThreadContainer from '../../shared/ThreadContainer'
import TaskBlock from '../../shared/TaskBlock'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'
import StatusPill from '../../shared/StatusPill'
import WarningBox from '../../shared/WarningBox'

interface TaskState {
  label: string
  color: string
  dim: string
  border: string
  running: boolean
  faded: boolean
  spin?: boolean
}

export default function DeadlockScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [mainTasks, setMainTasks] = useState<TaskState[]>([
    {
      label: 'RunLoop.main',
      color: 'var(--teal)',
      dim: 'var(--teal-dim)',
      border: 'rgba(45,212,168,.2)',
      running: false,
      faded: false,
    },
  ])
  const [lockTasks, setLockTasks] = useState<TaskState[]>([])
  const [mainStatus, setMainStatus] = useState<'running' | 'deadlocked'>('running')
  const [lockStatus, setLockStatus] = useState<'idle' | 'waiting' | 'deadlocked'>('idle')
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    setMainTasks([
      {
        label: 'RunLoop.main',
        color: 'var(--teal)',
        dim: 'var(--teal-dim)',
        border: 'rgba(45,212,168,.2)',
        running: false,
        faded: false,
      },
    ])
    setLockTasks([])
    setMainStatus('running')
    setLockStatus('idle')
    setShowWarning(false)
    clearLog('deadlock')
  }, [reset, clearLog])

  const handleDemo = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(3000)

    log('deadlock', 'viewDidLoad() called — on main thread', '', 'main')
    timeline.record('Main Thread', 'viewDidLoad()', 'var(--teal)', 'var(--teal-dim)')

    later(() => {
      setMainTasks((prev) => [
        ...prev,
        {
          label: 'DispatchQueue.main.sync { }',
          color: 'var(--red)',
          dim: 'var(--red-dim)',
          border: 'rgba(240,92,92,.25)',
          running: true,
          faded: false,
        },
      ])
      log(
        'deadlock',
        'DispatchQueue.main.sync { } called — BLOCKING main thread...',
        'warn',
        'main',
      )
      timeline.record('Main Thread', 'main.sync { } BLOCKED', 'var(--red)', 'var(--red-dim)')
      timeline.record('sync closure', 'waiting for main…', 'var(--amber)', 'var(--amber-dim)')

      later(() => {
        setLockTasks([
          {
            label: '⏳ waiting for main...',
            color: 'var(--amber)',
            dim: 'var(--amber-dim)',
            border: 'rgba(245,166,35,.25)',
            running: true,
            faded: false,
          },
        ])
        setLockStatus('waiting')
        log('deadlock', 'sync closure waiting for main thread to be free...', 'warn', 'bg')

        later(() => {
          setMainStatus('deadlocked')
          setLockStatus('deadlocked')
          setMainTasks((prev) =>
            prev.map((t) =>
              t.label === 'DispatchQueue.main.sync { }'
                ? { ...t, label: 'main.sync — blocked forever', spin: true }
                : t,
            ),
          )
          setLockTasks([
            {
              label: 'waiting for main — never comes',
              color: 'var(--red)',
              dim: 'var(--red-dim)',
              border: 'rgba(240,92,92,.25)',
              running: true,
              faded: false,
              spin: true,
            },
          ])
          log(
            'deadlock',
            'DEADLOCK: main waiting for closure, closure waiting for main',
            'error',
            'main',
          )
          log(
            'deadlock',
            'App freezes — no crash log, no recovery. Force kill required.',
            'error',
            '',
          )
          setShowWarning(true)
        }, 900)
      }, 600)
    }, 600)
  }, [later, log, timeline, handleReset])

  const handleFix = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(1800)

    log('deadlock', 'viewDidLoad() — calling DispatchQueue.main.async { }', '', 'main')
    const tlVDL = timeline.record('Main Thread', 'viewDidLoad()', 'var(--teal)', 'var(--teal-dim)')

    later(() => {
      setMainTasks((prev) => [
        ...prev,
        {
          label: 'DispatchQueue.main.async { }',
          color: 'var(--main)',
          dim: 'var(--main-dim)',
          border: 'rgba(79,142,247,.25)',
          running: true,
          faded: false,
        },
      ])
      log('deadlock', 'async dispatched — main thread NOT blocked', 'ok', 'main')
      const tlAsync = timeline.record(
        'Main Thread',
        'async { label.text }',
        'var(--main)',
        'var(--main-dim)',
      )

      later(() => {
        tlVDL()
        tlAsync()
        setMainTasks((prev) =>
          prev.map((t) =>
            t.label === 'DispatchQueue.main.async { }'
              ? { ...t, label: 'label.text = "hello" ✓', running: false }
              : t,
          ),
        )
        log('deadlock', 'Closure executed on next run loop cycle — no deadlock!', 'ok', 'main')
      }, 800)
    }, 600)
  }, [later, log, timeline, handleReset])

  const mainStatusPill =
    mainStatus === 'deadlocked' ? (
      <StatusPill text="DEADLOCKED" bgColor="var(--red-dim)" color="var(--red)" />
    ) : (
      <StatusPill text="running" bgColor="var(--teal-dim)" color="var(--teal)" />
    )

  const lockStatusPill =
    lockStatus === 'deadlocked' ? (
      <StatusPill text="DEADLOCKED" bgColor="var(--red-dim)" color="var(--red)" />
    ) : lockStatus === 'waiting' ? (
      <StatusPill text="waiting..." bgColor="var(--amber-dim)" color="var(--amber)" />
    ) : (
      <StatusPill text="idle" bgColor="var(--bg)" color="var(--text3)" />
    )

  return (
    <>
      <div className="controls">
        <button className="sim-btn-danger" onClick={handleDemo}>
          ⚠ Trigger Deadlock
        </button>
        <button className="sim-btn-primary" onClick={handleFix}>
          ▶ Show Fix
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        A deadlock occurs when Thread A waits for Thread B, and Thread B waits for Thread A — both
        block forever. The most common iOS deadlock: calling{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>DispatchQueue.main.sync</code>{' '}
        <em>from</em> the main thread.
      </InfoCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div className="section-heading" style={{ color: 'var(--red)' }}>
            Main Thread
          </div>
          <ThreadContainer label="Thread.main" color="var(--teal)" status={mainStatusPill}>
            <div
              style={{
                minHeight: 100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
              }}
            >
              {mainTasks.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {t.spin ? (
                    <div
                      className={`task-block${t.running ? ' task-running' : ''}`}
                      style={{
                        background: t.dim,
                        color: t.color,
                        border: `1px solid ${t.border}`,
                      }}
                    >
                      <div className="task-dot" style={{ background: t.color }} />
                      <span className="spin">↻</span> {t.label}
                    </div>
                  ) : (
                    <TaskBlock
                      label={t.label}
                      color={t.color}
                      dimColor={t.dim}
                      borderColor={t.border}
                      running={t.running}
                      faded={t.faded}
                    />
                  )}
                </div>
              ))}
            </div>
          </ThreadContainer>
        </div>
        <div>
          <div className="section-heading" style={{ color: 'var(--red)' }}>
            Blocked State
          </div>
          <ThreadContainer label="sync { } waiting" color="var(--red)" status={lockStatusPill}>
            <div
              style={{
                minHeight: 100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
              }}
            >
              {lockTasks.map((t, i) => (
                <div key={i}>
                  {t.spin ? (
                    <div
                      className={`task-block${t.running ? ' task-running' : ''}`}
                      style={{
                        background: t.dim,
                        color: t.color,
                        border: `1px solid ${t.border}`,
                      }}
                    >
                      <div className="task-dot" style={{ background: t.color }} />
                      <span className="spin">↻</span> {t.label}
                    </div>
                  ) : (
                    <TaskBlock
                      label={t.label}
                      color={t.color}
                      dimColor={t.dim}
                      borderColor={t.border}
                      running={t.running}
                      faded={t.faded}
                    />
                  )}
                </div>
              ))}
            </div>
          </ThreadContainer>
        </div>
      </div>

      {showWarning && (
        <WarningBox title="Deadlock detected — application frozen">
          Main thread is waiting for{' '}
          <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>sync</code> to execute, but sync
          can only execute on main. Classic circular wait. Fix: always use{' '}
          <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>DispatchQueue.main.async</code>{' '}
          instead.
        </WarningBox>
      )}

      <Timeline
        sceneId="deadlock"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={3000}
      />

      <LogPanel id="deadlock" entries={logs['deadlock'] || []} />
    </>
  )
}
