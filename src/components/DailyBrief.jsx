import { useState, useEffect } from 'react'
import db from '../data/db'
import { aiStatus, aiDailyBrief } from '../data/ai-client'
import AuroraPulse from './AuroraPulse'

// A short, personal "Here's your day, Wolf" briefing synthesized by Claude from
// today's reminders + events + a couple of stale/undistilled notes. Cached once
// per day in the aiArtifacts store so it costs one API call per day, and renders
// nothing at all when AI is offline (the dashboard simply omits it).

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function DailyBrief() {
  const [text, setText] = useState(null)
  const [busy, setBusy] = useState(true)
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const status = await aiStatus()
      if (!alive) return
      if (!status.available) { setBusy(false); return }
      setAvailable(true)

      const key = `brief:${today()}`
      try {
        const cached = await db.aiArtifacts.where('key').equals(key).first()
        if (cached?.text) { if (alive) { setText(cached.text); setBusy(false) } ; return }
      } catch { /* store may not exist on a partial DB — fall through */ }

      // Gather today's context from Dexie.
      const day = today()
      let reminders = [], events = [], staleNotes = []
      try {
        reminders = (await db.reminders.toArray()).filter(r => r.date === day && !r.completed)
        events = (await db.events.toArray()).filter(e => e.date === day)
        const notes = await db.notes.toArray()
        staleNotes = notes
          .filter(n => n.paraCategory !== 'inbox')
          .sort((a, b) => (a.distillationDepth || 0) - (b.distillationDepth || 0)
            || new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0))
          .slice(0, 3)
      } catch { /* tolerate empty DB */ }

      const res = await aiDailyBrief({ reminders, events, staleNotes, date: day })
      if (!alive) return
      if (res.ok && res.text) {
        setText(res.text)
        try { await db.aiArtifacts.put({ key, text: res.text, createdAt: new Date() }) } catch { /* non-fatal */ }
      }
      setBusy(false)
    })()
    return () => { alive = false }
  }, [])

  // While the first brief is generating (and AI is actually available), show the
  // aurora "superbrain" pulse. Stay silent entirely when AI is offline.
  if (busy) {
    if (!available) return null
    return (
      <div className="dsh-brief dsh-brief--loading">
        <AuroraPulse size={40} variant="ribbon" active />
        <span className="dsh-brief-loading-text">Composing your daily brief…</span>
      </div>
    )
  }
  if (!text) return null

  return (
    <div className="dsh-brief">
      <span className="dsh-brief-tag">✦ Daily Brief</span>
      <p className="dsh-brief-text">{text}</p>
    </div>
  )
}
