import { useState, useEffect } from 'react'
import db from '../data/db'

export default function DialDownScope({ project, onClose }) {
  const [notes, setNotes] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [mvpSuggestion, setMvpSuggestion] = useState('')

  useEffect(() => {
    async function load() {
      const all = await db.notes.toArray()
      const projectNotes = all.filter(n =>
        n.paraCategory === 'projects' ||
        (project && n.tags?.some(t => t === project.id || t === project.name?.toLowerCase()))
      )
      setNotes(projectNotes.slice(0, 20))
    }
    load()
  }, [project])

  const handleAnalyze = () => {
    const noteCount = notes.length
    const avgLength = notes.reduce((sum, n) => sum + (n.content?.length || 0), 0) / (noteCount || 1)
    const tagCount = new Set(notes.flatMap(n => n.tags || [])).size
    const hasDeadlines = notes.some(n => n.title?.toLowerCase().includes('deadline') || n.title?.toLowerCase().includes('due'))

    setAnalysis({ noteCount, avgLength: Math.round(avgLength), tagCount, hasDeadlines })

    if (noteCount > 10) {
      setMvpSuggestion(`You have ${noteCount} notes for this project. Consider focusing on the single most impactful outcome. Pick the 3 most essential features/ideas and drop the rest.`)
    } else if (avgLength > 500) {
      setMvpSuggestion(`Your notes average ${Math.round(avgLength)} characters each — they're quite detailed. Try distilling each to one sentence. What's the core idea?`)
    } else if (!hasDeadlines) {
      setMvpSuggestion(`No deadlines detected. Set a 1-week timeline for an MVP. What's the smallest deliverable you can ship in 7 days?`)
    } else {
      setMvpSuggestion(`Good structure detected. Your MVP is: identify the single critical path and trim everything that isn't essential to delivering value.`)
    }
  }

  return (
    <div className="dialdown-scope">
      <div className="dd-header">
        <div className="dd-header-left">
          <h3>Dial Down Scope</h3>
          <span className="dd-sub">Find your MVP when a project feels stuck</span>
        </div>
        <button className="qc-close" onClick={onClose}>✕</button>
      </div>

      <div className="dd-body">
        <div className="dd-project">
          <strong>Project:</strong> {project?.name || 'Current Project'}
          <span className="dd-note-count">{notes.length} related notes</span>
        </div>

        <button className="btn-primary" onClick={handleAnalyze} style={{ width: '100%', marginBottom: 16 }}>
          Analyze & Dial Down
        </button>

        {analysis && (
          <div className="dd-stats-grid">
            <div className="dd-stat-card">
              <span className="dd-stat-value">{analysis.noteCount}</span>
              <span className="dd-stat-label">Notes</span>
            </div>
            <div className="dd-stat-card">
              <span className="dd-stat-value">{analysis.avgLength}</span>
              <span className="dd-stat-label">Avg Length</span>
            </div>
            <div className="dd-stat-card">
              <span className="dd-stat-value">{analysis.tagCount}</span>
              <span className="dd-stat-label">Unique Tags</span>
            </div>
            <div className="dd-stat-card">
              <span className="dd-stat-value">{analysis.hasDeadlines ? '✓' : '✗'}</span>
              <span className="dd-stat-label">Deadlines</span>
            </div>
          </div>
        )}

        {mvpSuggestion && (
          <div className="dd-mvp">
            <div className="dd-mvp-icon">🎯</div>
            <div className="dd-mvp-content">
              <strong>MVP Suggestion</strong>
              <p>{mvpSuggestion}</p>
            </div>
          </div>
        )}

        <div className="dd-notes-preview">
          <strong>Related Notes</strong>
          {notes.slice(0, 5).map(note => (
            <div key={note.id} className="dd-note-row">
              <span className="dd-note-dot" style={{ background: note.color || '#884444' }} />
              <span>{note.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
