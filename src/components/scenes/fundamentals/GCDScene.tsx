import { useState, useEffect, useCallback } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import ThreadContainer from '../../shared/ThreadContainer'
import TaskBlock from '../../shared/TaskBlock'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'
import StatusPill from '../../shared/StatusPill'
import ProgressBar from '../../shared/ProgressBar'

const COLORS = [
  { color: 'var(--main)', dim: 'var(--main-dim)', border: 'rgba(79,142,247,.25)' },
  { color: 'var(--teal)', dim: 'var(--teal-dim)', border: 'rgba(45,212,168,.25)' },
  { color: 'var(--purple)', dim: 'var(--purple-dim)', border: 'rgba(167,139,250,.25)' },
  { color: 'var(--amber)', dim: 'var(--amber-dim)', border: 'rgba(245,166,35,.25)' },
  { color: 'var(--red)', dim: 'var(--red-dim)', border: 'rgba(240,92,92,.25)' },
  { color: 'var(--green)', dim: 'var(--green-dim)', border: 'rgba(74,222,128,.2)' },
]

const CONCURRENT_DURATIONS = [700, 1100, 600, 1400, 800, 1000, 500, 900]

interface TaskState {
  label: string
  color: string
  dim: string
  border: string
  running: boolean
  faded: boolean
}

export default function GCDScene() {
  const { later, log, clearLog, logs, timeline, reset } = useSimulation()
  const [taskCount, setTaskCount] = useState(4)
  const [running, setRunning] = useState(false)
  const [serialTasks, setSerialTasks] = useState<TaskState[]>([])
  const [concurrentTasks, setConcurrentTasks] = useState<TaskState[]>([])
  const [serialProgress, setSerialProgress] = useState(0)
  const [serialStatus, setSerialStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [concurrentStatus, setConcurrentStatus] = useState<'idle' | 'running' | 'done'>('idle')

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    setRunning(false)
    setSerialTasks([])
    setConcurrentTasks([])
    setSerialProgress(0)
    setSerialStatus('idle')
    setConcurrentStatus('idle')
    clearLog('gcd')
  }, [reset, clearLog])

  const handleRun = useCallback(() => {
    if (running) return
    handleReset()
    setRunning(true)

    const n = taskCount
    const taskDuration = 900
    timeline.clear()
    timeline.animate(n * taskDuration + 1200)

    // Serial queue
    setSerialStatus('running')
    log('gcd', 'Serial queue started', 'ok', 'main')

    let serialDelay = 0
    for (let i = 0; i < n; i++) {
      const c = COLORS[i % COLORS.length]
      const label = `task-${i + 1}`

      ;((idx, delay, col) => {
        later(() => {
          log('gcd', `serial.async { ${label} } dispatched`, '', 'main')
          setSerialTasks((prev) => [
            ...prev,
            {
              label,
              color: col.color,
              dim: col.dim,
              border: col.border,
              running: true,
              faded: false,
            },
          ])
          setSerialProgress(((idx + 1) / n) * 100)
          const tlDone = timeline.record('Serial Q', label, col.color, col.dim)

          later(() => {
            tlDone()
            log('gcd', `${label} completed`, 'ok', 'bg')
            setSerialTasks((prev) =>
              prev.map((t) => (t.label === label ? { ...t, running: false, faded: true } : t)),
            )
            if (idx === n - 1) {
              setSerialStatus('done')
            }
          }, taskDuration - 100)
        }, delay)
      })(i, serialDelay, c)

      serialDelay += taskDuration
    }

    // Concurrent queue — all at once
    log('gcd', 'Concurrent queue started', 'ok', 'main')
    setConcurrentStatus('running')

    for (let i = 0; i < n; i++) {
      const c = COLORS[i % COLORS.length]
      const label = `task-${i + 1}`
      const dur = CONCURRENT_DURATIONS[i % CONCURRENT_DURATIONS.length]

      ;((idx, col, d) => {
        later(() => {
          log('gcd', `concurrent.async { ${label} } — running on pool`, '', 'main')
          setConcurrentTasks((prev) => [
            ...prev,
            {
              label,
              color: col.color,
              dim: col.dim,
              border: col.border,
              running: true,
              faded: false,
            },
          ])
          const tlDone = timeline.record('Concurrent Q', label, col.color, col.dim)

          later(() => {
            tlDone()
            log('gcd', `${label} completed`, 'ok', `bg${(idx % 3) + 1}`)
            setConcurrentTasks((prev) =>
              prev.map((t) => (t.label === label ? { ...t, running: false, faded: true } : t)),
            )
            if (idx === n - 1) {
              later(() => {
                setConcurrentStatus('done')
              }, 200)
            }
          }, d)
        }, 50 * idx)
      })(i, c, dur)
    }
  }, [running, taskCount, later, log, timeline, handleReset])

  const serialStatusPill =
    serialStatus === 'running' ? (
      <StatusPill text="running" bgColor="var(--main-dim)" color="var(--main)" />
    ) : serialStatus === 'done' ? (
      <StatusPill text="done ✓" bgColor="var(--teal-dim)" color="var(--teal)" />
    ) : (
      <StatusPill text="idle" bgColor="var(--bg)" color="var(--text3)" />
    )

  const concurrentStatusPill =
    concurrentStatus === 'running' ? (
      <StatusPill text="running" bgColor="var(--teal-dim)" color="var(--teal)" />
    ) : concurrentStatus === 'done' ? (
      <StatusPill text="done ✓" bgColor="var(--teal-dim)" color="var(--teal)" />
    ) : (
      <StatusPill text="idle" bgColor="var(--bg)" color="var(--text3)" />
    )

  return (
    <>
      <div className="controls">
        <button className="sim-btn-primary" onClick={handleRun}>
          ▶ Run Simulation
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
        <div className="slider-row" style={{ flex: 1, minWidth: 180 }}>
          <span>Tasks</span>
          <input
            type="range"
            min={2}
            max={8}
            value={taskCount}
            onChange={(e) => setTaskCount(Number(e.target.value))}
          />
          <span className="slider-val">{taskCount}</span>
        </div>
      </div>

      <InfoCard>
        <strong>Real world:</strong> An image gallery app downloads thumbnails. A serial queue
        processes them one-by-one to update a database in order; a concurrent queue downloads all
        images in parallel for faster loading.{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>DispatchQueue</code> lets you
        choose the right strategy for each job.
      </InfoCard>

      <div className="section-heading">
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--main)',
            display: 'inline-block',
          }}
        />
        Serial Queue — tasks execute one-by-one
      </div>

      <ThreadContainer
        label='DispatchQueue(label: "serial", attributes: .serial)'
        color="var(--main)"
        status={serialStatusPill}
      >
        {serialTasks.length === 0 ? (
          <span style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--mono)' }}>
            {'// waiting...'}
          </span>
        ) : (
          serialTasks.map((t) => (
            <TaskBlock
              key={t.label}
              label={t.label}
              color={t.color}
              dimColor={t.dim}
              borderColor={t.border}
              running={t.running}
              faded={t.faded}
            />
          ))
        )}
      </ThreadContainer>
      <div style={{ padding: '0 0 4px' }}>
        <ProgressBar percent={serialProgress} color="var(--main)" />
      </div>

      <div className="section-heading">
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--teal)',
            display: 'inline-block',
          }}
        />
        Concurrent Queue — tasks run in parallel
      </div>

      <ThreadContainer
        label="DispatchQueue.global(qos: .userInitiated)"
        color="var(--teal)"
        status={concurrentStatusPill}
      >
        {concurrentTasks.length === 0 ? (
          <span style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--mono)' }}>
            {'// waiting...'}
          </span>
        ) : (
          concurrentTasks.map((t) => (
            <TaskBlock
              key={t.label}
              label={t.label}
              color={t.color}
              dimColor={t.dim}
              borderColor={t.border}
              running={t.running}
              faded={t.faded}
            />
          ))
        )}
      </ThreadContainer>

      <Timeline
        sceneId="gcd"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={taskCount * 900 + 1200}
      />

      <LogPanel id="gcd" entries={logs['gcd'] || []} onClear={() => clearLog('gcd')} />
    </>
  )
}
