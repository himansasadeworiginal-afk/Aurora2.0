import { useState, useEffect, useCallback, useMemo } from 'react'
import db from '../data/db'
import './TrackerView.css'

function getToday() {
  return new Date().toISOString().slice(0, 10)
}
function iso(d) { return d.toISOString().slice(0, 10) }

// Monday-based week containing today
function weekDates() {
  const now = new Date()
  const dow = (now.getDay() + 6) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - dow)
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return names.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return { label, iso: iso(d) }
  })
}
function last7() {
  const out = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    out.push(iso(d))
  }
  return out
}
function relTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const today = getToday()
  const yday = iso(new Date(Date.now() - 86400000))
  const day = iso(d)
  const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (day === today) return `Today • ${t}`
  if (day === yday) return `Yesterday • ${t}`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` • ${t}`
}

const CATEGORY_COLORS = { health: '#ffb690', work: '#4cd7f6', study: '#4cd7f6', personal: '#ddb7ff', other: '#8899cc' }
const HABIT_ICONS = ['#ddb7ff', '#4cd7f6', '#ffb690']

const Ico = {
  flame: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c2.5 3.5 6 5 6 9.5A6 6 0 016 11.5c0-2 1-3.4 2.2-4.5C8.4 8.7 9.3 10 10.5 10 9.5 7 11 4 12 2z"/></svg>,
  add: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  save: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h7V3"/><rect x="8" y="13" width="8" height="5"/></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18l5-5 3 3 7-8"/></svg>,
  bolt: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13z"/></svg>,
  up: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.2 14.2l-4-4 1.4-1.4 2.6 2.6 5.6-5.6L17.8 9z"/></svg>,
  ring: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/></svg>,
  dumbbell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5l11 11"/><path d="M4 9l2-2 2 2-2 2z"/><path d="M20 15l-2 2-2-2 2-2z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"/><path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13"/></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>,
}

function RingBig({ pct, color }) {
  const p = Math.max(0, Math.min(1, pct))
  return (
    <svg viewBox="0 0 36 36" className="trk-ring-svg">
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={`${p * 100}, 100`} />
    </svg>
  )
}

export default function TrackerView({ onClose }) {
  const [trackers, setTrackers] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // create form
  const [fName, setFName] = useState('')
  const [fType, setFType] = useState('check')
  const [fTarget, setFTarget] = useState(1)
  const [fUnit, setFUnit] = useState('')
  const [fCategory, setFCategory] = useState('personal')

  // quick add
  const [qId, setQId] = useState('')
  const [qVal, setQVal] = useState('')

  const today = getToday()
  const week = useMemo(weekDates, [])

  const loadData = useCallback(async () => {
    try {
      const [t, l] = await Promise.all([db.trackers.toArray(), db.trackerLogs.toArray()])
      setTrackers(t); setLogs(l)
      if (!qId && t.length) setQId(String(t[0].id))
    } catch {}
    setLoading(false)
  }, [qId])

  useEffect(() => { loadData() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = () => loadData()
    window.addEventListener('aurora-data-changed', h)
    return () => window.removeEventListener('aurora-data-changed', h)
  }, [loadData])

  const logIndex = useMemo(() => {
    const m = new Map()
    for (const l of logs) m.set(l.trackerId + '|' + l.date, l)
    return m
  }, [logs])
  const logFor = useCallback((id, date) => logIndex.get(id + '|' + date), [logIndex])
  const valueFor = useCallback((id, date) => {
    const l = logFor(id, date)
    return l ? (l.value != null ? l.value : 1) : 0
  }, [logFor])
  const isDone = useCallback((t, date) => {
    const v = valueFor(t.id, date)
    return t.type === 'count' ? v >= (t.target || 1) : v > 0
  }, [valueFor])

  const streakOf = useCallback((t) => {
    let streak = 0
    const d = new Date(today + 'T00:00:00')
    while (valueFor(t.id, iso(d)) > 0) { streak++; d.setDate(d.getDate() - 1) }
    return streak
  }, [today, valueFor])

  // ---- mutations ----
  const toggleDate = useCallback(async (t, date) => {
    const existing = logFor(t.id, date)
    if (existing) await db.trackerLogs.delete(existing.id)
    else await db.trackerLogs.add({ trackerId: t.id, date, value: t.type === 'count' ? (t.target || 1) : 1, note: '', createdAt: new Date().toISOString() })
    loadData()
  }, [logFor, loadData])

  const logEntry = useCallback(async () => {
    if (!qId) return
    const t = trackers.find(x => String(x.id) === String(qId))
    if (!t) return
    const num = parseFloat(qVal)
    const value = Number.isFinite(num) ? num : (t.type === 'count' ? (t.target || 1) : 1)
    const existing = logFor(t.id, today)
    if (existing) await db.trackerLogs.update(existing.id, { value, note: qVal })
    else await db.trackerLogs.add({ trackerId: t.id, date: today, value, note: qVal, createdAt: new Date().toISOString() })
    setQVal('')
    loadData()
  }, [qId, qVal, trackers, logFor, today, loadData])

  const addTracker = useCallback(async () => {
    if (!fName.trim()) return
    await db.trackers.add({
      name: fName.trim(),
      type: fType,
      target: fType === 'count' ? Math.max(1, Number(fTarget) || 1) : null,
      unit: fType === 'count' ? (fUnit.trim() || null) : null,
      frequency: 'daily',
      category: fCategory,
      color: CATEGORY_COLORS[fCategory] || null,
      createdAt: new Date().toISOString(),
    })
    setFName(''); setFType('check'); setFTarget(1); setFUnit(''); setFCategory('personal')
    setShowForm(false)
    loadData()
  }, [fName, fType, fTarget, fUnit, fCategory, loadData])

  const deleteTracker = useCallback(async (id) => {
    const logIds = logs.filter(l => l.trackerId === id).map(l => l.id)
    await Promise.all([db.trackers.delete(id), ...logIds.map(lid => db.trackerLogs.delete(lid))])
    loadData()
  }, [logs, loadData])

  // ---- derived analytics ----
  const bestStreak = trackers.reduce((mx, t) => Math.max(mx, streakOf(t)), 0)
  const days7 = last7()
  const consistency = days7.map(date => {
    if (!trackers.length) return 0
    const done = trackers.filter(t => isDone(t, date)).length
    return done / trackers.length
  })
  const completionRate = consistency.length ? Math.round((consistency.reduce((a, b) => a + b, 0) / consistency.length) * 1000) / 10 : 0
  const longestStreak = trackers.reduce((mx, t) => {
    // scan last 60 days for the longest run
    let best = 0, cur = 0
    for (let i = 0; i < 60; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      if (valueFor(t.id, iso(d)) > 0) { cur++; best = Math.max(best, cur) } else cur = 0
    }
    return Math.max(mx, best)
  }, 0)
  const missedGoals = trackers.reduce((s, t) => s + week.filter(w => w.iso <= today && !isDone(t, w.iso)).length, 0)
  const maxCons = Math.max(0.001, ...consistency)

  const recent = [...logs].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 8)
  const nameOf = (id) => trackers.find(t => t.id === id)?.name || 'Tracker'

  if (loading) {
    return <div className="trk"><div className="trk-loading">Loading trackers…</div></div>
  }

  return (
    <div className="trk">
      {/* Top bar */}
      <div className="trk-topbar">
        <div className="trk-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
          <input placeholder="Search trackers or habits..." />
        </div>
        <button className="trk-icon-btn trk-close" onClick={onClose} title="Back to dashboard">{Ico.close}</button>
      </div>

      <div className="trk-main">
        <header className="trk-header">
          <div>
            <h1 className="trk-title">Habit Trackers</h1>
            <p className="trk-subtitle">Stay consistent. Track your progress. Achieve more.</p>
          </div>
          <div className="trk-header-actions">
            <div className="trk-streak"><span className="trk-streak-ico">{Ico.flame}</span>{bestStreak} Day Streak</div>
            <button className="trk-newbtn" onClick={() => setShowForm(v => !v)}>
              <span className="trk-newbtn-ico">{showForm ? Ico.close : Ico.add}</span>{showForm ? 'Close' : 'New Tracker'}
            </button>
          </div>
        </header>

        {showForm && (
          <div className="trk-create glass-card">
            <input className="trk-in" placeholder="Tracker name (e.g. Exercise Daily)" value={fName} onChange={e => setFName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTracker()} autoFocus />
            <select className="trk-in" value={fType} onChange={e => setFType(e.target.value)}>
              <option value="check">Check-in (yes/no)</option>
              <option value="count">Count (numeric)</option>
            </select>
            {fType === 'count' && <input className="trk-in trk-in-sm" type="number" min="1" placeholder="Target" value={fTarget} onChange={e => setFTarget(e.target.value)} />}
            {fType === 'count' && <input className="trk-in trk-in-sm" placeholder="Unit (mins)" value={fUnit} onChange={e => setFUnit(e.target.value)} />}
            <select className="trk-in" value={fCategory} onChange={e => setFCategory(e.target.value)}>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
              <option value="work">Work</option>
              <option value="study">Study</option>
              <option value="other">Other</option>
            </select>
            <button className="trk-newbtn" onClick={addTracker}>Add</button>
          </div>
        )}

        <div className="trk-grid">
          {/* Left column */}
          <div className="trk-left">
            {/* Ring cards */}
            <div className="trk-rings">
              {trackers.length === 0 ? (
                <div className="trk-empty glass-card">
                  <div className="trk-empty-ico">{Ico.ring}</div>
                  <div className="trk-empty-title">No trackers yet</div>
                  <div className="trk-empty-sub">Hit “New Tracker” to start a habit or metric</div>
                </div>
              ) : trackers.slice(0, 6).map((t) => {
                const pct = t.type === 'count' ? valueFor(t.id, today) / (t.target || 1) : week.filter(w => isDone(t, w.iso)).length / 7
                const color = t.color || CATEGORY_COLORS[t.category] || '#ddb7ff'
                const streak = streakOf(t)
                return (
                  <div className="trk-ringcard glass-card" key={t.id}>
                    <button className="trk-ringcard-del" onClick={() => deleteTracker(t.id)} title="Delete tracker">{Ico.trash}</button>
                    <div className="trk-ring">
                      <RingBig pct={pct} color={color} />
                      <span className="trk-ring-pct" style={{ color }}>{Math.round(pct * 100)}%</span>
                    </div>
                    <div className="trk-ringcard-body">
                      <h3>{t.name}</h3>
                      <p className="trk-ringcard-target">
                        {t.type === 'count' ? `Target: ${t.target || 1}${t.unit ? ' ' + t.unit : ''} / day` : 'Daily check-in'}
                      </p>
                      <div className="trk-ringcard-status" style={{ color: streak > 0 ? '#4cd7f6' : 'var(--on-surface-variant)' }}>
                        <span className="trk-ringcard-status-ico">{streak > 0 ? Ico.bolt : Ico.up}</span>
                        {streak > 0 ? `${streak} day streak` : 'Log to start a streak'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Daily check-ins */}
            <div className="trk-checkins glass-card">
              <div className="trk-checkins-head">
                <h3>Daily Check-ins</h3>
                <div className="trk-week-badge">{week[0].iso.slice(5)} – {week[6].iso.slice(5)}</div>
              </div>
              {trackers.length === 0 ? (
                <div className="trk-checkins-empty">Create a tracker to check in daily.</div>
              ) : (
                <div className="trk-table-wrap">
                  <table className="trk-table">
                    <thead>
                      <tr>
                        <th className="trk-th-name">Habit Name</th>
                        {week.map(w => <th key={w.iso}>{w.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {trackers.map((t, i) => {
                        const color = t.color || CATEGORY_COLORS[t.category] || HABIT_ICONS[i % 3]
                        return (
                          <tr key={t.id}>
                            <td>
                              <div className="trk-habit-name">
                                <span className="trk-habit-ico" style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>{Ico.dumbbell}</span>
                                {t.name}
                              </div>
                            </td>
                            {week.map(w => {
                              const future = w.iso > today
                              const done = isDone(t, w.iso)
                              return (
                                <td key={w.iso} className="trk-cell">
                                  <button
                                    className={'trk-dot' + (done ? ' on' : '') + (future ? ' future' : '')}
                                    disabled={future}
                                    onClick={() => toggleDate(t, w.iso)}
                                    title={w.iso}
                                  >
                                    {done ? Ico.check : <span className="trk-dot-empty" />}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="trk-right">
            {/* Quick Add */}
            <div className="trk-quickadd glass-card">
              <h3>Quick Add</h3>
              <label className="trk-label">Select Tracker</label>
              <select className="trk-in" value={qId} onChange={e => setQId(e.target.value)} disabled={!trackers.length}>
                {trackers.length === 0 && <option>No trackers yet</option>}
                {trackers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <label className="trk-label">Value / Note</label>
              <input className="trk-in" placeholder="e.g. 45 mins" value={qVal} onChange={e => setQVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && logEntry()} />
              <button className="trk-logbtn" onClick={logEntry} disabled={!trackers.length}>
                <span className="trk-logbtn-ico">{Ico.save}</span>Log Entry
              </button>
            </div>

            {/* Consistency */}
            <div className="trk-consistency glass-card">
              <div className="trk-consistency-head">
                <h3>Consistency</h3>
                <span className="trk-consistency-ico">{Ico.chart}</span>
              </div>
              <div className="trk-bars">
                {consistency.map((v, i) => {
                  const isPeak = v === maxCons && v > 0
                  return (
                    <div className="trk-bar-col" key={i}>
                      <div className={'trk-bar' + (isPeak ? ' peak' : '')} style={{ height: `${Math.max(6, (v / maxCons) * 100)}%` }}>
                        {isPeak && <span className="trk-bar-peak">Peak</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="trk-stats">
                <div className="trk-stat-row"><span>Completion Rate</span><span className="trk-stat-val">{completionRate}%</span></div>
                <div className="trk-stat-row"><span>Longest Streak</span><span className="trk-stat-val trk-cyan">{longestStreak} Days</span></div>
                <div className="trk-stat-row"><span>Missed Goals</span><span className="trk-stat-val trk-red">{missedGoals}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {recent.length > 0 && (
          <div className="trk-recent">
            <div className="trk-recent-head">
              <h3>Recent Activity</h3>
            </div>
            <div className="trk-recent-scroll">
              {recent.map(l => {
                const color = HABIT_ICONS[(l.trackerId || 0) % 3]
                return (
                  <div className="trk-log glass-card" key={l.id}>
                    <span className="trk-log-ico" style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>{Ico.check}</span>
                    <div>
                      <p className="trk-log-name">{nameOf(l.trackerId)}{l.value && l.value !== 1 ? ` · ${l.value}` : ''}</p>
                      <p className="trk-log-time">{relTime(l.createdAt)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
