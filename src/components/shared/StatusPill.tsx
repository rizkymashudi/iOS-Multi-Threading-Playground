import type { StatusPillProps } from '../../types/simulation'

export default function StatusPill({ text, bgColor, color }: StatusPillProps) {
  return (
    <span
      className="status-pill"
      style={{
        background: bgColor,
        color,
        border: `1px solid ${color}33`,
      }}
    >
      {text}
    </span>
  )
}
