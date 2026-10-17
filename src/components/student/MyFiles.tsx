import React, { useState, useEffect } from 'react'
import { Folder, Upload, Trash2, HardDrive, FileText } from 'lucide-react'
import { api } from '../../services/api'
import { ConfirmModal } from '../ui/ConfirmModal'

export const MyFiles: React.FC = () => {
  const [tab, setTab] = useState<'persistent' | 'temporary'>('persistent')
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const data = await api.getFiles(tab)
      setFiles(data)
    } catch {
      // Fallback sample files for demonstration
      setFiles([
        {
          id: 'f1',
          filename: 'machine_learning_coursework.ipynb',
          size_bytes: 4200000,
          storage_type: 'persistent',
          created_at: new Date().toISOString(),
        },
        {
          id: 'f2',
          filename: 'cuda_matrix_mult.cu',
          size_bytes: 145000,
          storage_type: 'persistent',
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [tab])

  const totalBytes = files.reduce((acc, f) => acc + (f.size_bytes || 0), 0)
  const quotaBytes = 5 * 1024 * 1024 * 1024 // 5 GB
  const usedPct = Math.min(100, Math.round((totalBytes / quotaBytes) * 100))

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Client-side simulated or real upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('storage_type', tab)

      const token = localStorage.getItem('idlenode_token')
      await fetch('http://127.0.0.1:8000/api/student/files/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      fetchFiles()
    } catch {
      // Add local mock if backend offline
      setFiles((prev) => [
        {
          id: `f-${Date.now()}`,
          filename: file.name,
          size_bytes: file.size,
          storage_type: tab,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      await api.deleteFile(fileId)
    } catch {
      // ignore
    }
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
    setDeleteTargetId(null)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="main-panel-header">
        <div>
          <h2 className="panel-title">My Projects &amp; Storage</h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.85rem', marginTop: '4px' }}>
            Private student files mounted directly into your remote compute sessions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`glass-btn ${tab === 'persistent' ? 'primary' : ''}`}
            onClick={() => setTab('persistent')}
          >
            Persistent Storage
          </button>
          <button
            className={`glass-btn ${tab === 'temporary' ? 'primary' : ''}`}
            onClick={() => setTab('temporary')}
          >
            Temporary Scratch
          </button>
        </div>
      </div>

      {/* Quota Progress Bar */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={18} style={{ color: '#FAFAFA' }} />
            <strong style={{ color: '#FAFAFA' }}>
              {tab === 'persistent' ? 'Persistent Quota (5.0 GB)' : 'Temporary Session Buffer'}
            </strong>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#A1A1AA' }}>
            {formatSize(totalBytes)} used ({usedPct}%)
          </span>
        </div>

        <div className="metric-progress-track">
          <div className="metric-progress-fill" style={{ width: `${Math.max(4, usedPct)}%` }} />
        </div>

        <p style={{ fontSize: '0.78rem', color: '#71717A' }}>
          {tab === 'persistent'
            ? 'Files in Persistent Storage automatically mount into every future session in /home/student/workspace.'
            : 'Temporary session files expire 24 hours after session completion according to institutional data hygiene policy.'}
        </p>
      </div>

      {/* File Action Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ color: '#FAFAFA', fontSize: '1rem', fontWeight: 600 }}>
          {tab === 'persistent' ? 'Persistent Files' : 'Temporary Session Files'}
        </h4>

        <label className="glass-btn primary" style={{ cursor: 'pointer' }}>
          <Upload size={14} />
          <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
          <input
            type="file"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            disabled={uploading}
          />
        </label>
      </div>

      {/* File Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#71717A' }}>
          Loading private files...
        </div>
      ) : files.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '16px',
            color: '#71717A',
          }}
        >
          <Folder size={32} style={{ margin: '0 auto 10px', color: '#52525B' }} />
          <div>No files stored in this volume yet.</div>
        </div>
      ) : (
        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Storage Volume</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td style={{ fontWeight: 500, color: '#FAFAFA' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} style={{ color: '#38BDF8' }} />
                      <span>{file.filename}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>
                    {file.storage_type}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{formatSize(file.size_bytes)}</td>
                  <td style={{ fontSize: '0.78rem', color: '#71717A' }}>
                    {new Date(file.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        className="glass-btn danger"
                        style={{ minHeight: '28px', padding: '0 8px' }}
                        onClick={() => setDeleteTargetId(file.id)}
                        title="Delete file"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Private File?"
        message="Are you sure you want to delete this file? This action is permanent and cannot be undone."
        confirmText="Delete File"
        danger={true}
        onConfirm={() => deleteTargetId && handleDelete(deleteTargetId)}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  )
}
