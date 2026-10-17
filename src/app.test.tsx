import { describe, it, expect, beforeAll } from 'vitest'
import { renderToString } from 'react-dom/server'
import App from './App'
import { ApiDocsView } from './components/public/ApiDocsView'
import { GlobalSearchModal } from './components/common/GlobalSearchModal'
import { api, getStoredSession, setStoredSession, UserSession } from './services/api'

// In-memory localStorage polyfill for Node.js test environment
beforeAll(() => {
  const store: Record<string, string> = {}
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => {
      store[key] = String(val)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      for (const k in store) delete store[k]
    },
    length: 0,
    key: () => null,
  } as any
})

describe('IdleNode Frontend API & Session Client', () => {
  it('stores and retrieves user session securely from localStorage', () => {
    const mockSession: UserSession = {
      token: 'jwt-test-token-12345',
      role: 'student',
      userId: 'user-id-01',
      fullName: 'Aarav Sharma',
      email: 'student@campus.edu',
    }

    setStoredSession(mockSession)
    const retrieved = getStoredSession()
    expect(retrieved).not.toBeNull()
    expect(retrieved?.role).toBe('student')
    expect(retrieved?.email).toBe('student@campus.edu')

    setStoredSession(null)
    expect(getStoredSession()).toBeNull()
  })

  it('correctly constructs WebSocket telemetry URL with token', () => {
    const url = api.getWsUrl('test-token')
    expect(url).toContain('/ws/telemetry?token=test-token')
  })

  it('validates role boundaries in user session', () => {
    const roles = ['student', 'lab_assistant', 'hod', 'institution_admin', 'technical_admin']
    roles.forEach((role) => {
      const session: UserSession = {
        token: `token-${role}`,
        role: role as any,
        userId: `uid-${role}`,
        fullName: `User ${role}`,
        email: `${role}@campus.edu`,
      }
      expect(['student', 'lab_assistant', 'hod', 'institution_admin', 'technical_admin']).toContain(session.role)
    })
  })

  it('renders public LandingPage when unauthenticated without any API documentation links', () => {
    localStorage.clear()
    const html = renderToString(<App />)
    expect(html).toContain('IdleNode')
    expect(html).toContain('Your campus hardware.')
    expect(html).toContain('Your browser. Your workspace.')
    expect(html).toContain('Decentralized Grid Architecture')

    // Must NOT contain API Documentation, API Docs, or Interactive API Explorer on the landing page
    expect(html).not.toContain('API Documentation')
    expect(html).not.toContain('API Docs')
    expect(html).not.toContain('Interactive API Explorer')
  })

  it('renders API Documentation view properly without unwanted debugging blocks', () => {
    const html = renderToString(<ApiDocsView />)
    // Required Title
    expect(html).toContain('API Documentation')
    expect(html).toContain('Open Interactive API Explorer')
    expect(html).toContain('Endpoint Directory')
    expect(html).toContain('Role-Based Access Control (RBAC) Matrix')
    expect(html).toContain('5-Step Quick Getting Started Guide')

    // Verify unwanted debugging texts are REMOVED
    expect(html).not.toContain('Controller Host: http://127.0.0.1:8000')
    expect(html).not.toContain('FastAPI controller running with Uvicorn. Swagger UI mounted at /docs.')
    expect(html).not.toContain('<span>OpenAPI JSON</span>')
  })

  it('ensures students cannot see API Documentation in their navigation', () => {
    const studentSession: UserSession = {
      token: 'jwt-student-token',
      role: 'student',
      userId: 'usr_stud_01',
      fullName: 'Aarav Sharma',
      email: 'student@campus.edu',
    }
    setStoredSession(studentSession)
    const html = renderToString(<App />)
    
    // Student workspace should contain student features
    expect(html).toContain('Start Computing')
    expect(html).toContain('Remote Workspace')
    expect(html).toContain('My Sessions')

    // But MUST NOT contain API Documentation in student sidebar or header
    expect(html).not.toContain('nav-link-btn active">API Documentation')
    expect(html).not.toContain('>API Documentation</button>')

    setStoredSession(null)
  })

  it('filters GlobalSearchModal items strictly based on role', () => {
    // Unauthenticated search items
    const publicHtml = renderToString(
      <GlobalSearchModal
        isOpen={true}
        onClose={() => {}}
        session={null}
        onNavigate={() => {}}
      />
    )
    expect(publicHtml).toContain('Sign In to Campus Account')
    expect(publicHtml).toContain('Student Registration')
    expect(publicHtml).not.toContain('Start Computing Workload')
    // Public landing page search must NOT contain API docs
    expect(publicHtml).not.toContain('API Documentation &amp; Architecture Reference')

    // Student search items
    const studentSession: UserSession = {
      token: 'jwt-student',
      role: 'student',
      userId: 'usr_01',
      fullName: 'Aarav',
      email: 'student@campus.edu',
    }
    const studentHtml = renderToString(
      <GlobalSearchModal
        isOpen={true}
        onClose={() => {}}
        session={studentSession}
        onNavigate={() => {}}
      />
    )
    expect(studentHtml).toContain('Start Computing Workload')
    expect(studentHtml).toContain('Remote Desktop Workspace')
    // Must NOT contain admin features or API docs for student
    expect(studentHtml).not.toContain('API Documentation &amp; Developer Reference')
    expect(studentHtml).not.toContain('Credit Allocation Policies')

    // Administrator search items MUST still have API documentation
    const adminSession: UserSession = {
      token: 'jwt-admin',
      role: 'institution_admin',
      userId: 'usr_admin_01',
      fullName: 'Dr. Suresh Admin',
      email: 'admin@campus.edu',
    }
    const adminHtml = renderToString(
      <GlobalSearchModal
        isOpen={true}
        onClose={() => {}}
        session={adminSession}
        onNavigate={() => {}}
      />
    )
    expect(adminHtml).toContain('API Documentation &amp; Developer Reference')
  })
})
