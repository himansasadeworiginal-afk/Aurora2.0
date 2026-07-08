import { useState, useEffect } from 'react'
import db from '../data/db'

const MONTHLY_ITEMS = [
  { id: 'review-goals', label: 'Review monthly goals — on track?', category: 'goals' },
  { id: 'audit-projects', label: 'Audit all projects — close, pause, or continue', category: 'projects' },
  { id: 'review-areas', label: 'Review all Areas — any need attention?', category: 'areas' },
  { id: 'someday-maybe', label: 'Review Someday/Maybe list — promote or discard', category: 'planning' },
  { id: 'archive-old', label: 'Archive completed and cold projects', category: 'archives' },
  { id: 'check-habits', label: 'Check habit streaks — what is working?', category: 'habits' },
  { id: 'update-favorite-problems', label: 'Update Twelve Favorite Problems', category: 'growth' },
]

export default function MonthlyReview({ onClose }) {
  const [items, setItems] = useState(MONTHLY_ITEMS.map(i => ({ ...i, done: false })))
  const [activeReview, setActiveReview] = useState(null)
  const [, setHistory] = useState([])

  useEffect(() => {
    db.reviews.where('type').equals('monthly').reverse().limit(3).toArray().then(setHistory)
  }, [])

  const toggle = (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }

  const complete = async () => {
    const completed = items.filter(i => i.done)
    const review = {
      type: 'monthly',
      completedAt: new Date(),
      items: completed.map(i => i.id),
      duration: Math.floor((Date.now() - startTime) / 1000),
    }
    await db.reviews.add(review)
    setActiveReview(true)
    setHistory(prev => [review, ...prev])
  }

  const [startTime] = useState(Date.now())
  const doneCount = items.filter(i => i.done).length

  if (activeReview) {
    return (
      <div className="review-panel">
        <div className="review-header">
          <div className="review-header-left">
            <h3>Monthly Review Complete</h3>
            <span className="review-sub">{doneCount}/{items.length} items completed</span>
          </div>
          <button className="qc-close" onClick={onClose}>✕</button>
        </div>
        <div className="review-complete">
          <div className="review-complete-icon">✓</div>
          <p>Monthly review finished. Your second brain is in good shape.</p>
          <p className="review-hint">Next review: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="review-panel">
      <div className="review-header">
        <div className="review-header-left">
          <h3>Monthly Review</h3>
          <span className="review-sub">Deep audit — {doneCount}/{items.length}</span>
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
          Complete Monthly Review
        </button>
      </div>
    </div>
  )
}
