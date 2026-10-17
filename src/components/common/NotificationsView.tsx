import React, { useState } from 'react'
import { Bell, CheckCircle2, AlertTriangle, Info, Trash2, Check } from 'lucide-react'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'alert'
  timestamp: string
  read: boolean
}

interface NotificationsViewProps {
  userRole?: string
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ userRole: _userRole = 'student' }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Institutional Verification Approved',
      message: 'Your student account has been approved by Dr. Rajesh Iyer (HOD, CSE). Compute allocation access is now active.',
      type: 'success',
      timestamp: 'Today at 09:15 AM',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'Credit Allowance Reset',
      message: 'Your daily computing credit allowance of 100 credits has refreshed. Reset interval: Midnight (00:00 IST).',
      type: 'info',
      timestamp: 'Today at 00:01 AM',
      read: true,
    },
    {
      id: 'notif-3',
      title: 'Scheduled Lab Maintenance Notice',
      message: 'General Computing Lab (AI-101) will undergo routine hardware maintenance on Saturday from 22:00 to 02:00 IST. High-performance labs remain operational.',
      type: 'warning',
      timestamp: 'Yesterday at 04:30 PM',
      read: true,
    },
    {
      id: 'notif-4',
      title: 'Session Reconnection Grace Period Policy',
      message: 'Reminder: IdleNode preserves active compute states for 5 minutes during network drops. Reconnect promptly to resume uninterrupted workloads.',
      type: 'info',
      timestamp: '2 days ago',
      read: true,
    },
  ])

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="#10B981" />
      case 'warning':
        return <AlertTriangle size={18} color="#F59E0B" />
      default:
        return <Info size={18} color="#38BDF8" />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="main-panel-header">
        <div>
          <h2 className="panel-title">Notifications &amp; System Broadcasts</h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.85rem', marginTop: '4px' }}>
            Account approvals, queue transitions, credit reset logs, and laboratory maintenance schedules.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="glass-btn" onClick={markAllRead} disabled={notifications.every((n) => n.read)}>
            <Check size={14} />
            <span>Mark All Read</span>
          </button>
          <button className="glass-btn danger" onClick={clearAll} disabled={notifications.length === 0}>
            <Trash2 size={14} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            color: '#71717A',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Bell size={32} opacity={0.4} />
          <span style={{ fontSize: '0.9rem' }}>No new notifications</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '18px 20px',
                background: item.read ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.045)',
                border: item.read ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '14px',
                boxShadow: item.read ? 'none' : 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>{getIcon(item.type)}</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: item.read ? '#E4E4E7' : '#FAFAFA', fontSize: '0.92rem' }}>
                    {item.title}
                  </strong>
                  <span style={{ fontSize: '0.74rem', color: '#71717A', fontFamily: 'var(--font-mono)' }}>
                    {item.timestamp}
                  </span>
                </div>
                <p style={{ color: '#A1A1AA', fontSize: '0.84rem', lineHeight: '1.5' }}>{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
