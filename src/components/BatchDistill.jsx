import { useState, useEffect, useCallback } from 'react'
import db from '../data/db'
import { aiDistill, aiStatus } from '../data/ai-client'

const LAYERS = [
  { key: 'soil', label: 'Soil', color: '#884422' },
  { key: 'oil', label: 'Oil', color: '#aa6633' },
  { key: 'gold', label: 'Gold', color: '#cc8844' },
  { key: 'gems', label: 'Gems', color: '#ffaa55' },
]

export default function BatchDistill({ onClose }) {
  const [queue, setQueue] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [completed, setCompleted] = useState(0)
  const [aiAvail, setAiAvail] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)

  useEffect(() => { aiStatus().then(s => setAiAvail(!!s.available)) }, [])

  const loadQueue = useCallback(async () => {
    setLoading(true)
    const all = await db.notes
      .filter(n => n.paraCategory !== 'inbox')
      .toArray()
    const sorted = all.sort((a, b) => (a.distillationDepth || 0) - (b.distillationDepth || 0))
    setQueue(sorted)
    if (sorted.length > 0) {
      const note = sorted[0]
      if (!note.distillation) {
        note.distillation = { soil: note.content || '', oil: '', gold: '', gems: '' }
      }
      const currentLayer = note.distillationDepth || 0
      if (currentLayer < LAYERS.length) {
        setDraft(note.distillation[LAYERS[currentLayer].key] || '')
      } else {
        setDraft('')
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadQueue() }, [loadQueue])

  const current = queue[currentIdx]

  const saveAndNext = useCallback(async () => {
    if (!current) return
    const currentLayer = current.distillationDepth || 0
    if (currentLayer >= LAYERS.length) {
      setCurrentIdx(s => s + 1)
      return
    }
    const layer = LAYERS[currentLayer]
    const distillation = { ...(current.distillation || { soil: current.content || '', oil: '', gold: '', gems: '' }), [layer.key]: draft }
    const depth = currentLayer + 1

    await db.notes.update(current.id, { distillation, distillationDepth: depth })

    if (currentIdx < queue.length - 1) {
      const next = queue[currentIdx + 1]
      const nextLayer = next.distillationDepth || 0
      if (!next.distillation) {
        next.distillation = { soil: next.content || '', oil: '', gold: '', gems: '' }
      }
      setDraft(nextLayer < LAYERS.length ? (next.distillation[LAYERS[nextLayer].key] || '') : '')
      setCurrentIdx(s => s + 1)
      setCompleted(s => s + 1)
    } else {
      setCompleted(s => s + 1)
      setCurrentIdx(s => s + 1)
    }
  }, [current, currentIdx, draft, queue])

  const skip = useCallback(() => {
    if (currentIdx < queue.length - 1) {
      const next = queue[currentIdx + 1]
      const nextLayer = next.distillationDepth || 0
      if (!next.distillation) {
        next.distillation = { soil: next.content || '', oil: '', gold: '', gems: '' }
      }
      setDraft(nextLayer < LAYERS.length ? (next.distillation[LAYERS[nextLayer].key] || '') : '')
    } else {
      setDraft('')
    }
    setCurrentIdx(s => s + 1)
  }, [currentIdx, queue])

  const autoDraft = useCallback(async () => {
    if (!current || aiBusy) return
    const cl = current.distillationDepth || 0
    if (cl >= LAYERS.length) return
    const key = LAYERS[cl].key
    const prev = cl > 0 ? (current.distillation?.[LAYERS[cl - 1].key] || '') : ''
    const source = (prev && prev.trim()) ? prev : (current.content || current.distillation?.soil || '')
    if (!source.trim()) return
    setAiBusy(true)
    const res = await aiDistill({ title: current.title, source, layer: key })
    setAiBusy(false)
    if (res.ok && res.text) setDraft(res.text)
  }, [current, aiBusy])

  if (loading) {
    return <div className="batch-distill"><div className="zoom-loading">Loading queue...</div></div>
  }

  if (queue.length === 0) {
    return (
      <div className="batch-distill">
        <div className="bd-header">
          <h3>Batch Distill</h3>
          <button className="qc-close" onClick={onClose}>✕</button>
        </div>
        <div className="dd-empty"><p>No notes to distill.</p></div>
      </div>
    )
  }

  if (currentIdx >= queue.length) {
    return (
      <div className="batch-distill">
        <div className="bd-header">
          <h3>Batch Distill</h3>
          <button className="qc-close" onClick={onClose}>✕</button>
        </div>
        <div className="bd-complete">
          <div className="bd-complete-icon">✓</div>
          <h3>All done!</h3>
          <p>Processed {completed} of {queue.length} notes</p>
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }

  const currentLayer = current.distillationDepth || 0
  const layer = currentLayer < LAYERS.length ? LAYERS[currentLayer] : null
  const progress = queue.length > 0 ? Math.round((currentIdx / queue.length) * 100) : 0

  return (
    <div className="batch-distill">
      <div className="bd-header">
        <h3>Batch Distill</h3>
        <div className="bd-header-right">
          <span className="bd-progress-text">{currentIdx + 1} / {queue.length}</span>
          <button className="qc-close" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="bd-progress-bar-track">
        <div className="bd-progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="bd-note">
        <div className="bd-note-header">
          <strong>{current.title}</strong>
          <span className="dd-item-tag">{current.paraCategory}</span>
        </div>
        {layer && (
          <div className="bd-layer-indicator" style={{ borderColor: layer.color }}>
            <span className="bd-layer-badge" style={{ background: layer.color }}>{layer.label}</span>
            <span className="bd-layer-desc">
              {currentLayer === 0 ? 'Original content' : `Current: ${layer.label} layer`}
            </span>
          </div>
        )}
        {currentLayer > 0 && current.distillation && (
          <div className="bd-prev">
            {LAYERS.slice(0, currentLayer).map(l => (
              current.distillation[l.key]?.trim() && (
                <div key={l.key} className="bd-prev-block">
                  <span className="bd-prev-label" style={{ color: l.color }}>{l.label}:</span>
                  <p>{current.distillation[l.key]}</p>
                </div>
              )
            ))}
          </div>
        )}
        {layer ? (
          <div className="bd-editor">
            <div className="bd-editor-head">
              <label className="bd-editor-label">{layer.label} Layer</label>
              {aiAvail && currentLayer > 0 && (
                <button className="zoom-ai-btn" onClick={autoDraft} disabled={aiBusy} title="Draft this layer with Claude">
                  {aiBusy ? 'Drafting…' : '✦ Draft with AI'}
                </button>
              )}
            </div>
            <textarea
              className="zoom-textarea"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={
                currentLayer === 0 ? 'Original note content...' :
                currentLayer === 1 ? 'Bold the key passages...' :
                currentLayer === 2 ? 'Extract the best highlighted passages...' :
                'Write your personal summary...'
              }
              rows={6}
            />
          </div>
        ) : (
          <div className="bd-complete-note">
            <p>This note is fully distilled (4/4 layers).</p>
          </div>
        )}
      </div>

      <div className="bd-actions">
        <button className="btn-secondary" onClick={skip}>Skip</button>
        <button className="btn-primary" onClick={saveAndNext}>
          {currentIdx < queue.length - 1 ? 'Save & Next →' : 'Finish'}
        </button>
      </div>
    </div>
  )
}
