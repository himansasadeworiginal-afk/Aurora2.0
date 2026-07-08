import { useState, useEffect } from 'react'
import db from '../data/db'

const WEEKLY_ITEMS = [
  { id: 'clear-inbox', label: 'Clear inbox — process all uncategorized captures', category: 'inbox' },
  { id: 'check-calendar', label: 'Check calendar for upcoming deadlines and events', category: 'planning' },
  { id: 'close-projects', label: 'Close completed projects or mark stalled ones', category: 'projects' },
  { id: 'distill-5', label: 'Distill 5 notes — push one layer deeper', category: 'distill' },
  { id: 'pick-top-3', label: 'Pick top 3 priorities for next week', category: 'planning' },
  { id: 'review-notes', label: 'Review notes created this week — file or discard', category: 'organize' },
  { id: 'check-areas', label: 'Check each Area — is anything stuck?', category: 'areas' },
]

export default function WeeklyReview({ onClose }) {
  const [items, setItems] = useState(WEEKLY_ITEMS.map(i => ({ ...i, done: false })))
  const [activeReview, setActiveReview] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    db.reviews.where('type').equals('weekly').reverse().limit(5).toArray().then(setHistory)
  }, [])

  const toggle = (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }

  const complete = async () => {
    const completed = items.filter(i => i.done)
    const review = {
      type: 'weekly',
      completedAt: new Date(),
      items: completed.map(i => i.id),
      duration: Math.floor((Date.now() - startTime) / 1000),
    }
    const id = await db.reviews.add(review)
    setActiveReview(id)
    setHistory(prev => [review, ...prev])
  }

  const [startTime] = useState(Date.now())
  const doneCount = items.filter(i => i.done).length

  if (activeReview) {
    return (
      <div className="review-panel">
        <div className="review-header">
          <div className="review-header-left">
            <h3>Weekly Review Complete</h3>
            <span className="review-sub">{doneCount}/{items.length} items completed</span>
          </div>
          <button className="qc-close" onClick={onClose}>✕</button>
        </div>
        <div className="review-complete">
          <div className="review-complete-icon">✓</div>
          <p>Great work! You&apos;ve completed your weekly review.</p>
          <p className="review-hint">Come back next week to stay on track.</p>
        </div>
        {history.length > 1 && (
          <div className="review-history">
            <strong>Past Reviews</strong>
            {history.slice(1).map((r, i) => (
              <div key={i} className="review-history-item">
                <span>{new Date(r.completedAt).toLocaleDateString()}</span>
                <span>{r.items?.length || 0} items</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="review-panel">
      <div className="review-header">
        <div className="review-header-left">
          <h3>Weekly Review</h3>
          <span className="review-sub">Guided checklist — {doneCount}/{items.length}</span>
        </div>
        <button className="qc-close" onClick={onClose}>✕</button>
      </div>
      <div className="review-progress">
        <div className="review-progress-track">
          <div className="review-progress-fill" style={{ width: `${(doneCount / items.length) * 100}%` }} />
        </div>
      </div>
      <div className="review-list">
        {items.map(item => (
          <div key={item.id} className={`review-item ${item.done ? 'done' : ''}`} onClick={() => toggle(item.id)}>
            <div className={`review-check ${item.done ? 'checked' : ''}`}>
              {item.done && <span>✓</span>}
            </div>
            <div className="review-item-body">
              <strong>{item.label}</strong>
              <span className="review-category">{item.category}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="review-footer">
        <button className="btn-primary" onClick={complete} disabled={doneCount === 0}>
          Complete Review
        </button>
      </div>
    </div>
  )
}
