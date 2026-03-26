import { useState, useEffect, useCallback, useRef } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import ThreadContainer from '../../shared/ThreadContainer'
import TaskBlock from '../../shared/TaskBlock'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'
import ProgressBar from '../../shared/ProgressBar'

const QOS_LEVELS = [
  {
    name: 'userInteractive',
    label: '.userInteractive',
    color: 'var(--red)',
    dim: 'var(--red-dim)',
    border: 'rgba(240,92,92,.25)',
    speed: 400,
    desc: 'Animations, gestures',
  },
  {
    name: 'userInitiated',
    label: '.userInitiated',
    color: 'var(--amber)',
    dim: 'var(--amber-dim)',
    border: 'rgba(245,166,35,.25)',
    speed: 650,
    desc: 'Awaiting result',
  },
  {
    name: 'default',
    label: '.default',
    color: 'var(--main)',
    dim: 'var(--main-dim)',
    border: 'rgba(79,142,247,.25)',
    speed: 950,
    desc: 'General work',
  },
  {
    name: 'utility',
    label: '.utility',
    color: 'var(--purple)',
    dim: 'var(--purple-dim)',
    border: 'rgba(167,139,250,.25)',
    speed: 1400,
    desc: 'Long running',
  },
  {
    name: 'background',
    label: '.background',
    color: 'var(--text2)',
    dim: 'var(--bg4)',
    border: 'var(--border2)',
    speed: 2200,
    desc: 'Not time-sensitive',
  },
]

interface LaneState {
  name: string
  running: boolean
  done: boolean
  progress: number
}

export default function QoSScene() {
  const { later, log, logs, timeline, reset, clearLog, speed } = useSimulation()
  const [lanes, setLanes] = useState<LaneState[]>(
    QOS_LEVELS.map((q) => ({ name: q.name, running: false, done: false, progress: 0 })),
  )
  const intervalsRef = useRef<number[]>([])

  useEffect(() => {
    return () => {
      reset()
      intervalsRef.current.forEach((iv) => clearInterval(iv))
    }
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    intervalsRef.current.forEach((iv) => clearInterval(iv))
    intervalsRef.current = []
    setLanes(QOS_LEVELS.map((q) => ({ name: q.name, running: false, done: false, progress: 0 })))
    clearLog('qos')
  }, [reset, clearLog])

  const handleRun = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(3000)

    later(() => {
      QOS_LEVELS.forEach((q, i) => {
        later(() => {
          setLanes((prev) => prev.map((l) => (l.name === q.name ? { ...l, running: true } : l)))
          log('qos', `[${q.label}] task started`, '', 'bg')
          const tlDone = timeline.record(q.label, 'work()', q.color, q.dim)

          let pct = 0
          const step = 30
          const interval = q.speed / speed / (100 / step)
          const iv = window.setInterval(() => {
            pct = Math.min(100, pct + step + Math.random() * 10)
            setLanes((prev) => prev.map((l) => (l.name === q.name ? { ...l, progress: pct } : l)))
            if (pct >= 100) {
              clearInterval(iv)
              tlDone()
              setLanes((prev) =>
                prev.map((l) =>
                  l.name === q.name ? { ...l, running: false, done: true, progress: 100 } : l,
                ),
              )
              log('qos', `[${q.label}] completed`, 'ok', 'bg')
            }
          }, interval)
          intervalsRef.current.push(iv)
        }, i * 60)
      })
    }, 100)
  }, [later, log, timeline, speed, handleReset])

  return (
    <>
      <div className="controls">
        <button className="sim-btn-primary" onClick={handleRun}>
          ▶ Dispatch All QoS Tasks
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        QoS (Quality of Service) tells the system how urgent your work is. Higher QoS gets more CPU
        time. Watch how tasks with different priorities complete at different speeds.
      </InfoCard>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {QOS_LEVELS.map((q, i) => {
          const lane = lanes[i]
          return (
            <ThreadContainer
              key={q.name}
              label={`DispatchQueue.global(qos: ${q.label})`}
              color={q.color}
              status={<span style={{ fontSize: 11, color: 'var(--text3)' }}>{q.desc}</span>}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                {lane.running || lane.done ? (
                  <>
                    <TaskBlock
                      label={lane.done ? 'done ✓' : 'work()'}
                      color={q.color}
                      dimColor={q.dim}
                      borderColor={q.border}
                      running={lane.running}
                      faded={lane.done}
                    />
                    <div style={{ flex: 1 }}>
                      <ProgressBar percent={lane.progress} color={q.color} />
                    </div>
                  </>
                ) : (
                  <span style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--mono)' }}>
                    {'// idle'}
                  </span>
                )}
              </div>
            </ThreadContainer>
          )
        })}
      </div>

      <Timeline
        sceneId="qos"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={3000}
      />

      <LogPanel id="qos" entries={logs['qos'] || []} />
    </>
  )
}
