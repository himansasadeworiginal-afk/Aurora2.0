import { useState, useEffect } from 'react'
import db from '../data/db'
import './MainDashboard.css'

function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

const USER = 'Wolf'

function greetingFor(hour) {
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 22) return 'Good evening'
  return 'Burning the midnight oil'
}

const PERSONAL_LINES = [
  "Welcome back, Wolf. Your second brain is right where you left it.",
  "Let's make today count, Wolf.",
  "Everything's in order, Wolf. Where do you want to start?",
  "Your mind, organized. Ready when you are, Wolf.",
  "Good to see you, Wolf. I've kept everything synced.",
  "The whole system is yours, Wolf. Let's build something.",
  "Focused and ready, Wolf. What's on your mind?",
]

function personalLineFor(now, hour, taskCount) {
  if (hour >= 22 || hour < 5) return `It's late, Wolf — but I'm still here with you.`
  if (taskCount > 0) return `You've got ${taskCount} task${taskCount > 1 ? 's' : ''} waiting, Wolf. Let's clear them.`
  const day = Math.floor(now.getTime() / 86400000)
  return PERSONAL_LINES[day % PERSONAL_LINES.length]
}

const I = {
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>,
  brain: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="3"/><circle cx="5.5" cy="17" r="3"/><circle cx="18.5" cy="17" r="3"/><line x1="10" y1="9.5" x2="7.5" y2="14.5"/><line x1="14" y1="9.5" x2="16.5" y2="14.5"/><line x1="5.5" y1="17" x2="18.5" y2="17"/></svg>,
  timer: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><line x1="12" y1="13" x2="12" y2="9"/><line x1="9" y1="2.5" x2="15" y2="2.5"/></svg>,
  agenda: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 13l3 3 5-6"/></svg>,
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></svg>,
  capture: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"/></svg>,
  todos: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7l2 2 3-3"/><path d="M4 17l2 2 3-3"/><line x1="12" y1="7" x2="20" y2="7"/><line x1="12" y1="17" x2="20" y2="17"/></svg>,
  nexo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="4" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><line x1="12" y1="9.5" x2="12" y2="6"/><line x1="10.2" y1="13.4" x2="6.4" y2="16.4"/><line x1="13.8" y1="13.4" x2="17.6" y2="16.4"/></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>,
}

const PARA = [
  { key: 'projects',  label: 'Projects',  color: '#ddb7ff' },
  { key: 'areas',     label: 'Areas',     color: '#4cd7f6' },
  { key: 'resources', label: 'Resources', color: '#ffb690' },
  { key: 'archives',  label: 'Archive',   color: '#8899cc' },
]

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export default function MainDashboard({ onNavigate }) {
  const [stats, setStats] = useState({ reminders: 0, notes: 0, trackers: 0 })
  const [nextTask, setNextTask] = useState(null)
  const [todoProgress, setTodoProgress] = useState({ done: 0, total: 0 })
  const [week, setWeek] = useState(() => WEEKDAYS.map((d) => ({ day: d, v: 0 })))
  const [dist, setDist] = useState(() => PARA.map((p) => ({ ...p, count: 0 })))
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState(() => greetingFor(new Date().getHours()))
  const [clock, setClock] = useState(() => new Date())

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now)
      setGreeting(greetingFor(now.getHours()))
    }
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    async function load() {
      const today = getToday()
      try {
        const allRems = await db.reminders.toArray()
        const todayTasks = allRems.filter((r) => r.date === today && !r.completed)
        const notesCount = await db.notes.count()
        const trackersCount = await db.trackers.count()
        setStats({ reminders: todayTasks.length, notes: notesCount, trackers: trackersCount })

        // Next upcoming task today (by notificationTime, else first)
        const upcoming = todayTasks
          .slice()
          .sort((a, b) => (a.notificationTime || '99:99').localeCompare(b.notificationTime || '99:99'))[0]
        setNextTask(upcoming || null)

        // Weekly productivity — completed reminders per weekday, last 7 days
        const buckets = WEEKDAYS.map((d) => ({ day: d, v: 0 }))
        const now = new Date()
        for (let i = 0; i < 7; i++) {
          const d = new Date(now)
          d.setDate(now.getDate() - i)
          const iso = d.toISOString().slice(0, 10)
          const jsDay = (d.getDay() + 6) % 7 // Mon=0
          buckets[jsDay].v = allRems.filter((r) => r.date === iso && r.completed).length
        }
        setWeek(buckets)

        // Task distribution — notes by PARA category
        const notes = await db.notes.toArray()
        const dcounts = PARA.map((p) => ({
          ...p,
          count: notes.filter((n) => (n.paraCategory || '').toLowerCase() === p.key).length,
        }))
        setDist(dcounts)

        // To-Do progress
        const todos = await db.todos.toArray()
        setTodoProgress({ done: todos.filter((t) => t.done).length, total: todos.length })
      } catch { /* empty DB / first run — keep zeros */ }
      setLoading(false)
    }
    load()
  }, [])

  const timeStr = clock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const shortDate = clock.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const maxWeek = Math.max(1, ...week.map((w) => w.v))
  const distTotal = dist.reduce((s, d) => s + d.count, 0)
  const todoPct = todoProgress.total ? Math.round((todoProgress.done / todoProgress.total) * 100) : 0

  // Donut segments (stroke-dasharray on a 100-unit circumference)
  let acc = 0
  const segs = dist.map((d) => {
    const frac = distTotal ? d.count / distTotal : 0
    const seg = { color: d.color, len: frac * 100, off: -acc }
    acc += frac * 100
    return seg
  })

  return (
    <div className="dsh">
      <header className="dsh-head">
        <div>
          <h1 className="dsh-greeting">{greeting}, <span className="dsh-name">{USER}</span></h1>
          <div className="dsh-personal">{personalLineFor(clock, clock.getHours(), stats.reminders)}</div>
          <div className="dsh-date">{getFormattedDate()}</div>
        </div>
        <div className="dsh-clock">{timeStr}</div>
      </header>

      {/* Top stat cards */}
      <section className="dsh-stats">
        <div className="dsh-stat" style={{ '--hue': '#ddb7ff' }}>
          <div className="dsh-stat-text">
            <span className="dsh-stat-label">Tasks Today</span>
            <span className="dsh-stat-value">{stats.reminders}</span>
          </div>
          <span className="dsh-stat-icon">{I.check}</span>
        </div>
        <div className="dsh-stat" style={{ '--hue': '#4cd7f6' }}>
          <div className="dsh-stat-text">
            <span className="dsh-stat-label">Total Notes</span>
            <span className="dsh-stat-value">{stats.notes}</span>
          </div>
          <span className="dsh-stat-icon">{I.brain}</span>
        </div>
        <div className="dsh-stat" style={{ '--hue': '#ffb690' }}>
          <div className="dsh-stat-text">
            <span className="dsh-stat-label">Active Trackers</span>
            <span className="dsh-stat-value">{stats.trackers}</span>
          </div>
          <span className="dsh-stat-icon">{I.timer}</span>
        </div>
      </section>

      {/* Bento widget grid */}
      <section className="dsh-bento">
        <button type="button" className="dsh-hero" style={{ '--hue': '#ddb7ff' }} onClick={() => onNavigate('brain')}>
          <span className="dsh-hero-glow" />
          <span className="dsh-hero-icon">{I.brain}</span>
          <div className="dsh-hero-body">
            <h2>Second Brain</h2>
            <p>Connect your thoughts and explore your knowledge network with AI assistance.</p>
          </div>
          <span className="dsh-hero-cta">Access Vault</span>
        </button>

        <button type="button" className="dsh-tile dsh-tile-wide" style={{ '--hue': '#4cd7f6' }} onClick={() => onNavigate('agenda')}>
          <span className="dsh-tile-icon">{I.agenda}</span>
          <div className="dsh-tile-body">
            <h3>Daily Agenda</h3>
            <p>{nextTask ? `Next: ${nextTask.title}${nextTask.notificationTime ? ` (${nextTask.notificationTime})` : ''}` : 'No tasks scheduled today'}</p>
          </div>
        </button>

        <button type="button" className="dsh-tile dsh-tile-center" style={{ '--hue': '#ffb690' }} onClick={() => onNavigate('calendar')}>
          <span className="dsh-tile-icon">{I.calendar}</span>
          <span className="dsh-tile-cap">Calendar</span>
          <span className="dsh-tile-big">{shortDate}</span>
        </button>

        <button type="button" className="dsh-tile dsh-tile-center dsh-tile-ghost" onClick={() => onNavigate('capture')}>
          <span className="dsh-capture-orb">{I.capture}</span>
          <span className="dsh-tile-cap">Capture</span>
        </button>

        <button type="button" className="dsh-tile dsh-tile-wide" style={{ '--hue': '#4cd7f6' }} onClick={() => onNavigate('todos')}>
          <span className="dsh-tile-icon dsh-tile-icon-flat">{I.todos}</span>
          <div className="dsh-tile-body">
            <div className="dsh-todo-row">
              <h3>To-Do List</h3>
              <span className="dsh-todo-pct">{todoProgress.total ? `${todoPct}% Done` : 'Empty'}</span>
            </div>
            <div className="dsh-todo-track"><span className="dsh-todo-fill" style={{ width: `${todoPct}%` }} /></div>
          </div>
        </button>

        <button type="button" className="dsh-tile dsh-tile-wide dsh-tile-between" style={{ '--hue': '#ddb7ff' }} onClick={() => onNavigate('nexo')}>
          <div className="dsh-tile-inline">
            <span className="dsh-tile-icon-sm">{I.nexo}</span>
            <h3>NExo Hub</h3>
          </div>
          <span className="dsh-tile-arrow">{I.arrow}</span>
        </button>
      </section>

      {/* Charts */}
      <section className="dsh-charts">
        <div className="dsh-chart">
          <div className="dsh-chart-head">
            <h2>Weekly Productivity</h2>
            <span className="dsh-chart-tag">This Week</span>
          </div>
          <div className="dsh-bars">
            {week.map((w) => (
              <div className="dsh-bar-col" key={w.day}>
                <div className="dsh-bar-track">
                  <span className="dsh-bar-fill" style={{ height: `${(w.v / maxWeek) * 100}%` }} />
                </div>
                <span className="dsh-bar-label">{w.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dsh-chart">
          <div className="dsh-chart-head"><h2>Task Distribution</h2></div>
          <div className="dsh-donut-wrap">
            <div className="dsh-donut">
              <svg viewBox="0 0 36 36">
                {distTotal === 0 ? (
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                ) : segs.map((s, i) => (
                  <circle key={i} cx="18" cy="18" r="15.915" fill="none"
                    stroke={s.color} strokeWidth="4"
                    strokeDasharray={`${s.len} ${100 - s.len}`}
                    strokeDashoffset={s.off}
                    transform="rotate(-90 18 18)" />
                ))}
              </svg>
              <div className="dsh-donut-center">
                <span className="dsh-donut-num">{distTotal}</span>
                <span className="dsh-donut-cap">NOTES</span>
              </div>
            </div>
            <div className="dsh-legend">
              {dist.map((d) => (
                <div className="dsh-legend-row" key={d.key}>
                  <span className="dsh-legend-dot" style={{ background: d.color }} />
                  <span className="dsh-legend-name">{d.label}</span>
                  <span className="dsh-legend-val">{distTotal ? Math.round((d.count / distTotal) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {loading && <div className="dsh-loading-veil" aria-hidden="true" />}
    </div>
  )
}
