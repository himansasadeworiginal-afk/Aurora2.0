import { useState, useEffect } from 'react'
import db from '../data/db'

function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export default function MainDashboard({ onNavigate }) {
  const [stats, setStats] = useState({ reminders: 0, notes: 0, trackers: 0 })
  const [loading, setLoading] = useState(true)
  const [greetingIndex, setGreetingIndex] = useState(0)

  const greetings = ['Good morning', 'Good afternoon', 'Good evening']

  useEffect(() => {
    const h = new Date().getHours()
    setGreetingIndex(h < 12 ? 0 : h < 17 ? 1 : 2)
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
      } catch {}
      setLoading(false)
    }
    loadStats()
  }, [])

const icons = {
  brain: <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="9" r="4"/><circle cx="7" cy="23" r="4"/><circle cx="25" cy="23" r="4"/><line x1="13" y1="12" x2="9" y2="19"/><line x1="19" y1="12" x2="23" y2="19"/><line x1="7" y1="23" x2="25" y2="23"/></svg>,
  agenda: <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5" width="22" height="22" rx="2"/><path d="M11 18l4 4 7-7"/></svg>,
  calendar: <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="7" width="24" height="21" rx="2"/><line x1="4" y1="13" x2="28" y2="13"/><line x1="10" y1="4" x2="10" y2="9"/><line x1="22" y1="4" x2="22" y2="9"/></svg>,
  trackers: <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="6"/><circle cx="16" cy="16" r="2.5" fill="currentColor" stroke="none"/></svg>,
  capture: <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 26l3-3 1 1 2-2 1 1 3-3 1 1-4 4-1-1-2 2-1-1-3 3"/><path d="M26 8l-2-3-3 2"/></svg>,
  desmond: <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="9" r="4.5"/><circle cx="6" cy="25" r="4.5"/><circle cx="26" cy="25" r="4.5"/><line x1="12.5" y1="13" x2="9" y2="21"/><line x1="19.5" y1="13" x2="23" y2="21"/><line x1="6" y1="25" x2="26" y2="25"/></svg>,
}

  const cards = [
    { section: 'brain', icon: icons.brain, title: 'Second Brain', desc: 'Your knowledge graph in 3D', color: '#e60000' },
    { section: 'agenda', icon: icons.agenda, title: 'Daily Agenda', desc: "Today's tasks and reminders", color: '#ffaa33' },
    { section: 'calendar', icon: icons.calendar, title: 'Calendar', desc: 'Schedule and events', color: '#4488ff' },
    { section: 'trackers', icon: icons.trackers, title: 'Trackers', desc: 'Habits and progress', color: '#66cc88' },
    { section: 'capture', icon: icons.capture, title: 'Quick Capture', desc: 'Capture a thought instantly', color: '#aa44dd' },
    { section: 'desmond', icon: icons.desmond, title: 'Desmond', desc: 'AI voice assistant', color: '#22aaff' },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-greeting">{greetings[greetingIndex]}</div>
      <div className="dashboard-date">{getFormattedDate()}</div>

      <div className="dashboard-cards">
        {cards.map(card => (
          <div
            key={card.section}
            className={`dash-card${card.section !== 'brain' ? ` ${card.section}` : ''}`}
            style={{ '--card-accent': card.color }}
            onClick={() => onNavigate(card.section)}
          >
            <div className="shimmer-line" />
            <div className="dash-card-icon">{card.icon}</div>
            <div className="dash-card-title">{card.title}</div>
            <div className="dash-card-desc">{card.desc}</div>
          </div>
        ))}
      </div>

      {!loading && (
        <div className="dashboard-stats">
          <div className="dash-stat">
            <div className="dash-stat-value">{stats.reminders}</div>
            <div className="dash-stat-label">Today's Tasks</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-value">{stats.notes}</div>
            <div className="dash-stat-label">Total Notes</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-value">{stats.trackers}</div>
            <div className="dash-stat-label">Active Trackers</div>
          </div>
        </div>
      )}
    </div>
  )
}
