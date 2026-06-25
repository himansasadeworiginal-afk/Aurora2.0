import { useState, useEffect } from 'react'
import db from '../data/db'

const NUDGE_TEMPLATES = [
  {
    id: 'empty-titles',
    icon: '📝',
    label: 'Better Titles',
    desc: 'Notes with generic titles are harder to find. Consider more descriptive names.',
    check: (notes) => notes.filter(n => n.title && n.title.length < 5).length > 0,
    getCount: (notes) => notes.filter(n => n.title && n.title.length < 5).length,
  },
  {
    id: 'no-category',
    icon: '🏷️',
    label: 'Re-categorization',
    desc: 'Some notes lack a PARA category. Assign them to Projects, Areas, Resources, or Archives.',
    check: (notes) => notes.filter(n => !n.paraCategory || n.paraCategory === 'inbox').length > 0,
    getCount: (notes) => notes.filter(n => !n.paraCategory || n.paraCategory === 'inbox').length,
  },
  {
    id: 'similar-notes',
    icon: '🔗',
    label: 'Merge Suggestions',
    desc: 'Notes with very similar titles might be duplicates worth merging.',
    check: (notes) => {
      const titles = notes.filter(n => n.title).map(n => n.title.toLowerCase().trim())
      for (let i = 0; i < titles.length; i++) {
        for (let j = i + 1; j < titles.length; j++) {
          if (titles[i] !== titles[j] && (titles[i].includes(titles[j]) || titles[j].includes(titles[i]))) return true
        }
      }
      return false
    },
    getCount: (notes) => {
      let count = 0
      const titles = notes.filter(n => n.title).map(n => n.title.toLowerCase().trim())
      for (let i = 0; i < titles.length; i++) {
        for (let j = i + 1; j < titles.length; j++) {
          if (titles[i] !== titles[j] && (titles[i].includes(titles[j]) || titles[j].includes(titles[i]))) count++
        }
      }
      return count
    },
  },
  {
    id: 'stale-notes',
    icon: '⏰',
    label: 'Stale Notes',
    desc: 'Notes not updated in 30+ days may need review or archiving.',
    check: (notes) => {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
      return notes.filter(n => n.updatedAt && new Date(n.updatedAt).getTime() < cutoff).length > 0
    },
    getCount: (notes) => {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
      return notes.filter(n => n.updatedAt && new Date(n.updatedAt).getTime() < cutoff).length
    },
  },
  {
    id: 'no-distillation',
    icon: '💎',
    label: 'Undistilled Notes',
    desc: 'Notes at depth 0 have never been distilled. Pick one and push it to Layer 1.',
    check: (notes) => notes.filter(n => n.distillationDepth === undefined || n.distillationDepth === 0).length > 5,
    getCount: (notes) => notes.filter(n => n.distillationDepth === undefined || n.distillationDepth === 0).length,
  },
]

export default function HabitNudges({ onClose }) {
  const [nudges, setNudges] = useState([])
  const [dismissed, setDismissed] = useState(new Set())

  useEffect(() => {
    loadNudges()
  }, [])

  const loadNudges = async () => {
    const notes = await db.notes.toArray()
    const active = NUDGE_TEMPLATES.filter(t => t.check(notes)).map(t => ({
      ...t,
      count: t.getCount(notes),
    }))
    setNudges(active)
  }

  const dismiss = (id) => {
    setDismissed(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const activeNudges = nudges.filter(n => !dismissed.has(n.id))

  return (
    <div className="nudges-panel">
      <div className="review-header">
        <div className="review-header-left">
          <h3>Habit Nudges</h3>
          <span className="review-sub">{activeNudges.length} suggestions for your second brain</span>
        </div>
        <button className="qc-close" onClick={onClose}>✕</button>
      </div>
      {activeNudges.length === 0 ? (
        <div className="review-complete">
          <div className="review-complete-icon" style={{ background: 'rgba(136, 204, 68, 0.1)', border: '2px solid #88cc44', fontSize: '1.2rem' }}>✓</div>
          <p>Your second brain is in great shape! No nudges right now.</p>
        </div>
      ) : (
        <div className="nudges-list">
          {activeNudges.map(nudge => (
            <div key={nudge.id} className="nudge-card">
              <div className="nudge-icon">{nudge.icon}</div>
              <div className="nudge-body">
                <strong>{nudge.label}</strong>
                <p>{nudge.desc}</p>
                <span className="nudge-count">{nudge.count} affected</span>
              </div>
              <button className="nudge-dismiss" onClick={() => dismiss(nudge.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div className="review-footer">
        <button className="btn-secondary" onClick={loadNudges}>Refresh</button>
      </div>
    </div>
  )
}
