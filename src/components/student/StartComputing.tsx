import React, { useState } from 'react'
import { Zap, ArrowRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { api } from '../../services/api'

interface StartComputingProps {
  currentBalance: number
  onSessionCreated: (session: any) => void
  onNavigate: (page: string) => void
}

const WORKLOADS = [
  { id: 'general', name: 'General Desktop', rate: 5, desc: 'Web development, light compilers, standard IDEs' },
  { id: 'development', name: 'Programming & Systems', rate: 8, desc: 'C/C++, Rust, Linux kernel tooling, Docker' },
  { id: 'data_science', name: 'Data Science & Analytics', rate: 12, desc: 'Python Jupyter, Pandas, scikit-learn, R' },
  { id: 'ml_gpu', name: 'Deep Learning & ML (GPU)', rate: 25, desc: 'PyTorch, CUDA 12, RTX 4080/4090 workloads' },
  { id: 'simulation', name: 'CAD & Simulation', rate: 18, desc: 'MATLAB, ANSYS, high-throughput numerical models' },
]

export const StartComputing: React.FC<StartComputingProps> = ({ currentBalance, onSessionCreated, onNavigate }) => {
  const [workload, setWorkload] = useState('development')
  const [minCpu, setMinCpu] = useState(8)
  const [minRam, setMinRam] = useState(32)
  const [requireGpu, setRequireGpu] = useState(false)
  const [duration, setDuration] = useState(60)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allocatedSession, setAllocatedSession] = useState<any | null>(null)

  const selectedWorkloadObj = WORKLOADS.find((w) => w.id === workload) || WORKLOADS[0]
  const estimatedCost = Math.max(1, Math.ceil((selectedWorkloadObj.rate * duration) / 60))
  const canAfford = currentBalance >= estimatedCost

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canAfford) {
      setError(`Insufficient credits: this session requires ${estimatedCost} credits, but you have ${currentBalance}.`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const session = await api.createComputeRequest({
        workload_type: workload,
        min_cpu_cores: minCpu,
        min_ram_gb: minRam,
        require_gpu: requireGpu || workload === 'ml_gpu',
        requested_minutes: duration,
      })

      setAllocatedSession(session)
      onSessionCreated(session)
    } catch (err: any) {
      setError(err.message || 'Failed to request computing resources')
    } finally {
      setLoading(false)
    }
  }

  if (allocatedSession) {
    const isAllocated = allocatedSession.status !== 'queued'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="main-panel-header">
          <h2 className="panel-title">
            {isAllocated ? 'Compute Allocation Ready' : 'Request Queued in Fair Scheduler'}
          </h2>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px',
          }}
        >
          {isAllocated ? (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'grid',
                placeItems: 'center',
                color: '#34D399',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
          ) : (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'grid',
                placeItems: 'center',
                color: '#FBBF24',
              }}
            >
              <Clock size={32} />
            </div>
          )}

          <div>
            <h3 style={{ fontSize: '1.4rem', color: '#FAFAFA' }}>
              {isAllocated
                ? `Node ${allocatedSession.safe_identifier || 'Allocated'} Reserved`
                : `Position #${allocatedSession.queue_position || 1} in Fair Queue`}
            </h3>
            <p style={{ color: '#A1A1AA', fontSize: '0.9rem', maxWidth: '520px', margin: '8px auto 0' }}>
              {isAllocated
                ? 'Your requested compute environment has been atomically allocated. Display streaming and keyboard/mouse gateway are initialized.'
                : 'All matching lab machines are currently busy with active student workloads. The fair scheduler will automatically launch your session as soon as a node is released.'}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '24px',
              padding: '12px 24px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
            }}
          >
            <div>
              <span style={{ color: '#71717A' }}>Duration: </span>
              <span style={{ color: '#FAFAFA' }}>{allocatedSession.requested_minutes} min</span>
            </div>
            <div>
              <span style={{ color: '#71717A' }}>Rate: </span>
              <span style={{ color: '#FAFAFA' }}>{allocatedSession.credit_rate} cr/hr</span>
            </div>
            <div>
              <span style={{ color: '#71717A' }}>Reserved: </span>
              <span style={{ color: '#34D399' }}>{allocatedSession.credits_reserved} credits</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            {isAllocated ? (
              <button
                className="glass-btn primary"
                onClick={() => onNavigate('Remote Workspace')}
              >
                <span>Launch Remote Desktop</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                className="glass-btn primary"
                onClick={() => onNavigate('My Sessions')}
              >
                <span>View in Queue</span>
                <ArrowRight size={14} />
              </button>
            )}
            <button
              className="glass-btn"
              onClick={() => setAllocatedSession(null)}
            >
              Configure Another Request
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="main-panel-header">
        <div>
          <h2 className="panel-title">Start Computing</h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.85rem', marginTop: '4px' }}>
            Request laboratory workstation compute matching your workload profile.
          </p>
        </div>

        <div className="header-status-pill">
          <span>Available Credits: </span>
          <strong style={{ color: canAfford ? '#FAFAFA' : '#F43F5E', marginLeft: '4px' }}>
            {currentBalance}
          </strong>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '12px',
            color: '#FDA4AF',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Step 1: Workload Profile */}
        <div>
          <div className="sidebar-title" style={{ padding: '0 0 10px' }}>
            1. Select Workload Profile
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {WORKLOADS.map((w) => {
              const isSelected = workload === w.id
              return (
                <div
                  key={w.id}
                  onClick={() => {
                    setWorkload(w.id)
                    if (w.id === 'ml_gpu') setRequireGpu(true)
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    border: `1px solid ${isSelected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                    background: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                    boxShadow: isSelected ? 'inset 0 1px 1px rgba(255, 255, 255, 0.2)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#FAFAFA', fontSize: '0.95rem' }}>{w.name}</div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        color: '#A1A1AA',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '2px 8px',
                        borderRadius: '99px',
                      }}
                    >
                      {w.rate} cr/hr
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#71717A', marginTop: '6px' }}>{w.desc}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step 2: Hardware Specifications */}
        <div>
          <div className="sidebar-title" style={{ padding: '0 0 10px' }}>
            2. Compute Specifications
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '6px' }}>
                Minimum CPU Cores
              </label>
              <select
                className="glass-select"
                value={minCpu}
                onChange={(e) => setMinCpu(Number(e.target.value))}
              >
                <option value={4}>4 Cores</option>
                <option value={8}>8 Cores (Recommended)</option>
                <option value={16}>16 Cores</option>
                <option value={32}>32 Cores (EPYC / Threadripper)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '6px' }}>
                Minimum System RAM
              </label>
              <select
                className="glass-select"
                value={minRam}
                onChange={(e) => setMinRam(Number(e.target.value))}
              >
                <option value={16}>16 GB RAM</option>
                <option value={32}>32 GB RAM</option>
                <option value={64}>64 GB RAM</option>
                <option value={128}>128 GB RAM</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '6px' }}>
                Requested Duration
              </label>
              <select
                className="glass-select"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
                <option value={120}>120 Minutes (2 Hours)</option>
                <option value={240}>240 Minutes (4 Hours)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '14px' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                color: '#E4E4E7',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={requireGpu || workload === 'ml_gpu'}
                disabled={workload === 'ml_gpu'}
                onChange={(e) => setRequireGpu(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
              />
              <span>Require Dedicated Hardware GPU (NVIDIA RTX 4080 / 4090 / A5000)</span>
            </label>
          </div>
        </div>

        {/* Step 3: Reservation Summary & Submit */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', color: '#A1A1AA' }}>Credit Reservation Estimate</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 600, color: '#FAFAFA' }}>
                {estimatedCost}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#71717A' }}>credits reserved for {duration} min</span>
            </div>
          </div>

          <button
            type="submit"
            className="glass-btn primary"
            disabled={loading || !canAfford}
            style={{ minHeight: '44px', padding: '0 24px' }}
          >
            <Zap size={16} />
            <span>{loading ? 'Matching Compatible Node...' : 'Allocate Computing Resources'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
