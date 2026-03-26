import { useState, useEffect, useCallback, useRef } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import ThreadContainer from '../../shared/ThreadContainer'
import TaskBlock from '../../shared/TaskBlock'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'
import StatusPill from '../../shared/StatusPill'
import ProgressBar from '../../shared/ProgressBar'

interface PhotoUpload {
  id: number
  size: string
  dur: number
  status: 'queued' | 'uploading' | 'done'
}

export default function DispatchSemaphoreScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [limit, setLimit] = useState(2)
  const [photos, setPhotos] = useState<PhotoUpload[]>([])
  const [activeSlots, setActiveSlots] = useState(0)
  const runningRef = useRef(0)
  const queueRef = useRef<PhotoUpload[]>([])

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    runningRef.current = 0
    queueRef.current = []
    setPhotos([])
    setActiveSlots(0)
    clearLog('semaphore')
  }, [reset, clearLog])

  const handleRun = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(5000)

    const generated: PhotoUpload[] = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      size: (0.8 + Math.random() * 3.2).toFixed(1) + 'MB',
      dur: 600 + Math.random() * 1400,
      status: 'queued' as const,
    }))

    setPhotos(generated)
    queueRef.current = [...generated]
    runningRef.current = 0

    function tryStart() {
      while (runningRef.current < limit && queueRef.current.length > 0) {
        const p = queueRef.current.shift()!
        runningRef.current++
        setActiveSlots(runningRef.current)

        setPhotos((prev) =>
          prev.map((ph) => (ph.id === p.id ? { ...ph, status: 'uploading' } : ph)),
        )
        log('semaphore', `photo_${p.id}.jpg — semaphore.wait() acquired slot, uploading`, '', 'bg')
        const tlUp = timeline.record(
          `photo_${p.id}`,
          'uploading',
          'var(--purple)',
          'var(--purple-dim)',
        )

        later(() => {
          tlUp()
          runningRef.current--
          setActiveSlots(runningRef.current)
          setPhotos((prev) => prev.map((ph) => (ph.id === p.id ? { ...ph, status: 'done' } : ph)))
          log('semaphore', `photo_${p.id}.jpg — upload done, semaphore.signal()`, 'ok', 'bg')
          tryStart()
        }, p.dur)
      }
    }

    later(tryStart, 100)
  }, [later, log, timeline, handleReset, limit])

  return (
    <>
      <div className="controls">
        <button className="sim-btn-primary" onClick={handleRun}>
          ▶ Simulate Upload Queue
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
        <div className="slider-row" style={{ flex: 1, minWidth: 180 }}>
          <span>Max concurrent</span>
          <input
            type="range"
            min={1}
            max={5}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
          <span className="slider-val">{limit}</span>
        </div>
      </div>

      <InfoCard>
        <strong>Real world:</strong> Upload 8 photos to a CDN but limit to N concurrent uploads to
        avoid network saturation. A{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>DispatchSemaphore(value: N)</code>{' '}
        acts as a token bucket — each upload acquires a token, releases when done.
      </InfoCard>

      <div className="section-heading">
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--purple)',
            display: 'inline-block',
          }}
        />
        Upload queue — max concurrent slots
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {photos.map((p) => (
          <ThreadContainer
            key={p.id}
            label={`photo_${p.id}.jpg (${p.size})`}
            color={p.status === 'done' ? 'var(--teal)' : 'var(--text3)'}
            status={
              p.status === 'done' ? (
                <StatusPill text="done ✓" bgColor="var(--teal-dim)" color="var(--teal)" />
              ) : p.status === 'uploading' ? (
                <StatusPill text="uploading" bgColor="var(--purple-dim)" color="var(--purple)" />
              ) : (
                <StatusPill text="queued" bgColor="var(--bg)" color="var(--text3)" />
              )
            }
          >
            {p.status === 'queued' ? (
              <span style={{ color: 'var(--text3)', fontSize: 11, fontFamily: 'var(--mono)' }}>
                // waiting for slot…
              </span>
            ) : (
              <TaskBlock
                label={p.status === 'done' ? `uploaded ✓` : `uploading… (${p.size})`}
                color={p.status === 'done' ? 'var(--teal)' : 'var(--purple)'}
                dimColor={p.status === 'done' ? 'var(--teal-dim)' : 'var(--purple-dim)'}
                borderColor={p.status === 'done' ? 'rgba(80,250,123,.3)' : 'rgba(189,147,249,.3)'}
                running={p.status === 'uploading'}
                faded={p.status === 'done'}
              />
            )}
          </ThreadContainer>
        ))}
      </div>

      {photos.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Active slots:{' '}
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--purple)', fontWeight: 600 }}>
              {activeSlots}
            </span>{' '}
            / {limit}
          </div>
          <ProgressBar percent={(activeSlots / limit) * 100} color="var(--purple)" />
        </div>
      )}

      <Timeline
        sceneId="semaphore"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={5000}
      />

      <LogPanel id="semaphore" entries={logs['semaphore'] || []} />
    </>
  )
}
