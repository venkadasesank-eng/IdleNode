import React, { useState, useEffect } from 'react'
import { PanelsTopLeft, Activity, Monitor, Square, Wrench } from 'lucide-react'
import { api } from '../../services/api'
import { ConfirmModal } from '../ui/ConfirmModal'

interface LabAssistantDashboardProps {
  activeNav?: string
}

export const LabAssistantDashboard: React.FC<LabAssistantDashboardProps> = ({ activeNav }) => {
  const [tab, setTab] = useState<'labs' | 'monitoring' | 'computers'>('monitoring')

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="main-panel-header">
        <div>
          <h2 className="panel-title">Lab Supervision &amp; Monitoring</h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.85rem', marginTop: '4px' }}>
            Supervise assigned computer laboratory inventory, active student workloads, and hardware telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
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
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#FAFAFA', fontFamily: 'var(--font-mono)' }}>
                      {comp.safe_identifier}
                    </strong>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '99px',
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background: isBusy
                          ? 'rgba(56, 189, 248, 0.15)'
                          : isMaint
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(16, 185, 129, 0.15)',
                        color: isBusy ? '#38BDF8' : isMaint ? '#FBBF24' : '#34D399',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {comp.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#A1A1AA' }}>
                    <div>Lab: {comp.lab_name || 'AI Lab'}</div>
                    <div style={{ marginTop: '2px' }}>CPU: {comp.cpu_model} ({comp.cpu_cores} cores)</div>
                    <div style={{ marginTop: '2px' }}>RAM: {comp.ram_gb} GB DDR5</div>
                    {comp.gpu_model && (
                      <div style={{ marginTop: '2px', color: '#38BDF8' }}>GPU: {comp.gpu_model}</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                    {isBusy && (
                      <button
                        className="glass-btn danger"
                        style={{ minHeight: '30px', padding: '0 10px', fontSize: '0.75rem', flex: 1 }}
                        onClick={() => setStopSessionModal({ id: comp.id, node: comp.safe_identifier })}
                      >
                        <Square size={12} />
                        <span>Stop Runaway Session</span>
                      </button>
                    )}
                    <button
                      className="glass-btn"
                      style={{ minHeight: '30px', padding: '0 10px', fontSize: '0.75rem' }}
                      onClick={() => setMaintenanceModal({ id: comp.id, safeId: comp.safe_identifier, currentStatus: comp.status })}
                    >
                      <Wrench size={12} />
                      <span>{isMaint ? 'Exit Maint' : 'Set Maint'}</span>
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
                <th>Node Identifier</th>
                <th>Lab Room</th>
                <th>Processor</th>
                <th>Memory</th>
                <th>GPU Accelerator</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {computers.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: '#FAFAFA', fontFamily: 'var(--font-mono)' }}>
                    {c.safe_identifier}
                  </td>
                  <td>{c.lab_name}</td>
                  <td>{c.cpu_model} ({c.cpu_cores}C)</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{c.ram_gb} GB</td>
                  <td style={{ color: c.gpu_model ? '#38BDF8' : '#71717A' }}>
                    {c.gpu_model || 'Integrated'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>
                    {c.status}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="glass-btn"
                      style={{ minHeight: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                      onClick={() => setMaintenanceModal({ id: c.id, safeId: c.safe_identifier, currentStatus: c.status })}
                    >
                      Toggle Maint
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
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
