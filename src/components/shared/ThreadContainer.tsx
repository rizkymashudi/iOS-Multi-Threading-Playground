import type { ReactNode } from 'react'

interface ThreadContainerProps {
  label: string
  color: string
  status?: ReactNode
  children: ReactNode
}

export default function ThreadContainer({ label, color, status, children }: ThreadContainerProps) {
  return (
    <div className="thread-container">
      <div className="thread-header">
        <div className="thread-name">
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
          {label}
        </div>
        {status}
      </div>
      <div className="thread-track">{children}</div>
    </div>
  )
}
