import { useEffect, useRef } from 'react'

export default function AuroraTitle({ onToggleList, showList, ideaCount, testCount, onNewNote, onNewProject }) {
  const lineRef = useRef()

  useEffect(() => {
    const animate = () => {
      if (!lineRef.current) return
      const w = 30 + Math.sin(Date.now() * 0.002) * 15
      lineRef.current.style.width = w + '%'
      requestAnimationFrame(animate)
    }
    const id = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="aurora-header">
      <div className="aurora-brand">
        <div className="aurora-logo">
          <div className="aurora-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="#2DD4BF" strokeWidth="1.5" opacity="0.6" />
              <circle cx="10" cy="10" r="4" fill="#2DD4BF" opacity="0.3" />
              <circle cx="10" cy="10" r="1.5" fill="#2DD4BF" />
              <line x1="10" y1="2" x2="10" y2="18" stroke="#2DD4BF" strokeWidth="0.5" opacity="0.2" />
              <line x1="2" y1="10" x2="18" y2="10" stroke="#2DD4BF" strokeWidth="0.5" opacity="0.2" />
            </svg>
          </div>
          <div className="aurora-title-group">
            <h1 className="aurora-title">
              <span className="aurora-glow">Aurora</span>
              <span className="aurora-badge">5.0</span>
            </h1>
            <div className="aurora-accent-line" ref={lineRef} />
          </div>
        </div>
        <div className="aurora-meta">
          <span className="aurora-tagline">AI Second Brain</span>
          <span className="aurora-stat">{ideaCount} ideas</span>
          <span className="aurora-sep">·</span>
          <span className="aurora-stat">{testCount} tests</span>
          <span className="aurora-sep">·</span>
          <span className="aurora-indicator" />
          <span className="aurora-stat">live</span>
        </div>
      </div>
      <div className="aurora-actions">
        <button className="aurora-btn aurora-btn-action" onClick={onNewNote} title="New Note">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 4 }}>
            <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.5" />
            <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Note
        </button>
        <button className="aurora-btn aurora-btn-action" onClick={onNewProject} title="New Project">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 4 }}>
            <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <line x1="6" y1="3" x2="6" y2="9" stroke="currentColor" strokeWidth="1.2" />
            <line x1="3" y1="6" x2="9" y2="6" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Project
        </button>
        <button className="aurora-btn" onClick={onToggleList}>
          {showList ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 6 }}>
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="7" cy="7" r="2" fill="currentColor" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 6 }}>
              <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor" opacity="0.8" />
              <rect x="1" y="6.25" width="12" height="1.5" rx="0.75" fill="currentColor" opacity="0.8" />
              <rect x="1" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor" opacity="0.8" />
            </svg>
          )}
          {showList ? 'Scene' : 'Browse'}
        </button>
      </div>
    </div>
  )
}
