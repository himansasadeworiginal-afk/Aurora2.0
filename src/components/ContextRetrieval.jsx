import { useState, useEffect, useCallback } from 'react'
import db from '../data/db'

const PRESETS = [
  { id: 'active-projects', name: 'Active Projects', category: 'projects', icon: '◆' },
  { id: 'learning', name: 'Learning & Study', category: 'resources', tags: ['study', 'economics', 'accounting', 'business-studies'], icon: '📚' },
  { id: 'entertainment', name: 'Entertainment', category: 'resources', tags: ['entertainment'], icon: '🎬' },
  { id: 'archives', name: 'Archives', category: 'archives', icon: '▼' },
]

export default function ContextRetrieval({ onClose, onSelectNote }) {
  const [activePreset, setActivePreset] = useState('active-projects')
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [customFilter, setCustomFilter] = useState('')

  const loadNotes = useCallback(async () => {
    setLoading(true)
    const preset = PRESETS.find(p => p.id === activePreset)
    if (!preset) return

    let all = await db.notes.toArray()
    let filtered = all.filter(n => n.paraCategory !== 'inbox')

    if (preset.category === 'archives') {
      filtered = filtered.filter(n => n.paraCategory === 'archives')
    } else if (preset.tags) {
      filtered = filtered.filter(n =>
        n.paraCategory === preset.category ||
        n.tags?.some(t => preset.tags.includes(t))
      )
    } else {
      filtered = filtered.filter(n => n.paraCategory === preset.category)
    }

    if (customFilter.trim()) {
      const q = customFilter.toLowerCase()
      filtered = filtered.filter(n =>
        n.title?.toLowerCase().includes(q) ||
        n.content?.toLowerCase().includes(q) ||
        n.tags?.some(t => t.includes(q))
      )
    }

    setNotes(filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
    setLoading(false)
  }, [activePreset, customFilter])

  useEffect(() => { loadNotes() }, [loadNotes])

  return (
    <div className="context-retrieval">
      <div className="cr-header">
        <div className="cr-header-left">
          <h3>Context-Aware Retrieval</h3>
          <span className="cr-sub">Pre-filter notes by active project or area</span>
        </div>
        <button className="qc-close" onClick={onClose}>✕</button>
      </div>

      <div className="cr-presets">
        {PRESETS.map(preset => (
          <button
            key={preset.id}
            className={`cr-preset-btn ${activePreset === preset.id ? 'active' : ''}`}
            onClick={() => setActivePreset(preset.id)}
          >
            <span className="cr-preset-icon">{preset.icon}</span>
            <span className="cr-preset-name">{preset.name}</span>
          </button>
        ))}
      </div>

      <div className="cr-filter">
        <input
          className="cr-filter-input"
          placeholder="Filter within context..."
          value={customFilter}
          onChange={e => setCustomFilter(e.target.value)}
        />
        <span className="cr-count">{notes.length} notes</span>
      </div>

      <div className="cr-list">
        {loading ? (
          <div className="cr-loading">Loading...</div>
        ) : (
          notes.slice(0, 30).map(note => (
            <div
              key={note.id}
              className="cr-note-item"
              onClick={() => onSelectNote?.(note)}
              style={{ borderLeftColor: note.color || '#884444' }}
            >
              <strong>{note.title}</strong>
              <p>{(note.content || '').slice(0, 100)}</p>
              <div className="cr-note-footer">
                <span className="cr-tag">{note.paraCategory}</span>
                {note.tags?.slice(0, 3).map(t => (
                  <span key={t} className="cr-tag dim">{t}</span>
                ))}
                <span className="cr-date">{new Date(note.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
        {!loading && notes.length === 0 && (
          <div className="cr-empty">No notes in this context</div>
        )}
      </div>
    </div>
  )
}
