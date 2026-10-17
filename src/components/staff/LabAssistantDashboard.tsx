import React, { useState, useEffect } from 'react'
import { PanelsTopLeft, Activity, Monitor, Square, Wrench, AlertTriangle, CheckCircle2, Plus } from 'lucide-react'
import { api } from '../../services/api'
import { ConfirmModal } from '../ui/ConfirmModal'

interface LabAssistantDashboardProps {
  activeNav?: string
}

export const LabAssistantDashboard: React.FC<LabAssistantDashboardProps> = ({ activeNav }) => {
  const [tab, setTab] = useState<'labs' | 'monitoring' | 'computers' | 'incidents'>('monitoring')

  useEffect(() => {
    if (!activeNav) return
    if (activeNav === 'Live Monitoring') setTab('monitoring')
    else if (activeNav === 'Computer Management' || activeNav === 'Node Inventory') setTab('computers')
    else if (activeNav === 'Lab Supervision' || activeNav === 'Lab Overview' || activeNav === 'Overview') setTab('labs')
  }, [activeNav])

  const [labs, setLabs] = useState<any[]>([])
  const [computers, setComputers] = useState<any[]>([])

  const [stopSessionModal, setStopSessionModal] = useState<{ id: string; node: string } | null>(null)
  const [stopReason, setStopReason] = useState('')
  const [maintenanceModal, setMaintenanceModal] = useState<{ id: string; safeId: string; currentStatus: string } | null>(null)

  // Incident & Maintenance state
  const [incidents, setIncidents] = useState<any[]>([
    {
      id: 'inc-1',
      node_id: 'NODE-CSE-AI-03',
      lab_name: 'AI & Deep Learning Lab',
      severity: 'medium',
      title: 'Scheduled NVIDIA Driver & CUDA 12.4 Upgrade',
      reported_by: 'Pooja (Lab Assistant)',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      status: 'in_progress',
    },
    {
      id: 'inc-2',
      node_id: 'NODE-CSE-HPC-02',
      lab_name: 'High-Performance Systems Lab',
      severity: 'low',
      title: 'Chassis exhaust fan dust cleaning and cable management',
      reported_by: 'Pooja (Lab Assistant)',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      status: 'resolved',
    },
  ])
  const [newIncidentNode, setNewIncidentNode] = useState('NODE-CSE-AI-01')
  const [newIncidentTitle, setNewIncidentTitle] = useState('')
  const [newIncidentSeverity, setNewIncidentSeverity] = useState('medium')
  const [incidentSuccessMsg, setIncidentSuccessMsg] = useState(false)

  const fetchData = async () => {
    try {
      const [lData, cData] = await Promise.all([api.getLabs(), api.getLabComputers()])
      setLabs(lData)
      setComputers(cData)
    } catch {
      // Fallback sample data if backend offline
      setLabs([
        { id: 'lab-1', name: 'AI & Deep Learning Lab', room_number: 'CS-301', total_computers: 15, active_computers: 8 },
        { id: 'lab-2', name: 'High-Performance Systems Lab', room_number: 'CS-302', total_computers: 12, active_computers: 4 },
      ])
      setComputers([
        { id: 'c1', safe_identifier: 'NODE-CSE-AI-01', lab_name: 'AI & Deep Learning Lab', cpu_model: 'AMD EPYC 7763', cpu_cores: 32, ram_gb: 128, gpu_model: 'RTX 4090 24GB', status: 'available' },
        { id: 'c2', safe_identifier: 'NODE-CSE-AI-02', lab_name: 'AI & Deep Learning Lab', cpu_model: 'AMD EPYC 7763', cpu_cores: 32, ram_gb: 128, gpu_model: 'RTX 4080 16GB', status: 'in_use' },
        { id: 'c3', safe_identifier: 'NODE-CSE-HPC-01', lab_name: 'High-Performance Systems Lab', cpu_model: 'AMD Threadripper', cpu_cores: 64, ram_gb: 256, gpu_model: 'Dual RTX A5000', status: 'available' },
      ])
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleStopSession = async () => {
    if (!stopSessionModal || !stopReason.trim()) return
    try {
      await api.adminStopSession(stopSessionModal.id, stopReason)
      fetchData()
    } catch {
      // ignore
    }
    setStopSessionModal(null)
    setStopReason('')
  }

  const handleToggleMaintenance = async () => {
    if (!maintenanceModal) return
    const isMaint = maintenanceModal.currentStatus !== 'maintenance'
    try {
      await api.toggleComputerMaintenance(maintenanceModal.id, isMaint, 'Lab assistant inspection')
      fetchData()
    } catch {
      // ignore
    }
    setMaintenanceModal(null)
  }

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIncidentTitle.trim()) return

    const newInc = {
      id: `inc-${Date.now()}`,
      node_id: newIncidentNode,
      lab_name: 'AI & Deep Learning Lab',
      severity: newIncidentSeverity,
      title: newIncidentTitle.trim(),
      reported_by: 'Pooja (Lab Assistant)',
      created_at: new Date().toISOString(),
      status: 'open',
    }

    setIncidents([newInc, ...incidents])
    setNewIncidentTitle('')
    setIncidentSuccessMsg(true)
    setTimeout(() => setIncidentSuccessMsg(false), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="main-panel-header">
        <div>
          <h2 className="panel-title">Lab Supervision &amp; Monitoring</h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.85rem', marginTop: '4px' }}>
            Supervise assigned computer laboratory inventory, active student workloads, and hardware telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`glass-btn ${tab === 'monitoring' ? 'primary' : ''}`}
            onClick={() => setTab('monitoring')}
          >
            <Activity size={14} />
            <span>Live Telemetry</span>
          </button>
          <button
            className={`glass-btn ${tab === 'computers' ? 'primary' : ''}`}
            onClick={() => setTab('computers')}
          >
            <Monitor size={14} />
            <span>Computer Inventory</span>
          </button>
          <button
            className={`glass-btn ${tab === 'labs' ? 'primary' : ''}`}
            onClick={() => setTab('labs')}
          >
            <PanelsTopLeft size={14} />
            <span>Assigned Labs</span>
          </button>
          <button
            className={`glass-btn ${tab === 'incidents' ? 'primary' : ''}`}
            onClick={() => setTab('incidents')}
          >
            <Wrench size={14} />
            <span>Maintenance &amp; Incidents</span>
          </button>
        </div>
      </div>

      {/* Live Monitoring Tab */}
      {tab === 'monitoring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {computers.map((comp) => {
              const isBusy = ['busy', 'in_use', 'reserved'].includes(comp.status)
              const isMaint = comp.status === 'maintenance'

              return (
                <div
                  key={comp.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isBusy ? '#F59E0B' : isMaint ? '#71717A' : '#10B981',
                        }}
                      />
                      <strong style={{ color: '#FAFAFA', fontFamily: 'var(--font-mono)' }}>
                        {comp.safe_identifier}
                      </strong>
                    </div>

                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 8px',
                        borderRadius: '99px',
                        background: isBusy ? 'rgba(245, 158, 11, 0.15)' : isMaint ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.15)',
                        color: isBusy ? '#FBBF24' : isMaint ? '#A1A1AA' : '#34D399',
                        border: `1px solid ${isBusy ? 'rgba(245, 158, 11, 0.3)' : isMaint ? 'rgba(255,255,255,0.1)' : 'rgba(16, 185, 129, 0.3)'}`,
                      }}
                    >
                      {comp.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#D4D4D8' }}>
                    <div>Lab: {comp.lab_name}</div>
                    <div style={{ marginTop: '2px' }}>{comp.cpu_model} ({comp.cpu_cores} Cores)</div>
                    <div>{comp.ram_gb} GB RAM • {comp.gpu_model || 'No GPU'}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {isBusy && (
                      <button
                        className="glass-btn danger"
                        style={{ fontSize: '0.75rem', minHeight: '32px', flex: 1 }}
                        onClick={() => setStopSessionModal({ id: comp.id, node: comp.safe_identifier })}
                      >
                        <Square size={12} />
                        <span>Terminate Session</span>
                      </button>
                    )}

                    <button
                      className="glass-btn"
                      style={{ fontSize: '0.75rem', minHeight: '32px', flex: 1 }}
                      onClick={() => setMaintenanceModal({ id: comp.id, safeId: comp.safe_identifier, currentStatus: comp.status })}
                    >
                      <Wrench size={12} />
                      <span>{isMaint ? 'Exit Maintenance' : 'Maintenance Mode'}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Computer Inventory Tab */}
      {tab === 'computers' && (
        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Identifier</th>
                <th>Lab Room</th>
                <th>Processor</th>
                <th>Memory</th>
                <th>GPU Accelerator</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {computers.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#38BDF8' }}>
                    {c.safe_identifier}
                  </td>
                  <td>{c.lab_name}</td>
                  <td>{c.cpu_model} ({c.cpu_cores}c)</td>
                  <td>{c.ram_gb} GB</td>
                  <td style={{ color: c.gpu_model ? '#FAFAFA' : '#71717A' }}>
                    {c.gpu_model || 'Integrated Graphics'}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '99px',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        background: c.status === 'available' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: c.status === 'available' ? '#34D399' : '#A1A1AA',
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="glass-btn"
                      style={{ minHeight: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                      onClick={() => setMaintenanceModal({ id: c.id, safeId: c.safe_identifier, currentStatus: c.status })}
                    >
                      {c.status === 'maintenance' ? 'Activate' : 'Inspect'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assigned Labs Tab */}
      {tab === 'labs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {labs.map((l) => (
            <div
              key={l.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1.1rem', color: '#FAFAFA' }}>{l.name}</strong>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#A1A1AA', fontSize: '0.8rem' }}>
                  {l.room_number || 'Room CS-301'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: '#A1A1AA', marginTop: '6px' }}>
                <div>Total Nodes: <strong style={{ color: '#FAFAFA' }}>{l.total_computers}</strong></div>
                <div>Active Workloads: <strong style={{ color: '#34D399' }}>{l.active_computers}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Maintenance & Incidents Tab */}
      {tab === 'incidents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Create Incident Form */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color="#F59E0B" />
              <h3 style={{ fontSize: '1rem', color: '#FAFAFA', fontWeight: 600 }}>Log Hardware Inspection or Incident</h3>
            </div>

            {incidentSuccessMsg && (
              <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#6EE7B7', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={14} />
                <span>Maintenance incident logged and added to audit registry.</span>
              </div>
            )}

            <form onSubmit={handleCreateIncident} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '4px' }}>Target Computer Node</label>
                <select
                  className="glass-select"
                  value={newIncidentNode}
                  onChange={(e) => setNewIncidentNode(e.target.value)}
                >
                  {computers.map((c) => (
                    <option key={c.id} value={c.safe_identifier}>{c.safe_identifier} ({c.lab_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '4px' }}>Severity</label>
                <select
                  className="glass-select"
                  value={newIncidentSeverity}
                  onChange={(e) => setNewIncidentSeverity(e.target.value)}
                >
                  <option value="low">Low (Routine Check)</option>
                  <option value="medium">Medium (Driver/OS Update)</option>
                  <option value="high">High (Thermal/Hardware Fault)</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '4px' }}>Incident Description</label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. Node fan vibrating at high RPM; scheduled physical cleaning"
                  value={newIncidentTitle}
                  onChange={(e) => setNewIncidentTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <button type="submit" className="glass-btn primary" style={{ width: '100%', minHeight: '40px' }}>
                  <Plus size={14} />
                  <span>Log Incident</span>
                </button>
              </div>
            </form>
          </div>

          {/* Incidents List */}
          <div className="glass-table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Target Node</th>
                  <th>Severity</th>
                  <th>Summary</th>
                  <th>Technician</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#A1A1AA' }}>
                      {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#38BDF8' }}>
                      {inc.node_id}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '2px 8px',
                          borderRadius: '99px',
                          textTransform: 'uppercase',
                          background: inc.severity === 'high' ? 'rgba(244, 63, 94, 0.15)' : inc.severity === 'medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: inc.severity === 'high' ? '#FDA4AF' : inc.severity === 'medium' ? '#FBBF24' : '#7DD3FC',
                        }}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td style={{ color: '#FAFAFA' }}>{inc.title}</td>
                    <td style={{ color: '#A1A1AA' }}>{inc.reported_by}</td>
                    <td>
                      <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: inc.status === 'resolved' ? '#34D399' : '#FBBF24' }}>
                        {inc.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stop Session Reason Modal */}
      {stopSessionModal && (
        <div className="glass-modal-overlay" onClick={() => setStopSessionModal(null)}>
          <div className="glass-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#FAFAFA', fontSize: '1.2rem' }}>
              Terminate Session on {stopSessionModal.node}
            </h3>
            <p style={{ color: '#A1A1AA', fontSize: '0.85rem' }}>
              Administrative termination requires an explicit documented reason for the institutional audit log.
            </p>
            <input
              type="text"
              placeholder="e.g. Unresponsive infinite loop exceeding scheduled lab period"
              className="glass-input"
              value={stopReason}
              onChange={(e) => setStopReason(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="glass-btn" onClick={() => setStopSessionModal(null)}>Cancel</button>
              <button className="glass-btn danger" disabled={!stopReason.trim()} onClick={handleStopSession}>
                Terminate Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Confirmation Modal */}
      <ConfirmModal
        isOpen={!!maintenanceModal}
        title={maintenanceModal?.currentStatus === 'maintenance' ? 'Exit Maintenance Mode?' : 'Place Node in Maintenance?'}
        message={`Node ${maintenanceModal?.safeId} will be ${maintenanceModal?.currentStatus === 'maintenance' ? 'restored to available pool' : 'temporarily blocked from student allocations for hardware inspection'}.`}
        confirmText="Confirm Status Update"
        onConfirm={handleToggleMaintenance}
        onCancel={() => setMaintenanceModal(null)}
      />
    </div>
  )
}
