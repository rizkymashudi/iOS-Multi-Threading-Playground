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
}

export default function MainThreadScene() {
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
  const [bgTasks, setBgTasks] = useState<TaskState[]>([])
  const [bgStatus, setBgStatus] = useState<'idle' | 'running' | 'done' | 'violation'>('idle')
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
    setBgTasks([])
    setBgStatus('idle')
    setShowWarning(false)
    clearLog('mainthread')
  }, [reset, clearLog])

  const handleDemo = useCallback(
    (mode: 'correct' | 'wrong') => {
      handleReset()
      timeline.clear()
      timeline.animate(2500)

      log('mainthread', 'DispatchQueue.global().async { }', '', 'main')
      setBgStatus('running')

      setBgTasks([
        {
          label: 'fetchData()',
          color: 'var(--main)',
          dim: 'var(--main-dim)',
          border: 'rgba(79,142,247,.25)',
          running: true,
          faded: false,
        },
      ])
      const tlFetch = timeline.record('Background', 'fetchData()', 'var(--main)', 'var(--main-dim)')

      later(() => {
        tlFetch()
        log('mainthread', 'fetchData() done — got response', 'ok', 'bg')
        setBgTasks((prev) =>
          prev.map((t) => (t.label === 'fetchData()' ? { ...t, running: false, faded: true } : t)),
        )

        if (mode === 'correct') {
          setBgTasks((prev) => [
            ...prev,
            {
              label: 'DispatchQueue.main.async { }',
              color: 'var(--purple)',
              dim: 'var(--purple-dim)',
              border: 'rgba(167,139,250,.25)',
              running: true,
              faded: false,
            },
          ])
          log('mainthread', 'DispatchQueue.main.async { } — hopping to main...', '', 'bg')

          const tlDisp = timeline.record('Main', 'UI update ✓', 'var(--teal)', 'var(--teal-dim)')

          later(() => {
            tlDisp()
            setBgTasks((prev) =>
              prev.map((t) =>
                t.label === 'DispatchQueue.main.async { }'
                  ? { ...t, running: false, faded: true }
                  : t,
              ),
            )
            setMainTasks((prev) => [
              ...prev,
              {
                label: 'label.text = data.title ✓',
                color: 'var(--teal)',
                dim: 'var(--teal-dim)',
                border: 'rgba(45,212,168,.25)',
                running: false,
                faded: false,
              },
            ])
            log('mainthread', 'label.text updated — safe on main thread', 'ok', 'main')
            setBgStatus('done')
          }, 700)
        } else {
          log('mainthread', 'UPDATING UI FROM BACKGROUND THREAD!', 'error', 'bg')
          setBgTasks((prev) => [
            ...prev,
            {
              label: 'label.text = data.title ✗',
              color: 'var(--red)',
              dim: 'var(--red-dim)',
              border: 'rgba(240,92,92,.25)',
              running: false,
              faded: false,
            },
          ])
          timeline.record('Background', 'UI violation ✗', 'var(--red)', 'var(--red-dim)')()

          later(() => {
            setShowWarning(true)
            setBgStatus('violation')
            log('mainthread', 'Runtime crash: EXC_BAD_ACCESS or visual glitch', 'error', 'bg')
          }, 400)
        }
      }, 1200)
    },
    [later, log, timeline, handleReset],
  )

  const bgStatusPill =
    bgStatus === 'running' ? (
      <StatusPill text="running" bgColor="var(--main-dim)" color="var(--main)" />
    ) : bgStatus === 'done' ? (
      <StatusPill text="done ✓" bgColor="var(--teal-dim)" color="var(--teal)" />
    ) : bgStatus === 'violation' ? (
      <StatusPill text="violation!" bgColor="var(--red-dim)" color="var(--red)" />
    ) : (
      <StatusPill text="idle" bgColor="var(--bg)" color="var(--text3)" />
    )

  return (
    <>
      <div className="controls">
        <button className="sim-btn-primary" onClick={() => handleDemo('correct')}>
          ▶ Correct pattern
        </button>
        <button className="sim-btn-danger" onClick={() => handleDemo('wrong')}>
          ⚠ UI off main thread
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        <strong>Real world:</strong> A chat app fetches new messages on a background thread, then
        updates the conversation UI. If you set{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>tableView.reloadData()</code> from
        that background thread, you get visual glitches or crashes. Always hop to{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>DispatchQueue.main.async</code>{' '}
        before touching UI.
      </InfoCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div className="section-heading">Main Thread</div>
          <ThreadContainer
            label="Thread.main"
            color="var(--teal)"
            status={<StatusPill text="running" bgColor="var(--teal-dim)" color="var(--teal)" />}
          >
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
                <TaskBlock
                  key={i}
                  label={t.label}
                  color={t.color}
                  dimColor={t.dim}
                  borderColor={t.border}
                  running={t.running}
                  faded={t.faded}
                />
              ))}
            </div>
          </ThreadContainer>
        </div>
        <div>
          <div className="section-heading">Background Thread</div>
          <ThreadContainer label="Thread (bg)" color="var(--text3)" status={bgStatusPill}>
            <div
              style={{
                minHeight: 100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
              }}
            >
              {bgTasks.map((t, i) => (
                <TaskBlock
                  key={i}
                  label={t.label}
                  color={t.color}
                  dimColor={t.dim}
                  borderColor={t.border}
                  running={t.running}
                  faded={t.faded}
                />
              ))}
            </div>
          </ThreadContainer>
        </div>
      </div>

      {showWarning && (
        <WarningBox title="Main Thread Checker: UI API called on background thread">
          UILabel.text must be used from main thread only. This can cause visual corruption, layout
          failures, or EXC_BAD_ACCESS crash. Enable Main Thread Checker in Xcode Scheme Diagnostics
          to catch this at runtime.
        </WarningBox>
      )}

      <Timeline
        sceneId="mainthread"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={2500}
      />

      <LogPanel id="mainthread" entries={logs['mainthread'] || []} />
    </>
  )
}
