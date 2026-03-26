import { useState, useEffect, useCallback, useRef } from 'react'
import useSimulation from '../../../hooks/useSimulation'
import LogPanel from '../../shared/LogPanel'
import Timeline from '../../shared/Timeline'
import InfoCard from '../../shared/InfoCard'
import WarningBox from '../../shared/WarningBox'

export default function SendableScene() {
  const { later, log, logs, timeline, reset, clearLog } = useSimulation()
  const [badState, setBadState] = useState('')
  const [goodState, setGoodState] = useState('')
  const [showWarning, setShowWarning] = useState(false)
  const timeoutRef = useRef(30)

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    timeoutRef.current = 30
    setBadState('')
    setGoodState('')
    setShowWarning(false)
    clearLog('sendable')
  }, [reset, clearLog])

  const handleBad = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(2800)

    log(
      'sendable',
      'Passing class SDKConfig across two actors — shared mutable reference!',
      'warn',
      '',
    )

    timeoutRef.current = 30
    setBadState('timeout = 30\nretries = 3')

    timeline.record('NetworkActor', 'read config.timeout', 'var(--main)', 'var(--main-dim)')
    timeline.record('CacheActor', 'mutate config.timeout', 'var(--red)', 'var(--red-dim)')

    later(() => {
      log('sendable', 'NetworkActor: reading config.timeout (=30)…', '', 'bg')
    }, 300)

    later(() => {
      log('sendable', 'CacheActor: config.timeout = 5 — MUTATING shared ref!', 'error', 'bg')
      timeoutRef.current = 5
      setBadState('timeout = 5\nretries = 3')
    }, 700)

    later(() => {
      log('sendable', 'NetworkActor: config.timeout is now 5 — unexpected mutation!', 'error', 'bg')
      setShowWarning(true)
    }, 1100)
  }, [later, log, timeline, handleReset])

  const handleGood = useCallback(() => {
    handleReset()
    timeline.clear()
    timeline.animate(2800)

    log('sendable', 'Passing struct SDKConfig — each actor receives a copy', 'ok', '')

    setGoodState('timeout = 30\nretries = 3')

    timeline.record('NetworkActor', 'copy of config', 'var(--main)', 'var(--main-dim)')
    timeline.record('CacheActor', 'own copy of config', 'var(--teal)', 'var(--teal-dim)')

    later(() => {
      log('sendable', 'NetworkActor receives copy: { timeout:30, retries:3 }', 'ok', 'bg')
    }, 300)

    later(() => {
      log('sendable', 'CacheActor receives own copy: { timeout:30, retries:3 }', 'ok', 'bg')
    }, 500)

    later(() => {
      log('sendable', 'CacheActor "mutates" its copy — NetworkActor copy unchanged ✓', 'ok', 'bg')
      setGoodState('timeout = 30\nretries = 3\n// Each actor has independent value')
    }, 1000)
  }, [later, log, timeline, handleReset])

  return (
    <>
      <div className="controls">
        <button className="sim-btn-danger" onClick={handleBad}>
          ⚠ Non-Sendable across boundary
        </button>
        <button className="sim-btn-primary" onClick={handleGood}>
          ▶ Sendable types
        </button>
        <button className="sim-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <InfoCard>
        <strong>Real world:</strong> Passing a mutable SDK config object across an actor boundary.
        Non-<code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>Sendable</code> reference
        types can be mutated from two actors simultaneously. The fix: use{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>struct</code> (value type,
        implicitly Sendable) or{' '}
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>final class</code> with
        all-immutable state.
      </InfoCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <div className="section-heading" style={{ color: 'var(--red)' }}>
            class Config (mutable ref)
          </div>
          <div className="actor-box">
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--text3)',
                marginBottom: 8,
              }}
            >
              class SDKConfig {'{'} var timeout = 30 {'}'}
            </div>
            <div
              style={{
                fontSize: 12,
                fontFamily: 'var(--mono)',
                color: 'var(--text2)',
                lineHeight: 1.8,
                whiteSpace: 'pre-line',
              }}
            >
              {badState}
            </div>
          </div>
        </div>
        <div>
          <div className="section-heading" style={{ color: 'var(--green)' }}>
            struct Config (value type)
          </div>
          <div className="actor-box">
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--text3)',
                marginBottom: 8,
              }}
            >
              struct SDKConfig: Sendable {'{'} let timeout: Int {'}'}
            </div>
            <div
              style={{
                fontSize: 12,
                fontFamily: 'var(--mono)',
                color: 'var(--text2)',
                lineHeight: 1.8,
                whiteSpace: 'pre-line',
              }}
            >
              {goodState}
            </div>
          </div>
        </div>
      </div>

      {showWarning && (
        <WarningBox title="Shared mutable state — non-Sendable class passed across actors">
          Both actors hold a reference to the same SDKConfig object. CacheActor mutated it while
          NetworkActor was reading it. Fix: use a struct (value type) — each actor gets its own copy
          on assignment.
        </WarningBox>
      )}

      <Timeline
        sceneId="sendable"
        events={timeline.events}
        elapsedMs={timeline.elapsedMs}
        totalMs={2800}
      />

      <LogPanel id="sendable" entries={logs['sendable'] || []} />
    </>
  )
}
