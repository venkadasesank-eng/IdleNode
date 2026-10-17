// IdleNode API client service
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://127.0.0.1:8000'

export interface UserSession {
  token: string
  role: 'student' | 'lab_assistant' | 'hod' | 'institution_admin' | 'technical_admin'
  userId: string
  fullName: string
  email: string
}

export const TOKEN_KEY = 'idlenode_token'
export const USER_KEY = 'idlenode_user'

export const getStoredSession = (): UserSession | null => {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const setStoredSession = (session: UserSession | null) => {
  try {
    if (session) {
      localStorage.setItem(TOKEN_KEY, session.token)
      localStorage.setItem(USER_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  } catch {
    // ignore
  }
}

const authHeader = (): Record<string, string> => {
  const token = localStorage.getItem(TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeader(),
    ...(options.headers || {}),
  }

  const url = `${API_BASE}${endpoint}`
  const resp = await fetch(url, { ...options, headers })

  if (!resp.ok) {
    let errorDetail = `Request failed (${resp.status})`
    try {
      const errJson = await resp.json()
      if (errJson.detail) errorDetail = errJson.detail
    } catch {
      // ignore
    }
    throw new Error(errorDetail)
  }

  return resp.json()
}

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<UserSession> => {
    const data = await request<{ access_token: string; role: any; user_id: string; full_name: string; email: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const session: UserSession = {
      token: data.access_token,
      role: data.role,
      userId: data.user_id,
      fullName: data.full_name,
      email: data.email,
    }
    setStoredSession(session)
    return session
  },

  register: async (form: {
    fullName: string
    email: string
    password: string
    rollNumber: string
    departmentId: string
    academicYear?: string
    agreeTerms: boolean
  }): Promise<UserSession> => {
    const data = await request<{ access_token: string; role: any; user_id: string; full_name: string; email: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: form.fullName,
        email: form.email,
        password: form.password,
        roll_number: form.rollNumber,
        department_id: form.departmentId,
        academic_year: form.academicYear || '3rd Year',
        agree_terms: form.agreeTerms,
      }),
    })
    const session: UserSession = {
      token: data.access_token,
      role: data.role,
      userId: data.user_id,
      fullName: data.full_name,
      email: data.email,
    }
    setStoredSession(session)
    return session
  },

  logout: () => {
    setStoredSession(null)
  },

  getDemoAccounts: async () => {
    return request<Array<{ role: string; label: string; email: string; password: string; name: string }>>('/auth/demo-accounts')
  },

  // Student Dashboard
  getStudentDashboard: async () => {
    return request<{
      active_compute_nodes: number
      total_compute_nodes: number
      current_queue_tasks: number
      avg_queue_wait_minutes: number
      daily_balance: number
      daily_allowance: number
      grid_online: boolean
      recent_activity: string[]
    }>('/student/dashboard')
  },

  createComputeRequest: async (req: {
    workload_type: string
    min_cpu_cores: number
    min_ram_gb: number
    require_gpu: boolean
    requested_minutes: number
    application_profile?: string
  }) => {
    return request<any>('/student/requests', {
      method: 'POST',
      body: JSON.stringify(req),
    })
  },

  getStudentSessions: async () => {
    return request<any[]>('/student/sessions')
  },

  getSessionDetails: async (sessionId: string) => {
    return request<any>(`/student/sessions/${sessionId}`)
  },

  connectSession: async (sessionId: string) => {
    return request<any>(`/student/sessions/${sessionId}/connect`, { method: 'POST' })
  },

  disconnectSession: async (sessionId: string) => {
    return request<any>(`/student/sessions/${sessionId}/disconnect`, { method: 'POST' })
  },

  endSession: async (sessionId: string, reason: string = 'User completed work') => {
    return request<any>(`/student/sessions/${sessionId}/end`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },

  cancelQueuedRequest: async (sessionId: string) => {
    return request<any>(`/student/sessions/${sessionId}/queue`, { method: 'DELETE' })
  },

  getCredits: async () => {
    return request<{
      daily_allowance: number
      current_balance: number
      reserved_credits: number
      last_reset_date: string
      transactions: Array<{ id: string; amount: number; balance_after: number; reason: string; created_at: string }>
    }>('/student/credits')
  },

  getFiles: async (storageType?: string) => {
    const q = storageType ? `?storage_type=${storageType}` : ''
    return request<Array<{ id: string; filename: string; size_bytes: number; storage_type: string; created_at: string }>>(`/student/files${q}`)
  },

  deleteFile: async (fileId: string) => {
    return request<any>(`/student/files/${fileId}`, { method: 'DELETE' })
  },

  getNotifications: async () => {
    return request<Array<{ id: string; title: string; message: string; notification_type: string; is_read: boolean; created_at: string }>>('/student/notifications')
  },

  markNotificationRead: async (id: string) => {
    return request<any>(`/student/notifications/${id}/read`, { method: 'POST' })
  },

  // Lab Assistant
  getLabs: async () => {
    return request<any[]>('/lab-assistant/labs')
  },

  getLabComputers: async () => {
    return request<any[]>('/lab-assistant/computers')
  },

  toggleComputerMaintenance: async (computerId: string, maintenance: boolean, reason?: string) => {
    return request<any>(`/lab-assistant/computers/${computerId}/maintenance`, {
      method: 'POST',
      body: JSON.stringify({ maintenance, reason }),
    })
  },

  adminStopSession: async (sessionId: string, reason: string) => {
    return request<any>(`/lab-assistant/sessions/${sessionId}/stop`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },

  // HOD
  getHodOverview: async () => {
    return request<{
      department_name: string
      pending_registrations: number
      approved_students: number
      total_computers: number
      active_sessions: number
    }>('/hod/overview')
  },

  getPendingStudents: async () => {
    return request<any[]>('/hod/students/pending')
  },

  reviewStudent: async (profileId: string, action: 'approve' | 'reject', reason?: string) => {
    return request<any>(`/hod/students/${profileId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    })
  },

  // Institution Admin
  getAdminOverview: async () => {
    return request<any>('/admin/overview')
  },

  getCreditPolicy: async () => {
    return request<any>('/admin/credit-policy')
  },

  updateCreditPolicy: async (policy: any) => {
    return request<any>('/admin/credit-policy', {
      method: 'PUT',
      body: JSON.stringify(policy),
    })
  },

  registerComputer: async (comp: any) => {
    return request<any>('/admin/computers', {
      method: 'POST',
      body: JSON.stringify(comp),
    })
  },

  getAuditLogs: async () => {
    return request<any[]>('/admin/audit-logs')
  },

  // Health check
  checkHealth: async () => {
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/health')
      return resp.ok
    } catch {
      return false
    }
  },

  getWsUrl: (token?: string) => {
    const t = token || localStorage.getItem(TOKEN_KEY) || ''
    return `${WS_BASE}/ws/telemetry?token=${encodeURIComponent(t)}`
  }
}
