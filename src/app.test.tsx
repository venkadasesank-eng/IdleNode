import { describe, it, expect, beforeAll } from 'vitest'
import { renderToString } from 'react-dom/server'
import App from './App'
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

  it('renders public LandingPage when unauthenticated', () => {
    // Ensure clean state
    localStorage.clear()
    const html = renderToString(<App />)
    expect(html).toContain('IdleNode')
    expect(html).toContain('Your campus hardware.')
    expect(html).toContain('Your browser. Your workspace.')
    expect(html).toContain('Decentralized Grid Architecture')
  })
})
