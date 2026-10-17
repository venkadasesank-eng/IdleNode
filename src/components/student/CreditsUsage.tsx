import React, { useState, useEffect } from 'react'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Clock, HelpCircle } from 'lucide-react'
import { api } from '../../services/api'
import { MetricCard } from '../ui/MetricCard'

export const CreditsUsage: React.FC = () => {
  const [data, setData] = useState<{
    daily_allowance: number
    current_balance: number
    reserved_credits: number
    last_reset_date: string
    transactions: any[]
  }>({
    daily_allowance: 100,
    current_balance: 78,
    reserved_credits: 0,
    last_reset_date: '2026-10-17',
    transactions: [
      { id: 'tx-1', amount: 100, balance_after: 100, reason: 'Daily credit allowance grant (00:00 Asia/Kolkata)', created_at: new Date().toISOString() },
      { id: 'tx-2', amount: -14, balance_after: 86, reason: 'Completed development session on NODE-CSE-AI-01', created_at: new Date().toISOString() },
      { id: 'tx-3', amount: -8, balance_after: 78, reason: 'Completed simulation session on NODE-AI-GEN-01', created_at: new Date().toISOString() },
    ],
  })

  useEffect(() => {
    api.getCredits().then((res) => {
      if (res && res.daily_allowance) setData(res)
    }).catch(() => {})
  }, [])

  const usedCredits = data.daily_allowance - data.current_balance
  const usedPct = data.daily_allowance > 0 ? Math.round((usedCredits / data.daily_allowance) * 100) : 0
  const isNearLimit = usedPct >= 80

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="main-panel-header">
        <div>
          <h2 className="panel-title">Credits &amp; Resource Metering</h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.85rem', marginTop: '4px' }}>
            Transparent daily compute allowances, transparent debit ledger, and fair-use governance.
          </p>
        </div>

        <div className="header-status-pill">
          <Clock size={14} style={{ color: '#38BDF8' }} />
          <span>Reset: 00:00 Asia/Kolkata</span>
        </div>
      </div>

      {/* 80% Rule Warning Banner */}
      {isNearLimit && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            color: '#FBBF24',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.85rem',
          }}
        >
          <AlertTriangle size={18} />
          <span>
            <strong>Resource Balance Alert:</strong> You have consumed {usedPct}% of your daily compute allocation.
            Unused daily credits expire at midnight. Save your workspace files to persistent storage before running out.
          </span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="metrics-row">
        <MetricCard
          label="DAILY ALLOWANCE"
          value={data.daily_allowance}
          subtitle="Configured institutional quota"
          progressPct={100}
        />
        <MetricCard
          label="REMAINING BALANCE"
          value={data.current_balance}
          subtitle="Available for new workloads"
          progressPct={100 - usedPct}
        />
        <MetricCard
          label="TOTAL CONSUMED"
          value={usedCredits}
          subtitle={`${usedPct}% of daily allowance`}
          progressPct={usedPct}
        />
      </div>

      {/* Explanatory Metering Policy Box */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FAFAFA', fontWeight: 600 }}>
          <HelpCircle size={16} style={{ color: '#38BDF8' }} />
          <span>How Resource Metering Works</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#A1A1AA', lineHeight: '1.6' }}>
          • Every approved student receives a fresh daily allowance of <strong>{data.daily_allowance} credits</strong> at midnight.
          <br />
          • <strong>No rollover:</strong> Unused credits expire each day to encourage active, equitable distribution of campus resources.
          <br />
          • <strong>Fractional billing:</strong> Sessions that end early are charged strictly for actual minutes consumed, and reserved balance is instantly unlocked.
        </p>
      </div>

      {/* Auditable Transaction Ledger Table */}
      <div>
        <h4 style={{ color: '#FAFAFA', fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
          Auditable Transaction Ledger
        </h4>

        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Delta Amount</th>
                <th>Balance After</th>
                <th>Reason / Workflow</th>
                <th>Recorded Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((tx) => {
                const isPositive = tx.amount > 0
                return (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#71717A' }}>
                      {tx.id}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: isPositive ? '#34D399' : '#FDA4AF',
                        }}
                      >
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {isPositive ? `+${tx.amount}` : tx.amount} credits
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#FAFAFA' }}>
                      {tx.balance_after} credits
                    </td>
                    <td>{tx.reason}</td>
                    <td style={{ fontSize: '0.78rem', color: '#71717A' }}>
                      {new Date(tx.created_at).toLocaleTimeString()} · {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
