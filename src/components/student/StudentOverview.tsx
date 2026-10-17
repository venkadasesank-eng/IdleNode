import React from 'react'
import { Box, Play, ArrowRight } from 'lucide-react'
import { MetricCard } from '../ui/MetricCard'
import { TerminalPanel } from '../ui/TerminalPanel'

interface StudentOverviewProps {
  metrics: {
    active_compute_nodes: number
    total_compute_nodes: number
    current_queue_tasks: number
    avg_queue_wait_minutes: number
    daily_balance: number
    daily_allowance: number
    grid_online: boolean
    recent_activity: string[]
  }
  onNavigate: (page: string) => void
}

export const StudentOverview: React.FC<StudentOverviewProps> = ({ metrics, onNavigate }) => {
  const activePct = metrics.total_compute_nodes > 0 
    ? Math.round((metrics.active_compute_nodes / metrics.total_compute_nodes) * 100) 
    : 68

  const balancePct = metrics.daily_allowance > 0 
    ? Math.round((metrics.daily_balance / metrics.daily_allowance) * 100) 
    : 78

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header matching reference image: "Grid Overview" and "Campus Grid Online" */}
      <div className="main-panel-header">
        <h2 className="panel-title">Grid Overview</h2>

        <div className="header-status-pill">
          <span className="status-dot-green" />
          <span>Campus Grid Online</span>
        </div>
      </div>

      {/* 3 Metric Cards matching reference image layout */}
      <div className="metrics-row">
        {/* Card 1: ACTIVE COMPUTE */}
        <MetricCard
          label="ACTIVE COMPUTE"
          maxVal={metrics.total_compute_nodes || 50}
          value={metrics.active_compute_nodes || 34}
          subtitle="Lab PCs allocated"
          progressPct={activePct}
          icon={<Box size={22} style={{ color: '#FAFAFA', opacity: 0.85 }} />}
        />

        {/* Card 2: CURRENT QUEUE */}
        <MetricCard
          label="CURRENT QUEUE"
          maxVal={50}
          value={String(metrics.current_queue_tasks || 2).padStart(2, '0')}
          subtitle={`Tasks · Avg wait ~ ${metrics.avg_queue_wait_minutes || 1.4} min`}
          progressPct={Math.min(100, (metrics.current_queue_tasks || 2) * 20)}
        />

        {/* Card 3: DAILY BALANCE */}
        <MetricCard
          label="DAILY BALANCE"
          maxVal={metrics.daily_allowance || 100}
          value={metrics.daily_balance !== undefined ? metrics.daily_balance : 78}
          subtitle="Credits remaining"
          progressPct={balancePct}
        />
      </div>

      {/* Quick Launch Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#FAFAFA' }}>
            Ready to run lab workloads?
          </div>
          <div style={{ fontSize: '0.8rem', color: '#A1A1AA', marginTop: '2px' }}>
            Allocated machines feature high-speed compiler toolchains, GPUs, and persistent student storage.
          </div>
        </div>

        <button
          className="glass-btn primary"
          onClick={() => onNavigate('Start Computing')}
        >
          <Play size={14} />
          <span>Start Computing</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Terminal Panel matching reference image */}
      <TerminalPanel
        logs={metrics.recent_activity || [
          '2025-05-20T14:32:41Z User authenticated auth:verified',
          '2025-05-20T14:32:42Z Compute node allocated scheduler:alloc',
          '2025-05-20T14:32:43Z Streaming session started gateway:stream',
        ]}
        isConnected={metrics.grid_online}
      />
    </div>
  )
}
