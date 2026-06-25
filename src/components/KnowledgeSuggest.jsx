import { useState, useEffect, useCallback } from 'react'
import db from '../data/db'
import { findRelated } from '../data/embeddings'

export default function KnowledgeSuggest({ onClose, onSelectNote }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  const loadSuggestions = useCallback(async () => {
    setLoading(true)
    const allNotes = await db.notes.toArray()
    const eligibleNotes = allNotes.filter(n => n.paraCategory !== 'inbox').slice(0, 3)

    const results = []
    for (const note of eligibleNotes) {
      const related = await findRelated(note.id || note.ideaId, 2)
      for (const r of related) {
        if (!results.some(ex => ex.note?.id === r.note?.id)) {
          results.push(r)
        }
      }
    }

    results.sort((a, b) => b.score - a.score)
    setSuggestions(results.slice(0, 6))
    setLoading(false)
  }, [])

  useEffect(() => { loadSuggestions() }, [loadSuggestions])

  return (
    <div className="knowledge-suggest">
      <div className="ks-header">
        <div className="ks-header-left">
          <h3>Knowledge Compounding</h3>
          <span className="ks-sub">Related notes suggested from your corpus</span>
        </div>
        <div className="ks-header-actions">
          <button className="btn-secondary" onClick={loadSuggestions} style={{ fontSize: '0.6rem', padding: '3px 10px' }}>
            Refresh
          </button>
          <button className="qc-close" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="ks-body">
        {loading ? (
          <div className="ks-loading">Finding related knowledge...</div>
        ) : suggestions.length === 0 ? (
          <div className="ks-empty">
            <div className="ks-empty-icon">🧠</div>
            <p>No related suggestions yet</p>
            <span>Add more notes to see knowledge compounding in action</span>
          </div>
        ) : (
          <div className="ks-suggestions">
            <div className="ks-suggestions-header">
              <strong>Suggested Connections</strong>
              <span className="ks-hint">Click a note to explore</span>
            </div>
            {suggestions.map((s, i) => (
              <div
                key={s.note?.id || i}
                className="ks-card"
                onClick={() => onSelectNote?.(s.note)}
                style={{ borderLeftColor: s.note?.color || '#884444' }}
              >
                <div className="ks-card-header">
                  <strong>{s.note?.title || 'Untitled'}</strong>
                  <span className="ks-relevance" style={{
                    color: s.score > 0.5 ? '#88cc44' : s.score > 0.2 ? '#ffaa44' : '#884444',
                  }}>
                    {Math.round(s.score * 100)}% match
                  </span>
                </div>
                <p>{(s.note?.content || '').slice(0, 100)}</p>
                <div className="ks-card-footer">
                  <span className="ks-tag">{s.note?.paraCategory}</span>
                  {s.note?.tags?.slice(0, 2).map(t => (
                    <span key={t} className="ks-tag dim">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
