import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, Zap, Monitor, History, Folder, Coins,
  LogOut, Shield, ChevronDown, Check, Activity, Building2, User,
  Bell, AlertCircle, Loader2
} from 'lucide-react'

import { BackgroundVideo } from './components/layout/BackgroundVideo'
import { LandingPage } from './components/public/LandingPage'
import { AuthModal } from './components/public/AuthModal'

// Student Views
import { StudentOverview } from './components/student/StudentOverview'
import { StartComputing } from './components/student/StartComputing'
import { RemoteWorkspace } from './components/student/RemoteWorkspace'
import { MySessions } from './components/student/MySessions'
import { MyFiles } from './components/student/MyFiles'
import { CreditsUsage } from './components/student/CreditsUsage'

// Common Staff & Student Views
import { NotificationsView } from './components/common/NotificationsView'
import { ProfileSecurityView } from './components/common/ProfileSecurityView'

// Staff Views
import { LabAssistantDashboard } from './components/staff/LabAssistantDashboard'
import { HodDashboard } from './components/staff/HodDashboard'
import { InstitutionAdminDashboard } from './components/staff/InstitutionAdminDashboard'

import { api, getStoredSession, UserSession } from './services/api'

export default function App() {
  const [session, setSession] = useState<UserSession | null>(getStoredSession)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'register' | 'demo'>('signin')
  
  // Navigation State
  const [currentPage, setCurrentPage] = useState<string>('Overview')
  const [activeComputeSession, setActiveComputeSession] = useState<any | null>(null)
  
  // Role Switcher Popover State
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false)
  const [isSwitchingRole, setIsSwitchingRole] = useState(false)
  const [roleSwitchError, setRoleSwitchError] = useState<string | null>(null)
  const roleSwitcherRef = useRef<HTMLDivElement>(null)

  // Real-time Dashboard Telemetry State
  const [dashboardMetrics, setDashboardMetrics] = useState({
    active_compute_nodes: 34,
    total_compute_nodes: 50,
    current_queue_tasks: 2,
    avg_queue_wait_minutes: 1.4,
    daily_balance: 78,
    daily_allowance: 100,
    grid_online: true,
    recent_activity: [
      '2026-10-17T08:32:41Z User authenticated auth:verified',
      '2026-10-17T08:32:42Z Compute node allocated scheduler:alloc',
      '2026-10-17T08:32:43Z Streaming session started gateway:stream',
    ],
  })

  // Close Role Switcher when clicking outside or pressing Escape
  useEffect(() => {
    if (!roleSwitcherOpen) return

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (roleSwitcherRef.current && !roleSwitcherRef.current.contains(e.target as Node)) {
        setRoleSwitcherOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRoleSwitcherOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [roleSwitcherOpen])

  // Poll or fetch dashboard telemetry
  useEffect(() => {
    if (session?.role === 'student') {
      api.getStudentDashboard()
        .then((m) => {
          if (m && m.active_compute_nodes !== undefined) setDashboardMetrics(m)
        })
        .catch(() => {})
    }
  }, [session, currentPage])

  // Real-time WebSocket Telemetry listener
  useEffect(() => {
    if (!session?.token) return

    let ws: WebSocket | null = null
    try {
      ws = new WebSocket(api.getWsUrl(session.token))
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'TELEMETRY_SNAPSHOT' && data.data) {
            setDashboardMetrics((prev) => ({
              ...prev,
              active_compute_nodes: data.data.active_nodes ?? prev.active_compute_nodes,
              total_compute_nodes: data.data.total_nodes ?? prev.total_compute_nodes,
              current_queue_tasks: data.data.queued_tasks ?? prev.current_queue_tasks,
              grid_online: true,
            }))
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // WebSocket offline fallback
    }

    return () => {
      if (ws) ws.close()
    }
  }, [session])

  const handleLogout = () => {
    api.logout()
    setSession(null)
    setCurrentPage('Overview')
    setActiveComputeSession(null)
  }

  const handleSwitchDemoRole = async (demoEmail: string) => {
    setIsSwitchingRole(true)
    setRoleSwitchError(null)
    try {
      const newSession = await api.login(demoEmail, 'password123')
      setSession(newSession)
      setCurrentPage('Overview')
      setRoleSwitcherOpen(false)
    } catch (err: any) {
      setRoleSwitchError(err?.message || 'Authentication error while switching demo role.')
    } finally {
      setIsSwitchingRole(false)
    }
  }

  // Determine Sidebar navigation items based on STRICT role access
  const getSidebarNav = () => {
    if (!session) return []

    if (session.role === 'student') {
      return [
        { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'Start Computing', label: 'Start Computing', icon: Zap },
        { id: 'Remote Workspace', label: 'Remote Workspace', icon: Monitor },
        { id: 'My Sessions', label: 'My Sessions', icon: History },
        { id: 'My Files', label: 'My Projects & Files', icon: Folder },
        { id: 'Credits & Usage', label: 'Credits & Usage', icon: Coins },
        { id: 'Notifications', label: 'Notifications', icon: Bell },
        { id: 'Profile & Security', label: 'Profile & Security', icon: User },
      ]
    }

    if (session.role === 'lab_assistant') {
      return [
        { id: 'Overview', label: 'Lab Supervision', icon: LayoutDashboard },
        { id: 'Live Monitoring', label: 'Live Monitoring', icon: Activity },
        { id: 'Computer Management', label: 'Computer Inventory', icon: Monitor },
        { id: 'Notifications', label: 'Notifications', icon: Bell },
        { id: 'Profile & Security', label: 'Profile & Security', icon: User },
      ]
    }

    if (session.role === 'hod') {
      return [
        { id: 'Overview', label: 'Department Overview', icon: LayoutDashboard },
        { id: 'Student Approvals', label: 'Student Approvals', icon: User },
        { id: 'Notifications', label: 'Notifications', icon: Bell },
        { id: 'Profile & Security', label: 'Profile & Security', icon: User },
      ]
    }

    // Institution Admin / Tech Admin
    return [
      { id: 'Overview', label: 'Institution Overview', icon: LayoutDashboard },
      { id: 'Credit Policies', label: 'Credit Policies', icon: Coins },
      { id: 'Hardware Inventory', label: 'Node Inventory', icon: Building2 },
      { id: 'Audit Trail', label: 'Audit Trail', icon: Shield },
      { id: 'Notifications', label: 'Notifications', icon: Bell },
      { id: 'Profile & Security', label: 'Profile & Security', icon: User },
    ]
  }

  return (
    <div className="app-viewport">
      {/* Background Video & Space Grid Layer */}
      <BackgroundVideo />

      <div className="app-container">
        {/* Header Bar */}
        <header className="glass-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              className="brand-badge"
              onClick={() => setCurrentPage('Overview')}
              style={{ cursor: 'pointer' }}
              title="IdleNode Platform Home"
            >
              <span className="brand-dot" />
              <span>IdleNode</span>
            </div>

            {session && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '99px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: '#FAFAFA',
                  textTransform: 'capitalize',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: session.role === 'student' ? '#38BDF8' : '#10B981',
                  }}
                />
                <span>{session.role.replace('_', ' ')}</span>
              </div>
            )}
          </div>

          <div className="header-controls">
            {!session ? (
              <>
                <button
                  className="glass-btn"
                  onClick={() => { setAuthModalTab('demo'); setAuthModalOpen(true) }}
                >
                  Explore Demo Roles
                </button>
                <button
                  className="glass-btn primary"
                  onClick={() => { setAuthModalTab('signin'); setAuthModalOpen(true) }}
                >
                  Sign In
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* 1-Click Role Switcher with dedicated relative container */}
                <div ref={roleSwitcherRef} style={{ position: 'relative' }}>
                  <button
                    className="glass-btn"
                    style={{ minHeight: '34px', fontSize: '0.8rem', padding: '0 12px', gap: '8px' }}
                    onClick={() => setRoleSwitcherOpen((v) => !v)}
                    aria-expanded={roleSwitcherOpen}
                    aria-haspopup="true"
                    title="Switch Demo Role for Pair Programming / Evaluation"
                  >
                    <User size={13} />
                    <span>Switch Role</span>
                    <ChevronDown
                      size={13}
                      style={{
                        transform: roleSwitcherOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>

                  {roleSwitcherOpen && (
                    <div className="role-switcher-popover" role="menu">
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: '#A1A1AA',
                          padding: '6px 8px 4px',
                          textTransform: 'uppercase',
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          marginBottom: '4px',
                        }}
                      >
                        Switch Authenticated Role:
                      </div>

                      {roleSwitchError && (
                        <div
                          style={{
                            padding: '6px 8px',
                            background: 'rgba(244, 63, 94, 0.15)',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            borderRadius: '6px',
                            color: '#FDA4AF',
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <AlertCircle size={12} />
                          <span>{roleSwitchError}</span>
                        </div>
                      )}

                      {[
                        { role: 'student', label: 'Student (Aarav)', email: 'student@campus.edu' },
                        { role: 'lab_assistant', label: 'Lab Assistant (Pooja)', email: 'labtech@campus.edu' },
                        { role: 'hod', label: 'HOD (Dr. Rajesh)', email: 'hod.cs@campus.edu' },
                        { role: 'institution_admin', label: 'Institution Admin (Dean Varma)', email: 'admin@campus.edu' },
                        { role: 'technical_admin', label: 'Technical Admin (Vikram)', email: 'techadmin@campus.edu' },
                      ].map((item) => (
                        <button
                          key={item.role}
                          className="glass-btn"
                          style={{
                            justifyContent: 'space-between',
                            minHeight: '34px',
                            border: 'none',
                            background: session.role === item.role ? 'rgba(255, 255, 255, 0.09)' : 'transparent',
                            fontSize: '0.78rem',
                            padding: '0 8px',
                          }}
                          disabled={isSwitchingRole}
                          onClick={() => handleSwitchDemoRole(item.email)}
                        >
                          <span style={{ color: session.role === item.role ? '#FAFAFA' : '#D4D4D8' }}>
                            {item.label}
                          </span>
                          {session.role === item.role ? (
                            <Check size={14} color="#10B981" />
                          ) : null}
                        </button>
                      ))}

                      {isSwitchingRole && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px', color: '#38BDF8', fontSize: '0.74rem' }}>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Authenticating role...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Session Profile & Sign Out */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <span style={{ fontSize: '0.82rem', color: '#FAFAFA', fontWeight: 500 }}>
                    {session.fullName}
                  </span>
                  <button
                    className="glass-btn danger"
                    style={{ minHeight: '32px', padding: '0 10px' }}
                    onClick={handleLogout}
                    title="Sign Out"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Unauthenticated View: Public Landing Page */}
        {!session ? (
          <LandingPage
            onSignIn={() => { setAuthModalTab('signin'); setAuthModalOpen(true) }}
            onGetStarted={() => { setAuthModalTab('register'); setAuthModalOpen(true) }}
            onExploreDemo={() => { setAuthModalTab('demo'); setAuthModalOpen(true) }}
          />
        ) : (
          /* Authenticated View: Role-Specific Liquid Glass Layout */
          <div className="workspace-layout">
            {/* Sidebar */}
            <aside className="glass-sidebar" aria-label="Role Navigation">
              <div className="sidebar-title">Workspace Navigation</div>

              {getSidebarNav().map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <button
                    key={item.id}
                    className={`nav-link-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setCurrentPage(item.id)}
                  >
                    {isActive ? <span className="nav-dot" /> : <Icon size={16} />}
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </aside>

            {/* Main Panel */}
            <main className="glass-main-panel">
              {/* Universal Views across all roles */}
              {currentPage === 'Notifications' && (
                <NotificationsView userRole={session.role} />
              )}

              {currentPage === 'Profile & Security' && (
                <ProfileSecurityView session={session} onLogout={handleLogout} />
              )}

              {/* STUDENT VIEWS */}
              {session.role === 'student' && (
                <>
                  {currentPage === 'Overview' && (
                    <StudentOverview
                      metrics={dashboardMetrics}
                      onNavigate={setCurrentPage}
                    />
                  )}

                  {currentPage === 'Start Computing' && (
                    <StartComputing
                      currentBalance={dashboardMetrics.daily_balance}
                      onSessionCreated={(newSession) => {
                        setActiveComputeSession(newSession)
                        if (newSession.status !== 'queued') {
                          setCurrentPage('Remote Workspace')
                        } else {
                          setCurrentPage('My Sessions')
                        }
                      }}
                      onNavigate={setCurrentPage}
                    />
                  )}

                  {currentPage === 'Remote Workspace' && (
                    <RemoteWorkspace
                      session={activeComputeSession}
                      onEndSession={() => {
                        setActiveComputeSession(null)
                        setCurrentPage('Overview')
                      }}
                      onNavigate={setCurrentPage}
                    />
                  )}

                  {currentPage === 'My Sessions' && (
                    <MySessions
                      onOpenSession={(sess) => {
                        setActiveComputeSession(sess)
                        setCurrentPage('Remote Workspace')
                      }}
                      onNavigate={setCurrentPage}
                    />
                  )}

                  {currentPage === 'My Files' && <MyFiles />}

                  {currentPage === 'Credits & Usage' && <CreditsUsage />}
                </>
              )}

              {/* LAB ASSISTANT VIEWS (No compute access) */}
              {session.role === 'lab_assistant' && currentPage !== 'Notifications' && currentPage !== 'Profile & Security' && (
                <LabAssistantDashboard activeNav={currentPage} />
              )}

              {/* HOD VIEWS (No compute access) */}
              {session.role === 'hod' && currentPage !== 'Notifications' && currentPage !== 'Profile & Security' && (
                <HodDashboard activeNav={currentPage} />
              )}

              {/* INSTITUTION ADMINISTRATOR / TECH ADMIN VIEWS (No compute access) */}
              {(session.role === 'institution_admin' || session.role === 'technical_admin') &&
                currentPage !== 'Notifications' && currentPage !== 'Profile & Security' && (
                  <InstitutionAdminDashboard activeNav={currentPage} />
              )}
            </main>
          </div>
        )}
      </div>

      {/* Unified Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialTab={authModalTab}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(sess) => setSession(sess)}
      />
    </div>
  )
}
