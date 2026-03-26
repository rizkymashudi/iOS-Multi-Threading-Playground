import { useState, useEffect, useCallback } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import ThreadContainer from '../../shared/ThreadContainer'
import TaskBlock from '../../shared/TaskBlock'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'
import StatusPill from '../../shared/StatusPill'
import WarningBox from '../../shared/WarningBox'

interface ThreadState {
  id: string
  label: string
  color: string
  task: { label: string; color: string; dim: string; border: string; running: boolean } | null
  status: { text: string; bgColor: string; color: string }
}

export default function PriorityInversionScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [threads, setThreads] = useState<ThreadState[]>([])
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    setThreads([])
    setShowWarning(false)
    clearLog('priorityinversion')
  }, [reset, clearLog])

  const handleBug = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(4500)

    const initial: ThreadState[] = [
      {
        id: 'bg',
        label: '.background — syncTask()',
        color: 'var(--text3)',
        task: {
          label: 'syncTask() — holding NSLock',
          color: 'var(--text3)',
          dim: 'var(--bg4)',
          border: 'var(--border2)',
          running: true,
        },
        status: { text: 'running (bg)', bgColor: 'var(--bg4)', color: 'var(--text3)' },
      },
      {
        id: 'hi',
        label: '.userInteractive — animationFrame()',
        color: 'var(--red)',
        task: null,
        status: { text: 'idle', bgColor: 'var(--bg)', color: 'var(--text3)' },
      },
    ]
    setThreads(initial)

    log('priorityinversion', 'Background task acquires lock first…', 'warn', '')
    timeline.record('.background', 'holds NSLock', 'var(--text3)', 'var(--bg4)')

    later(() => {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === 'hi'
            ? {
                ...t,
                task: {
                  label: 'animationFrame() — BLOCKED waiting for lock',
                  color: 'var(--red)',
                  dim: 'var(--red-dim)',
                  border: 'rgba(255,85,85,.3)',
                  running: true,
                },
                status: { text: 'BLOCKED', bgColor: 'var(--red-dim)', color: 'var(--red)' },
              }
            : t,
        ),
      )
      log(
        'priorityinversion',
        '.userInteractive task needs lock — BLOCKED by .background task!',
        'error',
        'bg',
      )
      timeline.record('.userInteractive', 'BLOCKED (waiting)', 'var(--red)', 'var(--red-dim)')

      later(() => {
        log(
          'priorityinversion',
          'FRAME DROP: animation stalled > 16ms — jank visible to user',
          'error',
          'main',
        )
        setShowWarning(true)

        later(() => {
          setThreads((prev) =>
            prev.map((t) => {
              if (t.id === 'bg') {
                return {
                  ...t,
                  task: {
                    label: 'syncTask() done — lock released',
                    color: 'var(--text3)',
                    dim: 'var(--bg4)',
                    border: 'var(--border2)',
                    running: false,
                  },
                  status: { text: 'done', bgColor: 'var(--bg4)', color: 'var(--text3)' },
                }
              }
              if (t.id === 'hi') {
                return {
                  ...t,
                  task: {
                    label: 'animationFrame() running ✓',
                    color: 'var(--red)',
                    dim: 'var(--red-dim)',
                    border: 'rgba(255,85,85,.3)',
                    running: true,
                  },
                  status: { text: 'unblocked ✓', bgColor: 'var(--teal-dim)', color: 'var(--teal)' },
                }
              }
              return t
            }),
          )
          log(
            'priorityinversion',
            '.background task finished — lock released. QoS elevation resolved inversion.',
            'ok',
            'bg',
          )
          timeline.record(
            '.userInteractive',
            'unblocked → running',
            'var(--teal)',
            'var(--teal-dim)',
          )()
          log(
            'priorityinversion',
            '.userInteractive unblocked — animation resumes (too late for this frame)',
            'ok',
            'bg',
          )
        }, 1200)
      }, 600)
    }, 600)
  }, [later, log, timeline, handleReset])

  const handleFix = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(2800)

    const initial: ThreadState[] = [
      {
        id: 'bg',
        label: '.background — syncTask() [QoS boosted]',
        color: 'var(--amber)',
        task: {
          label: 'syncTask() [QoS boosted by OS]',
          color: 'var(--amber)',
          dim: 'var(--amber-dim)',
          border: 'rgba(255,184,108,.3)',
          running: true,
        },
        status: { text: 'boosted!', bgColor: 'var(--amber-dim)', color: 'var(--amber)' },
      },
      {
        id: 'hi',
        label: '.userInteractive — animationFrame()',
        color: 'var(--teal)',
        task: null,
        status: { text: 'idle', bgColor: 'var(--bg)', color: 'var(--text3)' },
      },
    ]
    setThreads(initial)

    log(
      'priorityinversion',
      'GCD QoS propagation: background task boosted to userInteractive when waiter arrives',
      'ok',
      '',
    )
    const tlBg = timeline.record(
      '.background (boosted)',
      'syncTask fast',
      'var(--amber)',
      'var(--amber-dim)',
    )

    later(() => {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === 'hi'
            ? {
                ...t,
                task: {
                  label: 'animationFrame() — waiting (short)',
                  color: 'var(--teal)',
                  dim: 'var(--teal-dim)',
                  border: 'rgba(80,250,123,.3)',
                  running: true,
                },
                status: {
                  text: 'waiting (brief)',
                  bgColor: 'var(--teal-dim)',
                  color: 'var(--teal)',
                },
              }
            : t,
        ),
      )
      timeline.record('.userInteractive', 'waiting (brief)', 'var(--teal)', 'var(--teal-dim)')
      log(
        'priorityinversion',
        '.userInteractive arrives — OS auto-elevates .background QoS to match',
        'ok',
        'bg',
      )

      later(() => {
        tlBg()
        setThreads((prev) =>
          prev.map((t) => {
            if (t.id === 'bg') {
              return {
                ...t,
                task: {
                  label: 'syncTask() done quickly ✓',
                  color: 'var(--amber)',
                  dim: 'var(--amber-dim)',
                  border: 'rgba(255,184,108,.3)',
                  running: false,
                },
                status: { text: 'done fast', bgColor: 'var(--teal-dim)', color: 'var(--teal)' },
              }
            }
            if (t.id === 'hi') {
              return {
                ...t,
                task: {
                  label: 'animationFrame() on time ✓ — no frame drop!',
                  color: 'var(--teal)',
                  dim: 'var(--teal-dim)',
                  border: 'rgba(80,250,123,.3)',
                  running: false,
                },
                status: { text: 'on time ✓', bgColor: 'var(--teal-dim)', color: 'var(--teal)' },
              }
            }
            return t
          }),
        )
        log(
          'priorityinversion',
          '.background completed quickly (boosted) — lock released in time',
          'ok',
          'bg',
        )
        timeline.record('.userInteractive', 'runs on time ✓', 'var(--teal)', 'var(--teal-dim)')()
        log(
          'priorityinversion',
          'Animation delivered on time — no jank! QoS propagation resolved inversion.',
          'ok',
          'main',
        )
      }, 500)
    }, 400)
  }, [later, log, timeline, handleReset])

  return (
    <>
      <div className="controls">
        <button className="sim-btn-danger" onClick={handleBug}>
          ⚠ Trigger Priority Inversion
        </button>
        <button className="sim-btn-primary" onClick={handleFix}>
          ▶ With QoS Propagation fix
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        <strong>Real world:</strong> A background sync task holds a lock that a userInteractive
        animation task needs. The high-priority task stalls — causing a frame drop. The OS QoS
        propagation temporarily boosts the low-priority task to unblock the higher one.
      </InfoCard>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {threads.map((t) => (
          <ThreadContainer
            key={t.id}
            label={t.label}
            color={t.color}
            status={
              <StatusPill text={t.status.text} bgColor={t.status.bgColor} color={t.status.color} />
            }
          >
            {t.task && (
              <TaskBlock
                label={t.task.label}
                color={t.task.color}
                dimColor={t.task.dim}
                borderColor={t.task.border}
                running={t.task.running}
                faded={!t.task.running}
              />
            )}
          </ThreadContainer>
        ))}
      </div>

      {showWarning && (
        <WarningBox title="Priority Inversion — high-priority task blocked by low-priority">
          The .background task holds a lock the .userInteractive animation needs. The animation
          frame drops. Without QoS propagation the UI stalls indefinitely. Fix: GCD auto-boosts the
          waiter&apos;s QoS. For Swift Concurrency use actors instead of explicit locks to avoid
          this entirely.
        </WarningBox>
      )}

      <Timeline
        sceneId="priorityinversion"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={4500}
      />

      <LogPanel id="priorityinversion" entries={logs['priorityinversion'] || []} />
    </>
  )
}
