import { useEffect, useRef } from 'react'
import './AlarmOverlay.css'

// A full-screen, on-theme alarm that rings until the user acts. Fired for
// reminders flagged `alarm: true` when their notificationTime arrives. The sound
// is a repeating two-tone beep via Web Audio (no asset needed) that loops until
// the overlay unmounts (snooze or dismiss).

function useAlarmSound() {
  const ctxRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    let ctx
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)()
      ctxRef.current = ctx
    } catch { return }

    const beep = () => {
      const now = ctx.currentTime
      // two urgent tones
      ;[880, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, now + i * 0.22)
        gain.gain.setValueAtTime(0.0001, now + i * 0.22)
        gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.22 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.22 + 0.18)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * 0.22)
        osc.stop(now + i * 0.22 + 0.2)
      })
    }

    beep()
    intervalRef.current = setInterval(beep, 1100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      try { ctx.close() } catch {}
    }
  }, [])
}

export default function AlarmOverlay({ alarm, onSnooze, onDismiss }) {
  useAlarmSound()

  // Allow Escape to dismiss.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onDismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  if (!alarm) return null

  return (
    <div className="alarm-overlay" role="alertdialog" aria-label="Alarm">
      <div className="alarm-card">
        <div className="alarm-ring">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 01-3.4 0" />
          </svg>
        </div>
        <div className="alarm-time">{alarm.notificationTime}</div>
        <div className="alarm-title">{alarm.title}</div>
        <div className="alarm-meta">
          <span className="alarm-priority" data-p={alarm.priority || 'medium'}>{alarm.priority || 'medium'}</span>
          {alarm.category && <span className="alarm-cat">{alarm.category}</span>}
        </div>
        <div className="alarm-actions">
          <button className="alarm-btn" onClick={() => onSnooze(5)}>Snooze 5m</button>
          <button className="alarm-btn" onClick={() => onSnooze(10)}>Snooze 10m</button>
          <button className="alarm-btn primary" onClick={onDismiss}>Dismiss</button>
        </div>
      </div>
    </div>
  )
}
