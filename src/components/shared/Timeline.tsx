import type { TLEvent } from '../../types/timeline'
import { packIntoLanes, buildRulerTicks, TL_TOTAL_MS } from '../../utils/timeline'

interface TimelineProps {
  sceneId: string
  events: TLEvent[]
  elapsedMs: number
  totalMs?: number
}

export default function Timeline({ events, elapsedMs, totalMs }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="timeline-panel">
        <div className="timeline-header">
          <div className="timeline-title">
            <div className="timeline-title-dot" />
            Timeline
          </div>
        </div>
        <div className="timeline-body">
          <div className="tl-empty">Run a simulation to see the timeline</div>
        </div>
      </div>
    )
  }

  const now = elapsedMs
  const total = Math.max(totalMs ?? TL_TOTAL_MS, now + 200)
  const ticks = buildRulerTicks(total)
  const lanes = packIntoLanes(events, now)
  const phPct = Math.min((now / total) * 100, 99.8)

  return (
    <div className="timeline-panel">
      <div className="timeline-header">
        <div className="timeline-title">
          <div className="timeline-title-dot" />
          Timeline
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text3)' }}>
          {Math.round(now)} ms
        </span>
      </div>
      <div className="timeline-body">
        <div className="tl-ruler">
          {ticks.map((t) => (
            <div className="tl-tick" key={t}>
              {t}ms
            </div>
          ))}
        </div>
        <div className="tl-canvas" style={{ position: 'relative' }}>
          <div
            className="tl-playhead"
            style={{
              left: `calc(var(--tl-label-w) + (100% - var(--tl-label-w)) * ${phPct / 100})`,
            }}
          />
          {lanes.map((lane) => (
            <div className="tl-lane" key={lane.name}>
              <div className="tl-label" title={lane.name}>
                {lane.name}
              </div>
              <div className="tl-rows">
                {lane.subRows.map((row, ri) => (
                  <div className="tl-track" key={ri}>
                    {row.events.map((ev, ei) => {
                      const left = (ev.startMs / total) * 100
                      const evEnd = ev.endMs != null ? ev.endMs : now
                      const rawW = (evEnd / total) * 100 - left
                      const w = Math.max(rawW, 0.8)
                      const alpha = ev.endMs == null ? 0.92 : 0.62
                      const showText = w > 2.5
                      const tooltip = `${ev.label} (${Math.round(ev.startMs)}–${ev.endMs != null ? Math.round(ev.endMs) : '…'}ms)`

                      return (
                        <div
                          className="tl-block"
                          key={ei}
                          title={tooltip}
                          style={{
                            left: `${left.toFixed(2)}%`,
                            width: `${w.toFixed(2)}%`,
                            background: ev.dimColor,
                            border: `1px solid ${ev.color}`,
                            color: ev.color,
                            opacity: alpha,
                          }}
                        >
                          {showText ? ev.label : ''}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
