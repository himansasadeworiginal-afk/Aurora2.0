import { useState, useMemo, useEffect, useCallback } from 'react'
import db from '../data/db'
import { getAllNoteStats, getResonanceScore } from '../data/resonance'

const DEFAULT_PROBLEMS = [
  { id: 'p1', text: 'How can I build systems that amplify human potential?', color: '#ff003c' },
  { id: 'p2', text: 'What does it mean to think clearly in a complex world?', color: '#ff4400' },
  { id: 'p3', text: 'How do we create value that outlasts us?', color: '#ff0066' },
  { id: 'p4', text: 'What is the relationship between chaos and creativity?', color: '#cc0044' },
  { id: 'p5', text: 'How can knowledge compound across disciplines?', color: '#dd0055' },
  { id: 'p6', text: 'What habits separate effective people from the rest?', color: '#ff6622' },
  { id: 'p7', text: 'How do we balance depth with breadth of knowledge?', color: '#3388ff' },
  { id: 'p8', text: 'What makes a decision truly good?', color: '#22aa88' },
  { id: 'p9', text: 'How can technology serve humanity without dominating it?', color: '#8855dd' },
  { id: 'p10', text: 'What is the art of meaningful connection?', color: '#aa44cc' },
  { id: 'p11', text: 'How do we navigate uncertainty with grace?', color: '#cc66ee' },
  { id: 'p12', text: 'What stories shape our reality—and how do we choose them?', color: '#9955bb' },
]

export default function ScoredProblems({ onClose }) {
  const [problems] = useState(DEFAULT_PROBLEMS)
  const [resonance, setResonance] = useState(null)
  const [stats, setStats] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [autoScore, setAutoScore] = useState(null)

  const loadStats = useCallback(async () => {
    const s = await getResonanceScore()
    setStats(s)
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  const scanResonance = async () => {
    setScanning(true)
    const allNotes = await db.notes.toArray()
    const noteStats = await getAllNoteStats()

    const results = problems.map(problem => {
      const pWords = problem.text.toLowerCase().split(/\s+/)
      let score = 0
      let matches = []
      for (const note of allNotes) {
        const text = (note.title + ' ' + (note.content || '') + ' ' + (note.tags || []).join(' ')).toLowerCase()
        const matchCount = pWords.filter(w => w.length > 3 && text.includes(w)).length
        if (matchCount > 0) {
          const ns = noteStats[note.id] || { views: 0, edits: 0, distills: 0, captures: 0 }
          const engagementBonus = (ns.views + ns.edits * 2 + ns.distills * 3) * 0.1
          const weightedScore = matchCount + engagementBonus
          score += weightedScore
          matches.push({ title: note.title, id: note.id, matchCount, weightedScore: Math.round(weightedScore * 10) / 10 })
        }
      }
      matches.sort((a, b) => b.weightedScore - a.weightedScore)
      return { ...problem, score: Math.round(score * 10) / 10, matches: matches.slice(0, 5) }
    })
    results.sort((a, b) => b.score - a.score)
    setResonance(results)
    computeAutoScore(results)
    setScanning(false)
  }

  const computeAutoScore = (results) => {
    const total = results.reduce((s, r) => s + r.score, 0)
    const avg = total / results.length
    const coverage = results.filter(r => r.score > 0).length
    const topScore = results[0]?.score || 0
    setAutoScore({
      totalScore: Math.round(total),
      averageScore: Math.round(avg * 10) / 10,
      coverage: `${coverage}/12`,
      topProblem: results[0]?.text?.slice(0, 40) || 'N/A',
      topScore,
      health: topScore > 20 ? 'strong' : topScore > 10 ? 'moderate' : 'weak',
    })
  }

  const topProblems = useMemo(() => {
    if (!resonance) return []
    return resonance.filter(r => r.score > 0)
  }, [resonance])

  return (
    <div className="scored-problems">
      <div className="sp-header">
        <div className="sp-header-left">
          <h3>Resonance Dashboard</h3>
          <span className="sp-sub">Auto-scored Twelve Favorite Problems with engagement tracking</span>
        </div>
        <button className="qc-close" onClick={onClose}>✕</button>
      </div>

      {stats && (
        <div className="sp-stats-bar">
          <div className="sp-stat"><span className="sp-stat-val">{stats.totalNotes}</span> Notes</div>
          <div className="sp-stat"><span className="sp-stat-val">{stats.totalEvents}</span> Events</div>
          <div className="sp-stat"><span className="sp-stat-val">{stats.weeklyEvents}</span> This Week</div>
          <div className="sp-stat"><span className="sp-stat-val">{stats.engagementRate}</span> Rate</div>
        </div>
      )}

      {autoScore && (
        <div className="sp-auto-score">
          <div className="sp-score-header">
            <strong>Resonance Score</strong>
            <span className="sp-score-badge" style={{
              background: autoScore.health === 'strong' ? 'rgba(136,204,68,0.15)' : autoScore.health === 'moderate' ? 'rgba(255,170,68,0.15)' : 'rgba(200,0,0,0.15)',
              color: autoScore.health === 'strong' ? '#88cc44' : autoScore.health === 'moderate' ? '#ffaa44' : '#ff4444',
            }}>
              {autoScore.health.toUpperCase()}
            </span>
          </div>
          <div className="sp-score-grid">
            <div className="sp-score-item">
              <span className="sp-score-num">{autoScore.totalScore}</span>
              <span className="sp-score-label">Total</span>
            </div>
            <div className="sp-score-item">
              <span className="sp-score-num">{autoScore.averageScore}</span>
              <span className="sp-score-label">Avg</span>
            </div>
            <div className="sp-score-item">
              <span className="sp-score-num">{autoScore.coverage}</span>
              <span className="sp-score-label">Coverage</span>
            </div>
            <div className="sp-score-item">
              <span className="sp-score-num">{autoScore.topScore}</span>
              <span className="sp-score-label">Top Score</span>
            </div>
          </div>
        </div>
      )}

      <div className="sp-scan-area">
        <button className="btn-primary" onClick={scanResonance} disabled={scanning}>
          {scanning ? 'Scanning with engagement weights...' : 'Scan Resonance with Auto-Score'}
        </button>
      </div>

      {resonance && (
        <div className="sp-results">
          <div className="sp-results-header">
            <span className="fp-result-count">{topProblems.length} problems with resonance</span>
            <button className="btn-secondary" onClick={() => setResonance(null)}>Rescan</button>
          </div>
          {topProblems.map(problem => (
            <div key={problem.id} className="fp-problem" style={{ borderLeftColor: problem.color }}>
              <div className="fp-problem-header">
                <span className="fp-problem-icon" style={{ background: problem.color }} />
                <strong>{problem.text}</strong>
                <span className="fp-problem-score">{problem.score} pts</span>
              </div>
              {problem.matches.length > 0 && (
                <div className="fp-matches">
                  {problem.matches.map(m => (
                    <span key={m.id} className="fp-match-chip" style={{ borderColor: problem.color }}>
                      {m.title} ({m.weightedScore})
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
