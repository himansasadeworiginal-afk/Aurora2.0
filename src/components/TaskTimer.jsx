import { useState, useEffect, useRef, useCallback } from 'react'
import './TaskTimer.css'

// A floating focus / Pomodoro timer, always available in the app shell. It runs
// off an absolute `endsAt` timestamp persisted in localStorage, so the countdown
// survives reloads and navigation. Any view can start a timer for a task by
// dispatching: window.dispatchEvent(new CustomEvent('aurora-timer', { detail: { label, minutes } })).

const KEY = 'aurora-timer-state'
const PRESETS = [
  { label: 'Pomodoro', min: 25 },
  { label: 'Short break', min: 5 },
  { label: 'Long break', min: 15 },
]

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null }
}
function save(state) {
  try {
    if (state) localStorage.setItem(KEY, JSON.stringify(state))
    else localStorage.removeItem(KEY)
  } catch {}
}

function fmt(sec) {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const now = ctx.currentTime
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, now + i * 0.15)
      gain.gain.setValueAtTime(0.18, now + i * 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(now + i * 0.15); osc.stop(now + i * 0.15 + 0.4)
    })
    setTimeout(() => { try { ctx.close() } catch {} }, 1500)
  } catch {}
}

export default function TaskTimer() {
  const [state, setState] = useState(load)      // { label, totalSec, endsAt|null, remainingSec, running } | null
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [custom, setCustom] = useState(25)
  const [done, setDone] = useState(false)
  const firedRef = useRef(false)

  // Persist whenever state changes.
  useEffect(() => { save(state) }, [state])

  // 1s tick while a timer is active.
  useEffect(() => {
    if (!state) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [state])

  const remaining = state
    ? (state.running ? (state.endsAt - now) / 1000 : state.remainingSec)
    : 0

  // Completion side-effects.
  useEffect(() => {
    if (!state || !state.running) { firedRef.current = false; return }
    if (remaining <= 0 && !firedRef.current) {
      firedRef.current = true
      chime()
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Timer done', { body: state.label || 'Focus session complete', tag: 'aurora-timer', silent: true })
        }
      } catch {}
      setDone(true)
      setOpen(true)
      setState(s => s ? { ...s, running: false, remainingSec: 0 } : s)
    }
  }, [remaining, state])

  const start = useCallback((minutes, label = 'Focus') => {
    const totalSec = Math.max(1, Math.round(minutes * 60))
    setDone(false)
    firedRef.current = false
    setState({ label, totalSec, endsAt: Date.now() + totalSec * 1000, remainingSec: totalSec, running: true })
    setOpen(true)
  }, [])

  const pause = useCallback(() => {
    setState(s => s && s.running ? { ...s, running: false, remainingSec: Math.max(0, (s.endsAt - Date.now()) / 1000) } : s)
  }, [])

  const resume = useCallback(() => {
    setState(s => s && !s.running ? { ...s, running: true, endsAt: Date.now() + s.remainingSec * 1000 } : s)
  }, [])

  const reset = useCallback(() => { setState(null); setDone(false) }, [])

  // External trigger: start a timer for a specific task.
  useEffect(() => {
    const onEvt = (e) => {
      const { label, minutes } = e.detail || {}
      start(minutes || 25, label || 'Focus')
    }
    window.addEventListener('aurora-timer', onEvt)
    return () => window.removeEventListener('aurora-timer', onEvt)
  }, [start])

  const pct = state ? Math.max(0, Math.min(1, remaining / state.totalSec)) : 0
  const R = 26
  const circ = 2 * Math.PI * R

  return (
    <div className="task-timer">
      {/* Floating launcher / mini display */}
      <button
        className={`tt-fab ${state ? 'active' : ''} ${done ? 'done' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Focus timer"
      >
        {state ? fmt(remaining) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2" />
            <path d="M9 2h6" />
          </svg>
        )}
      </button>

      {open && (
        <div className="tt-panel">
          <div className="tt-panel-head">
            <span>{done ? 'Done!' : state ? state.label : 'Focus Timer'}</span>
            <button className="tt-x" onClick={() => setOpen(false)}>✕</button>
          </div>

          {state ? (
            <>
              <div className="tt-dial">
                <svg width="72" height="72" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r={R} fill="none" stroke="var(--border, #2a1212)" strokeWidth="5" />
                  <circle
                    cx="32" cy="32" r={R} fill="none"
                    stroke="var(--accent, #e60000)" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                    transform="rotate(-90 32 32)"
                  />
                </svg>
                <span className="tt-dial-time">{fmt(remaining)}</span>
              </div>
              <div className="tt-actions">
                {state.running
                  ? <button className="tt-btn" onClick={pause}>Pause</button>
                  : !done && <button className="tt-btn primary" onClick={resume}>Resume</button>}
                <button className="tt-btn" onClick={reset}>{done ? 'Close' : 'Reset'}</button>
              </div>
            </>
          ) : (
            <>
              <div className="tt-presets">
                {PRESETS.map(p => (
                  <button key={p.label} className="tt-preset" onClick={() => start(p.min, p.label)}>
                    <strong>{p.min}m</strong>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
              <div className="tt-custom">
                <input
                  type="number" min="1" max="180" value={custom}
                  onChange={e => setCustom(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
                />
                <span>min</span>
                <button className="tt-btn primary" onClick={() => start(custom, 'Focus')}>Start</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
