import type { TaskBlockProps } from '../../types/simulation'

export default function TaskBlock({
  label,
  color,
  dimColor,
  borderColor,
  running = false,
  faded = false,
}: TaskBlockProps) {
  return (
    <div
      className={`task-block${running ? ' task-running' : ''}`}
      style={{
        background: dimColor,
        color,
        border: `1px solid ${borderColor}`,
        opacity: faded ? 0.4 : 1,
      }}
    >
      <div className="task-dot" style={{ background: color }} />
      {label}
    </div>
  )
}
