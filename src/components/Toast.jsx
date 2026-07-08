import { useState, useEffect, useCallback } from 'react'

const PRIORITY_COLORS = { high: '#F59E0B', medium: '#2DD4BF', low: '#8B7CF6' }

const BellIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 1.5v1" />
    <path d="M11 10.5l.5 1h-9l.5-1 .5-.5V6.5a3.5 3.5 0 017 0v3.5l.5.5z" />
    <circle cx="7" cy="12" r="0.6" />
  </svg>
)

export default function Toast({ notifications, onDismiss }) {
  if (!notifications || notifications.length === 0) return null

  return (
    <div className="toast-container">
      {notifications.map((n, i) => (
        <ToastItem key={n.id || i} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ notification, onDismiss }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onDismiss(notification.id), 400)
    }, 5000)
    return () => clearTimeout(timer)
  }, [notification.id, onDismiss])

  const handleDismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => onDismiss(notification.id), 400)
  }, [notification.id, onDismiss])

  return (
    <div className={`toast-item ${exiting ? 'toast-exit' : 'toast-enter'}`}>
      <div className="toast-accent" style={{ background: PRIORITY_COLORS[notification.priority] || '#884444' }} />
      <div className="toast-icon">
        <BellIcon />
      </div>
      <div className="toast-body">
        <div className="toast-title">{notification.title}</div>
        <div className="toast-meta">
          <span className="toast-priority" style={{ color: PRIORITY_COLORS[notification.priority] }}>
            {notification.priority}
          </span>
          <span className="toast-sep">·</span>
          <span className="toast-category">{notification.category}</span>
          <span className="toast-sep">·</span>
          <span className="toast-time">{notification.notificationTime}</span>
        </div>
      </div>
      <button className="toast-close" onClick={handleDismiss}>✕</button>
      <div className="toast-progress" />
    </div>
  )
}
