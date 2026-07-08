import { useState, useEffect, useCallback, useRef } from 'react'
import db from '../data/db'
import './DailyAgenda.css'

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function dayMatches(reminder, today) {
  if (!reminder.recurring || reminder.recurring === 'none') return reminder.date === today
  const todayDate = new Date(today + 'T00:00:00')
  const todayDow = todayDate.getDay()
  const reminderDate = new Date(reminder.date + 'T00:00:00')
  if (reminder.recurring === 'daily') return true
  if (reminder.recurring === 'weekdays') return todayDow >= 1 && todayDow <= 5
  if (reminder.recurring === 'weekends') return todayDow === 0 || todayDow === 6
  if (reminder.recurring === 'weekly') return todayDow === reminderDate.getDay()
  if (reminder.recurring === 'monthly') return todayDate.getDate() === reminderDate.getDate()
  return false
}

// ---- Inline icons (no icon font — offline) --------------------------------
const Ico = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>,
  gear: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7.7 1.6 1.6 0 01-3.2 0 1.6 1.6 0 00-2.7-.7l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H4a2 2 0 010-4h.1A1.6 1.6 0 005.6 8a1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H12a1.6 1.6 0 001-1.5V2a2 2 0 014 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V12a1.6 1.6 0 001.5 1h.1a2 2 0 010 4h-.1a1.6 1.6 0 00-1.5 1z"/></svg>,
  bolt: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13z"/></svg>,
  addCircle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8.5" x2="12" y2="15.5"/><line x1="8.5" y1="12" x2="15.5" y2="12"/></svg>,
  label: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 012-2h9l6 7-6 7H5a2 2 0 01-2-2z"/><circle cx="8" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>,
  flag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-11"/></svg>,
  category: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  more: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"/><path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13"/></svg>,
  timer: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 13V9"/><path d="M9 2h6"/></svg>,
  play: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>,
  pause: <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 108-8"/><path d="M4 4v5h5"/></svg>,
  doneAll: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 13l3.5 3.5L13 8"/><path d="M9 16.5L11 18l8-9"/></svg>,
}

const PRIORITY = {
  high:   { label: 'High',   color: '#ddb7ff' },
  medium: { label: 'Medium', color: '#4cd7f6' },
  low:    { label: 'Low',    color: '#ffb690' },
}
const PRIORITY_CYCLE = ['medium', 'high', 'low']
const CATEGORIES = ['General', 'Work', 'Development', 'Personal', 'Health', 'Meetings']
const FILTERS = ['All Tasks', 'High Priority', 'Development', 'Personal']

function fmtCountdown(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function DailyAgenda({ onClose }) {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [draftPriority, setDraftPriority] = useState('medium')
  const [draftCat, setDraftCat] = useState('General')
  const [draftTime, setDraftTime] = useState('')
  const [showTime, setShowTime] = useState(false)
  const [filter, setFilter] = useState('All Tasks')
  const [search, setSearch] = useState('')

  // Deep Focus timer (self-contained Pomodoro)
  const [secs, setSecs] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const tickRef = useRef(null)

  const today = getToday()

  const load = useCallback(async () => {
    try {
      const all = await db.reminders.toArray()
      const items = all.filter(r => dayMatches(r, today))
      items.sort((a, b) => {
        const p = { high: 0, medium: 1, low: 2 }
        const pa = p[a.priority] ?? 1, pb = p[b.priority] ?? 1
        if (pa !== pb) return pa - pb
        return (b.createdAt || 0) - (a.createdAt || 0)
      })
      setReminders(items)
    } catch {}
    setLoading(false)
  }, [today])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const h = () => load()
    window.addEventListener('aurora-data-changed', h)
    return () => window.removeEventListener('aurora-data-changed', h)
  }, [load])

  // Timer loop
  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) { setRunning(false); return 0 }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(tickRef.current)
  }, [running])

  const addTask = useCallback(async () => {
    const t = draft.trim()
    if (!t) return
    const now = new Date().toISOString()
    await db.reminders.add({
      title: t,
      date: today,
      priority: draftPriority,
      category: draftCat.toLowerCase(),
      recurring: 'none',
      notificationTime: draftTime || null,
      alarm: false,
      completed: false,
      createdAt: now,
      updatedAt: now,
    })
    setDraft(''); setDraftTime(''); setShowTime(false); setDraftPriority('medium'); setDraftCat('General')
    load()
  }, [draft, draftPriority, draftCat, draftTime, today, load])

  const toggle = useCallback(async (r) => {
    await db.reminders.update(r.id, { completed: !r.completed, updatedAt: new Date().toISOString() })
    load()
  }, [load])

  const remove = useCallback(async (id) => { await db.reminders.delete(id); load() }, [load])

  const cyclePriority = () => setDraftPriority(p => PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(p) + 1) % PRIORITY_CYCLE.length])
  const cycleCat = () => setDraftCat(c => CATEGORIES[(CATEGORIES.indexOf(c) + 1) % CATEGORIES.length])

  const total = reminders.length
  const done = reminders.filter(r => r.completed).length
  const remaining = total - done
  const pct = total ? Math.round((done / total) * 100) : 0

  const visible = reminders.filter(r => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'High Priority') return r.priority === 'high'
    if (filter === 'Development') return (r.category || '') === 'development'
    if (filter === 'Personal') return (r.category || '') === 'personal'
    return true
  })

  const schedule = reminders
    .filter(r => r.notificationTime)
    .sort((a, b) => (a.notificationTime || '').localeCompare(b.notificationTime || ''))
  const nowHM = new Date().toTimeString().slice(0, 5)
  const currentIdx = schedule.findIndex(r => (r.notificationTime || '') >= nowHM)

  return (
    <div className="ag">
      {/* Top bar */}
      <div className="ag-topbar">
        <div className="ag-search">
          <span className="ag-search-ico">{Ico.search}</span>
          <input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="ag-topbar-actions">
          <button className="ag-icon-btn ag-has-dot" title="Notifications">{Ico.bell}</button>
          <button className="ag-icon-btn" title="Settings">{Ico.gear}</button>
          <button className="ag-icon-btn ag-close" onClick={onClose} title="Back to dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div className="ag-main">
        {/* Header */}
        <header className="ag-header">
          <div>
            <h1 className="ag-title">Daily Agenda</h1>
            <p className="ag-subtitle">
              <span className="ag-sub-ico">{Ico.category}</span>
              {getFormattedDate()} — <span className="ag-sub-accent">{remaining} {remaining === 1 ? 'task' : 'tasks'} remaining</span>
            </p>
          </div>
          <div className="ag-header-right">
            <div className="ag-progress">
              <span className="ag-progress-bolt">{Ico.bolt}</span>
              <div className="ag-progress-mid">
                <span className="ag-progress-cap">Progress</span>
                <div className="ag-progress-track"><span style={{ width: `${pct}%` }} /></div>
              </div>
              <span className="ag-progress-pct">{pct}%</span>
            </div>
            <button className="ag-newtask" onClick={() => document.getElementById('ag-quick-input')?.focus()}>New Task</button>
          </div>
        </header>

        {/* Bento */}
        <div className="ag-grid">
          <div className="ag-col-left">
            {/* Quick entry */}
            <div className="ag-quick">
              <button className="ag-quick-add" onClick={addTask} title="Add task">{Ico.addCircle}</button>
              <input
                id="ag-quick-input"
                className="ag-quick-input"
                placeholder="I want to achieve..."
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
              />
              <div className="ag-quick-tools">
                <button
                  className={'ag-quick-tool' + (draftCat !== 'General' ? ' on' : '')}
                  onClick={cycleCat}
                  title={`Category: ${draftCat}`}
                >{Ico.label}</button>
                <button
                  className={'ag-quick-tool' + (showTime || draftTime ? ' on' : '')}
                  onClick={() => setShowTime(v => !v)}
                  title="Set a time"
                >{Ico.clock}</button>
                <button
                  className="ag-quick-tool ag-quick-flag"
                  onClick={cyclePriority}
                  style={{ color: PRIORITY[draftPriority].color }}
                  title={`Priority: ${PRIORITY[draftPriority].label}`}
                >{Ico.flag}</button>
              </div>
            </div>
            {showTime && (
              <div className="ag-timerow">
                <span>Remind at</span>
                <input type="time" value={draftTime} onChange={e => setDraftTime(e.target.value)} />
                <span className="ag-timerow-cat">· {draftCat} · <b style={{ color: PRIORITY[draftPriority].color }}>{PRIORITY[draftPriority].label}</b></span>
              </div>
            )}

            {/* Filters */}
            <div className="ag-filters">
              {FILTERS.map(f => (
                <button key={f} className={'ag-filter' + (filter === f ? ' active' : '')} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>

            {/* Task list */}
            <div className="ag-tasks">
              {loading ? (
                <div className="ag-empty">Loading…</div>
              ) : visible.length === 0 ? (
                <div className="ag-empty">
                  <div className="ag-empty-title">{total === 0 ? 'No tasks for today' : 'Nothing matches this filter'}</div>
                  <div className="ag-empty-sub">Type above and hit Enter to add your first task</div>
                </div>
              ) : visible.map(r => {
                const p = PRIORITY[r.priority] || PRIORITY.medium
                return (
                  <div key={r.id} className={'ag-task' + (r.completed ? ' done' : '')} style={{ '--pcolor': p.color }}>
                    <div className="ag-task-main">
                      <button className={'ag-check' + (r.completed ? ' checked' : '')} onClick={() => toggle(r)}>
                        {r.completed && Ico.check}
                      </button>
                      <div className="ag-task-body">
                        <h4 className="ag-task-title">{r.title}</h4>
                        <div className="ag-task-meta">
                          {r.completed ? (
                            <span className="ag-badge ag-badge-done">Done</span>
                          ) : (
                            <span className="ag-badge" style={{ color: p.color, background: `color-mix(in srgb, ${p.color} 14%, transparent)` }}>{p.label}</span>
                          )}
                          {r.category && !r.completed && (
                            <span className="ag-task-cat"><span className="ag-task-cat-ico">{Ico.category}</span>{r.category.charAt(0).toUpperCase() + r.category.slice(1)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ag-task-right">
                      {r.notificationTime && <span className="ag-task-time">{r.notificationTime}</span>}
                      {r.completed
                        ? <span className="ag-task-doneall">{Ico.doneAll}</span>
                        : (
                          <div className="ag-task-actions">
                            <button className="ag-task-act" title="Focus 25 min" onClick={() => { setSecs(25 * 60); setRunning(true) }}>{Ico.timer}</button>
                            <button className="ag-task-act ag-task-del" title="Delete" onClick={() => remove(r.id)}>{Ico.trash}</button>
                          </div>
                        )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right column */}
          <div className="ag-col-right">
            {/* Deep Focus */}
            <div className="ag-focus">
              <div className="ag-focus-timerico">{Ico.timer}</div>
              <h3 className="ag-focus-cap">Deep Focus</h3>
              <div className="ag-focus-clock">{fmtCountdown(secs)}</div>
              <div className="ag-focus-btns">
                <button className="ag-focus-play" onClick={() => { if (secs === 0) setSecs(25 * 60); setRunning(r => !r) }}>
                  {running ? Ico.pause : Ico.play}
                </button>
                <button className="ag-focus-reset" onClick={() => { setRunning(false); setSecs(25 * 60) }}>{Ico.refresh}</button>
              </div>
              <p className="ag-focus-hint">Next up: 5 min short break</p>
            </div>

            {/* Schedule */}
            <div className="ag-schedule">
              <h3 className="ag-focus-cap ag-schedule-cap">Schedule</h3>
              {schedule.length === 0 ? (
                <div className="ag-schedule-empty">No timed tasks today. Add a time to a task to see it here.</div>
              ) : (
                <div className="ag-timeline">
                  <div className="ag-timeline-line" />
                  {schedule.map((r, i) => {
                    const isCurrent = i === currentIdx && !r.completed
                    const past = r.completed || (currentIdx !== -1 && i < currentIdx)
                    return (
                      <div key={r.id} className={'ag-tl-item' + (past ? ' past' : '')}>
                        <div className={'ag-tl-dot' + (isCurrent ? ' current' : '')}>
                          {isCurrent ? <span className="ag-tl-bolt">{Ico.bolt}</span> : <span className="ag-tl-inner" />}
                        </div>
                        <div className="ag-tl-body">
                          <span className="ag-tl-time">{isCurrent ? `Current — ${r.notificationTime}` : r.notificationTime}</span>
                          <h5 className="ag-tl-name">{r.title}</h5>
                          <p className="ag-tl-sub">{(r.category || 'general').charAt(0).toUpperCase() + (r.category || 'general').slice(1)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <button className="ag-viewcal" onClick={() => (location.hash = 'calendar')}>View Full Calendar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
