import React, { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { api, UserSession } from '../../services/api'

interface AuthModalProps {
  isOpen: boolean
  initialTab?: 'signin' | 'register' | 'demo'
  onClose: () => void
  onSuccess: (session: UserSession) => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialTab = 'signin', onClose, onSuccess }) => {
  const [tab, setTab] = useState<'signin' | 'register' | 'demo'>(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sign In State
  const [email, setEmail] = useState('student@campus.edu')
  const [password, setPassword] = useState('password123')

  // Register State
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRoll, setRegRoll] = useState('')
  const [regDept, setRegDept] = useState('CSE')
  const [regTerms, setRegTerms] = useState(false)

  if (!isOpen) return null

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const session = await api.login(email, password)
      onSuccess(session)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regTerms) {
      setError('You must agree to campus laboratory compute policy')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const session = await api.register({
        fullName: regName,
        email: regEmail,
        password: regPassword,
        rollNumber: regRoll,
        departmentId: regDept,
        agreeTerms: regTerms,
      })
      onSuccess(session)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true)
    setError(null)
    try {
      const session = await api.login(demoEmail, 'password123')
      onSuccess(session)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-modal-overlay" onClick={onClose}>
      <div className="glass-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-dot" />
            <h3 style={{ fontSize: '1.25rem', color: '#FAFAFA' }}>
              {tab === 'signin' && 'Sign in to IdleNode'}
              {tab === 'register' && 'Student Registration'}
              {tab === 'demo' && 'Quick Demo Role Selector'}
            </h3>
          </div>

          <button
            className="glass-btn"
            style={{ minHeight: '28px', padding: '0 8px', borderRadius: '50%' }}
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: '12px' }}>
          <button
            className={`glass-btn ${tab === 'signin' ? 'primary' : ''}`}
            style={{ flex: 1, minHeight: '32px', fontSize: '0.8rem' }}
            onClick={() => { setTab('signin'); setError(null) }}
          >
            Sign In
          </button>
          <button
            className={`glass-btn ${tab === 'register' ? 'primary' : ''}`}
            style={{ flex: 1, minHeight: '32px', fontSize: '0.8rem' }}
            onClick={() => { setTab('register'); setError(null) }}
          >
            Register Student
          </button>
          <button
            className={`glass-btn ${tab === 'demo' ? 'primary' : ''}`}
            style={{ flex: 1, minHeight: '32px', fontSize: '0.8rem' }}
            onClick={() => { setTab('demo'); setError(null) }}
          >
            1-Click Demo
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '10px',
              color: '#FDA4AF',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Sign In */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '4px' }}>
                Institutional Email
              </label>
              <input
                type="email"
                required
                className="glass-input"
                placeholder="student@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '4px' }}>
                Password
              </label>
              <input
                type="password"
                required
                className="glass-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="glass-btn primary" disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Tab 2: Register Student */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#A1A1AA', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                className="glass-input"
                placeholder="Rohan Sharma"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#A1A1AA', marginBottom: '4px' }}>
                College Email Address
              </label>
              <input
                type="email"
                required
                className="glass-input"
                placeholder="rohan.22@campus.edu"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#A1A1AA', marginBottom: '4px' }}>
                  Roll / Registration No.
                </label>
                <input
                  type="text"
                  required
                  className="glass-input"
                  placeholder="22CS155"
                  value={regRoll}
                  onChange={(e) => setRegRoll(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#A1A1AA', marginBottom: '4px' }}>
                  Department
                </label>
                <select
                  className="glass-select"
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                >
                  <option value="CSE">Computer Science &amp; Eng.</option>
                  <option value="AIDS">AI &amp; Data Science</option>
                  <option value="ECE">Electronics &amp; Comm.</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#A1A1AA', marginBottom: '4px' }}>
                Password (min. 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="glass-input"
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#A1A1AA', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={regTerms}
                  onChange={(e) => setRegTerms(e.target.checked)}
                  style={{ accentColor: '#10B981' }}
                />
                <span>I agree to campus compute acceptable-use policies and fair daily credit rules.</span>
              </label>
            </div>

            <button type="submit" className="glass-btn primary" disabled={loading} style={{ marginTop: '6px' }}>
              {loading ? 'Submitting Registration...' : 'Submit Student Registration'}
            </button>
          </form>
        )}

        {/* Tab 3: Quick Demo Roles */}
        {tab === 'demo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '0.82rem', color: '#A1A1AA', marginBottom: '4px' }}>
              Click any verified role below to log in immediately and inspect role-specific permissions and dashboards:
            </p>

            <button
              className="glass-btn"
              style={{ justifyContent: 'space-between', padding: '12px 16px', minHeight: '44px' }}
              onClick={() => handleDemoLogin('student@campus.edu')}
              disabled={loading}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38BDF8' }} />
                <span style={{ fontWeight: 600, color: '#FAFAFA' }}>Student (Aarav Sharma)</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#71717A', fontFamily: 'var(--font-mono)' }}>Compute Consumer</span>
            </button>

            <button
              className="glass-btn"
              style={{ justifyContent: 'space-between', padding: '12px 16px', minHeight: '44px' }}
              onClick={() => handleDemoLogin('labtech@campus.edu')}
              disabled={loading}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                <span style={{ fontWeight: 600, color: '#FAFAFA' }}>Lab Assistant (Pooja Patel)</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#71717A', fontFamily: 'var(--font-mono)' }}>Lab Supervision</span>
            </button>

            <button
              className="glass-btn"
              style={{ justifyContent: 'space-between', padding: '12px 16px', minHeight: '44px' }}
              onClick={() => handleDemoLogin('hod.cs@campus.edu')}
              disabled={loading}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                <span style={{ fontWeight: 600, color: '#FAFAFA' }}>HOD (Dr. Rajesh Iyer)</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#71717A', fontFamily: 'var(--font-mono)' }}>Academic Approvals</span>
            </button>

            <button
              className="glass-btn"
              style={{ justifyContent: 'space-between', padding: '12px 16px', minHeight: '44px' }}
              onClick={() => handleDemoLogin('admin@campus.edu')}
              disabled={loading}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#A855F7' }} />
                <span style={{ fontWeight: 600, color: '#FAFAFA' }}>Institution Admin (Dean Varma)</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#71717A', fontFamily: 'var(--font-mono)' }}>Campus Policies</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
