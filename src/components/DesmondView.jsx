import { useState, useEffect, useCallback } from 'react'
import './DesmondView.css'

export default function DesmondView({ onClose }) {
  const [status, setStatus] = useState('loading')
  const [statusText, setStatusText] = useState('Checking Desmond status...')

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/health')
      if (!res.ok) throw new Error('Server unreachable')
      const data = await res.json()
      const s = data.desmond?.state
      const err = data.desmond?.error
      if (s === 'running') {
        setStatus('running')
        setStatusText('Desmond is running')
      } else if (s === 'starting') {
        setStatus('starting')
        setStatusText('Desmond is starting...')
      } else if (s === 'error') {
        setStatus('error')
        setStatusText(err ? `Error: ${err}` : 'Desmond failed to start')
      } else {
        setStatus('stopped')
        setStatusText('Desmond is stopped')
      }
    } catch {
      setStatus('error')
      setStatusText('Cannot reach Aurora server')
    }
  }, [])

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 3000)
    return () => clearInterval(interval)
  }, [checkStatus])

  const handleStart = useCallback(async () => {
    setStatus('starting')
    setStatusText('Starting Desmond...')
    try {
      const res = await fetch('/api/desmond/start', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to start')
      const data = await res.json()
      const s = data.desmond?.state
      const err = data.desmond?.error
      if (s === 'error') {
        setStatus('error')
        setStatusText(err ? `Error: ${err}` : 'Failed to start Desmond')
      }
    } catch {
      setStatus('error')
      setStatusText('Failed to start Desmond')
    }
  }, [])

  const handleStop = useCallback(async () => {
    setStatus('stopping')
    setStatusText('Stopping Desmond...')
    try {
      await fetch('/api/desmond/stop', { method: 'POST' })
    } catch {}
  }, [])

  const statusClass =
    status === 'running' ? 'desmond-status-ok' :
    status === 'starting' || status === 'stopping' ? 'desmond-status-pending' :
    'desmond-status-off'

  return (
    <div className="dsm-v2 desmond-page">
      <div className="desmond-header">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="6" r="3" />
          <circle cx="4.5" cy="15" r="3" />
          <circle cx="15.5" cy="15" r="3" />
          <line x1="8" y1="8.5" x2="6" y2="12.5" />
          <line x1="12" y1="8.5" x2="14" y2="12.5" />
          <line x1="4.5" y1="15" x2="15.5" y2="15" />
        </svg>
        <span>Desmond — AI Assistant</span>
        <span className={`desmond-status-dot ${statusClass}`} title={statusText} />
        <span className="desmond-status-label">{statusText}</span>
        <button className="desmond-close-btn" onClick={onClose} title="Back to Dashboard">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
        </button>
      </div>

      <div className="desmond-body">
        <div className="desmond-controls">
          <svg width="80" height="80" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
            <circle cx="10" cy="6" r="3" />
            <circle cx="4.5" cy="15" r="3" />
            <circle cx="15.5" cy="15" r="3" />
            <line x1="8" y1="8.5" x2="6" y2="12.5" />
            <line x1="12" y1="8.5" x2="14" y2="12.5" />
            <line x1="4.5" y1="15" x2="15.5" y2="15" />
          </svg>

          <div className="desmond-status-text">{statusText}</div>

          <div className="desmond-button-row">
            {(status === 'stopped' || status === 'error') && (
              <button className="desmond-btn desmond-btn-primary" onClick={handleStart}>
                Launch Desmond
              </button>
            )}
            {status === 'running' && (
              <button className="desmond-btn desmond-btn-danger" onClick={handleStop}>
                Stop Desmond
              </button>
            )}
            {(status === 'starting' || status === 'stopping') && (
              <button className="desmond-btn" disabled>
                {status === 'starting' ? 'Starting...' : 'Stopping...'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
