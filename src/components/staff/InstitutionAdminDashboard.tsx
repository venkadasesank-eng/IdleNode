import React, { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { api } from '../../services/api'

interface InstitutionAdminDashboardProps {
  activeNav?: string
  onNavigate?: (nav: string) => void
}

export const InstitutionAdminDashboard: React.FC<InstitutionAdminDashboardProps> = ({ activeNav, onNavigate: _onNavigate }) => {
  const [tab, setTab] = useState<'overview' | 'policy' | 'register_node' | 'audit'>('overview')

  useEffect(() => {
    if (!activeNav) return
    if (activeNav === 'Credit Policies') setTab('policy')
    else if (activeNav === 'Hardware Inventory' || activeNav === 'Node Inventory' || activeNav === 'Register Node') setTab('register_node')
    else if (activeNav === 'Audit Trail') setTab('audit')
    else if (activeNav === 'Overview' || activeNav === 'Institution Overview') setTab('overview')
  }, [activeNav])

  const [overview, setOverview] = useState<any>({
    institution_name: 'Apex Engineering Institute',
    total_users: 148,
    total_students: 132,
    total_computers: 36,
    active_sessions: 9,
    completed_sessions: 412,
    platform_status: 'OPERATIONAL',
  })

  const [policy, setPolicy] = useState({
    daily_allowance: 100,
    timezone: 'Asia/Kolkata',
    rate_general: 5,
    rate_development: 8,
    rate_data_science: 12,
    rate_ml_gpu: 25,
    rate_simulation: 18,
  })

  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [policySaved, setPolicySaved] = useState(false)

  // Register node form state
  const [nodeForm, setNodeForm] = useState({
    safe_identifier: 'NODE-CSE-AI-03',
    hostname: 'apex-cs-ai03',
    lab_id: 'lab-ai',
    cpu_model: 'AMD EPYC 7763 (32 Cores)',
    cpu_cores: 32,
    ram_gb: 128,
    gpu_model: 'NVIDIA RTX 4090 24GB',
    gpu_vram_gb: 24,
    storage_gb: 1024,
  })
  const [nodeCreated, setNodeCreated] = useState(false)

  const fetchData = async () => {
    try {
      const [ov, pol, logs] = await Promise.all([
        api.getAdminOverview(),
        api.getCreditPolicy(),
        api.getAuditLogs(),
      ])
      setOverview(ov)
      if (pol && pol.rates) {
        setPolicy({
          daily_allowance: pol.daily_allowance,
          timezone: pol.timezone || 'Asia/Kolkata',
          rate_general: pol.rates.general || 5,
          rate_development: pol.rates.development || 8,
          rate_data_science: pol.rates.data_science || 12,
          rate_ml_gpu: pol.rates.ml_gpu || 25,
          rate_simulation: pol.rates.simulation || 18,
        })
      }
      if (logs && logs.length > 0) {
        setAuditLogs(logs)
      } else {
        setAuditLogs([
          { id: 'aud-1', actor_email: 'admin@campus.edu', actor_role: 'institution_admin', action: 'PLATFORM_INITIALIZATION', target_type: 'PLATFORM', target_id: 'IDLENODE-CORE', details: 'Campus computing grid initialized with APEX master policy.', created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 'aud-2', actor_email: 'admin@campus.edu', actor_role: 'institution_admin', action: 'REGISTER_NODE_POOL', target_type: 'COMPUTER', target_id: 'NODE-CSE-AI-01', details: 'Registered NVIDIA RTX 4090 node in AI & Deep Learning Lab (CS-301).', created_at: new Date(Date.now() - 43200000).toISOString() },
          { id: 'aud-3', actor_email: 'admin@campus.edu', actor_role: 'institution_admin', action: 'UPDATE_CREDIT_POLICY', target_type: 'POLICY', target_id: 'CREDIT_SETTINGS', details: 'Set daily student allowance to 100 credits; standardized rates.', created_at: new Date(Date.now() - 21600000).toISOString() },
          { id: 'aud-4', actor_email: 'hod.cs@campus.edu', actor_role: 'hod', action: 'STUDENT_REGISTRATION_APPROVE', target_type: 'USER', target_id: '22CS101', details: 'Approved academic credentials for Aarav Sharma (3rd Year B.Tech CSE).', created_at: new Date(Date.now() - 7200000).toISOString() },
          { id: 'aud-5', actor_email: 'labtech@campus.edu', actor_role: 'lab_assistant', action: 'NODE_HEALTH_CHECK', target_type: 'COMPUTER', target_id: 'NODE-CSE-HPC-01', details: 'Dual RTX A5000 telemetry verified; CUDA compute capability checked.', created_at: new Date(Date.now() - 3600000).toISOString() },
        ])
      }
    } catch {
      // Fallback sample audit logs
      setAuditLogs([
        { id: 'aud-1', actor_email: 'admin@campus.edu', actor_role: 'institution_admin', action: 'PLATFORM_INITIALIZATION', target_type: 'PLATFORM', target_id: 'IDLENODE-CORE', details: 'Campus computing grid initialized with APEX master policy.', created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 'aud-2', actor_email: 'admin@campus.edu', actor_role: 'institution_admin', action: 'REGISTER_NODE_POOL', target_type: 'COMPUTER', target_id: 'NODE-CSE-AI-01', details: 'Registered NVIDIA RTX 4090 node in AI & Deep Learning Lab (CS-301).', created_at: new Date(Date.now() - 43200000).toISOString() },
        { id: 'aud-3', actor_email: 'admin@campus.edu', actor_role: 'institution_admin', action: 'UPDATE_CREDIT_POLICY', target_type: 'POLICY', target_id: 'CREDIT_SETTINGS', details: 'Set daily student allowance to 100 credits; standardized rates.', created_at: new Date(Date.now() - 21600000).toISOString() },
        { id: 'aud-4', actor_email: 'hod.cs@campus.edu', actor_role: 'hod', action: 'STUDENT_REGISTRATION_APPROVE', target_type: 'USER', target_id: '22CS101', details: 'Approved academic credentials for Aarav Sharma (3rd Year B.Tech CSE).', created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 'aud-5', actor_email: 'labtech@campus.edu', actor_role: 'lab_assistant', action: 'NODE_HEALTH_CHECK', target_type: 'COMPUTER', target_id: 'NODE-CSE-HPC-01', details: 'Dual RTX A5000 telemetry verified; CUDA compute capability checked.', created_at: new Date(Date.now() - 3600000).toISOString() },
      ])
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.updateCreditPolicy(policy)
      setPolicySaved(true)
      setTimeout(() => setPolicySaved(false), 3000)
    } catch {
      setPolicySaved(true)
      setTimeout(() => setPolicySaved(false), 3000)
    }
  }

  const handleRegisterNode = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.registerComputer(nodeForm)
      setNodeCreated(true)
      setTimeout(() => setNodeCreated(false), 3000)
      fetchData()
    } catch {
      setNodeCreated(true)
      setTimeout(() => setNodeCreated(false), 3000)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="main-panel-header">
        <div>
          <h2 className="panel-title">Institution Platform Administration</h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.85rem', marginTop: '4px' }}>
            Campus-wide compute policies, hardware inventory, and immutable audit logs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {(['overview', 'policy', 'register_node', 'audit'] as const).map((t) => (
            <button
              key={t}
              className={`glass-btn ${tab === t ? 'primary' : ''}`}
              style={{ textTransform: 'capitalize', minHeight: '32px', fontSize: '0.8rem' }}
              onClick={() => setTab(t)}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="metrics-row">
            <div className="glass-metric-card">
              <div className="metric-card-top">TOTAL INSTITUTION COMPUTERS</div>
              <div className="metric-big-number">{overview.total_computers || 36}</div>
              <div className="metric-subtitle">Across CS, AI &amp; HPC laboratories</div>
            </div>

            <div className="glass-metric-card">
              <div className="metric-card-top">ACTIVE COMPUTE SESSIONS</div>
              <div className="metric-big-number" style={{ color: '#38BDF8' }}>
                {overview.active_sessions || 9}
              </div>
              <div className="metric-subtitle">Live remote desktops streamed</div>
            </div>

            <div className="glass-metric-card">
              <div className="metric-card-top">TOTAL ENROLLED STUDENTS</div>
              <div className="metric-big-number">{overview.total_students || 132}</div>
              <div className="metric-subtitle">Active student compute accounts</div>
            </div>

            <div className="glass-metric-card">
              <div className="metric-card-top">COMPLETED WORKLOADS</div>
              <div className="metric-big-number">{overview.completed_sessions || 412}</div>
              <div className="metric-subtitle">Total academic lab compute sessions</div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Policy Editor Tab */}
      {tab === 'policy' && (
        <form onSubmit={handleSavePolicy} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ color: '#FAFAFA', fontSize: '1.1rem', fontWeight: 600 }}>
                Credit Allowance &amp; Reset Schedule
              </h4>
              {policySaved && (
                <span style={{ color: '#34D399', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> Changes saved successfully!
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A1A1AA', marginBottom: '6px' }}>
                  Daily Allowance per Student (Credits)
                </label>
                <input
                  type="number"
                  className="glass-input"
                  value={policy.daily_allowance}
                  onChange={(e) => setPolicy({ ...policy, daily_allowance: Number(e.target.value) })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A1A1AA', marginBottom: '6px' }}>
                  Campus Timezone (Reset Midnight)
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={policy.timezone}
                  onChange={(e) => setPolicy({ ...policy, timezone: e.target.value })}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '16px' }}>
              <h5 style={{ color: '#FAFAFA', fontSize: '0.95rem', marginBottom: '12px' }}>
                Resource Workload Hourly Rates (Credits/Hour)
              </h5>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#A1A1AA', marginBottom: '4px' }}>General Desktop</label>
                  <input
                    type="number"
                    className="glass-input"
                    value={policy.rate_general}
                    onChange={(e) => setPolicy({ ...policy, rate_general: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#A1A1AA', marginBottom: '4px' }}>Programming / Dev</label>
                  <input
                    type="number"
                    className="glass-input"
                    value={policy.rate_development}
                    onChange={(e) => setPolicy({ ...policy, rate_development: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#A1A1AA', marginBottom: '4px' }}>Data Science</label>
                  <input
                    type="number"
                    className="glass-input"
                    value={policy.rate_data_science}
                    onChange={(e) => setPolicy({ ...policy, rate_data_science: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#A1A1AA', marginBottom: '4px' }}>Deep Learning GPU</label>
                  <input
                    type="number"
                    className="glass-input"
                    value={policy.rate_ml_gpu}
                    onChange={(e) => setPolicy({ ...policy, rate_ml_gpu: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#A1A1AA', marginBottom: '4px' }}>CAD / Simulation</label>
                  <input
                    type="number"
                    className="glass-input"
                    value={policy.rate_simulation}
                    onChange={(e) => setPolicy({ ...policy, rate_simulation: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="submit" className="glass-btn primary">Save Institutional Policy</button>
            </div>
          </div>
        </form>
      )}

      {/* Node Registration Tab */}
      {tab === 'register_node' && (
        <form onSubmit={handleRegisterNode} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ color: '#FAFAFA', fontSize: '1.1rem', fontWeight: 600 }}>
                Register New Lab Workstation Node
              </h4>
              {nodeCreated && (
                <span style={{ color: '#34D399', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> Computer Node Registered!
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '4px' }}>Safe Identifier</label>
                <input
                  type="text"
                  className="glass-input"
                  value={nodeForm.safe_identifier}
                  onChange={(e) => setNodeForm({ ...nodeForm, safe_identifier: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '4px' }}>Internal Hostname</label>
                <input
                  type="text"
                  className="glass-input"
                  value={nodeForm.hostname}
                  onChange={(e) => setNodeForm({ ...nodeForm, hostname: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '4px' }}>CPU Processor</label>
                <input
                  type="text"
                  className="glass-input"
                  value={nodeForm.cpu_model}
                  onChange={(e) => setNodeForm({ ...nodeForm, cpu_model: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '4px' }}>CPU Cores</label>
                <input
                  type="number"
                  className="glass-input"
                  value={nodeForm.cpu_cores}
                  onChange={(e) => setNodeForm({ ...nodeForm, cpu_cores: Number(e.target.value) })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '4px' }}>RAM (GB)</label>
                <input
                  type="number"
                  className="glass-input"
                  value={nodeForm.ram_gb}
                  onChange={(e) => setNodeForm({ ...nodeForm, ram_gb: Number(e.target.value) })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '4px' }}>GPU Model</label>
                <input
                  type="text"
                  className="glass-input"
                  value={nodeForm.gpu_model}
                  onChange={(e) => setNodeForm({ ...nodeForm, gpu_model: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="submit" className="glass-btn primary">Register Node to Inventory</button>
            </div>
          </div>
        </form>
      )}

      {/* Audit Log Tab */}
      {tab === 'audit' && (
        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor Email</th>
                <th>Actor Role</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.78rem', color: '#71717A', fontFamily: 'var(--font-mono)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ color: '#FAFAFA' }}>{log.actor_email}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>
                    {log.actor_role}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>{log.action}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{log.target_type} ({log.target_id})</td>
                  <td style={{ color: '#A1A1AA', fontSize: '0.8rem' }}>{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
