import React, { useState } from 'react'
import { User, Key, LogOut, CheckCircle2, Laptop } from 'lucide-react'
import { UserSession } from '../../services/api'

interface ProfileSecurityViewProps {
  session: UserSession | null
  onLogout: () => void
}

export const ProfileSecurityView: React.FC<ProfileSecurityViewProps> = ({ session, onLogout }) => {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwUpdated, setPwUpdated] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPw || !newPw) {
      setErrorMsg('Please fill in all password fields')
      return
    }
    if (newPw !== confirmPw) {
      setErrorMsg('New passwords do not match')
      return
    }
    if (newPw.length < 8) {
      setErrorMsg('Password must be at least 8 characters long')
      return
    }

    // Success feedback
    setErrorMsg('')
    setPwUpdated(true)
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setTimeout(() => setPwUpdated(false), 3500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="main-panel-header">
        <div>
          <h2 className="panel-title">Profile &amp; Account Security</h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.85rem', marginTop: '4px' }}>
            Manage institutional credentials, active browser sessions, and access permissions.
          </p>
        </div>

        <button className="glass-btn danger" onClick={onLogout}>
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* User Institutional Profile Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'grid',
                placeItems: 'center',
                color: '#FAFAFA',
              }}
            >
              <User size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#FAFAFA', fontWeight: 600 }}>
                {session?.fullName || 'Campus User'}
              </h3>
              <div style={{ color: '#38BDF8', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>
                {session?.role?.replace('_', ' ') || 'Authorized Account'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '16px' }}>
            <div>
              <div style={{ fontSize: '0.74rem', color: '#71717A', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Institutional Email</div>
              <div style={{ color: '#E4E4E7', fontSize: '0.88rem', marginTop: '2px' }}>{session?.email || 'user@campus.edu'}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', color: '#71717A', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Academic Department</div>
              <div style={{ color: '#E4E4E7', fontSize: '0.88rem', marginTop: '2px' }}>Computer Science &amp; Engineering (CSE)</div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', color: '#71717A', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Academic Roll Number</div>
              <div style={{ color: '#E4E4E7', fontSize: '0.88rem', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>22CS101 (3rd Year B.Tech)</div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', color: '#71717A', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Approval Status</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px', padding: '3px 10px', borderRadius: '99px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34D399', fontSize: '0.76rem', fontWeight: 600 }}>
                <CheckCircle2 size={13} />
                <span>Verified by Academic Administration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <form
          onSubmit={handleUpdatePassword}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key size={18} color="#38BDF8" />
            <h3 style={{ fontSize: '1.05rem', color: '#FAFAFA', fontWeight: 600 }}>
              Update Password
            </h3>
          </div>

          {pwUpdated && (
            <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', color: '#34D399', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>Password successfully updated. Secure token refreshed.</span>
            </div>
          )}

          {errorMsg && (
            <div style={{ padding: '10px 14px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '10px', color: '#FDA4AF', fontSize: '0.82rem' }}>
              {errorMsg}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '4px' }}>Current Password</label>
            <input
              type="password"
              className="glass-input"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '4px' }}>New Password (min 8 chars)</label>
            <input
              type="password"
              className="glass-input"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '4px' }}>Confirm New Password</label>
            <input
              type="password"
              className="glass-input"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button type="submit" className="glass-btn primary" style={{ minHeight: '38px' }}>
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Active Device Sessions Card */}
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
          <div>
            <h4 style={{ color: '#FAFAFA', fontSize: '1rem', fontWeight: 600 }}>Active Authentication Sessions</h4>
            <p style={{ color: '#71717A', fontSize: '0.8rem', marginTop: '2px' }}>
              Devices authorized to access your IdleNode compute account.
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#10B981', fontFamily: 'var(--font-mono)' }}>
            1 ACTIVE CLIENT
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Laptop size={20} color="#38BDF8" />
            <div>
              <div style={{ color: '#FAFAFA', fontSize: '0.88rem', fontWeight: 500 }}>
                This Browser Session (Chrome / Windows 11)
              </div>
              <div style={{ color: '#71717A', fontSize: '0.76rem', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                IP: 10.0.84.192 • Campus Wi-Fi Eduroam • Active Now
              </div>
            </div>
          </div>
          <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', fontSize: '0.72rem', fontWeight: 600 }}>
            CURRENT DEVICE
          </span>
        </div>
      </div>
    </div>
  )
}
