import { useState, useEffect, useCallback } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import ThreadContainer from '../../shared/ThreadContainer'
import TaskBlock from '../../shared/TaskBlock'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'

interface PoolTask {
  label: string
  color: string
  dim: string
  border: string
  running: boolean
  faded: boolean
}

export default function AsyncAwaitScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [poolTasks, setPoolTasks] = useState<PoolTask[]>([])
  const [mainTasks, setMainTasks] = useState<PoolTask[]>([
    {
      label: 'UI idle — ready',
      color: 'var(--teal)',
      dim: 'var(--teal-dim)',
      border: 'rgba(45,212,168,.2)',
      running: false,
      faded: false,
    },
  ])

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    setPoolTasks([])
    setMainTasks([
      {
        label: 'UI idle — ready',
        color: 'var(--teal)',
        dim: 'var(--teal-dim)',
        border: 'rgba(45,212,168,.2)',
        running: false,
        faded: false,
      },
    ])
    clearLog('asyncawait')
  }, [reset, clearLog])

  const handleRun = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(3500)

    log('asyncawait', 'Task { await loadProfile() } started', '', 'main')

    later(() => {
      setPoolTasks([
        {
          label: 'Task: loadProfile() running',
          color: 'var(--main)',
          dim: 'var(--main-dim)',
          border: 'rgba(79,142,247,.25)',
          running: true,
          faded: false,
        },
      ])
      log('asyncawait', 'Running on cooperative pool thread', '', 'bg')
      const tlLoad = timeline.record('Coop Pool', 'loadProfile()', 'var(--main)', 'var(--main-dim)')

      later(() => {
        tlLoad()
        setPoolTasks((prev) =>
          prev.map((t) =>
            t.label === 'Task: loadProfile() running'
              ? { ...t, label: 'await fetchFromAPI() — SUSPENDED', faded: true, running: false }
              : t,
          ),
        )
        log(
          'asyncawait',
          'await fetchFromAPI() — thread released to pool (not blocked!)',
          'ok',
          'bg',
        )
        const tlFetch = timeline.record(
          'Coop Pool',
          'await fetchFromAPI()',
          'var(--main)',
          'var(--main-dim)',
        )

        setPoolTasks((prev) => [
          ...prev,
          {
            label: 'Task: other work runs here',
            color: 'var(--purple)',
            dim: 'var(--purple-dim)',
            border: 'rgba(167,139,250,.25)',
            running: true,
            faded: false,
          },
        ])
        log(
          'asyncawait',
          'Pool thread reused for another task while first is suspended',
          'ok',
          'bg',
        )
        const tlOther = timeline.record(
          'Coop Pool',
          'other work (reuse)',
          'var(--purple)',
          'var(--purple-dim)',
        )

        later(() => {
          tlOther()
          setPoolTasks((prev) =>
            prev.map((t) => {
              if (t.label === 'Task: other work runs here')
                return { ...t, running: false, faded: true }
              if (t.label === 'await fetchFromAPI() — SUSPENDED')
                return {
                  ...t,
                  label: 'fetchFromAPI() resumed — got data',
                  faded: false,
                  running: true,
                }
              return t
            }),
          )
          log('asyncawait', 'fetchFromAPI() returned — task resumes on pool', 'ok', 'bg')

          later(() => {
            tlFetch()
            setPoolTasks((prev) =>
              prev.map((t) =>
                t.label === 'fetchFromAPI() resumed — got data'
                  ? {
                      ...t,
                      label: 'await MainActor.run { } — hopping...',
                      running: false,
                      faded: true,
                    }
                  : t,
              ),
            )
            const tlMainActor = timeline.record(
              '@MainActor',
              'label.text = name',
              'var(--teal)',
              'var(--teal-dim)',
            )

            setMainTasks([
              {
                label: '@MainActor: label.text = name ✓',
                color: 'var(--teal)',
                dim: 'var(--teal-dim)',
                border: 'rgba(45,212,168,.25)',
                running: true,
                faded: false,
              },
            ])
            log('asyncawait', 'MainActor.run { } — executing on main thread', 'ok', 'main')

            later(() => {
              tlMainActor()
              setMainTasks((prev) => prev.map((t) => ({ ...t, running: false })))
              log('asyncawait', 'UI updated safely — all done!', 'ok', 'main')
            }, 600)
          }, 700)
        }, 900)
      }, 700)
    }, 300)
  }, [later, log, timeline, handleReset])

  return (
    <>
      <div className="controls">
        <button className="sim-btn-primary" onClick={handleRun}>
          ▶ Run async/await Flow
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        <strong>Real world:</strong> A weather app fetches forecast data with{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>async/await</code> — the thread
        suspends at the network call instead of blocking. The cooperative thread pool reuses that
        thread for other work.{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>@MainActor</code> guarantees UI
        hops automatically.
      </InfoCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div className="section-heading">Cooperative Thread Pool</div>
          <ThreadContainer label="Swift Concurrency Pool" color="var(--main)">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                minHeight: 120,
              }}
            >
              {poolTasks.map((t, i) => (
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
          <div className="section-heading" style={{ color: 'var(--teal)' }}>
            @MainActor
          </div>
          <ThreadContainer label="Main Thread" color="var(--teal)">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                minHeight: 120,
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
      </div>

      <Timeline
        sceneId="asyncawait"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={3500}
      />

      <LogPanel id="asyncawait" entries={logs['asyncawait'] || []} />
    </>
  )
}
