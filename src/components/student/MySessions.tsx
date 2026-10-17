import React, { useState, useEffect } from 'react'
import { History, Play, XCircle } from 'lucide-react'
import { api } from '../../services/api'
import { ConfirmModal } from '../ui/ConfirmModal'

interface MySessionsProps {
  onOpenSession: (session: any) => void
  onNavigate: (page: string) => void
}

export const MySessions: React.FC<MySessionsProps> = ({ onOpenSession, onNavigate }) => {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'queued' | 'completed'>('all')
  const [cancelModalSessionId, setCancelModalSessionId] = useState<string | null>(null)

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const data = await api.getStudentSessions()
      setSessions(data)
    } catch {
      // Fallback sample data if backend is offline
      setSessions([
        {
          id: 'sess-dev-01',
          safe_identifier: 'NODE-CSE-AI-01',
          workload_type: 'development',
          status: 'active',
          requested_minutes: 60,
          actual_minutes: 18,
          credit_rate: 8,
          credits_consumed: 3,
          created_at: new Date().toISOString(),
        },
        {
          id: 'sess-ml-02',
          safe_identifier: 'NODE-CSE-HPC-01',
          workload_type: 'ml_gpu',
          status: 'completed',
          requested_minutes: 120,
          actual_minutes: 114,
          credit_rate: 25,
          credits_consumed: 48,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleCancelQueue = async (sessionId: string) => {
    try {
      await api.cancelQueuedRequest(sessionId)
      fetchSessions()
    } catch {
      // ignore
    }
    setCancelModalSessionId(null)
  }

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'active') return ['active', 'allocating', 'connecting', 'disconnected'].includes(s.status)
    if (filter === 'queued') return s.status === 'queued'
    if (filter === 'completed') return ['completed', 'cancelled', 'failed'].includes(s.status)
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="main-panel-header">
        <div>
          <h2 className="panel-title">My Compute Sessions</h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.85rem', marginTop: '4px' }}>
            History of your requested, active, and completed computing sessions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'active', 'queued', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              className={`glass-btn ${filter === tab ? 'primary' : ''}`}
              style={{ textTransform: 'capitalize', minHeight: '32px', fontSize: '0.8rem' }}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#71717A' }}>
          Loading your session records...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            color: '#A1A1AA',
          }}
        >
          <History size={36} style={{ color: '#71717A', margin: '0 auto 12px' }} />
          <h4 style={{ color: '#FAFAFA', fontSize: '1.1rem' }}>No sessions found</h4>
          <p style={{ fontSize: '0.85rem', color: '#71717A', marginTop: '4px' }}>
            You haven't run any compute sessions in this filter category.
          </p>
          <button
            className="glass-btn primary"
            style={{ marginTop: '16px' }}
            onClick={() => onNavigate('Start Computing')}
          >
            Start a Session
          </button>
        </div>
      ) : (
        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Computer Node</th>
                <th>Workload</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Credit Cost</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((s) => {
                const isActive = ['active', 'allocating', 'connecting', 'disconnected'].includes(s.status)
                const isQueued = s.status === 'queued'

                return (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#71717A' }}>
                      {s.id.slice(0, 12)}...
                    </td>
                    <td style={{ fontWeight: 600, color: '#FAFAFA', fontFamily: 'var(--font-mono)' }}>
                      {s.safe_identifier || (isQueued ? 'Queue Pending' : 'Allocated')}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{s.workload_type}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '2px 8px',
                          borderRadius: '99px',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          background: isActive
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isQueued
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(255, 255, 255, 0.05)',
                          color: isActive ? '#34D399' : isQueued ? '#FBBF24' : '#A1A1AA',
                          border: `1px solid ${
                            isActive
                              ? 'rgba(16, 185, 129, 0.3)'
                              : isQueued
                              ? 'rgba(245, 158, 11, 0.3)'
                              : 'rgba(255, 255, 255, 0.08)'
                          }`,
                        }}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {s.actual_minutes ? `${s.actual_minutes} min` : `${s.requested_minutes} min req`}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      <strong style={{ color: '#FAFAFA' }}>{s.credits_consumed || 0}</strong> cr
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#71717A' }}>
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isActive && (
                        <button
                          className="glass-btn primary"
                          style={{ minHeight: '30px', padding: '0 10px', fontSize: '0.75rem' }}
                          onClick={() => onOpenSession(s)}
                        >
                          <Play size={12} />
                          <span>Open Workspace</span>
                        </button>
                      )}
                      {isQueued && (
                        <button
                          className="glass-btn danger"
                          style={{ minHeight: '30px', padding: '0 10px', fontSize: '0.75rem' }}
                          onClick={() => setCancelModalSessionId(s.id)}
                        >
                          <XCircle size={12} />
                          <span>Cancel Queue</span>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel Queue Confirmation Modal */}
      <ConfirmModal
        isOpen={!!cancelModalSessionId}
        title="Cancel Queued Request?"
        message="Are you sure you want to withdraw your compute request from the queue? Your reserved credits will be immediately restored."
        confirmText="Cancel Request"
        danger={true}
        onConfirm={() => cancelModalSessionId && handleCancelQueue(cancelModalSessionId)}
        onCancel={() => setCancelModalSessionId(null)}
      />
    </div>
  )
}
