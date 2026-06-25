import { useState, useEffect, useCallback } from 'react'
import db from '../data/db'
import './TrackerView.css'

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

const CATEGORY_COLORS = {
  health: '#88cc44',
  work: '#4488ff',
  study: '#ffaa33',
  personal: '#cc44cc',
  other: '#888888'
}

const CATEGORY_LABELS = {
  health: 'Health',
  work: 'Work',
  study: 'Study',
  personal: 'Personal',
  other: 'Other'
}

const S = { stroke: 'currentColor', fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" {...S}>
    <line x1="7" y1="2" x2="7" y2="12" />
    <line x1="2" y1="7" x2="12" y2="7" />
  </svg>
)

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" {...S}>
    <line x1="2" y1="2" x2="10" y2="10" />
    <line x1="10" y1="2" x2="2" y2="10" />
  </svg>
)

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" {...S}>
    <path d="M2 5l2 2 4-4" />
  </svg>
)

const TrashIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" {...S}>
    <path d="M2 3h7M4 3V2a1 1 0 011-1h1a1 1 0 011 1v1M3 3v6a1 1 0 001 1h3a1 1 0 001-1V3" />
  </svg>
)

const TargetIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" {...S}>
    <circle cx="14" cy="14" r="11" />
    <circle cx="14" cy="14" r="6" />
    <circle cx="14" cy="14" r="2" fill="currentColor" stroke="none" />
  </svg>
)

export default function TrackerView({ onClose }) {
  const [trackers, setTrackers] = useState([])
  const [logs, setLogs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formFrequency, setFormFrequency] = useState('daily')
  const [formCategory, setFormCategory] = useState('personal')
  const [loading, setLoading] = useState(true)

  const today = getToday()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [allTrackers, allLogs] = await Promise.all([
        db.trackers.toArray(),
        db.trackerLogs.toArray()
      ])
      setTrackers(allTrackers)
      setLogs(allLogs)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const getLogForToday = useCallback((trackerId) => {
    return logs.find(l => l.trackerId === trackerId && l.date === today)
  }, [logs, today])

  const isLoggedToday = useCallback((trackerId) => {
    return logs.some(l => l.trackerId === trackerId && l.date === today)
  }, [logs, today])

  const getStreak = useCallback((trackerId) => {
    const loggedDates = new Set(
      logs.filter(l => l.trackerId === trackerId).map(l => l.date)
    )
    if (loggedDates.size === 0) return 0
    let streak = 0
    const d = new Date(today + 'T00:00:00')
    while (true) {
      const ds = d.toISOString().slice(0, 10)
      if (loggedDates.has(ds)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else break
    }
    return streak
  }, [logs, today])

  const toggleCheckin = useCallback(async (trackerId) => {
    const existing = getLogForToday(trackerId)
    if (existing) {
      await db.trackerLogs.delete(existing.id)
    } else {
      await db.trackerLogs.add({
        trackerId,
        date: today,
        note: '',
        createdAt: new Date().toISOString()
      })
    }
    loadData()
  }, [getLogForToday, today, loadData])

  const deleteTracker = useCallback(async (id) => {
    const logIds = logs.filter(l => l.trackerId === id).map(l => l.id)
    await Promise.all([
      db.trackers.delete(id),
      ...logIds.map(lid => db.trackerLogs.delete(lid))
    ])
    loadData()
  }, [logs, loadData])

  const handleAddTracker = useCallback(async () => {
    if (!formName.trim()) return
    await db.trackers.add({
      name: formName.trim(),
      frequency: formFrequency,
      category: formCategory,
      createdAt: new Date().toISOString()
    })
    setFormName('')
    setFormFrequency('daily')
    setFormCategory('personal')
    setShowForm(false)
    loadData()
  }, [formName, formFrequency, formCategory, loadData])

  if (loading) {
    return (
      <div className="trk-v2 trackers-section">
        <div className="tracker-loading">Loading trackers...</div>
      </div>
    )
  }

  return (
    <div className="trk-v2 trackers-section">
      <div className="trackers-header">
        <h3 className="trackers-title">Trackers</h3>
        <div className="trackers-header-actions">
          <button
            className="trackers-add-btn"
            onClick={() => setShowForm(v => !v)}
            title={showForm ? 'Cancel' : 'Add tracker'}
          >
            {showForm ? <CloseIcon /> : <PlusIcon />}
          </button>
          {onClose && (
            <button className="trackers-close-btn" onClick={onClose} title="Close">
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="tracker-form">
          <input
            className="tracker-input"
            placeholder="Tracker name..."
            value={formName}
            onChange={e => setFormName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTracker()}
            autoFocus
          />
          <div className="tracker-form-row">
            <select
              className="tracker-select"
              value={formFrequency}
              onChange={e => setFormFrequency(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <select
              className="tracker-select"
              value={formCategory}
              onChange={e => setFormCategory(e.target.value)}
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="tracker-form-actions">
            <button className="tracker-save-btn" onClick={handleAddTracker}>Save</button>
            <button className="tracker-cancel-btn" onClick={() => { setShowForm(false); setFormName('') }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="tracker-list">
        {trackers.length === 0 ? (
          <div className="tracker-empty">
            <div className="tracker-empty-icon">
              <TargetIcon />
            </div>
            <p className="tracker-empty-title">No trackers yet</p>
            <p className="tracker-empty-sub">Create your first habit tracker to get started</p>
          </div>
        ) : (
          trackers.map(tracker => {
            const logged = isLoggedToday(tracker.id)
            const streak = getStreak(tracker.id)
            const catColor = CATEGORY_COLORS[tracker.category] || '#888'

            return (
              <div
                key={tracker.id}
                className="tracker-card"
                style={{ borderLeftColor: catColor }}
              >
                <div className="tracker-card-left">
                  <div className="tracker-name">{tracker.name}</div>
                  <div className="tracker-meta">
                    <span className="tracker-category" style={{ color: catColor, background: `${catColor}22`, borderColor: `${catColor}44` }}>
                      {CATEGORY_LABELS[tracker.category] || 'Other'}
                    </span>
                    <span className="tracker-frequency">{tracker.frequency}</span>
                  </div>
                </div>
                <div className="tracker-card-right">
                  <div className="tracker-checkin-group">
                    <button
                      className={`tracker-checkin${logged ? ' done' : ''}`}
                      onClick={() => toggleCheckin(tracker.id)}
                      title="Check in"
                    >
                      {logged && <CheckIcon />}
                    </button>
                    <span className={`tracker-streak${streak > 0 ? ' active' : ''}`}>
                      {streak}d
                    </span>
                  </div>
                  <button
                    className="tracker-del"
                    onClick={() => deleteTracker(tracker.id)}
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
