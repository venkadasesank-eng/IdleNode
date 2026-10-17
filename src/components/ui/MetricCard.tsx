import React from 'react'

interface MetricCardProps {
  label: string
  maxVal?: number | string
  value: number | string
  unit?: string
  subtitle: string
  progressPct?: number
  icon?: React.ReactNode
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  maxVal,
  value,
  subtitle,
  progressPct = 68,
  icon,
}) => {
  return (
    <div className="glass-metric-card">
      <div className="metric-card-top">
        <span>{label}</span>
        {maxVal !== undefined && <span>{maxVal}</span>}
      </div>

      <div className="metric-card-body">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="metric-big-number">{value}</span>
            {icon}
          </div>
          <div className="metric-subtitle">{subtitle}</div>
        </div>
      </div>

      <div className="metric-progress-track">
        <div
          className="metric-progress-fill"
          style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
        />
      </div>
    </div>
  )
}
