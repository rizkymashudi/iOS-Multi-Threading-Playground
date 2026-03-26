import { useState, useEffect, useCallback, useRef } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import ThreadContainer from '../../shared/ThreadContainer'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'

const WRITERS = ['Writer-A', 'Writer-B', 'Writer-C']
const WRITER_COLORS = ['var(--main)', 'var(--purple)', 'var(--teal)']

interface DataItem {
  value: string
  color: string
  flash: boolean
}

interface WriterTask {
  label: string
  done: boolean
}

export default function SerialIsolationScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [data, setData] = useState<DataItem[]>([])
  const dataRef = useRef<string[]>([])
  const [writerTasks, setWriterTasks] = useState<Record<number, WriterTask[]>>({})

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    dataRef.current = []
    setData([])
    setWriterTasks({})
    clearLog('serial')
  }, [reset, clearLog])

  const handleDemo = useCallback(
    (mode: 'unsafe' | 'safe') => {
      handleReset()
      timeline.clear()
      timeline.animate(1800)

      // Initialize writer containers
      const initial: Record<number, WriterTask[]> = {}
      WRITERS.forEach((_, i) => {
        initial[i] = []
      })
      setWriterTasks(initial)

      if (mode === 'unsafe') {
        log('serial', 'No synchronization — concurrent appends to shared array', 'warn', '')
        WRITERS.forEach((w, i) => {
          const col = WRITER_COLORS[i]
          for (let j = 0; j < 4; j++) {
            ;((wi, wj) => {
              later(() => {
                const val = `${w.slice(-1)}${wj + 1}`
                const tlS = timeline.record(w, `append(${val})`, col, col + '22')
                dataRef.current.push(val)
                tlS()
                setData((prev) => [...prev, { value: val, color: col, flash: true }])
                setWriterTasks((prev) => ({
                  ...prev,
                  [wi]: [...(prev[wi] || []), { label: val, done: true }],
                }))
                log('serial', `${w} appended "${val}" — unsynchronized`, 'warn', `bg${wi + 1}`)
              }, Math.random() * 1200)
            })(i, j)
          }
        })
      } else {
        log('serial', 'Using private serial DispatchQueue — all appends serialized', 'ok', '')
        const ops: { w: string; i: number; j: number; delay: number }[] = []
        WRITERS.forEach((w, i) => {
          for (let j = 0; j < 4; j++) {
            ops.push({ w, i, j, delay: Math.random() * 1200 })
          }
        })
        ops.sort((a, b) => a.delay - b.delay)

        ops.forEach((op, offset) => {
          later(
            () => {
              const val = `${op.w.slice(-1)}${op.j + 1}`
              const col = WRITER_COLORS[op.i]
              const tlQ = timeline.record('Serial Q', `append(${val})`, col, col + '22')
              dataRef.current.push(val)
              tlQ()
              setData((prev) => [...prev, { value: val, color: col, flash: false }])
              setWriterTasks((prev) => ({
                ...prev,
                [op.i]: [...(prev[op.i] || []), { label: val, done: true }],
              }))
              log(
                'serial',
                `queue.async { append("${val}") } — serialized safely`,
                'ok',
                `bg${op.i + 1}`,
              )
            },
            offset * 220 + 100,
          )
        })
      }
    },
    [later, log, timeline, handleReset],
  )

  return (
    <>
      <div className="controls">
        <button className="sim-btn-danger" onClick={() => handleDemo('unsafe')}>
          ⚠ Concurrent (unsafe)
        </button>
        <button className="sim-btn-primary" onClick={() => handleDemo('safe')}>
          ▶ Serial isolation (safe)
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        A <strong>private serial queue</strong> as a mutex: all access to shared state funnels
        through one queue, so no two operations can overlap. Simple and effective — no locks needed.
      </InfoCard>

      <div className="actor-box">
        <div className="actor-title">
          <span style={{ color: 'var(--green)' }}>var</span> sharedData: [String] = []
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            minHeight: 40,
            marginBottom: 8,
          }}
        >
          {data.map((item, i) => (
            <div
              key={i}
              className={`queue-item${item.flash ? ' race-flash' : ''}`}
              style={{ color: item.color, borderColor: item.color + '44' }}
            >
              {item.value}
            </div>
          ))}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--text2)',
            fontFamily: 'var(--mono)',
          }}
        >
          count: <span style={{ color: 'var(--green)' }}>{data.length}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {WRITERS.map((w, i) => (
          <ThreadContainer key={w} label={w} color={WRITER_COLORS[i]}>
            <div style={{ minHeight: 40, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(writerTasks[i] || []).map((t, j) => (
                <div
                  key={j}
                  className="task-block"
                  style={{
                    background: WRITER_COLORS[i] + '22',
                    color: WRITER_COLORS[i],
                    border: `1px solid ${WRITER_COLORS[i]}44`,
                    fontSize: '10.5px',
                    opacity: t.done ? 0.5 : 1,
                  }}
                >
                  <div className="task-dot" style={{ background: WRITER_COLORS[i] }} />
                  append("{t.label}")
                </div>
              ))}
            </div>
          </ThreadContainer>
        ))}
      </div>

      <Timeline
        sceneId="serial"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={1800}
      />

      <LogPanel id="serial" entries={logs['serial'] || []} />
    </>
  )
}
