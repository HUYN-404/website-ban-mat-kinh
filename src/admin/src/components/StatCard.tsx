import type { CSSProperties, ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  helper?: string
}

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const helperStyle: CSSProperties = {
  color: 'var(--muted)',
  opacity: 0.9,
}

export const StatCard = ({ label, value, icon, helper }: StatCardProps) => (
  <div className="stat-card">
    <div style={headerStyle}>
      <span>{label}</span>
      {icon}
    </div>
    <strong>{value}</strong>
    {helper ? <small style={helperStyle}>{helper}</small> : null}
  </div>
)


