import { useEffect, useRef } from 'react'
import type { LogEntry } from '../../types/simulation'

interface LogPanelProps {
  id: string
  entries: LogEntry[]
  onClear?: () => void
}

export default function LogPanel({ entries, onClear }: LogPanelProps) {
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [entries])

  const typeClass = (type: string) => {
    switch (type) {
      case 'warn':
        return 'log-warn'
      case 'error':
        return 'log-error'
      case 'ok':
        return 'log-success'
      default:
        return 'log-msg'
    }
  }

  return (
    <div className="log-panel">
      <div className="log-header">
        <span className="log-title">Console Output</span>
        {onClear && (
          <button
            className="sim-btn"
            style={{ padding: '2px 8px', fontSize: '10px' }}
            onClick={onClear}
          >
            Clear
          </button>
        )}
      </div>
      <div className="log-body" ref={bodyRef}>
        {entries.map((entry) => (
          <div className="log-entry" key={entry.id}>
            <span className="log-time">{entry.timestamp}</span>
            {entry.thread && (
              <span className="log-thread" style={{ color: entry.color || 'var(--text3)' }}>
                [{entry.thread}]
              </span>
            )}
            <span className={typeClass(entry.type)}>{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
