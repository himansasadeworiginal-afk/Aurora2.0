import { useState, useCallback, useEffect, useRef } from 'react'
import db from '../data/db'
import { aiDistill, aiStatus } from '../data/ai-client'
import { usePersonMentions } from './PersonMention/usePersonMentions'
import { syncNoteMentions } from './PersonMention/personMentionData'
import PersonMentionDropdown from './PersonMention/PersonMentionDropdown'
import NoteContent from './PersonMention/NoteContent'

const LAYERS = [
  { key: 'soil', label: 'Soil', desc: 'Original full note', color: '#884422', icon: '🟫' },
  { key: 'oil', label: 'Oil', desc: 'Bold passages — highlight what matters', color: '#aa6633', icon: '🟠' },
  { key: 'gold', label: 'Gold', desc: 'Highlighted passages — extract the best', color: '#cc8844', icon: '⭐' },
  { key: 'gems', label: 'Gems', desc: 'Personal summary — your takeaway', color: '#ffaa55', icon: '💎' },
]

export default function ZoomEditor({ noteId, onClose }) {
  const [note, setNote] = useState(null)
  const [activeLayer, setActiveLayer] = useState(0)
  const [loading, setLoading] = useState(true)
  const [aiAvail, setAiAvail] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState(null)

  useEffect(() => { aiStatus().then(s => setAiAvail(!!s.available)) }, [])

  useEffect(() => {
    (async () => {
      const n = await db.notes.get(noteId)
      if (n) {
        if (!n.distillation) {
          n.distillation = { soil: n.content || '', oil: '', gold: '', gems: '' }
        }
        setNote(n)
      }
      setLoading(false)
    })()
  }, [noteId])

  const updateLayer = useCallback(async (key, value) => {
    const updated = { ...note }
    updated.distillation = { ...updated.distillation, [key]: value }
    const depth = ['soil', 'oil', 'gold', 'gems'].indexOf(key) + 1
    Object.keys(updated.distillation).forEach(k => {
      if (updated.distillation[k] && updated.distillation[k].trim()) {
        updated.distillationDepth = Math.max(updated.distillationDepth || 0, ['soil', 'oil', 'gold', 'gems'].indexOf(k) + 1)
      }
    })
    await db.notes.update(noteId, { distillation: updated.distillation, distillationDepth: updated.distillationDepth || depth })
    setNote(updated)
  }, [note, noteId])

  const draftWithAI = useCallback(async () => {
    if (!note || aiBusy) return
    const key = LAYERS[activeLayer].key
    const prev = activeLayer > 0 ? note.distillation[LAYERS[activeLayer - 1].key] : ''
    const source = (prev && prev.trim()) ? prev : (note.content || note.distillation.soil || '')
    if (!source.trim()) { setAiError('Nothing to distill yet.'); return }
    setAiBusy(true)
    setAiError(null)
    const res = await aiDistill({ title: note.title, source, layer: key })
    setAiBusy(false)
    if (res.ok && res.text) await updateLayer(key, res.text)
    else setAiError('AI is offline — write this layer yourself.')
  }, [note, activeLayer, aiBusy, updateLayer])

  const advanceLayer = useCallback(() => {
    if (activeLayer < LAYERS.length - 1) setActiveLayer(s => s + 1)
  }, [activeLayer])

  // @* person mentions on the active layer's textarea. Picked people persist to
  // the note record and sync each person's linkedItems.
  const taRef = useRef(null)
  const layerKey = LAYERS[activeLayer].key
  const mention = usePersonMentions({
    textareaRef: taRef,
    value: note?.distillation?.[layerKey] || '',
    setValue: (v) => updateLayer(layerKey, v),
    initialMentions: note?.mentions,
  })
  useEffect(() => {
    if (!note) return
    const prev = note.mentions || []
    if (mention.mentions.length === prev.length && mention.mentions.every((m, i) => m.personId === prev[i]?.personId)) return
    db.notes.update(noteId, { mentions: mention.mentions })
    syncNoteMentions(noteId, note.title, mention.mentions)
    setNote(n => n ? { ...n, mentions: mention.mentions } : n)
  }, [mention.mentions, note, noteId])

  if (loading || !note) {
    return <div className="zoom-editor"><div className="zoom-loading">Loading...</div></div>
  }

  const layer = LAYERS[activeLayer]
  const isLastLayer = activeLayer === LAYERS.length - 1
  const canAdvance = note.distillation[layer.key]?.trim().length > 0

  return (
    <div className="zoom-editor">
      <div className="zoom-header">
        <div className="zoom-header-left">
          <h3 className="zoom-title">{note.title}</h3>
          <span className="zoom-meta">{note.paraCategory} · {new Date(note.createdAt).toLocaleDateString()}</span>
        </div>
        <button className="qc-close" onClick={onClose}>✕</button>
      </div>

      <div className="zoom-layers">
        {LAYERS.map((l, i) => (
          <button
            key={l.key}
            className={`zoom-layer-tab ${i === activeLayer ? 'active' : ''} ${i < activeLayer ? 'done' : ''}`}
            onClick={() => setActiveLayer(i)}
            style={{ '--layer-color': l.color }}
          >
            <span className="zoom-layer-icon">{l.icon}</span>
            <div className="zoom-layer-info">
              <strong>{l.label}</strong>
              {i === activeLayer && <span className="zoom-layer-desc">{l.desc}</span>}
            </div>
            {i < activeLayer && <span className="zoom-layer-check">✓</span>}
          </button>
        ))}
      </div>

      <div className="zoom-editor-body">
        {activeLayer > 0 && (
          <div className="zoom-prev-layer">
            <span className="zoom-prev-label">{LAYERS[activeLayer - 1].label}:</span>
            <p><NoteContent content={note.distillation[LAYERS[activeLayer - 1].key]} mentions={note.mentions} /></p>
          </div>
        )}

        <div className="zoom-current-layer" style={{ borderColor: layer.color }}>
          <div className="zoom-current-header">
            <span className="zoom-layer-badge" style={{ background: layer.color }}>{layer.label}</span>
            <span className="zoom-layer-hint">{layer.desc}</span>
            {aiAvail && activeLayer > 0 && (
              <button className="zoom-ai-btn" onClick={draftWithAI} disabled={aiBusy} title="Draft this layer with Claude">
                {aiBusy ? 'Drafting…' : '✦ Draft with AI'}
              </button>
            )}
          </div>
          {aiError && <div className="zoom-ai-error">{aiError}</div>}
          <div className="pm-anchor">
            <textarea
              ref={taRef}
              className="zoom-textarea"
              value={note.distillation[layer.key] || ''}
              onChange={e => { updateLayer(layer.key, e.target.value); mention.onValueChange(e.target.value, e.target.selectionStart) }}
              onKeyDown={e => { if (mention.open) mention.onKeyDown(e) }}
              placeholder={
                activeLayer === 0 ? 'Original note content… (@*people to link)' :
                activeLayer === 1 ? 'Bold the key passages from the Soil layer...' :
                activeLayer === 2 ? 'Extract the most valuable highlighted passages...' :
                'Summarize in your own words — the essence of this note...'
              }
              rows={8}
            />
            {mention.open && (
              <PersonMentionDropdown
                query={mention.query}
                people={mention.people}
                controlRef={mention.controlRef}
                onPick={mention.pick}
                onCreate={mention.create}
              />
            )}
          </div>
        </div>
      </div>

      <div className="zoom-footer">
        <div className="zoom-depth-indicator">
          {LAYERS.map((l, i) => (
            <div key={l.key} className={`zoom-dot ${i <= activeLayer ? 'filled' : ''}`} style={{ background: i <= activeLayer ? l.color : 'none' }} />
          ))}
          <span className="zoom-depth-label">{activeLayer + 1}/{LAYERS.length} — {layer.label}</span>
        </div>
        <div className="zoom-actions">
          {!isLastLayer && (
            <button className="btn-primary" onClick={advanceLayer} disabled={!canAdvance}>
              Next: {LAYERS[activeLayer + 1].label} →
            </button>
          )}
          {isLastLayer && (
            <span className="zoom-complete">Complete</span>
          )}
        </div>
      </div>
    </div>
  )
}
