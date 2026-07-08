import { useState, useEffect, useCallback, useMemo } from 'react'
import db from '../data/db'

export default function DistillDashboard({ onSelectNote, onClose }) {
  const [notes, setNotes] = useState([])
  const [sortBy, setSortBy] = useState('depth')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const all = await db.notes
      .filter(n => n.paraCategory !== 'inbox')
      .toArray()
    setNotes(all)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const sorted = useMemo(() => {
    const copy = [...notes]
    switch (sortBy) {
      case 'depth':
        return copy.sort((a, b) => (a.distillationDepth || 0) - (b.distillationDepth || 0))
      case 'depth-desc':
        return copy.sort((a, b) => (b.distillationDepth || 0) - (a.distillationDepth || 0))
      case 'oldest':
        return copy.sort((a, b) => new Date(a.updatedAt || a.createdAt) - new Date(b.updatedAt || b.createdAt))
      case 'title':
        return copy.sort((a, b) => a.title.localeCompare(b.title))
      default:
        return copy
    }
  }, [notes, sortBy])

  const getDepthInfo = useCallback((note) => {
    const depth = note.distillationDepth || 0
    const labels = ['Untouched', 'Soil', 'Oil', 'Gold', 'Gems']
    const colors = ['#553333', '#884422', '#aa6633', '#cc8844', '#ffaa55']
    return { depth, label: labels[depth] || 'Untouched', color: colors[depth] || '#553333' }
  }, [])

  if (loading) {
    return (
      <div className="distill-dashboard">
        <div className="dd-header"><h3>Distillation Dashboard</h3></div>
      </div>
    )
  }

  const untouched = notes.filter(n => !n.distillationDepth || n.distillationDepth === 0).length

  return (
    <div className="distill-dashboard">
      <div className="dd-header">
        <div className="dd-header-row">
          <h3>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            Distillation Dashboard
          </h3>
          <button className="qc-close" onClick={onClose}>✕</button>
        </div>
        <div className="dd-stats">
          <span className="dd-stat"><span className="dd-stat-num">{notes.length}</span> total</span>
          <span className="dd-stat"><span className="dd-stat-num">{untouched}</span> untouched</span>
        </div>
      </div>

      <div className="dd-controls">
        <span className="dd-sort-label">Sort:</span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="dd-sort">
          <option value="depth">Least distilled</option>
          <option value="depth-desc">Most distilled</option>
          <option value="oldest">Oldest updated</option>
          <option value="title">Title</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <div className="dd-empty">
          <p>No notes yet. Capture some ideas first.</p>
        </div>
      ) : (
        <div className="dd-list">
          {sorted.map(note => {
            const info = getDepthInfo(note)
            return (
              <div key={note.id} className="dd-item" onClick={() => onSelectNote?.(note)}>
                <div className="dd-item-bar" style={{ background: info.color }} />
                <div className="dd-item-body">
                  <strong>{note.title}</strong>
                  <p>{note.content?.slice(0, 80)}</p>
                  <div className="dd-item-meta">
                    <span className="dd-depth-badge" style={{ background: info.color }}>{info.label}</span>
                    <span className="dd-item-tag">{note.paraCategory}</span>
                  </div>
                </div>
                <div className="dd-item-right">
                  <span className="dd-depth-num">{info.depth}/4</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
