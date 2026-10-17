import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search,
  X,
  LayoutDashboard,
  Zap,
  Monitor,
  History,
  Folder,
  Coins,
  Bell,
  User,
  Activity,
  Building2,
  Shield,
  BookOpen,
  ArrowRight,
  LogIn,
  UserPlus,
  Sparkles
} from 'lucide-react'
import { UserSession } from '../../services/api'

interface SearchItem {
  id: string
  label: string
  description: string
  category: 'Navigation' | 'Actions' | 'Governance' | 'Public'
  targetPage?: string
  actionKey?: string
  icon: React.ElementType
  allowedRoles: ('public' | 'student' | 'lab_assistant' | 'hod' | 'institution_admin' | 'technical_admin')[]
}

const ALL_SEARCH_ITEMS: SearchItem[] = [
  // Student Authorized Items
  {
    id: 'student-overview',
    label: 'Overview & Cluster Telemetry',
    description: 'View active compute nodes, FIFO wait queues, and live grid capacity',
    category: 'Navigation',
    targetPage: 'Overview',
    icon: LayoutDashboard,
    allowedRoles: ['student']
  },
  {
    id: 'student-compute',
    label: 'Start Computing Workload',
    description: 'Request GPU/CPU lab computer nodes and configure duration',
    category: 'Actions',
    targetPage: 'Start Computing',
    icon: Zap,
    allowedRoles: ['student']
  },
  {
    id: 'student-workspace',
    label: 'Remote Desktop Workspace',
    description: 'In-browser remote desktop stream with low-latency keyboard and mouse',
    category: 'Navigation',
    targetPage: 'Remote Workspace',
    icon: Monitor,
    allowedRoles: ['student']
  },
  {
    id: 'student-sessions',
    label: 'My Sessions & History',
    description: 'Inspect active, queued, and historical remote laboratory allocations',
    category: 'Navigation',
    targetPage: 'My Sessions',
    icon: History,
    allowedRoles: ['student']
  },
  {
    id: 'student-files',
    label: 'My Projects & Persistent Files',
    description: 'Manage persistent workspace storage and datasets synced to lab nodes',
    category: 'Navigation',
    targetPage: 'My Files',
    icon: Folder,
    allowedRoles: ['student']
  },
  {
    id: 'student-credits',
    label: 'Credits & Resource Usage',
    description: 'Inspect daily allowance balance (100 credits/day) and burn rates',
    category: 'Navigation',
    targetPage: 'Credits & Usage',
    icon: Coins,
    allowedRoles: ['student']
  },

  // Lab Assistant Authorized Items
  {
    id: 'lab-overview',
    label: 'Lab Supervision Overview',
    description: 'Supervise assigned laboratory computers, active students, and room health',
    category: 'Navigation',
    targetPage: 'Overview',
    icon: LayoutDashboard,
    allowedRoles: ['lab_assistant']
  },
  {
    id: 'lab-monitoring',
    label: 'Live Telemetry & Workload Monitoring',
    description: 'Real-time CPU%, RAM%, GPU% and active sessions across assigned PCs',
    category: 'Navigation',
    targetPage: 'Live Monitoring',
    icon: Activity,
    allowedRoles: ['lab_assistant']
  },
  {
    id: 'lab-computers',
    label: 'Computer Inventory & Maintenance',
    description: 'Toggle node maintenance mode, reboot workstations, and inspect hardware',
    category: 'Navigation',
    targetPage: 'Computer Management',
    icon: Monitor,
    allowedRoles: ['lab_assistant']
  },

  // HOD Authorized Items
  {
    id: 'hod-overview',
    label: 'Department Governance Overview',
    description: 'Department student metrics, computer utilization, and credit consumption',
    category: 'Navigation',
    targetPage: 'Overview',
    icon: LayoutDashboard,
    allowedRoles: ['hod']
  },
  {
    id: 'hod-approvals',
    label: 'Student Enrollment Approvals',
    description: 'Review and approve pending student registrations and roll numbers',
    category: 'Governance',
    targetPage: 'Student Approvals',
    icon: User,
    allowedRoles: ['hod']
  },

  // Institution Admin / Tech Admin Authorized Items
  {
    id: 'admin-overview',
    label: 'Institution Fleet Overview',
    description: 'Campus-wide node telemetry, department allocations, and cluster uptime',
    category: 'Navigation',
    targetPage: 'Overview',
    icon: LayoutDashboard,
    allowedRoles: ['institution_admin', 'technical_admin']
  },
  {
    id: 'admin-policies',
    label: 'Credit Allocation Policies',
    description: 'Configure institutional daily allowances and hourly profile burn rates',
    category: 'Governance',
    targetPage: 'Credit Policies',
    icon: Coins,
    allowedRoles: ['institution_admin', 'technical_admin']
  },
  {
    id: 'admin-hardware',
    label: 'Node & Hardware Provisioning',
    description: 'Register physical lab workstations with MAC and IP addresses',
    category: 'Governance',
    targetPage: 'Hardware Inventory',
    icon: Building2,
    allowedRoles: ['institution_admin', 'technical_admin']
  },
  {
    id: 'admin-audit',
    label: 'Immutable Security Audit Trail',
    description: 'Inspect cryptographic logs for logins, allocations, and policy changes',
    category: 'Governance',
    targetPage: 'Audit Trail',
    icon: Shield,
    allowedRoles: ['institution_admin', 'technical_admin']
  },
  {
    id: 'admin-api-docs',
    label: 'API Documentation & Developer Reference',
    description: 'Inspect REST endpoints, RBAC matrix, and Swagger explorer',
    category: 'Governance',
    targetPage: 'API Documentation',
    icon: BookOpen,
    allowedRoles: ['institution_admin', 'technical_admin']
  },

  // Shared Account Items across Authenticated Roles
  {
    id: 'shared-notifications',
    label: 'Notifications & Alerts',
    description: 'System alerts, node assignments, and queue status updates',
    category: 'Actions',
    targetPage: 'Notifications',
    icon: Bell,
    allowedRoles: ['student', 'lab_assistant', 'hod', 'institution_admin', 'technical_admin']
  },
  {
    id: 'shared-profile',
    label: 'Profile & Security Settings',
    description: 'Inspect credentials, authorized department, and session parameters',
    category: 'Actions',
    targetPage: 'Profile & Security',
    icon: User,
    allowedRoles: ['student', 'lab_assistant', 'hod', 'institution_admin', 'technical_admin']
  },

  // Public / Unauthenticated Items
  {
    id: 'public-signin',
    label: 'Sign In to Campus Account',
    description: 'Authenticate with student or staff institutional credentials',
    category: 'Public',
    actionKey: 'open-signin',
    icon: LogIn,
    allowedRoles: ['public']
  },
  {
    id: 'public-register',
    label: 'Student Registration',
    description: 'Register a new student compute account with college roll number',
    category: 'Public',
    actionKey: 'open-register',
    icon: UserPlus,
    allowedRoles: ['public']
  },
  {
    id: 'public-demo',
    label: 'Explore Demo Accounts & Environments',
    description: 'Instantly evaluate Student, Lab Assistant, HOD, Institution Admin, and Tech Admin dashboards',
    category: 'Public',
    actionKey: 'open-demo',
    icon: Sparkles,
    allowedRoles: ['public']
  }
]

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  session: UserSession | null
  onNavigate: (page: string) => void
  onAction?: (actionKey: string) => void
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  session,
  onNavigate,
  onAction
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Current active role
  const userRole = session ? session.role : 'public'

  // Filter items strictly by active role
  const roleAllowedItems = useMemo(() => {
    return ALL_SEARCH_ITEMS.filter((item) => item.allowedRoles.includes(userRole))
  }, [userRole])

  // Filter by search query
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return roleAllowedItems

    return roleAllowedItems.filter((item) => {
      const matchLabel = item.label.toLowerCase().includes(q)
      const matchDesc = item.description.toLowerCase().includes(q)
      const matchCat = item.category.toLowerCase().includes(q)
      return matchLabel || matchDesc || matchCat
    })
  }, [query, roleAllowedItems])

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Scroll active item into view
  useEffect(() => {
    if (resultsRef.current && resultsRef.current.children[selectedIndex]) {
      const element = resultsRef.current.children[selectedIndex] as HTMLElement
      element.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleSelect = (item: SearchItem) => {
    onClose()
    if (item.targetPage) {
      onNavigate(item.targetPage)
    } else if (item.actionKey && onAction) {
      onAction(item.actionKey)
    }
  }

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1 < filteredResults.length ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredResults.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="search-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Search"
    >
      <div
        className="search-modal-container"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="search-modal-header">
          <Search size={18} color="#38BDF8" />
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder={
              session
                ? `Search features for ${session.role.replace('_', ' ')}...`
                : 'Search IdleNode campus features, demo roles, or documentation...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '4px' }}
              title="Clear search"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="search-kbd">ESC</kbd>
          )}
        </div>

        {/* Results List */}
        <div className="search-modal-results" ref={resultsRef}>
          {filteredResults.length > 0 ? (
            filteredResults.map((item, idx) => {
              const Icon = item.icon
              const isSelected = idx === selectedIndex

              return (
                <div
                  key={item.id}
                  className={`search-result-item ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  role="button"
                  tabIndex={0}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#38BDF8' : '#A1A1AA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icon size={16} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: isSelected ? '#FAFAFA' : '#E4E4E7' }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#A1A1AA' }}>
                        {item.description}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="search-result-badge">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight size={14} color="#38BDF8" />}
                  </div>
                </div>
              )
            })
          ) : (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#71717A', fontSize: '0.86rem' }}>
              No matching features or actions found for your authorized role.
            </div>
          )}
        </div>

        {/* Footer Navigation Hint */}
        <div className="search-footer-hint">
          <div style={{ display: 'flex', gap: '12px' }}>
            <span><kbd className="search-kbd">↑</kbd> <kbd className="search-kbd">↓</kbd> to navigate</span>
            <span><kbd className="search-kbd">↵</kbd> to select</span>
            <span><kbd className="search-kbd">ESC</kbd> to close</span>
          </div>
          <div>
            <span>Role: <strong style={{ color: '#E4E4E7', textTransform: 'capitalize' }}>{userRole.replace('_', ' ')}</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}
