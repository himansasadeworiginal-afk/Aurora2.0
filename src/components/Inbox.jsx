import { useState, useEffect, useCallback } from 'react'
import db from '../data/db'

export default function Inbox({ onSelect, onClose }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const all = await db.notes
      .where('paraCategory')
      .equals('inbox')
      .reverse()
      .toArray()
    setNotes(all)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleClassify = useCallback(async (id, category) => {
    await db.notes.update(id, { paraCategory: category, updatedAt: new Date() })
    setNotes(prev => prev.filter(n => n.id !== id))
  }, [])

  if (loading) {
    return (
      <div className="inbox">
      <div className="inbox-header">
        <h2>Inbox</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="inbox-count">loading...</span>
        </div>
      </div>
      </div>
    )
  }

  return (
    <div className="inbox">
      <div className="inbox-header">
        <h2>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6, verticalAlign: 'middle' }}>
            <path d="M1 4l2-2h10l2 2v9a1 1 0 01-1 1H2a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <path d="M1 4l7 4 7-4" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          Inbox
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="inbox-count">{notes.length} items</span>
          {onClose && <button className="qc-close" onClick={onClose} title="Close">✕</button>}
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="inbox-empty">
          <div className="inbox-empty-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="4" y="8" width="32" height="24" rx="3" stroke="#884444" strokeWidth="1.5" fill="none" />
              <path d="M4 14l16 10 16-10" stroke="#884444" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <p>Inbox is empty</p>
          <span className="inbox-empty-hint">Capture something using the Quick Capture bar</span>
        </div>
      ) : (
        <div className="inbox-list">
          {notes.map(note => (
            <div key={note.id} className="inbox-item" onClick={() => onSelect?.(note)}>
              <div className="inbox-item-header">
                <strong>{note.title}</strong>
                <span className="inbox-item-time">
                  {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {note.content && <p>{note.content.slice(0, 120)}</p>}
              <div className="inbox-item-footer">
                <div className="tags">
                  {note.tags?.map(t => <span key={t} className="tag">#{t}</span>)}
                </div>
                <div className="inbox-classify">
                  <span className="inbox-classify-label">Move to:</span>
                  <select onChange={e => { e.stopPropagation(); handleClassify(note.id, e.target.value) }} defaultValue="">
                    <option value="" disabled>PARA...</option>
                    <option value="projects">Projects</option>
                    <option value="areas">Areas</option>
                    <option value="resources">Resources</option>
                    <option value="archives">Archives</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
