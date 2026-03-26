interface ProgressBarProps {
  percent: number
  color: string
}

export default function ProgressBar({ percent, color }: ProgressBarProps) {
  return (
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{ width: `${Math.min(percent, 100)}%`, background: color }}
      />
    </div>
  )
}
