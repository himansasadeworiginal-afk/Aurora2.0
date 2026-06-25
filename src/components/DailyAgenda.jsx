import { useState, useEffect, useCallback } from 'react'
import db from '../data/db'
import TimeWheelPicker from './TimeWheelPicker'
import './DailyAgenda.css'

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getTodayName() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
}

function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function dayMatches(reminder, today) {
  if (!reminder.recurring || reminder.recurring === 'none') {
    return reminder.date === today
  }
  const todayDate = new Date(today + 'T00:00:00')
  const todayDow = todayDate.getDay()
  const reminderDate = new Date(reminder.date + 'T00:00:00')
  const dayOfMonth = todayDate.getDate()

  if (reminder.recurring === 'daily') return true
  if (reminder.recurring === 'weekdays') return todayDow >= 1 && todayDow <= 5
  if (reminder.recurring === 'weekends') return todayDow === 0 || todayDow === 6
  if (reminder.recurring === 'weekly') {
    return todayDow === reminderDate.getDay()
  }
  if (reminder.recurring === 'monthly') {
    return dayOfMonth === reminderDate.getDate()
  }
  return false
}

const S = { stroke: 'currentColor', fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }

const CheckIcon = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" {...S}>
    <path d="M1.5 4.5l2 2 4-4" />
  </svg>
)

const CloseIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" {...S}>
    <line x1="2" y1="2" x2="9" y2="9" />
    <line x1="9" y1="2" x2="2" y2="9" />
  </svg>
)

const EditIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" {...S}>
    <path d="M8 1.5l1.5 1.5-6 6-2 .5.5-2 6-6z" />
  </svg>
)

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" {...S}>
    <line x1="6" y1="1.5" x2="6" y2="10.5" />
    <line x1="1.5" y1="6" x2="10.5" y2="6" />
  </svg>
)

const NoteIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" {...S}>
    <rect x="1.5" y="1.5" width="9" height="9" rx="1" />
    <line x1="4" y1="5" x2="8" y2="5" />
    <line x1="4" y1="7" x2="7" y2="7" />
  </svg>
)

const BellIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.5 1.5v.5" />
    <path d="M8.5 7.5l.5 1H2l.5-1 .5-.5V5a3 3 0 016 0v2l.5.5z" />
    <circle cx="5.5" cy="9.5" r="0.5" />
  </svg>
)

const BellFilledIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.5 1.5v.5" />
    <path d="M8.5 7.5l.5 1H2l.5-1 .5-.5V5a3 3 0 016 0v2l.5.5z" />
    <circle cx="5.5" cy="9.5" r="0.5" />
  </svg>
)

export default function DailyAgenda({ onClose, autoOpen }) {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [category, setCategory] = useState('general')
  const [recurring, setRecurring] = useState('none')
  const [notificationTime, setNotificationTime] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const [newCount, setNewCount] = useState(0)

  const today = getToday()

  const loadReminders = useCallback(async () => {
    setLoading(true)
    try {
      const all = await db.reminders.toArray()
      const todayItems = all.filter(r => dayMatches(r, today))
      todayItems.sort((a, b) => {
        const pa = { high: 0, medium: 1, low: 2 }[a.priority] || 1
        const pb = { high: 0, medium: 1, low: 2 }[b.priority] || 1
        if (pa !== pb) return pa - pb
        return (b.createdAt || 0) - (a.createdAt || 0)
      })
      setReminders(todayItems)
      setNewCount(todayItems.filter(r => !r.completed).length)
    } catch {}
    setLoading(false)
  }, [today])

  useEffect(() => { loadReminders() }, [loadReminders])

  const toggleComplete = useCallback(async (reminder) => {
    await db.reminders.update(reminder.id, {
      completed: !reminder.completed,
      updatedAt: new Date().toISOString()
    })
    loadReminders()
  }, [loadReminders])

  const deleteReminder = useCallback(async (id) => {
    await db.reminders.delete(id)
    loadReminders()
  }, [loadReminders])

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return
    const now = new Date().toISOString()
    if (editingId) {
      await db.reminders.update(editingId, {
        title: title.trim(),
        priority,
        category,
        recurring,
        notificationTime: notificationTime || null,
        updatedAt: now
      })
    } else {
      await db.reminders.add({
        title: title.trim(),
        date: today,
        priority,
        category,
        recurring,
        notificationTime: notificationTime || null,
        completed: false,
        createdAt: now,
        updatedAt: now
      })
    }
    setTitle('')
    setPriority('medium')
    setCategory('general')
    setRecurring('none')
    setNotificationTime('')
    setEditingId(null)
    setShowForm(false)
    loadReminders()
  }, [title, priority, category, recurring, notificationTime, editingId, today, loadReminders])

  const startEdit = useCallback((r) => {
    setTitle(r.title)
    setPriority(r.priority || 'medium')
    setCategory(r.category || 'general')
    setRecurring(r.recurring || 'none')
    setNotificationTime(r.notificationTime || '')
    setEditingId(r.id)
    setShowForm(true)
  }, [])

  const cancelForm = useCallback(() => {
    setTitle('')
    setPriority('medium')
    setCategory('general')
    setRecurring('none')
    setNotificationTime('')
    setEditingId(null)
    setShowForm(false)
  }, [])

  const priorityColors = { high: '#ff3333', medium: '#ffaa33', low: '#66aaff' }
  const categoryLabels = {
    general: 'General', work: 'Work', study: 'Study',
    personal: 'Personal', health: 'Health', errands: 'Errands'
  }
  const categoryIcons = {
    general: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><rect x="1.5" y="1.5" width="9" height="9" rx="1"/><line x1="4" y1="5" x2="8" y2="5"/><line x1="4" y1="7" x2="7" y2="7"/></svg>,
    work: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><rect x="1" y="4.5" width="10" height="6.5" rx="1"/><path d="M4 4.5v-2a1 1 0 011-1h2a1 1 0 011 1v2"/></svg>,
    study: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M2 3.5l4-2 4 2v5.5l-4 2-4-2V3.5z"/><line x1="6" y1="1.5" x2="6" y2="8.5"/><path d="M2 5v4"/><path d="M10 5v4"/></svg>,
    personal: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><circle cx="6" cy="4.5" r="2.5"/><path d="M2 11c0-2.5 1.8-4 4-4s4 1.5 4 4"/></svg>,
    health: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M6 2v8M2 6h8"/><circle cx="6" cy="6" r="5"/></svg>,
    errands: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><circle cx="4" cy="10" r="1"/><circle cx="9" cy="10" r="1"/><path d="M2 2h1.5l1.5 6h5l1-3.5H6.5"/></svg>,
  }

  const completed = reminders.filter(r => r.completed).length
  const total = reminders.length

  if (loading) {
    return (
      <div className="agenda-v2 agenda-modal">
        <div className="agenda-loading">Loading agenda...</div>
      </div>
    )
  }

  return (
    <div className={`agenda-v2 agenda-modal ${collapsed ? 'agenda-collapsed' : ''}`}>
      <div className="agenda-header">
        <div className="agenda-header-left">
          <div className="agenda-greeting">{getGreeting()}</div>
          <div className="agenda-date">{getFormattedDate()}</div>
        </div>
        <div className="agenda-header-actions">
          <span className="agenda-count-badge">
            {newCount} {newCount === 1 ? 'task' : 'tasks'}
          </span>
          <button className="agenda-close-btn" onClick={onClose} title="Close agenda">
            <CloseIcon />
          </button>
        </div>
      </div>

      {autoOpen && (
        <div className="agenda-auto-hint">
          Your daily agenda — ready for the day ahead
        </div>
      )}

      {total > 0 && (
        <div className="agenda-progress-bar">
          <div
            className="agenda-progress-fill"
            style={{ width: `${Math.round((completed / total) * 100)}%` }}
          />
        </div>
      )}

      <div className="agenda-body">
        {total === 0 ? (
          <div className="agenda-empty">
            <div className="agenda-empty-icon">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#884444" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="18" cy="18" r="5" fill="#884444" fillOpacity="0.15"/>
                <line x1="18" y1="2" x2="18" y2="6"/>
                <line x1="18" y1="30" x2="18" y2="34"/>
                <line x1="2" y1="18" x2="6" y2="18"/>
                <line x1="30" y1="18" x2="34" y2="18"/>
                <line x1="7" y1="7" x2="10" y2="10"/>
                <line x1="26" y1="26" x2="29" y2="29"/>
                <line x1="7" y1="29" x2="10" y2="26"/>
                <line x1="26" y1="10" x2="29" y2="7"/>
              </svg>
            </div>
            <div className="agenda-empty-title">No tasks for today</div>
            <div className="agenda-empty-sub">Add a reminder to start your day</div>
          </div>
        ) : (
          <div className="agenda-list">
            {reminders.map(r => (
              <div
                key={r.id}
                className={`agenda-item ${r.completed ? 'done' : ''}`}
              >
                <button
                  className={`agenda-check ${r.completed ? 'checked' : ''}`}
                  onClick={() => toggleComplete(r)}
                  style={{ borderColor: r.completed ? 'var(--accent)' : priorityColors[r.priority] || '#884444' }}
                >
                  {r.completed && <CheckIcon />}
                </button>
                <div className="agenda-item-body">
                  <div className="agenda-item-title">
                    <span className="agenda-cat-icon">{categoryIcons[r.category] || <NoteIcon />}</span>
                    {r.title}
                  </div>
                  <div className="agenda-item-meta">
                    <span className="agenda-priority" style={{ color: priorityColors[r.priority] }}>
                      {r.priority}
                    </span>
                    <span className="agenda-category">{categoryLabels[r.category]}</span>
                    {r.recurring && r.recurring !== 'none' && (
                      <span className="agenda-recurring">{r.recurring}</span>
                    )}
                    {r.notificationTime && (
                      <span className="agenda-notify-time"><BellFilledIcon /> {r.notificationTime}</span>
                    )}
                  </div>
                </div>
                <div className="agenda-item-actions">
                  <button className="agenda-item-btn" onClick={() => startEdit(r)} title="Edit">
                    <EditIcon />
                  </button>
                  <button className="agenda-item-btn del" onClick={() => deleteReminder(r.id)} title="Delete">
                    <CloseIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > 0 && completed === total && (
          <div className="agenda-all-done">
            <div className="agenda-all-done-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#e60000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="9,1 11.5,6.5 17.5,7.5 13,12 14,18 9,15 4,18 5,12 0.5,7.5 6.5,6.5"/>
              </svg>
            </div>
            <div className="agenda-all-done-text">All tasks completed!</div>
          </div>
        )}
      </div>

      <div className="agenda-footer">
        {showForm ? (
          <div className="agenda-form">
            <div className="agenda-form-row">
              <input
                className="agenda-input"
                placeholder="What do you need to do?"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </div>
            <div className="agenda-form-row opts">
              <select className="agenda-select" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select className="agenda-select" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="general">General</option>
                <option value="work">Work</option>
                <option value="study">Study</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
                <option value="errands">Errands</option>
              </select>
              <select className="agenda-select" value={recurring} onChange={e => setRecurring(e.target.value)}>
                <option value="none">Once</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="agenda-notify-section">
              <div className="agenda-notify-header">
                <BellIcon />
                <span>Notify me</span>
                <button
                  className={'agenda-notify-toggle' + (notificationTime ? ' active' : '')}
                  onClick={() => setNotificationTime(notificationTime ? '' : '09:00')}
                >
                  {notificationTime ? 'ON' : 'OFF'}
                </button>
              </div>
              {notificationTime && (
                <div className="agenda-notify-picker">
                  <TimeWheelPicker
                    value={notificationTime}
                    onChange={setNotificationTime}
                  />
                </div>
              )}
            </div>
            <div className="agenda-form-actions">
              <button className="agenda-form-btn primary" onClick={handleSubmit}>
                {editingId ? 'Update' : 'Add'}
              </button>
              <button className="agenda-form-btn" onClick={cancelForm}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="agenda-add-btn" onClick={() => setShowForm(true)}>
            <PlusIcon /> Add Reminder
          </button>
        )}
      </div>
    </div>
  )
}
