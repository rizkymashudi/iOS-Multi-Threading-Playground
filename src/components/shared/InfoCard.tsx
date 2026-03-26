interface InfoCardProps {
  children: React.ReactNode
}

export default function InfoCard({ children }: InfoCardProps) {
  return <div className="info-card">{children}</div>
}
