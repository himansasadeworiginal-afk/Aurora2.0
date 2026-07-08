import { useState, useCallback, useEffect } from 'react'
import PersonCard from './PersonCard'
import AuroraPulse from '../../components/AuroraPulse'
import { compactPerson, keywordSearch } from './relations-data'
import { aiRelationsSearch, aiStatus } from '../../data/ai-client'

// Natural-language search over the people graph. Sends a compact projection to
// Claude (via the /api/ai proxy); on no-key / failure it falls back to local
// keyword matching so it never shows a broken state.

const EXAMPLES = [
  'backend devs more than 60% friendly',
  'people I met at a conference',
  'designers in Europe',
  'mentors I should reconnect with',
]

export default function RelationsAISearch({ people, onOpen }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null) // null = idle, [] = no matches
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState(null) // 'ai' | 'keyword'
  const [aiOn, setAiOn] = useState(false)

  useEffect(() => { aiStatus().then(s => setAiOn(!!s.available)) }, [])

  const byId = useCallback((id) => people.find(p => p.id === id), [people])

  const run = useCallback(async (query) => {
    const term = (query ?? q).trim()
    if (!term) return
    setLoading(true)
    setResults(null)

    const res = await aiRelationsSearch(term, people.map(compactPerson))
    if (res?.ok && Array.isArray(res.results)) {
      const mapped = res.results
        .map(r => ({ person: byId(r.id), reason: r.reason }))
        .filter(x => x.person)
      setResults(mapped)
      setMode('ai')
    } else {
      setResults(keywordSearch(term, people))
      setMode('keyword')
    }
    setLoading(false)
  }, [q, people, byId])

  const onSubmit = useCallback((e) => { e.preventDefault(); run() }, [run])

  return (
    <div className="rel-ai">
      <form className="rel-ai-search" onSubmit={onSubmit}>
        <div className="rel-ai-bar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2.5l1.3 3.2 3.2 1.3-3.2 1.3L10 11.5 8.7 8.3 5.5 7l3.2-1.3z" />
            <path d="M15.5 12.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" />
          </svg>
          <input
            className="rel-ai-input"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Ask anything — e.g. backend devs more than 60% friendly"
            autoFocus
          />
          <button className="rel-btn-primary" type="submit" disabled={loading || !q.trim()}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
        <div className="rel-ai-hint">
          {aiOn
            ? 'Powered by Claude — understands meaning, not just keywords.'
            : 'No API key set — using local keyword matching.'}
        </div>
      </form>

      {results === null && !loading && (
        <div className="rel-ai-examples">
          <span className="rel-label">Try</span>
          <div className="rel-ai-chips">
            {EXAMPLES.map(ex => (
              <button key={ex} type="button" className="rel-tag rel-tag-filter" onClick={() => { setQ(ex); run(ex) }}>{ex}</button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="rel-ai-loading">
          <AuroraPulse size={44} variant="orb" active />
          <span className="rel-ai-loading-text">Searching your people…</span>
        </div>
      )}

      {results !== null && !loading && (
        <>
          <div className="rel-count">
            {results.length} {results.length === 1 ? 'match' : 'matches'}
            {mode === 'keyword' && <span className="rel-ai-tag-fallback">keyword</span>}
            {mode === 'ai' && <span className="rel-ai-tag-ai">AI</span>}
          </div>
          {results.length === 0 ? (
            <div className="rel-empty">No one matched that. Try rephrasing.</div>
          ) : (
            <div className="rel-grid">
              {results.map(({ person, reason }) => (
                <PersonCard key={person.id} person={person} reason={reason} onOpen={onOpen} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
