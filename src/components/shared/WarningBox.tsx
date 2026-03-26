interface WarningBoxProps {
  title: string
  children: React.ReactNode
}

export default function WarningBox({ title, children }: WarningBoxProps) {
  return (
    <div className="warning-box">
      <div className="warning-icon">&#x26A0;</div>
      <div>
        <div className="warning-title">{title}</div>
        <div className="warning-body">{children}</div>
      </div>
    </div>
  )
}
