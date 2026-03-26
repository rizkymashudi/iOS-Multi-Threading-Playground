import { useState, useEffect, useCallback, useRef } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import ThreadContainer from '../../shared/ThreadContainer'
import TaskBlock from '../../shared/TaskBlock'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'

const TG_LOCALES = [
  { locale: 'en-US', label: 'English', color: 'var(--main)', dim: 'var(--main-dim)', dur: 700 },
  { locale: 'id-ID', label: 'Indonesian', color: 'var(--teal)', dim: 'var(--teal-dim)', dur: 450 },
  { locale: 'ms-MY', label: 'Malay', color: 'var(--purple)', dim: 'var(--purple-dim)', dur: 900 },
  { locale: 'th-TH', label: 'Thai', color: 'var(--amber)', dim: 'var(--amber-dim)', dur: 600 },
  { locale: 'vi-VN', label: 'Vietnamese', color: 'var(--red)', dim: 'var(--red-dim)', dur: 750 },
  {
    locale: 'zh-CN',
    label: 'Chinese',
    color: 'var(--pink)',
    dim: 'rgba(255,121,198,.13)',
    dur: 500,
  },
]

interface LocaleTask {
  locale: string
  label: string
  color: string
  dim: string
  done: boolean
}

export default function TaskGroupScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [tasks, setTasks] = useState<LocaleTask[]>([])
  const [mergedLocales, setMergedLocales] = useState<{ locale: string; color: string }[]>([])
  const [allDone, setAllDone] = useState(false)
  const finishedRef = useRef(0)

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    finishedRef.current = 0
    setTasks([])
    setMergedLocales([])
    setAllDone(false)
    clearLog('taskgroup')
  }, [reset, clearLog])

  const handleRun = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(1800)

    log('taskgroup', 'withTaskGroup { } — spawning 6 child tasks in parallel', '', 'main')

    const initial: LocaleTask[] = TG_LOCALES.map((loc) => ({
      locale: loc.locale,
      label: loc.label,
      color: loc.color,
      dim: loc.dim,
      done: false,
    }))
    setTasks(initial)

    finishedRef.current = 0

    TG_LOCALES.forEach((loc) => {
      log('taskgroup', `group.addTask { fetchBundle("${loc.locale}") }`, '', 'bg')
      const tlDone = timeline.record(loc.locale, 'fetchBundle', loc.color, loc.dim)

      later(() => {
        tlDone()
        setTasks((prev) => prev.map((t) => (t.locale === loc.locale ? { ...t, done: true } : t)))
        log('taskgroup', `"${loc.locale}" bundle received — for await in group`, 'ok', 'bg')
        setMergedLocales((prev) => [...prev, { locale: loc.locale, color: loc.color }])
        finishedRef.current++

        if (finishedRef.current === TG_LOCALES.length) {
          later(() => {
            setAllDone(true)
            log('taskgroup', 'TaskGroup complete — all bundles merged into cache', 'ok', 'main')
          }, 100)
        }
      }, loc.dur)
    })
  }, [later, log, timeline, handleReset])

  return (
    <>
      <div className="controls">
        <button className="sim-btn-primary" onClick={handleRun}>
          ▶ Fetch All Localization Keys
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        <strong>Real world:</strong> A localization system needs to fetch 6 language bundles in
        parallel, then merge all results.{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>withTaskGroup</code> spawns child
        tasks concurrently; the for-await loop collects all results, and cancellation propagates
        automatically if one fails.
      </InfoCard>

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
        Parallel child tasks — collect &amp; merge
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {tasks.map((t) => (
          <ThreadContainer key={t.locale} label={t.locale} color={t.color}>
            <TaskBlock
              label={t.done ? `${t.label} ✓` : t.label}
              color={t.color}
              dimColor={t.dim}
              borderColor={t.color + '44'}
              running={!t.done}
              faded={t.done}
            />
          </ThreadContainer>
        ))}
      </div>

      {(mergedLocales.length > 0 || allDone) && (
        <div className="actor-box" style={{ marginTop: 4 }}>
          <div className="actor-title">
            <span style={{ color: 'var(--teal)' }}>merged result</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, minHeight: 30 }}>
            {mergedLocales.map((m) => (
              <div
                key={m.locale}
                className="queue-item"
                style={{ color: m.color, borderColor: m.color + '44' }}
              >
                {m.locale}
              </div>
            ))}
          </div>
          {allDone && (
            <div
              style={{
                width: '100%',
                fontSize: 12,
                fontFamily: 'var(--mono)',
                color: 'var(--teal)',
                marginTop: 6,
              }}
            >
              → all 6 bundles merged, cache populated ✓
            </div>
          )}
        </div>
      )}

      <Timeline
        sceneId="taskgroup"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={1800}
      />

      <LogPanel id="taskgroup" entries={logs['taskgroup'] || []} />
    </>
  )
}
