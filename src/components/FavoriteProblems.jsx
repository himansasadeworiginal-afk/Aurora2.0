import { useState, useMemo } from 'react'
import db from '../data/db'

const DEFAULT_PROBLEMS = [
  { id: 'p1', text: 'How can I build systems that amplify human potential?', color: '#2DD4BF' },
  { id: 'p2', text: 'What does it mean to think clearly in a complex world?', color: '#34D6C4' },
  { id: 'p3', text: 'How do we create value that outlasts us?', color: '#56C6E8' },
  { id: 'p4', text: 'What is the relationship between chaos and creativity?', color: '#6FB2EC' },
  { id: 'p5', text: 'How can knowledge compound across disciplines?', color: '#7FA8F0' },
  { id: 'p6', text: 'What habits separate effective people from the rest?', color: '#8B7CF6' },
  { id: 'p7', text: 'How do we balance depth with breadth of knowledge?', color: '#A78BFA' },
  { id: 'p8', text: 'What makes a decision truly good?', color: '#52E3A4' },
  { id: 'p9', text: 'How can technology serve humanity without dominating it?', color: '#9D8CF8' },
  { id: 'p10', text: 'What is the art of meaningful connection?', color: '#6FDDB4' },
  { id: 'p11', text: 'How do we navigate uncertainty with grace?', color: '#46C8D8' },
  { id: 'p12', text: 'What stories shape our reality—and how do we choose them?', color: '#8B7CF6' },
]

export default function FavoriteProblems({ onClose }) {
  const [problems] = useState(DEFAULT_PROBLEMS)
  const [resonance, setResonance] = useState(null)
  const [scanning, setScanning] = useState(false)

  const scanResonance = async () => {
    setScanning(true)
    const allNotes = await db.notes.toArray()
    const results = problems.map(problem => {
      const pWords = problem.text.toLowerCase().split(/\s+/)
      let score = 0
      let matches = []
      for (const note of allNotes) {
        const text = (note.title + ' ' + (note.content || '') + ' ' + (note.tags || []).join(' ')).toLowerCase()
        const matchCount = pWords.filter(w => w.length > 3 && text.includes(w)).length
        if (matchCount > 0) {
          score += matchCount
          matches.push({ title: note.title, id: note.id, matchCount })
        }
      }
      matches.sort((a, b) => b.matchCount - a.matchCount)
      return { ...problem, score, matches: matches.slice(0, 5) }
    })
    results.sort((a, b) => b.score - a.score)
    setResonance(results)
    setScanning(false)
  }

  const topProblems = useMemo(() => {
    if (!resonance) return []
    return resonance.filter(r => r.score > 0)
  }, [resonance])

  if (!resonance) {
    return (
      <div className="favorite-problems">
        <div className="fp-header">
          <div className="fp-header-row">
            <h3>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                <path d="M7 1l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1 2-4z" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
              Twelve Favorite Problems
            </h3>
            <button className="qc-close" onClick={onClose} title="Close">✕</button>
          </div>
          <p className="fp-sub">Scan your notes for resonance with your guiding questions</p>
        </div>
        <div style={{ padding: '0 14px 12px' }}>
        <button className="btn-primary" onClick={scanResonance} disabled={scanning}>
          {scanning ? 'Scanning...' : 'Scan for Resonance'}
        </button>
        </div>
      </div>
    )
  }

  return (
    <div className="favorite-problems">
      <div className="fp-header">
        <div className="fp-header-row">
          <h3>Resonance Scan</h3>
          <button className="qc-close" onClick={onClose} title="Close">✕</button>
        </div>
        <div className="fp-header-actions">
          <span className="fp-result-count">{topProblems.length} problems with matches</span>
          <button className="btn-secondary" onClick={() => setResonance(null)}>Rescan</button>
        </div>
      </div>

      {topProblems.length === 0 ? (
        <div className="fp-empty">
          <p>No resonance found. Capture more notes to discover connections with your favorite problems.</p>
        </div>
      ) : (
        <div className="fp-results">
          {topProblems.map(problem => (
            <div key={problem.id} className="fp-problem" style={{ borderLeftColor: problem.color }}>
              <div className="fp-problem-header">
                <span className="fp-problem-icon" style={{ background: problem.color }} />
                <strong>{problem.text}</strong>
                <span className="fp-problem-score">{problem.score} matches</span>
              </div>
              {problem.matches.length > 0 && (
                <div className="fp-matches">
                  {problem.matches.map(m => (
                    <span key={m.id} className="fp-match-chip" style={{ borderColor: problem.color }}>
                      {m.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
