import React, { useState } from 'react'
import { Box, Play, ArrowRight, Server, Cpu, Zap, HardDrive, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [showNodeInventory, setShowNodeInventory] = useState(false)

  const activePct = metrics.total_compute_nodes > 0 
    ? Math.round((metrics.active_compute_nodes / metrics.total_compute_nodes) * 100) 
    : 68

  const balancePct = metrics.daily_allowance > 0 
    ? Math.round((metrics.daily_balance / metrics.daily_allowance) * 100) 
    : 78

  const sampleNodes = [
    { id: 'NODE-CSE-AI-01', lab: 'AI & Deep Learning Lab', cpu: 'AMD EPYC 7763 (32 Cores)', ram: '128 GB', gpu: 'NVIDIA RTX 4090 24GB', status: 'available', currentWorkload: 'Idle · Ready for Allocation' },
    { id: 'NODE-CSE-AI-02', lab: 'AI & Deep Learning Lab', cpu: 'AMD EPYC 7763 (32 Cores)', ram: '128 GB', gpu: 'NVIDIA RTX 4080 16GB', status: 'in_use', currentWorkload: 'Student Session (Active Training)' },
    { id: 'NODE-CSE-HPC-01', lab: 'High-Performance Systems Lab', cpu: 'AMD Threadripper (64 Cores)', ram: '256 GB', gpu: 'Dual NVIDIA RTX A5000', status: 'available', currentWorkload: 'Idle · Ready for Allocation' },
    { id: 'NODE-CSE-HPC-02', lab: 'High-Performance Systems Lab', cpu: 'AMD Threadripper (64 Cores)', ram: '256 GB', gpu: 'Dual NVIDIA RTX A5000', status: 'in_use', currentWorkload: 'Distributed Physics Simulation' },
    { id: 'NODE-ECE-EMB-01', lab: 'Embedded & Robotics Lab', cpu: 'Intel Xeon Gold (24 Cores)', ram: '64 GB', gpu: 'NVIDIA RTX 4070 12GB', status: 'available', currentWorkload: 'Idle · Ready for Allocation' },
    { id: 'NODE-CSE-AI-03', lab: 'AI & Deep Learning Lab', cpu: 'AMD EPYC 7763 (32 Cores)', ram: '128 GB', gpu: 'NVIDIA RTX 4090 24GB', status: 'maintenance', currentWorkload: 'Scheduled Driver Update' },
  ]

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
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#FAFAFA' }}>
            Ready to run lab workloads?
          </div>
          <div style={{ fontSize: '0.8rem', color: '#D4D4D8', marginTop: '2px' }}>
            Allocated machines feature high-speed compiler toolchains, GPUs, and persistent student storage.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="glass-btn"
            style={{ fontSize: '0.82rem' }}
            onClick={() => setShowNodeInventory((v) => !v)}
          >
            <Server size={14} color="#38BDF8" />
            <span>{showNodeInventory ? 'Hide Node Grid' : 'View Cluster Nodes'}</span>
            {showNodeInventory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            className="glass-btn primary"
            onClick={() => onNavigate('Start Computing')}
          >
            <Play size={14} />
            <span>Start Computing</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Expandable Hardware Availability Grid */}
      {showNodeInventory && (
        <div
          style={{
            background: 'rgba(12, 14, 20, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            animation: 'modalScaleUp 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#FAFAFA', fontWeight: 600 }}>Campus Laboratory Cluster Hardware Inventory</h3>
              <p style={{ fontSize: '0.78rem', color: '#A1A1AA', marginTop: '2px' }}>
                All nodes reside inside authorized college departmental laboratories.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} /> Available
              </span>
              <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B' }} /> In Use
              </span>
              <span style={{ color: '#71717A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#71717A' }} /> Maintenance
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {sampleNodes.map((node) => (
              <div
                key={node.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600, color: '#38BDF8' }}>
                    {node.id}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '2px 8px',
                      borderRadius: '99px',
                      textTransform: 'uppercase',
                      background: node.status === 'available' ? 'rgba(16, 185, 129, 0.12)' : node.status === 'in_use' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                      color: node.status === 'available' ? '#34D399' : node.status === 'in_use' ? '#FBBF24' : '#A1A1AA',
                      border: `1px solid ${node.status === 'available' ? 'rgba(16, 185, 129, 0.25)' : node.status === 'in_use' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.1)'}`,
                    }}
                  >
                    {node.status.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ fontSize: '0.76rem', color: '#FAFAFA', fontWeight: 500 }}>{node.lab}</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.74rem', color: '#D4D4D8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cpu size={12} color="#A1A1AA" />
                    <span>{node.cpu}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HardDrive size={12} color="#A1A1AA" />
                    <span>{node.ram} RAM</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={12} color="#F59E0B" />
                    <span>{node.gpu}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#71717A', fontFamily: 'var(--font-mono)', marginTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '6px' }}>
                  {node.currentWorkload}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
