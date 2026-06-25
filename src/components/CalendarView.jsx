import { useState, useEffect, useCallback, useMemo } from 'react'
import db from '../data/db'

const S = { stroke: 'currentColor', fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }

const CloseIcon = () => (<svg width="11" height="11" viewBox="0 0 11 11" {...S}><line x1="2" y1="2" x2="9" y2="9" /><line x1="9" y1="2" x2="2" y2="9" /></svg>)
const ChevronLeft = () => (<svg width="10" height="10" viewBox="0 0 10 10" {...S}><path d="M6.5 2l-3 3 3 3" /></svg>)
const ChevronRight = () => (<svg width="10" height="10" viewBox="0 0 10 10" {...S}><path d="M3.5 2l3 3-3 3" /></svg>)
const PlusIcon = () => (<svg width="12" height="12" viewBox="0 0 12 12" {...S}><line x1="6" y1="1.5" x2="6" y2="10.5" /><line x1="1.5" y1="6" x2="10.5" y2="6" /></svg>)
const EditIcon = () => (<svg width="11" height="11" viewBox="0 0 11 11" {...S}><path d="M8 1.5l1.5 1.5-6 6-2 .5.5-2 6-6z" /></svg>)
const CheckIcon = () => (<svg width="9" height="9" viewBox="0 0 9 9" {...S}><path d="M1.5 4.5l2 2 4-4" /></svg>)
const RepeatIcon = () => (<svg width="10" height="10" viewBox="0 0 10 10" {...S}><path d="M1 5c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" /><polyline points="7,5 5,3 3,5" /></svg>)

function toDateStr(year, month, day) {
  if (month < 0) { month = 11; year-- }
  if (month > 11) { month = 0; year++ }
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function todayStr() {
  const d = new Date()
  return toDateStr(d.getFullYear(), d.getMonth(), d.getDate())
}

function dayMatches(dateStr, reminder) {
  if (!reminder.recurring || reminder.recurring === 'none') {
    return reminder.date === dateStr
  }
  const d = new Date(dateStr + 'T00:00:00')
  const dow = d.getDay()
  const dayOfMonth = d.getDate()
  const reminderDate = new Date(reminder.date + 'T00:00:00')
  if (reminder.recurring === 'daily') return true
  if (reminder.recurring === 'weekdays') return dow >= 1 && dow <= 5
  if (reminder.recurring === 'weekends') return dow === 0 || dow === 6
  if (reminder.recurring === 'weekly') return dow === reminderDate.getDay()
  if (reminder.recurring === 'monthly') return dayOfMonth === reminderDate.getDate()
  return false
}

function eventMatchesDate(dateStr, event) {
  if (!event.recurring || event.recurring === 'none') {
    return event.date === dateStr
  }
  const d = new Date(dateStr + 'T00:00:00')
  const dow = d.getDay()
  const dayOfMonth = d.getDate()
  const evDate = new Date(event.date + 'T00:00:00')
  if (event.recurring === 'daily') return true
  if (event.recurring === 'weekly') return dow === evDate.getDay()
  if (event.recurring === 'monthly') return dayOfMonth === evDate.getDate()
  if (event.recurring === 'yearly') return d.getMonth() === evDate.getMonth() && d.getDate() === evDate.getDate()
  return false
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6)

const COLORS = ['#e60000', '#4488ff', '#66cc88', '#ffaa33', '#cc44cc']
const PRIORITY_COLORS = { high: '#ff3333', medium: '#ffaa33', low: '#66aaff' }
const CATEGORY_COLORS = { health: '#88cc44', work: '#4488ff', study: '#ffaa33', personal: '#cc44cc', other: '#888888' }

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'holiday', label: 'Holiday' },
]

function getWeekRange(year, month, day) {
  const d = new Date(year, month, day)
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { start: mon, end: sun }
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function CalendarView({ onClose }) {
  const today = todayStr()
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(today)
  const [events, setEvents] = useState([])
  const [reminders, setReminders] = useState([])
  const [trackers, setTrackers] = useState([])
  const [trackerLogs, setTrackerLogs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formColor, setFormColor] = useState(COLORS[0])
  const [formDesc, setFormDesc] = useState('')
  const [formCategory, setFormCategory] = useState('general')
  const [formRecurring, setFormRecurring] = useState('none')
  const [editingId, setEditingId] = useState(null)
  const [viewMode, setViewMode] = useState('month')

  const loadAll = useCallback(async () => {
    const [evs, rems, trs, logs] = await Promise.all([
      db.events.toArray(),
      db.reminders.toArray(),
      db.trackers.toArray(),
      db.trackerLogs.toArray(),
    ])
    setEvents(evs)
    setReminders(rems)
    setTrackers(trs)
    setTrackerLogs(logs)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }
  const goToday = () => {
    const d = new Date()
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
    setSelectedDate(todayStr())
  }

  const prevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() - 1)
    const s = toDateStr(d.getFullYear(), d.getMonth(), d.getDate())
    setSelectedDate(s)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }
  const nextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    const s = toDateStr(d.getFullYear(), d.getMonth(), d.getDate())
    setSelectedDate(s)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDow = new Date(viewYear, viewMonth, 1).getDay()
  const startOffset = firstDow === 0 ? 6 : firstDow - 1
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate()

  const cells = useMemo(() => {
    const r = []
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrev - i
      r.push({ day: d, date: toDateStr(viewYear, viewMonth - 1, d), otherMonth: true })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      r.push({ day: d, date: toDateStr(viewYear, viewMonth, d), otherMonth: false })
    }
    const rem = 42 - r.length
    for (let d = 1; d <= rem; d++) {
      r.push({ day: d, date: toDateStr(viewYear, viewMonth + 1, d), otherMonth: true })
    }
    return r
  }, [viewYear, viewMonth, startOffset, daysInPrev, daysInMonth])

  const weekRange = useMemo(() => {
    if (viewMode !== 'week') return null
    const sel = new Date(selectedDate + 'T00:00:00')
    return getWeekRange(sel.getFullYear(), sel.getMonth(), sel.getDate())
  }, [viewMode, selectedDate])

  const weekCells = useMemo(() => {
    if (!weekRange) return []
    const r = []
    const d = new Date(weekRange.start)
    while (d <= weekRange.end) {
      r.push({ day: d.getDate(), date: toDateStr(d.getFullYear(), d.getMonth(), d.getDate()), otherMonth: d.getMonth() !== viewMonth })
      d.setDate(d.getDate() + 1)
    }
    return r
  }, [weekRange, viewMonth])

  const getItemsForDate = useCallback((dateStr) => {
    const evs = events.filter(e => eventMatchesDate(dateStr, e))
    const rems = reminders.filter(r => dayMatches(dateStr, r))
    const trs = trackers.map(t => {
      const done = trackerLogs.some(l => l.trackerId === t.id && l.date === dateStr)
      return { ...t, done, type: 'tracker' }
    })
    return { events: evs, reminders: rems, trackers: trs }
  }, [events, reminders, trackers, trackerLogs])

  const selectedItems = useMemo(() => {
    return getItemsForDate(selectedDate)
  }, [getItemsForDate, selectedDate])

  const handleDayClick = (date, otherMonth) => {
    setSelectedDate(date)
    setShowForm(false)
    setEditingId(null)
    if (otherMonth) {
      const parts = date.split('-').map(Number)
      setViewYear(parts[0])
      setViewMonth(parts[1] - 1)
    }
  }

  const toggleReminder = useCallback(async (reminder) => {
    await db.reminders.update(reminder.id, {
      completed: !reminder.completed,
      updatedAt: new Date().toISOString()
    })
    loadAll()
  }, [loadAll])

  const deleteReminder = useCallback(async (id) => {
    await db.reminders.delete(id)
    loadAll()
  }, [loadAll])

  const toggleTracker = useCallback(async (tracker, dateStr) => {
    const existing = trackerLogs.find(l => l.trackerId === tracker.id && l.date === dateStr)
    if (existing) {
      await db.trackerLogs.delete(existing.id)
    } else {
      await db.trackerLogs.add({
        trackerId: tracker.id,
        date: dateStr,
        note: '',
        createdAt: new Date().toISOString()
      })
    }
    loadAll()
  }, [trackerLogs, loadAll])

  const resetForm = () => {
    setFormTitle('')
    setFormTime('')
    setFormColor(COLORS[0])
    setFormDesc('')
    setFormCategory('general')
    setFormRecurring('none')
    setEditingId(null)
    setShowForm(s => !s)
  }

  const startEdit = useCallback((ev) => {
    setFormTitle(ev.title)
    setFormTime(ev.time || '')
    setFormColor(ev.color || COLORS[0])
    setFormDesc(ev.description || '')
    setFormCategory(ev.category || 'general')
    setFormRecurring(ev.recurring || 'none')
    setEditingId(ev.id)
    setShowForm(true)
  }, [])

  const handleSaveEvent = useCallback(async () => {
    if (!formTitle.trim()) return
    if (editingId) {
      await db.events.update(editingId, {
        title: formTitle.trim(),
        date: selectedDate,
        time: formTime.trim() || null,
        color: formColor,
        description: formDesc.trim() || null,
        category: formCategory,
        recurring: formRecurring === 'none' ? null : formRecurring,
      })
    } else {
      await db.events.add({
        title: formTitle.trim(),
        date: selectedDate,
        time: formTime.trim() || null,
        color: formColor,
        description: formDesc.trim() || null,
        category: formCategory,
        recurring: formRecurring === 'none' ? null : formRecurring,
        createdAt: new Date().toISOString(),
      })
    }
    resetForm()
    loadAll()
  }, [formTitle, formTime, formColor, formDesc, formCategory, formRecurring, editingId, selectedDate, loadAll])

  const deleteEvent = useCallback(async (id) => {
    await db.events.delete(id)
    loadAll()
  }, [loadAll])

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const renderDayView = () => {
    const { events: evs, reminders: rems, trackers: trs } = selectedItems
    const hourly = {}
    for (let h = 0; h < 24; h++) {
      hourly[h] = { events: [], reminders: [], trackers: [] }
    }
    for (const ev of evs) {
      const h = ev.time ? parseInt(ev.time.split(':')[0]) : 12
      if (!hourly[h]) hourly[h] = { events: [], reminders: [], trackers: [] }
      hourly[h].events.push(ev)
    }
    for (const r of rems) {
      const h = r.notificationTime ? parseInt(r.notificationTime.split(':')[0]) : 8
      if (!hourly[h]) hourly[h] = { events: [], reminders: [], trackers: [] }
      hourly[h].reminders.push(r)
    }
    for (const t of trs) {
      hourly[7].trackers.push(t)
    }

    return (
      <div className="cal-day-view">
        <div className="cal-day-nav">
          <button className="cal-nav-btn" onClick={prevDay}><ChevronLeft /></button>
          <span className="cal-day-nav-title">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <button className="cal-nav-btn" onClick={nextDay}><ChevronRight /></button>
          <button className="cal-today-btn" onClick={goToday}>Today</button>
        </div>
        <div className="cal-day-timeline">
          {HOURS.map(h => {
            const slot = hourly[h] || { events: [], reminders: [], trackers: [] }
            const isEmpty = slot.events.length === 0 && slot.reminders.length === 0 && slot.trackers.length === 0
            const label = h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`
            return (
              <div key={h} className={'cal-hour-row' + (isEmpty ? ' empty' : '')}>
                <div className="cal-hour-label">{label}</div>
                <div className="cal-hour-content">
                  {slot.trackers.map(t => (
                    <div key={'t-' + t.id} className="cal-hour-item cal-hour-tracker" style={{ borderLeftColor: CATEGORY_COLORS[t.category] || '#888' }}>
                      <button
                        className={'cal-hour-check' + (t.done ? ' done' : '')}
                        onClick={() => toggleTracker(t, selectedDate)}
                      >
                        {t.done && <CheckIcon />}
                      </button>
                      <span className={'cal-hour-item-title' + (t.done ? ' done-text' : '')}>{t.name}</span>
                      <span className="cal-hour-item-type">habit</span>
                    </div>
                  ))}
                  {slot.reminders.map(r => (
                    <div key={'r-' + r.id} className={'cal-hour-item cal-hour-reminder' + (r.completed ? ' done' : '')} style={{ borderLeftColor: PRIORITY_COLORS[r.priority] || '#884444' }}>
                      <button
                        className={'cal-hour-check' + (r.completed ? ' done' : '')}
                        onClick={() => toggleReminder(r)}
                      >
                        {r.completed && <CheckIcon />}
                      </button>
                      <span className={'cal-hour-item-title' + (r.completed ? ' done-text' : '')}>{r.title}</span>
                      <span className="cal-hour-item-type">{r.priority}</span>
                      {r.recurring && r.recurring !== 'none' && <RepeatIcon />}
                    </div>
                  ))}
                  {slot.events.map(ev => (
                    <div key={'e-' + ev.id} className="cal-hour-item cal-hour-event" style={{ borderLeftColor: ev.color || COLORS[0] }}>
                      <span className="cal-hour-item-title">{ev.title}</span>
                      {ev.time && <span className="cal-hour-time">{formatTime(ev.time)}</span>}
                      {ev.recurring && <RepeatIcon />}
                    </div>
                  ))}
                  {isEmpty && <span className="cal-hour-empty">—</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderWeekView = () => (
    <div className="cal-week-grid">
      {weekCells.map(({ day, date, otherMonth }) => {
        const { events: evs, reminders: rems, trackers: trs } = getItemsForDate(date)
        const allCount = evs.length + rems.filter(r => !r.completed).length + trs.filter(t => !t.done).length
        const completedCount = rems.filter(r => r.completed).length + trs.filter(t => t.done).length
        const isToday = date === today
        const isSelected = date === selectedDate
        return (
          <div
            key={date}
            className={'cal-week-day' + (isToday ? ' today' : '') + (isSelected ? ' selected' : '') + (otherMonth ? ' other-month' : '')}
            onClick={() => handleDayClick(date, otherMonth)}
          >
            <div className="cal-week-day-header">
              <span className="cal-week-day-name">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <span className="cal-week-day-num">{day}</span>
            </div>
            <div className="cal-week-events">
              {trs.filter(t => !t.done).slice(0, 2).map(t => (
                <div key={'t-' + t.id} className="cal-week-event habit" style={{ borderLeftColor: CATEGORY_COLORS[t.category] || '#888' }}>
                  <span className="cal-week-event-title">{t.name}</span>
                </div>
              ))}
              {rems.filter(r => !r.completed).slice(0, 3).map(r => (
                <div key={'r-' + r.id} className="cal-week-event task" style={{ borderLeftColor: PRIORITY_COLORS[r.priority] || '#884444' }}>
                  <span className="cal-week-event-title">{r.title}</span>
                </div>
              ))}
              {evs.slice(0, 3).map(ev => (
                <div key={'e-' + ev.id} className="cal-week-event" style={{ borderLeftColor: ev.color || COLORS[0] }}>
                  {ev.time && <span className="cal-week-event-time">{ev.time}</span>}
                  <span className="cal-week-event-title">{ev.title}</span>
                </div>
              ))}
            </div>
            {allCount > 0 && <div className="cal-week-count">{allCount} left · {completedCount} done</div>}
          </div>
        )
      })}
    </div>
  )

  const renderMonthView = () => (
    <div className="cal-grid">
      {WEEKDAYS.map(d => (<div key={d} className="cal-weekday">{d}</div>))}
      {cells.map(({ day, date, otherMonth }) => {
        const { events: evs, reminders: rems, trackers: trs } = getItemsForDate(date)
        const allCount = evs.length + rems.length + trs.length
        const isToday = date === today
        const isSelected = date === selectedDate
        return (
          <div
            key={date}
            className={'cal-day' + (isToday ? ' today' : '') + (isSelected ? ' selected' : '') + (allCount > 0 ? ' has-events' : '') + (otherMonth ? ' other-month' : '')}
            onClick={() => handleDayClick(date, otherMonth)}
          >
            <span className="cal-day-num">{day}</span>
            {allCount > 0 && (
              <div className="cal-day-dots">
                {trs.filter(t => !t.done).slice(0, 1).map(t => (
                  <span key={'t-' + t.id} className="cal-day-dot tracker" style={{ backgroundColor: CATEGORY_COLORS[t.category] || '#888' }} />
                ))}
                {rems.filter(r => !r.completed).slice(0, 1).map(r => (
                  <span key={'r-' + r.id} className="cal-day-dot task" style={{ backgroundColor: PRIORITY_COLORS[r.priority] || '#884444' }} />
                ))}
                {evs.slice(0, 2).map(ev => (
                  <span key={'e-' + ev.id} className="cal-day-dot" style={{ backgroundColor: ev.color || COLORS[0] }} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  const catLabel = (v) => {
    const c = CATEGORIES.find(c => c.value === v)
    return c ? c.label : v || 'General'
  }

  const renderSidebar = () => {
    const { events: evs, reminders: rems, trackers: trs } = selectedItems
    return (
      <div className="cal-sidebar">
        <div className="cal-events-header">
          <span className="cal-sidebar-date">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button className="cal-add-btn" onClick={resetForm} title="Add event"><PlusIcon /></button>
        </div>

        {showForm && (
          <div className="cal-form">
            <input className="cal-input" placeholder="Event title" value={formTitle} onChange={e => setFormTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveEvent()} autoFocus />
            <div className="cal-form-row">
              <input className="cal-input cal-input-sm" placeholder="Time" type="time" value={formTime} onChange={e => setFormTime(e.target.value)} />
              <select className="cal-select" value={formCategory} onChange={e => setFormCategory(e.target.value)}>
                {CATEGORIES.map(c => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>
            <div className="cal-form-row">
              <div className="cal-color-picker">
                {COLORS.map(c => (<span key={c} className={'cal-color-opt' + (formColor === c ? ' active' : '')} style={{ backgroundColor: c }} onClick={() => setFormColor(c)} />))}
              </div>
              <select className="cal-select cal-select-sm" value={formRecurring} onChange={e => setFormRecurring(e.target.value)}>
                <option value="none">No repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <textarea className="cal-input" placeholder="Description (optional)" value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} />
            <div className="cal-form-actions">
              <button className="cal-save-btn" onClick={handleSaveEvent}>{editingId ? 'Update' : 'Save'}</button>
              <button className="cal-cancel-btn" onClick={resetForm}>Cancel</button>
            </div>
          </div>
        )}

        {trs.length > 0 && (
          <div className="cal-section">
            <div className="cal-section-title">Habits</div>
            {trs.map(t => (
              <div key={'t-' + t.id} className="cal-event-item" style={{ borderLeftColor: CATEGORY_COLORS[t.category] || '#888' }}>
                <span className="cal-event-color" style={{ backgroundColor: CATEGORY_COLORS[t.category] || '#888' }} />
                <div className="cal-event-info">
                  <div className="cal-event-info-top">
                    <span className="cal-event-category">{t.category}</span>
                    {t.done && <span className="cal-event-done-badge">Done</span>}
                  </div>
                  <span className={'cal-event-title' + (t.done ? ' done-text' : '')}>{t.name}</span>
                </div>
                <button className={'cal-check-btn' + (t.done ? ' done' : '')} onClick={() => toggleTracker(t, selectedDate)} title={t.done ? 'Undo' : 'Mark done'}>
                  {t.done ? <CheckIcon /> : <span className="cal-check-empty" />}
                </button>
              </div>
            ))}
          </div>
        )}

        {rems.length > 0 && (
          <div className="cal-section">
            <div className="cal-section-title">Tasks</div>
            {rems.map(r => (
              <div key={'r-' + r.id} className={'cal-event-item' + (r.completed ? ' done' : '')} style={{ borderLeftColor: PRIORITY_COLORS[r.priority] || '#884444' }}>
                <span className="cal-event-color" style={{ backgroundColor: PRIORITY_COLORS[r.priority] || '#884444' }} />
                <div className="cal-event-info">
                  <div className="cal-event-info-top">
                    <span className="cal-event-priority" style={{ color: PRIORITY_COLORS[r.priority] }}>{r.priority}</span>
                    {r.category && r.category !== 'general' && <span className="cal-event-category">{r.category}</span>}
                    {r.recurring && r.recurring !== 'none' && <RepeatIcon />}
                    {r.notificationTime && <span className="cal-event-time">{r.notificationTime}</span>}
                  </div>
                  <span className={'cal-event-title' + (r.completed ? ' done-text' : '')}>{r.title}</span>
                </div>
                <div className="cal-event-actions">
                  <button className={'cal-check-btn' + (r.completed ? ' done' : '')} onClick={() => toggleReminder(r)} title={r.completed ? 'Undo' : 'Complete'}>
                    {r.completed ? <CheckIcon /> : <span className="cal-check-empty" />}
                  </button>
                  <button className="cal-event-del" onClick={() => deleteReminder(r.id)} title="Delete"><CloseIcon /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {evs.length > 0 && (
          <div className="cal-section">
            <div className="cal-section-title">Events</div>
            {evs.map(ev => (
              <div key={'e-' + ev.id} className="cal-event-item" style={{ borderLeftColor: ev.color || COLORS[0] }}>
                <span className="cal-event-color" style={{ backgroundColor: ev.color || COLORS[0] }} />
                <div className="cal-event-info">
                  <div className="cal-event-info-top">
                    {ev.time && <span className="cal-event-time">{formatTime(ev.time)}</span>}
                    {ev.recurring && <RepeatIcon />}
                    {ev.category && ev.category !== 'general' && <span className="cal-event-category">{catLabel(ev.category)}</span>}
                  </div>
                  <span className="cal-event-title">{ev.title}</span>
                  {ev.description && <span className="cal-event-desc">{ev.description.slice(0, 60)}{ev.description.length > 60 ? '...' : ''}</span>}
                </div>
                <div className="cal-event-actions">
                  <button className="cal-event-edit" onClick={() => startEdit(ev)} title="Edit"><EditIcon /></button>
                  <button className="cal-event-del" onClick={() => deleteEvent(ev.id)} title="Delete"><CloseIcon /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {trs.length === 0 && rems.length === 0 && evs.length === 0 && !showForm && (
          <div className="cal-empty">
            {selectedDate === today ? 'No items for today' : 'No items for this day'}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="calendar-section">
      {onClose && (
        <button className="cal-close-btn" onClick={onClose} title="Close"><CloseIcon /></button>
      )}
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft /></button>
        <span className="cal-nav-title">{monthLabel}</span>
        <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight /></button>
        <button className="cal-today-btn" onClick={goToday}>Today</button>
      </div>

      <div className="cal-toolbar">
        <div className="cal-view-toggle">
          <button className={'cal-view-btn' + (viewMode === 'day' ? ' active' : '')} onClick={() => setViewMode('day')} title="Day view">Day</button>
          <button className={'cal-view-btn' + (viewMode === 'week' ? ' active' : '')} onClick={() => setViewMode('week')} title="Week view">Week</button>
          <button className={'cal-view-btn' + (viewMode === 'month' ? ' active' : '')} onClick={() => setViewMode('month')} title="Month view">Month</button>
        </div>
      </div>

      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}

      {renderSidebar()}
    </div>
  )
}
