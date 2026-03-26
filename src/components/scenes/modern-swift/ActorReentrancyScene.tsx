import { useState, useEffect, useCallback } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'
import WarningBox from '../../shared/WarningBox'

interface TaskEntry {
  color: string
  borderColor: string
  label: string
  done: boolean
}

export default function ActorReentrancyScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [cacheValue, setCacheValue] = useState('nil')
  const [loadingValue, setLoadingValue] = useState('false')
  const [tasks, setTasks] = useState<TaskEntry[]>([])
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    setCacheValue('nil')
    setLoadingValue('false')
    setTasks([])
    setShowWarning(false)
    clearLog('reentrancy')
  }, [reset, clearLog])

  const handleDemo = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(2500)

    log('reentrancy', 'Two tasks call buggyLoad() simultaneously', 'warn', '')

    later(() => {
      setTasks([
        {
          color: 'var(--main)',
          borderColor: 'rgba(79,142,247,.4)',
          label: 'Task-1 buggyLoad() — isLoading=false, proceed',
          done: false,
        },
      ])
      setLoadingValue('true')
      log('reentrancy', 'Task-1: isLoading=false → sets isLoading=true, begins await', '', 'bg')
      const tlT1 = timeline.record('Task-1', 'buggyLoad() await…', 'var(--main)', 'var(--main-dim)')

      later(() => {
        setTasks((prev) => [
          ...prev,
          {
            color: 'var(--purple)',
            borderColor: 'rgba(167,139,250,.4)',
            label: 'Task-2 buggyLoad() — isLoading=true → returns early',
            done: false,
          },
        ])
        log(
          'reentrancy',
          'Task-2 enters during Task-1 suspension — sees isLoading=true, exits',
          'warn',
          'bg',
        )
        const tlT2 = timeline.record(
          'Task-2',
          'enters + exits',
          'var(--purple)',
          'var(--purple-dim)',
        )
        tlT2()

        later(() => {
          tlT1()
          setTasks((prev) =>
            prev.map((t) =>
              t.label.startsWith('Task-1')
                ? { ...t, label: 'Task-1 resumed — sets data = "loaded"' }
                : t,
            ),
          )
          setCacheValue('"loaded"')
          setLoadingValue('false')
          log(
            'reentrancy',
            'Task-1 resumed — data set. But if another task mutated first, invariant broken!',
            'warn',
            'bg',
          )
          setShowWarning(true)
        }, 900)
      }, 500)
    }, 200)
  }, [later, log, timeline, handleReset])

  const handleFix = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(2200)

    log('reentrancy', 'Two tasks call safeLoad() — re-checks state after await', 'ok', '')

    later(() => {
      setTasks([
        {
          color: 'var(--teal)',
          borderColor: 'rgba(45,212,168,.4)',
          label: 'Task-1 safeLoad() — guard data==nil && !isLoading → proceed',
          done: false,
        },
      ])
      setLoadingValue('true')
      log('reentrancy', 'Task-1: guards pass, begins await fetchData()', 'ok', 'bg')

      later(() => {
        setTasks((prev) => [
          ...prev,
          {
            color: 'var(--teal)',
            borderColor: 'rgba(45,212,168,.4)',
            label: 'Task-2 safeLoad() — isLoading=true → early exit',
            done: false,
          },
        ])
        log('reentrancy', 'Task-2: sees isLoading=true → exits cleanly', 'ok', 'bg')

        later(() => {
          setTasks((prev) =>
            prev.map((t) =>
              t.label.startsWith('Task-1')
                ? { ...t, label: 'Task-1 resumed — re-check: data==nil ✓ → set data' }
                : t,
            ),
          )
          setCacheValue('"loaded"')
          setLoadingValue('false')
          log(
            'reentrancy',
            'Task-1 resumed — re-checked data==nil, safe to assign. No reentrancy bug!',
            'ok',
            'bg',
          )
        }, 900)
      }, 500)
    }, 200)
  }, [later, log, timeline, handleReset])

  return (
    <>
      <div className="controls">
        <button className="sim-btn-danger" onClick={handleDemo}>
          ⚠ Trigger Reentrancy Bug
        </button>
        <button className="sim-btn-primary" onClick={handleFix}>
          ▶ Show Fix
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        <strong>Real world:</strong> A bank account actor checks the balance, then{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>await</code>s a network
        confirmation. While suspended, another withdrawal enters and drains the balance — the first
        resumes and double-spends. Always re-check state after every{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>await</code>.
      </InfoCard>

      <div className="actor-box">
        <div className="actor-title">
          <span style={{ color: 'var(--purple)' }}>actor</span> Cache
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text3)',
                marginBottom: 6,
                fontFamily: 'var(--mono)',
              }}
            >
              var data: String?
            </div>
            <div
              style={{
                fontSize: 13,
                fontFamily: 'var(--mono)',
                padding: '8px 12px',
                background: 'var(--bg4)',
                borderRadius: 6,
                color: 'var(--text2)',
              }}
            >
              {cacheValue}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text3)',
                marginBottom: 6,
                fontFamily: 'var(--mono)',
              }}
            >
              var isLoading: Bool
            </div>
            <div
              style={{
                fontSize: 13,
                fontFamily: 'var(--mono)',
                padding: '8px 12px',
                background: 'var(--bg4)',
                borderRadius: 6,
                color: 'var(--text2)',
              }}
            >
              {loadingValue}
            </div>
          </div>
        </div>
        <div className="actor-queue" style={{ marginTop: 12 }}>
          {tasks.map((t, i) => (
            <div
              key={i}
              className="actor-task"
              style={{ borderColor: t.borderColor, opacity: t.done ? 0.35 : 1 }}
            >
              <div className="task-dot" style={{ background: t.color }} />
              <span style={{ color: t.color }}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {showWarning && (
        <WarningBox title="Actor reentrancy: state checked before await may be stale after">
          Task-1 checked{' '}
          <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>isLoading=false</code> and set
          it to true. But while it awaited, Task-2 could enter. After Task-1 resumes, any assumption
          it made before the <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>await</code>{' '}
          may be wrong. Always re-check actor state after every{' '}
          <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>await</code>.
        </WarningBox>
      )}

      <Timeline
        sceneId="reentrancy"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={2500}
      />

      <LogPanel id="reentrancy" entries={logs['reentrancy'] || []} />
    </>
  )
}
