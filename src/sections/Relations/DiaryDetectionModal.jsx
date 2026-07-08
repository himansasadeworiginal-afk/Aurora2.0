import { useState, useMemo } from 'react'
import { Avatar } from './PersonCard'
import { friendlinessColor } from './relations-data'

// Single-detection review card used inside DiaryDetectionQueue. Renders an
// uncertain-match confirmation step when confidence is low, then an inline-
// editable field form: green-glow fields for a new person, amber-glow for the
// changed fields of an existing one. Emits the edited, confirmed detection back
// up via onSave so the queue can apply it.

const FIELDS = [
  { key: 'name', label: 'Full Name', type: 'text' },
  { key: 'relationshipType', label: 'Relationship', type: 'text' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'skills', label: 'Skills', type: 'tags' },
  { key: 'howWeMet', label: 'How We Met', type: 'text' },
  { key: 'friendliness', label: 'Friendliness', type: 'number' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'birthday', label: 'Birthday', type: 'date' },
  { key: 'description', label: 'Notes', type: 'textarea' },
]

const toFieldValue = (key, v) => {
  if (v == null) return key === 'skills' ? '' : ''
  if (key === 'skills') return Array.isArray(v) ? v.join(', ') : String(v)
  return String(v)
}

export default function DiaryDetectionModal({ detection, matched, onSave, onDiscard }) {
  const isUpdate = detection.type === 'update' && matched
  const uncertain = isUpdate && detection.confidence < 70
  // 'confirm' only for low-confidence updates; otherwise straight to the form.
  const [stage, setStage] = useState(uncertain ? 'confirm' : 'form')
  const [asNew, setAsNew] = useState(false) // user rejected the uncertain match

  const treatUpdate = isUpdate && !asNew
  const fields = detection.extractedFields || {}
  // Keys that came from detection = the green (new) / amber (changed) fields.
  const activeKeys = useMemo(() => new Set(Object.keys(fields).filter(k => FIELDS.some(f => f.key === k))), [fields])

  const seed = useMemo(() => {
    const d = {}
    for (const f of FIELDS) {
      if (treatUpdate) {
        d[f.key] = toFieldValue(f.key, activeKeys.has(f.key) ? fields[f.key] : matched?.[f.key])
      } else {
        d[f.key] = toFieldValue(f.key, fields[f.key])
      }
    }
    return d
  }, [fields, matched, treatUpdate, activeKeys])

  const [draft, setDraft] = useState(seed)
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))

  // Which rows to render: name always; active keys always; for updates a couple
  // of unchanged context fields so the card reads as a real profile.
  const rows = useMemo(() => {
    const shown = new Set(['name'])
    activeKeys.forEach(k => shown.add(k))
    if (treatUpdate) {
      for (const k of ['location', 'relationshipType', 'friendliness']) {
        if (matched?.[k] != null && matched[k] !== '') shown.add(k)
      }
    }
    return FIELDS.filter(f => shown.has(f.key) || (draft[f.key] && draft[f.key] !== ''))
  }, [activeKeys, treatUpdate, matched, draft])

  const fieldState = (key) => {
    if (!activeKeys.has(key)) return 'plain'
    return treatUpdate ? 'changed' : 'new'
  }

  const save = () => {
    // Build the patch from the active keys (plus name for a new person), using
    // the user's edited values. Coercion to real types happens in applyDetection.
    const keys = treatUpdate ? [...activeKeys] : FIELDS.map(f => f.key).filter(k => draft[k] && draft[k] !== '')
    const out = {}
    for (const k of keys) {
      const v = draft[k]
      if (v == null || v === '') continue
      out[k] = v
    }
    if (!treatUpdate && !out.name) out.name = (draft.name || '').trim() || 'Unnamed'
    onSave({
      type: treatUpdate ? 'update' : 'new',
      matchedId: treatUpdate ? detection.matchedId : null,
      extractedFields: out,
      sourceText: detection.sourceText || null,
    })
  }

  if (stage === 'confirm') {
    return (
      <div className="rel-detect-card rel-detect-uncertain">
        <div className="rel-detect-banner rel-detect-banner-warn">
          <WarnIcon /> Is this the right person?
        </div>
        <p className="rel-detect-q">We think this refers to:</p>
        <div className="rel-detect-matchrow">
          <Avatar person={matched} size={40} />
          <div>
            <strong>{matched.name}</strong>
            <span className="rel-detect-matchmeta">
              {[matched.location, (matched.skills || [])[0]].filter(Boolean).join(' · ') || '—'}
            </span>
          </div>
        </div>
        <div className="rel-detect-actions">
          <button className="rel-btn-ghost" onClick={() => { setAsNew(true); setStage('form') }}>No, create new</button>
          <button className="rel-btn-primary" onClick={() => setStage('form')}>Yes, that&apos;s him</button>
        </div>
      </div>
    )
  }

  return (
    <div className="rel-detect-card">
      <div className={`rel-detect-banner ${treatUpdate ? 'rel-detect-banner-update' : 'rel-detect-banner-new'}`}>
        <span className="rel-detect-dot" />
        {treatUpdate ? `Update detected — ${matched.name}` : 'New person detected'}
      </div>

      <div className="rel-detect-head">
        <Avatar person={treatUpdate ? matched : { name: draft.name }} size={56} />
      </div>

      <div className="rel-detect-fields">
        {rows.map(f => {
          const st = fieldState(f.key)
          return (
            <label key={f.key} className={`rel-detect-field rel-detect-${st}`}>
              <span className="rel-detect-flabel">
                {st !== 'plain' && <span className="rel-detect-mark">✦</span>}
                {f.label}
              </span>
              {f.type === 'textarea' ? (
                <textarea className="rel-input" rows={2} value={draft[f.key]} onChange={e => set(f.key, e.target.value)} />
              ) : f.type === 'number' ? (
                <input className="rel-input" type="number" min="0" max="100" value={draft[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  style={draft[f.key] !== '' ? { color: friendlinessColor(Number(draft[f.key])) } : undefined} />
              ) : (
                <input className="rel-input" type={f.type === 'date' ? 'date' : 'text'} value={draft[f.key]}
                  placeholder={f.type === 'tags' ? 'comma, separated' : ''}
                  onChange={e => set(f.key, e.target.value)} />
              )}
            </label>
          )
        })}
      </div>

      <div className="rel-detect-actions">
        <button className="rel-btn-ghost" onClick={onDiscard}>Discard</button>
        <button className="rel-btn-primary" onClick={save}>Save</button>
      </div>
    </div>
  )
}

function WarnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 1.6L13 12H1z" /><line x1="7" y1="5.5" x2="7" y2="8.5" /><circle cx="7" cy="10.3" r="0.5" fill="currentColor" />
    </svg>
  )
}
