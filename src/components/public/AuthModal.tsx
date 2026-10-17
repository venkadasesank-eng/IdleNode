import React, { useState } from 'react'
import {
  AlertTriangle,
  X,
  Monitor,
  Activity,
  Building2,
  Shield,
  Terminal,
  ArrowRight,
  Loader2,
  Sparkles,
  Info
} from 'lucide-react'
import { api, UserSession } from '../../services/api'

interface AuthModalProps {
  isOpen: boolean
  initialTab?: 'signin' | 'register' | 'demo'
  onClose: () => void
  onSuccess: (session: UserSession) => void
}

interface DemoRoleCard {
  role: 'student' | 'lab_assistant' | 'hod' | 'institution_admin' | 'technical_admin'
  label: string
  name: string
  tag: string
  color: string
  icon: React.ElementType
  description: string
}

const DEMO_ROLES: DemoRoleCard[] = [
  {
    role: 'student',
    label: 'Student',
    name: 'Aarav Sharma',
    tag: 'Compute Consumer',
    color: '#38BDF8',
    icon: Monitor,
    description: 'Explore compute workload requests, active remote desktop sessions, daily credit allowance (100 credits/day), notifications, and persistent project files.',
  },
  {
    role: 'lab_assistant',
    label: 'Lab Assistant',
    name: 'Pooja Patel',
    tag: 'Lab Supervision',
    color: '#10B981',
    icon: Activity,
    description: 'Supervise lab computer grids, inspect real-time CPU/GPU load telemetry, toggle maintenance modes, and manage student sessions across assigned labs.',
  },
  {
    role: 'hod',
    label: 'Department Head (HOD)',
    name: 'Dr. Rajesh Iyer',
    tag: 'Department Governance',
    color: '#F59E0B',
    icon: Building2,
    description: 'Review pending student compute registrations, monitor departmental lab occupancy rates, and inspect departmental resource policies.',
  },
  {
    role: 'institution_admin',
    label: 'Institution Administrator',
    name: 'Dean K. Varma',
    tag: 'Campus Infrastructure',
    color: '#A855F7',
    icon: Shield,
    description: 'Configure campus-wide credit policies, register new laboratory computers, oversee multi-department grids, and inspect immutable audit trails.',
  },
  {
    role: 'technical_admin',
    label: 'Technical Administrator',
    name: 'SysAdmin Vikram',
    tag: 'Systems & API Engineering',
    color: '#F43F5E',
    icon: Terminal,
    description: 'Inspect hardware telemetry daemons, node health diagnostics, worker agent registration, and developer API references.',
  },
]

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'signin',
  onClose,
  onSuccess,
}) => {
  const [tab, setTab] = useState<'signin' | 'register' | 'demo'>(initialTab)
  const [loading, setLoading] = useState(false)
  const [loadingRole, setLoadingRole] = useState<string | null>(null)
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
      setError(err?.message || 'Login failed. Please check credentials or try a Demo Account.')
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
      setError(err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (role: string) => {
    if (loadingRole) return
    setLoadingRole(role)
    setError(null)
    try {
      const session = await api.demoLogin(role)
      onSuccess(session)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate into demo role.')
    } finally {
      setLoadingRole(null)
    }
  }

  return (
    <div className="glass-modal-overlay" onClick={onClose}>
      <div
        className="glass-dialog"
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
          width: 'min(580px, 94vw)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-dot" />
            <h3 style={{ fontSize: '1.25rem', color: '#FAFAFA', margin: 0, fontWeight: 600 }}>
              {tab === 'signin' && 'Sign In to IdleNode'}
              {tab === 'register' && 'Student Registration'}
              {tab === 'demo' && 'Explore Demo Accounts'}
            </h3>
          </div>

          <button
            className="glass-btn"
            style={{ minHeight: '28px', padding: '0 8px', borderRadius: '50%' }}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={14} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: '12px' }}>
          <button
            className={`glass-btn ${tab === 'signin' ? 'primary' : ''}`}
            style={{ flex: 1, minHeight: '34px', fontSize: '0.8rem' }}
            onClick={() => { setTab('signin'); setError(null) }}
          >
            Sign In
          </button>
          <button
            className={`glass-btn ${tab === 'register' ? 'primary' : ''}`}
            style={{ flex: 1, minHeight: '34px', fontSize: '0.8rem' }}
            onClick={() => { setTab('register'); setError(null) }}
          >
            Register Student
          </button>
          <button
            className={`glass-btn ${tab === 'demo' ? 'primary' : ''}`}
            style={{ flex: 1.2, minHeight: '34px', fontSize: '0.8rem', gap: '6px' }}
            onClick={() => { setTab('demo'); setError(null) }}
          >
            <Sparkles size={13} color={tab === 'demo' ? '#FAFAFA' : '#38BDF8'} />
            <span>Explore Demo</span>
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
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
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

            <button type="submit" className="glass-btn primary" disabled={loading} style={{ minHeight: '42px', marginTop: '4px' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Quick Demo Jump from Sign In */}
            <div style={{ marginTop: '10px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: '#A1A1AA', margin: '0 0 10px 0' }}>
                Evaluating IdleNode? No credentials required:
              </p>
              <button
                type="button"
                className="glass-btn"
                style={{ width: '100%', minHeight: '38px', gap: '8px', fontSize: '0.82rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38BDF8' }}
                onClick={() => { setTab('demo'); setError(null) }}
              >
                <Sparkles size={14} />
                <span>Explore Demo Accounts (All 5 Roles Available)</span>
              </button>
            </div>
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

            <button type="submit" className="glass-btn primary" disabled={loading} style={{ minHeight: '40px', marginTop: '6px' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting Registration...</span>
                </div>
              ) : (
                'Submit Student Registration'
              )}
            </button>
          </form>
        )}

        {/* Tab 3: Explore Demo Accounts (All 5 Roles) */}
        {tab === 'demo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.82rem', color: '#A1A1AA', margin: '0 0 4px 0', lineHeight: '1.5' }}>
              Select any verified campus role below to immediately enter its dedicated workspace and evaluate platform workflows:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {DEMO_ROLES.map((item) => {
                const Icon = item.icon
                const isLoggingIn = loadingRole === item.role
                return (
                  <div
                    key={item.role}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: `rgba(${item.color === '#38BDF8' ? '56, 189, 248' : item.color === '#10B981' ? '16, 185, 129' : item.color === '#F59E0B' ? '245, 158, 11' : item.color === '#A855F7' ? '168, 85, 247' : '244, 63, 94'}, 0.12)`,
                            border: `1px solid ${item.color}40`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: item.color,
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '0.88rem', color: '#FAFAFA' }}>{item.label}</strong>
                            <span style={{ fontSize: '0.74rem', color: '#A1A1AA' }}>({item.name})</span>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: item.color, fontFamily: 'var(--font-mono)' }}>
                            {item.tag}
                          </span>
                        </div>
                      </div>

                      <button
                        className="glass-btn primary"
                        style={{
                          minHeight: '32px',
                          fontSize: '0.78rem',
                          padding: '0 12px',
                          gap: '6px',
                        }}
                        disabled={loadingRole !== null}
                        onClick={() => handleDemoLogin(item.role)}
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Entering...</span>
                          </>
                        ) : (
                          <>
                            <span>Enter Demo</span>
                            <ArrowRight size={12} />
                          </>
                        )}
                      </button>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#A1A1AA', lineHeight: '1.45' }}>
                      {item.description}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Disclaimer notice */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
                padding: '10px 12px',
                background: 'rgba(56, 189, 248, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.15)',
                borderRadius: '10px',
                fontSize: '0.74rem',
                color: '#93C5FD',
                lineHeight: '1.45',
              }}
            >
              <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>Sample Data Notice:</strong> Demo accounts operate with isolated sample data and simulated laboratory compute operations to evaluate platform workflows without accessing real campus computers.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
