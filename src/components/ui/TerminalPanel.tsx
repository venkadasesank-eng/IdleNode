import React from 'react'
import { Terminal } from 'lucide-react'

interface TerminalPanelProps {
  logs: string[]
  isConnected?: boolean
  onClear?: () => void
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  logs,
  isConnected = true,
}) => {
  return (
    <div className="glass-terminal-panel">
      <div className="terminal-header">
        <div className="terminal-header-title">
          <Terminal size={15} style={{ color: '#A1A1AA' }} />
          <span>Live Session Stream &amp; Telemetry</span>
        </div>

        <div className="ws-status-badge">
          <span className="status-dot-green" />
          <span>{isConnected ? 'WebSocket Connected' : 'Connecting...'}</span>
        </div>
      </div>

      <div className="terminal-log-content">
        {logs.map((log, index) => {
          // Parse timestamp and tags if available
          const parts = log.split(' ')
          const ts = parts[0] || ''
          const rest = parts.slice(1).join(' ')

          return (
            <div className="terminal-row" key={index}>
              <span className="terminal-line-num">{index + 1}</span>
              <span className="terminal-timestamp">{ts}</span>
              <span>{rest}</span>
            </div>
          )
        })}
        <div className="terminal-row">
          <span className="terminal-line-num">{logs.length + 1}</span>
          <span className="terminal-prompt">$</span>
        </div>
      </div>
    </div>
  )
}
