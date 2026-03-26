import { useState, useEffect, useCallback, useRef } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import ThreadContainer from '../../shared/ThreadContainer'
import TaskBlock from '../../shared/TaskBlock'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'
import StatusPill from '../../shared/StatusPill'

const DG_APIS = [
  {
    id: 'profile',
    label: 'fetchUserProfile()',
    color: 'var(--main)',
    dim: 'var(--main-dim)',
    dur: 800,
  },
  {
    id: 'balance',
    label: 'fetchBalance()',
    color: 'var(--teal)',
    dim: 'var(--teal-dim)',
    dur: 500,
  },
  {
    id: 'quota',
    label: 'fetchDataQuota()',
    color: 'var(--purple)',
    dim: 'var(--purple-dim)',
    dur: 1100,
  },
  {
    id: 'promos',
    label: 'fetchPromos()',
    color: 'var(--amber)',
    dim: 'var(--amber-dim)',
    dur: 650,
  },
]

interface ApiState {
  id: string
  label: string
  color: string
  dim: string
  done: boolean
}

export default function DispatchGroupScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [apis, setApis] = useState<ApiState[]>([])
  const [notifyVisible, setNotifyVisible] = useState(false)
  const [notifyFired, setNotifyFired] = useState(false)
  const doneCount = useRef(0)

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    doneCount.current = 0
    setApis([])
    setNotifyVisible(false)
    setNotifyFired(false)
    clearLog('dispatchgroup')
  }, [reset, clearLog])

  const handleRun = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(2500)

    log('dispatchgroup', 'group.enter() × 4 — dispatching dashboard requests', '', 'main')

    const initialApis = DG_APIS.map((api) => ({
      id: api.id,
      label: api.label,
      color: api.color,
      dim: api.dim,
      done: false,
    }))
    setApis(initialApis)

    DG_APIS.forEach((api) => {
      log('dispatchgroup', `group.enter() → ${api.label} dispatched`, '', 'bg')
      const tlDone = timeline.record(api.label.replace('()', ''), 'fetching', api.color, api.dim)

      later(() => {
        tlDone()
        setApis((prev) => prev.map((a) => (a.id === api.id ? { ...a, done: true } : a)))
        log('dispatchgroup', `${api.label} → group.leave()`, 'ok', 'bg')
        doneCount.current++

        if (doneCount.current === DG_APIS.length) {
          later(() => {
            setNotifyVisible(true)
            setNotifyFired(true)
            timeline.record(
              'group.notify(.main)',
              'refreshDashboard()',
              'var(--teal)',
              'var(--teal-dim)',
            )()
            log(
              'dispatchgroup',
              'group.notify fired — all 4 requests complete, updating UI',
              'ok',
              'main',
            )
          }, 120)
        }
      }, api.dur)
    })
  }, [later, log, timeline, handleReset])

  return (
    <>
      <div className="controls">
        <button className="sim-btn-primary" onClick={handleRun}>
          ▶ Load Dashboard
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        <strong>Real world:</strong> A dashboard loads 4 API calls in parallel — user profile,
        balance, data quota, promo banners.{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>DispatchGroup</code> fires{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>notify</code> only after all 4
        complete, then updates the UI at once.
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
        Parallel API calls — notify when all done
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {apis.map((api) => (
          <ThreadContainer
            key={api.id}
            label={api.label}
            color={api.color}
            status={
              api.done ? (
                <StatusPill text="done ✓" bgColor={api.dim} color={api.color} />
              ) : (
                <StatusPill text="fetching…" bgColor="var(--bg)" color="var(--text3)" />
              )
            }
          >
            <TaskBlock
              label={api.done ? `${api.label} ✓` : api.label}
              color={api.color}
              dimColor={api.dim}
              borderColor={api.color + '44'}
              running={!api.done}
              faded={api.done}
            />
          </ThreadContainer>
        ))}
      </div>

      {notifyVisible && (
        <ThreadContainer
          label="group.notify(queue: .main)"
          color="var(--teal)"
          status={
            notifyFired ? (
              <StatusPill text="fired ✓" bgColor="var(--teal-dim)" color="var(--teal)" />
            ) : (
              <StatusPill text="waiting" bgColor="var(--bg)" color="var(--text3)" />
            )
          }
        >
          <TaskBlock
            label="refreshDashboard() — all data ready ✓"
            color="var(--teal)"
            dimColor="var(--teal-dim)"
            borderColor="rgba(80,250,123,.3)"
            running={!notifyFired}
          />
        </ThreadContainer>
      )}

      <Timeline
        sceneId="dispatchgroup"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={2500}
      />

      <LogPanel id="dispatchgroup" entries={logs['dispatchgroup'] || []} />
    </>
  )
}
