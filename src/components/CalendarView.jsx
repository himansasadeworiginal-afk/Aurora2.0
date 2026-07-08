import { useState, useEffect, useCallback, useMemo } from 'react'
import db from '../data/db'
import './CalendarView.css'

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

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6)

const COLORS = ['#2DD4BF', '#56C6E8', '#52E3A4', '#8B7CF6', '#F59E0B']
const PRIORITY_COLORS = { high: '#F59E0B', medium: '#2DD4BF', low: '#8B7CF6' }
const CATEGORY_COLORS = { health: '#52E3A4', work: '#2DD4BF', study: '#56C6E8', personal: '#8B7CF6', other: '#9aa0a6' }

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

// A compact start–end label, or "All day".
function formatRange(ev) {
  if (ev.allDay) return 'All day'
  if (!ev.time) return ''
  return ev.endTime ? `${formatTime(ev.time)} – ${formatTime(ev.endTime)}` : formatTime(ev.time)
}

const PinIcon = () => (<svg width="9" height="9" viewBox="0 0 10 10" {...S}><path d="M5 9s3-2.7 3-5a3 3 0 10-6 0c0 2.3 3 5 3 5z" /><circle cx="5" cy="4" r="1" /></svg>)

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
  const [formEndTime, setFormEndTime] = useState('')
  const [formAllDay, setFormAllDay] = useState(false)
  const [formLocation, setFormLocation] = useState('')
  const [formColor, setFormColor] = useState(COLORS[0])
  const [formDesc, setFormDesc] = useState('')
  const [formCategory, setFormCategory] = useState('general')
  const [formRecurring, setFormRecurring] = useState('none')
  const [editingId, setEditingId] = useState(null)
  const [viewMode, setViewMode] = useState('month')
  const [hiddenCats, setHiddenCats] = useState(() => new Set())
  const [search, setSearch] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)

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

  useEffect(() => {
    const h = () => loadAll()
    window.addEventListener('aurora-data-changed', h)
    return () => window.removeEventListener('aurora-data-changed', h)
  }, [loadAll])

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
    setDetailOpen(true)
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
    setFormEndTime('')
    setFormAllDay(false)
    setFormLocation('')
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
    setFormEndTime(ev.endTime || '')
    setFormAllDay(!!ev.allDay)
    setFormLocation(ev.location || '')
    setFormColor(ev.color || COLORS[0])
    setFormDesc(ev.description || '')
    setFormCategory(ev.category || 'general')
    setFormRecurring(ev.recurring || 'none')
    setEditingId(ev.id)
    setShowForm(true)
  }, [])

  const handleSaveEvent = useCallback(async () => {
    if (!formTitle.trim()) return
    const payload = {
      title: formTitle.trim(),
      date: selectedDate,
      time: formAllDay ? null : (formTime.trim() || null),
      endTime: formAllDay ? null : (formEndTime.trim() || null),
      allDay: formAllDay,
      location: formLocation.trim() || null,
      color: formColor,
      description: formDesc.trim() || null,
      category: formCategory,
      recurring: formRecurring === 'none' ? null : formRecurring,
    }
    if (editingId) {
      await db.events.update(editingId, payload)
    } else {
      await db.events.add({ ...payload, createdAt: new Date().toISOString() })
    }
    resetForm()
    loadAll()
  }, [formTitle, formTime, formEndTime, formAllDay, formLocation, formColor, formDesc, formCategory, formRecurring, editingId, selectedDate, loadAll])

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
      const h = ev.allDay ? 6 : (ev.time ? parseInt(ev.time.split(':')[0]) : 12)
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
                      {(ev.allDay || ev.time) && <span className="cal-hour-time">{formatRange(ev)}</span>}
                      {ev.location && <span className="cal-hour-loc"><PinIcon /></span>}
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
    <div className="cal-mgrid">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
        <div key={d} className="cal-mgrid-head">{d}</div>
      ))}
      {cells.map(({ day, date, otherMonth }) => {
        const { events: evs, reminders: rems } = getItemsForDate(date)
        const vevs = evs.filter(e => !hiddenCats.has(e.category || 'general') && matchSearch(e.title))
        const vrems = rems.filter(r => matchSearch(r.title))
        const pills = [
          ...vevs.map(e => ({ id: 'e' + e.id, title: e.title, color: e.color || COLORS[0] })),
          ...vrems.map(r => ({ id: 'r' + r.id, title: r.title, color: PRIORITY_COLORS[r.priority] || COLORS[0], done: r.completed })),
        ]
        const isToday = date === today
        const isSelected = date === selectedDate
        return (
          <div
            key={date}
            className={'cal-mcell' + (otherMonth ? ' other' : '') + (isSelected ? ' selected' : '')}
            onClick={() => handleDayClick(date, otherMonth)}
          >
            <span className={'cal-mcell-num' + (isToday ? ' today' : '')}>{day}</span>
            {isToday && <span className="cal-mcell-today">Today</span>}
            <div className="cal-mcell-pills">
              {pills.slice(0, 3).map(p => (
                <div key={p.id} className={'cal-pill' + (p.done ? ' done' : '')}
                  style={{ color: p.color, background: `color-mix(in srgb, ${p.color} 16%, transparent)`, borderColor: `color-mix(in srgb, ${p.color} 30%, transparent)` }}>
                  {p.title}
                </div>
              ))}
              {pills.length > 3 && <div className="cal-pill cal-pill-more">+{pills.length - 3} more</div>}
            </div>
          </div>
        )
      })}
    </div>
  )

  const matchSearch = (t) => !search || (t || '').toLowerCase().includes(search.toLowerCase())

  // Category filters derived from the events actually present
  const catList = useMemo(() => {
    const map = new Map()
    for (const e of events) {
      const k = e.category || 'general'
      if (!map.has(k)) map.set(k, e.color || COLORS[0])
    }
    if (map.size === 0) {
      map.set('meeting', '#4cd7f6'); map.set('deadline', '#ddb7ff'); map.set('appointment', '#ffb690')
    }
    return [...map.entries()].map(([key, color]) => ({ key, color }))
  }, [events])

  const toggleCat = (key) => setHiddenCats(prev => {
    const n = new Set(prev)
    n.has(key) ? n.delete(key) : n.add(key)
    return n
  })

  const renderMiniCal = () => {
    const mDays = new Date(viewYear, viewMonth + 1, 0).getDate()
    const fDow = new Date(viewYear, viewMonth, 1).getDay()
    const blanks = Array.from({ length: fDow }, (_, i) => i)
    return (
      <div className="cal-mini">
        <div className="cal-mini-head">
          <span className="cal-mini-title">{monthLabel}</span>
          <div className="cal-mini-navs">
            <button onClick={prevMonth}><ChevronLeft /></button>
            <button onClick={nextMonth}><ChevronRight /></button>
          </div>
        </div>
        <div className="cal-mini-grid">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="cal-mini-dow">{d}</span>)}
          {blanks.map(b => <span key={'b' + b} />)}
          {Array.from({ length: mDays }, (_, i) => i + 1).map(d => {
            const ds = toDateStr(viewYear, viewMonth, d)
            const isT = ds === today
            const isSel = ds === selectedDate
            return (
              <button key={d} className={'cal-mini-day' + (isT ? ' today' : '') + (isSel ? ' sel' : '')} onClick={() => setSelectedDate(ds)}>{d}</button>
            )
          })}
        </div>
      </div>
    )
  }

  const renderNextUp = () => {
    const { events: evs, reminders: rems } = selectedItems
    const items = [
      ...evs.map(e => ({ id: 'e' + e.id, title: e.title, sub: formatRange(e) || 'Event', color: e.color || COLORS[0], done: false })),
      ...rems.map(r => ({ id: 'r' + r.id, title: r.title, sub: r.notificationTime || r.priority, color: PRIORITY_COLORS[r.priority] || COLORS[0], done: r.completed })),
    ]
    return (
      <div className="cal-nextup">
        <div className="cal-rail-cap">{selectedDate === today ? 'Next Up Today' : 'On This Day'}</div>
        {items.length === 0 ? (
          <div className="cal-nextup-empty">Nothing scheduled.</div>
        ) : (
          <div className="cal-nextup-list">
            {items.map(it => (
              <div key={it.id} className={'cal-nextup-item' + (it.done ? ' done' : '')} style={{ '--c': it.color }}>
                <p className="cal-nextup-title">{it.title}</p>
                <p className="cal-nextup-sub">{it.done ? 'Completed' : it.sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

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
              <button
                type="button"
                className={'cal-allday-toggle' + (formAllDay ? ' active' : '')}
                onClick={() => setFormAllDay(a => !a)}
              >
                {formAllDay ? '● All day' : '○ All day'}
              </button>
              <select className="cal-select" value={formCategory} onChange={e => setFormCategory(e.target.value)}>
                {CATEGORIES.map(c => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>
            {!formAllDay && (
              <div className="cal-form-row">
                <input className="cal-input cal-input-sm" aria-label="Start time" type="time" value={formTime} onChange={e => setFormTime(e.target.value)} />
                <span className="cal-time-dash">–</span>
                <input className="cal-input cal-input-sm" aria-label="End time" type="time" value={formEndTime} onChange={e => setFormEndTime(e.target.value)} />
              </div>
            )}
            <input className="cal-input" placeholder="Location (optional)" value={formLocation} onChange={e => setFormLocation(e.target.value)} />
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
                    {(ev.allDay || ev.time) && <span className="cal-event-time">{formatRange(ev)}</span>}
                    {ev.recurring && <RepeatIcon />}
                    {ev.category && ev.category !== 'general' && <span className="cal-event-category">{catLabel(ev.category)}</span>}
                  </div>
                  <span className="cal-event-title">{ev.title}</span>
                  {ev.location && <span className="cal-event-location"><PinIcon /> {ev.location}</span>}
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

  const openNewEvent = () => {
    setEditingId(null); setFormTitle(''); setFormTime(''); setFormEndTime('')
    setFormAllDay(false); setFormLocation(''); setFormColor(COLORS[0]); setFormDesc('')
    setFormCategory('general'); setFormRecurring('none'); setShowForm(true); setDetailOpen(true)
  }

  return (
    <div className="cal cal-v2">
      {/* Top bar */}
      <div className="cal-topbar">
        <div className="cal-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
          <input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {onClose && <button className="cal-icon-btn" onClick={onClose} title="Back to dashboard"><CloseIcon /></button>}
      </div>

      <div className="cal-body">
        {/* Left rail */}
        <aside className="cal-rail">
          {renderMiniCal()}
          <div className="cal-cats">
            <div className="cal-cats-head">
              <span className="cal-rail-cap">Categories</span>
              <button className="cal-cats-add" onClick={openNewEvent} title="New event"><PlusIcon /></button>
            </div>
            <div className="cal-cats-list">
              {catList.map(c => (
                <label key={c.key} className="cal-cat">
                  <input type="checkbox" checked={!hiddenCats.has(c.key)} onChange={() => toggleCat(c.key)} />
                  <span className="cal-cat-dot" style={{ background: c.color, boxShadow: `0 0 8px ${c.color}` }} />
                  <span className="cal-cat-name">{catLabel(c.key)}</span>
                </label>
              ))}
            </div>
          </div>
          {renderNextUp()}
        </aside>

        {/* Main canvas */}
        <main className="cal-canvas">
          <div className="cal-controls">
            <div className="cal-controls-left">
              <h2 className="cal-month-title">{monthLabel}</h2>
              <div className="cal-tabs">
                {['day', 'week', 'month', 'year'].map(m => (
                  <button key={m} className={'cal-tab' + (viewMode === m ? ' active' : '')} onClick={() => setViewMode(m)}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="cal-controls-right">
              <button className="cal-today-pill" onClick={goToday}>Today</button>
              <button className="cal-newevent" onClick={openNewEvent}>
                <PlusIcon /> New Event
              </button>
            </div>
          </div>

          <div className="cal-viewport">
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'year' && (
              <div className="cal-year">
                {Array.from({ length: 12 }, (_, m) => {
                  const count = events.filter(e => { const d = new Date(e.date + 'T00:00:00'); return d.getFullYear() === viewYear && d.getMonth() === m }).length
                  return (
                    <button key={m} className={'cal-year-cell' + (m === viewMonth ? ' active' : '')} onClick={() => { setViewMonth(m); setViewMode('month') }}>
                      <span className="cal-year-name">{new Date(viewYear, m).toLocaleDateString('en-US', { month: 'long' })}</span>
                      <span className="cal-year-count">{count} event{count === 1 ? '' : 's'}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Event form modal + day detail */}
      {detailOpen && (
        <div className="cal-detail-overlay" onClick={(e) => { if (e.target.classList.contains('cal-detail-overlay')) { setDetailOpen(false); setShowForm(false) } }}>
          <div className="cal-detail">
            <div className="cal-detail-head">
              <span className="cal-detail-date">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <button className="cal-icon-btn" onClick={() => { setDetailOpen(false); setShowForm(false) }}><CloseIcon /></button>
            </div>
            {renderSidebar()}
          </div>
        </div>
      )}
    </div>
  )
}
