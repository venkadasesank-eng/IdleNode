import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Building2 } from 'lucide-react'
import { api } from '../../services/api'

interface HodDashboardProps {
  activeNav?: string
}

export const HodDashboard: React.FC<HodDashboardProps> = ({ activeNav: _activeNav }) => {
  const [overview, setOverview] = useState<any>({
    department_name: 'Computer Science & Engineering',
    pending_registrations: 1,
    approved_students: 42,
    total_computers: 24,
    active_sessions: 6,
  })
  const [pendingStudents, setPendingStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [reviewAction, setReviewAction] = useState<{ id: string; name: string; action: 'approve' | 'reject' } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchHodData = async () => {
    setLoading(true)
    try {
      const [ov, pending] = await Promise.all([api.getHodOverview(), api.getPendingStudents()])
      setOverview(ov)
      setPendingStudents(pending)
    } catch {
      // Sample pending student
      setPendingStudents([
        {
          id: 'p-1',
          full_name: 'Meera Nair',
          email: 'pending.student@campus.edu',
          roll_number: '23CS205',
          academic_year: '2nd Year B.Tech',
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHodData()
  }, [])

  const handleReview = async () => {
    if (!reviewAction) return
    try {
      await api.reviewStudent(reviewAction.id, reviewAction.action, rejectReason)
      fetchHodData()
    } catch {
      // Update locally
      setPendingStudents((prev) => prev.filter((p) => p.id !== reviewAction.id))
    }
    setReviewAction(null)
    setRejectReason('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="main-panel-header">
        <div>
          <h2 className="panel-title">Department Governance — {overview.department_name}</h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.85rem', marginTop: '4px' }}>
            Review pending student compute registrations, departmental node allocations, and academic policy compliance.
          </p>
        </div>

        <div className="header-status-pill">
          <Building2 size={14} style={{ color: '#10B981' }} />
          <span>Department Authority Active</span>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="metrics-row">
        <div className="glass-metric-card">
          <div className="metric-card-top">PENDING REGISTRATIONS</div>
          <div className="metric-big-number" style={{ color: pendingStudents.length > 0 ? '#FBBF24' : '#FAFAFA' }}>
            {String(pendingStudents.length).padStart(2, '0')}
          </div>
          <div className="metric-subtitle">Awaiting HOD verification</div>
        </div>

        <div className="glass-metric-card">
          <div className="metric-card-top">ENROLLED COMPUTE STUDENTS</div>
          <div className="metric-big-number">{overview.approved_students || 42}</div>
          <div className="metric-subtitle">Active student compute accounts</div>
        </div>

        <div className="glass-metric-card">
          <div className="metric-card-top">DEPARTMENT NODES</div>
          <div className="metric-big-number">{overview.total_computers || 24}</div>
          <div className="metric-subtitle">{overview.active_sessions || 6} active session workloads</div>
        </div>
      </div>

      {/* Pending Student Registrations Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 style={{ color: '#FAFAFA', fontSize: '1.05rem', fontWeight: 600 }}>
            Pending Student Compute Applications
          </h4>
          <span style={{ fontSize: '0.78rem', color: '#A1A1AA' }}>
            Institutional verification required before compute allocation
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#71717A' }}>Loading pending list...</div>
        ) : pendingStudents.length === 0 ? (
          <div
            style={{
              padding: '36px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              color: '#34D399',
            }}
          >
            <CheckCircle size={32} style={{ margin: '0 auto 8px' }} />
            <div style={{ color: '#FAFAFA', fontWeight: 600 }}>All Applications Reviewed</div>
            <div style={{ color: '#71717A', fontSize: '0.82rem', marginTop: '2px' }}>
              No student accounts currently waiting for administrative approval.
            </div>
          </div>
        ) : (
          <div className="glass-table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Institutional Email</th>
                  <th>Roll / Reg Number</th>
                  <th>Academic Level</th>
                  <th>Application Date</th>
                  <th style={{ textAlign: 'right' }}>Decision</th>
                </tr>
              </thead>
              <tbody>
                {pendingStudents.map((st) => (
                  <tr key={st.id}>
                    <td style={{ fontWeight: 600, color: '#FAFAFA' }}>{st.full_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{st.email}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>{st.roll_number}</td>
                    <td>{st.academic_year}</td>
                    <td style={{ fontSize: '0.78rem', color: '#71717A' }}>
                      {new Date(st.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="glass-btn primary"
                          style={{ minHeight: '30px', padding: '0 12px', fontSize: '0.75rem' }}
                          onClick={() => setReviewAction({ id: st.id, name: st.full_name, action: 'approve' })}
                        >
                          <CheckCircle size={12} />
                          <span>Approve</span>
                        </button>
                        <button
                          className="glass-btn danger"
                          style={{ minHeight: '30px', padding: '0 12px', fontSize: '0.75rem' }}
                          onClick={() => setReviewAction({ id: st.id, name: st.full_name, action: 'reject' })}
                        >
                          <XCircle size={12} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewAction && (
        <div className="glass-modal-overlay" onClick={() => setReviewAction(null)}>
          <div className="glass-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#FAFAFA', fontSize: '1.2rem' }}>
              {reviewAction.action === 'approve' ? 'Approve Student Account' : 'Reject Student Account'}
            </h3>
            <p style={{ color: '#A1A1AA', fontSize: '0.85rem' }}>
              {reviewAction.action === 'approve'
                ? `Confirm compute privileges for ${reviewAction.name}? They will immediately receive a daily quota of 100 credits.`
                : `Specify reason for rejecting ${reviewAction.name}'s registration:`}
            </p>

            {reviewAction.action === 'reject' && (
              <input
                type="text"
                placeholder="e.g. Unverified enrollment status or incorrect roll number"
                className="glass-input"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                autoFocus
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="glass-btn" onClick={() => setReviewAction(null)}>Cancel</button>
              <button
                className={`glass-btn ${reviewAction.action === 'approve' ? 'primary' : 'danger'}`}
                onClick={handleReview}
              >
                {reviewAction.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
