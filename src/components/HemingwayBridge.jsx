import { useState, useEffect, useCallback } from 'react'
import db from '../data/db'

export default function HemingwayBridge({ onClose }) {
  const [nextSteps, setNextSteps] = useState('')
  const [blockers, setBlockers] = useState('')
  const [currentContext, setCurrentContext] = useState('')
  const [sessions, setSessions] = useState([])
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const loadSessions = useCallback(async () => {
    const all = await db.sessions.toArray()
    const enriched = await Promise.all(all.map(async s => {
      const blocks = await db.sessionBlocks.where('sessionId').equals(s.id).toArray()
      return { ...s, blocks }
    }))
    setSessions(enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
  }, [])

  useEffect(() => { loadSessions() }, [loadSessions])

  const handleEndSession = async () => {
    if (!nextSteps.trim() && !blockers.trim() && !currentContext.trim()) return
    setSaving(true)
    const now = new Date()
    const sessionId = await db.sessions.add({ createdAt: now, endedAt: now })

    const blocks = []
    if (currentContext.trim()) blocks.push({ sessionId, type: 'context', content: currentContext.trim(), createdAt: now })
    if (nextSteps.trim()) blocks.push({ sessionId, type: 'next-steps', content: nextSteps.trim(), createdAt: now })
    if (blockers.trim()) blocks.push({ sessionId, type: 'blockers', content: blockers.trim(), createdAt: now })

    await db.sessionBlocks.bulkAdd(blocks)

    setNextSteps('')
    setBlockers('')
    setCurrentContext('')
    setSaving(false)
    await loadSessions()
  }

  const handleExportSession = (session) => {
    const context = session.blocks.find(b => b.type === 'context')
    const steps = session.blocks.find(b => b.type === 'next-steps')
    const block = session.blocks.find(b => b.type === 'blockers')

    let md = `# Hemingway Bridge — ${new Date(session.createdAt).toLocaleString()}\n\n`
    if (context) md += `## Context\n\n${context.content}\n\n`
    if (steps) md += `## Next Steps\n\n${steps.content}\n\n`
    if (block) md += `## Blockers\n\n${block.content}\n\n`

    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hemingway-bridge-${new Date(session.createdAt).toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="hemingway-bridge">
      <div className="hb-header">
        <div className="hb-header-left">
          <h3>Hemingway Bridge</h3>
          <span className="hb-sub">Save next-steps and blockers before ending your session</span>
        </div>
        <div className="hb-header-actions">
          <button className="btn-secondary" onClick={() => setShowHistory(s => !s)} style={{ fontSize: '0.65rem' }}>
            {showHistory ? 'Close History' : `History (${sessions.length})`}
          </button>
          <button className="qc-close" onClick={onClose}>✕</button>
        </div>
      </div>

      {!showHistory ? (
        <div className="hb-body">
          <div className="hb-field">
            <label className="hb-label">
              <span className="hb-label-icon">🎯</span>
              Current Context
            </label>
            <textarea
              className="hb-input"
              placeholder="What are you working on right now?"
              value={currentContext}
              onChange={e => setCurrentContext(e.target.value)}
              rows={2}
            />
          </div>

          <div className="hb-field">
            <label className="hb-label">
              <span className="hb-label-icon">➡</span>
              Next Steps
            </label>
            <textarea
              className="hb-input"
              placeholder="What do you need to do next?"
              value={nextSteps}
              onChange={e => setNextSteps(e.target.value)}
              rows={3}
            />
          </div>

          <div className="hb-field">
            <label className="hb-label">
              <span className="hb-label-icon">⚠</span>
              Blockers
            </label>
            <textarea
              className="hb-input"
              placeholder="What's blocking your progress?"
              value={blockers}
              onChange={e => setBlockers(e.target.value)}
              rows={3}
            />
          </div>

          <div className="hb-actions">
            <button className="btn-primary" onClick={handleEndSession} disabled={saving || (!nextSteps.trim() && !blockers.trim() && !currentContext.trim())}>
              {saving ? 'Saving...' : 'End Session & Save Bridge'}
            </button>
          </div>
        </div>
      ) : (
        <div className="hb-history">
          {sessions.map(session => {
            const context = session.blocks.find(b => b.type === 'context')
            const steps = session.blocks.find(b => b.type === 'next-steps')
            const block = session.blocks.find(b => b.type === 'blockers')
            return (
              <div key={session.id} className="hb-history-item">
                <div className="hb-history-header">
                  <strong>{new Date(session.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                  <button className="hb-export-btn" onClick={() => handleExportSession(session)}>Export</button>
                </div>
                {context && <div className="hb-history-block"><span className="hb-block-label">Context:</span> {context.content}</div>}
                {steps && <div className="hb-history-block"><span className="hb-block-label">Next Steps:</span> {steps.content}</div>}
                {block && <div className="hb-history-block"><span className="hb-block-label">Blockers:</span> {block.content}</div>}
              </div>
            )
          })}
          {sessions.length === 0 && (
            <div className="hb-empty">No sessions recorded yet</div>
          )}
        </div>
      )}
    </div>
  )
}
