import { useState, useRef, useCallback, useEffect } from 'react'
import { search } from '../data/embeddings'
import { trackEvent } from '../data/resonance'

export default function SemanticSearch({ onClose, onSelectNote }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const timerRef = useRef(null)

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }
    setSearching(true)
    const res = await search(q)
    setResults(res)
    setHasSearched(true)
    setSearching(false)
  }, [])

  const handleInputChange = useCallback((e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => handleSearch(val), 300)
  }, [handleSearch])

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  const handleSelect = async (note) => {
    await trackEvent(note.id || note.ideaId, 'view')
    onSelectNote?.(note)
  }

  return (
    <div className="semantic-search">
      <div className="ss-header">
        <div className="ss-header-left">
          <h3>Semantic Search</h3>
          <span className="ss-sub">Search across all notes with relevance scoring</span>
        </div>
        <button className="qc-close" onClick={onClose}>✕</button>
      </div>

      <div className="ss-search-area">
        <div className="ss-input-wrap">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ss-search-icon">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <input
            className="ss-input"
            placeholder="Search notes, ideas, tags..."
            value={query}
            onChange={handleInputChange}
            autoFocus
          />
          {query && (
            <button className="ss-clear" onClick={() => { setQuery(''); setResults([]); setHasSearched(false) }}>✕</button>
          )}
        </div>
      </div>

      <div className="ss-results">
        {searching && (
          <div className="ss-loading">Searching...</div>
        )}

        {!searching && hasSearched && results.length === 0 && (
          <div className="ss-empty">
            <p>No matches found</p>
            <span>Try different keywords or browse your notes directly</span>
          </div>
        )}

        {!searching && results.map((r, i) => (
          <div
            key={r.note?.id || i}
            className="ss-result-item"
            onClick={() => handleSelect(r.note)}
            style={{ borderLeftColor: r.note?.color || '#884444' }}
          >
            <div className="ss-result-header">
              <strong>{r.note?.title || 'Untitled'}</strong>
              <span className="ss-score" style={{
                color: r.score > 0.5 ? '#88cc44' : r.score > 0.2 ? '#ffaa44' : '#884444',
              }}>
                {Math.round(r.score * 100)}%
              </span>
            </div>
            <p>{(r.note?.content || '').slice(0, 120)}</p>
            <div className="ss-result-footer">
              <span className="ss-category" style={{
                background: r.note?.paraCategory === 'projects' ? 'rgba(255,68,68,0.15)' :
                  r.note?.paraCategory === 'areas' ? 'rgba(255,136,51,0.15)' : 'rgba(68,136,255,0.15)',
                color: r.note?.paraCategory === 'projects' ? '#ff6666' :
                  r.note?.paraCategory === 'areas' ? '#ffaa66' : '#66aaff',
              }}>
                {r.note?.paraCategory}
              </span>
              {r.matches?.length > 0 && (
                <span className="ss-matches">{r.matches.slice(0, 4).join(', ')}</span>
              )}
            </div>
          </div>
        ))}

        {!hasSearched && !searching && (
          <div className="ss-hint">
            <div className="ss-hint-icon">🔍</div>
            <p>Type to search across your entire knowledge base</p>
            <span>Search uses keyword relevance scoring to find the most related notes</span>
          </div>
        )}
      </div>
    </div>
  )
}
