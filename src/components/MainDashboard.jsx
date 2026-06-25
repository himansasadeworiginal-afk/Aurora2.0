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

function greetingFor(hour) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const icons = {
  brain: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="9" r="4"/><circle cx="7" cy="23" r="4"/><circle cx="25" cy="23" r="4"/><line x1="13" y1="12" x2="9" y2="19"/><line x1="19" y1="12" x2="23" y2="19"/><line x1="7" y1="23" x2="25" y2="23"/></svg>,
  agenda: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5" width="22" height="22" rx="2"/><path d="M11 18l4 4 7-7"/></svg>,
  calendar: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="7" width="24" height="21" rx="2"/><line x1="4" y1="13" x2="28" y2="13"/><line x1="10" y1="4" x2="10" y2="9"/><line x1="22" y1="4" x2="22" y2="9"/></svg>,
  trackers: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="6"/><circle cx="16" cy="16" r="2.5" fill="currentColor" stroke="none"/></svg>,
  capture: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 26l3-3 1 1 2-2 1 1 3-3 1 1-4 4-1-1-2 2-1-1-3 3"/><path d="M26 8l-2-3-3 2"/></svg>,
  nexo: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 6h13l5 5v15H7z"/><path d="M20 6v5h5"/><line x1="11" y1="16" x2="21" y2="16"/><line x1="11" y1="20" x2="18" y2="20"/></svg>,
  desmond: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="9" r="4.5"/><circle cx="6" cy="25" r="4.5"/><circle cx="26" cy="25" r="4.5"/><line x1="12.5" y1="13" x2="9" y2="21"/><line x1="19.5" y1="13" x2="23" y2="21"/><line x1="6" y1="25" x2="26" y2="25"/></svg>,
}

const cards = [
  { section: 'brain', icon: icons.brain, title: 'Second Brain', desc: 'Your knowledge graph in 3D', color: '#e60000' },
  { section: 'agenda', icon: icons.agenda, title: 'Daily Agenda', desc: "Today's tasks and reminders", color: '#e0ad4a' },
  { section: 'calendar', icon: icons.calendar, title: 'Calendar', desc: 'Schedule and events', color: '#4488ff' },
  { section: 'trackers', icon: icons.trackers, title: 'Trackers', desc: 'Habits and progress', color: '#34c3a0' },
  { section: 'capture', icon: icons.capture, title: 'Quick Capture', desc: 'Capture a thought instantly', color: '#9d6bd6' },
  { section: 'nexo', icon: icons.nexo, title: 'NExo', desc: 'Book summaries library', color: '#ff7a45' },
  { section: 'desmond', icon: icons.desmond, title: 'Desmond', desc: 'AI voice assistant', color: '#22aaff' },
]

export default function MainDashboard({ onNavigate }) {
  const [stats, setStats] = useState({ reminders: 0, notes: 0, trackers: 0 })
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
    async function loadStats() {
      const today = getToday()
      try {
        const allRems = await db.reminders.toArray()
        const todayTasks = allRems.filter(r => r.date === today && !r.completed)
        const notesCount = await db.notes.count()
        const trackersCount = await db.trackers.count()
        setStats({ reminders: todayTasks.length, notes: notesCount, trackers: trackersCount })
      } catch { /* empty DB / first run — keep zeros */ }
      setLoading(false)
    }
    loadStats()
  }, [])

  const timeStr = clock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="dsh">
      <header className="dsh-head">
        <div>
          <h1 className="dsh-greeting">{greeting}</h1>
          <div className="dsh-date">{getFormattedDate()}</div>
        </div>
        <div className="dsh-clock">{timeStr}</div>
      </header>

      <div className="dsh-grid">
        {cards.map(card => (
          <button
            key={card.section}
            type="button"
            className="dsh-card"
            style={{ '--accent-card': card.color }}
            onClick={() => onNavigate(card.section)}
          >
            <span className="dsh-chip">{card.icon}</span>
            <span className="dsh-card-title">{card.title}</span>
            <span className="dsh-card-desc">{card.desc}</span>
          </button>
        ))}
      </div>

      {!loading && (
        <div className="dsh-stats">
          <div className="dsh-stat">
            <span className="dsh-stat-value">{stats.reminders}</span>
            <span className="dsh-stat-label">Tasks Today</span>
          </div>
          <div className="dsh-stat">
            <span className="dsh-stat-value">{stats.notes}</span>
            <span className="dsh-stat-label">Total Notes</span>
          </div>
          <div className="dsh-stat">
            <span className="dsh-stat-value">{stats.trackers}</span>
            <span className="dsh-stat-label">Active Trackers</span>
          </div>
        </div>
      )}
    </div>
  )
}
