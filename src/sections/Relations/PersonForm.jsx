import { useState, useCallback, useRef } from 'react'
import { emptyPerson, friendlinessColor } from './relations-data'
import { Avatar } from './PersonCard'

// Add / edit a person. `initial` seeds edit mode; otherwise a blank record.
// Calls onSave(personObject) — the parent persists it. Only name is required.

export default function PersonForm({ initial, onSave, onCancel }) {
  const [p, setP] = useState(() => ({ ...emptyPerson(), ...(initial || {}) }))
  const [skillDraft, setSkillDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const set = useCallback((key, val) => setP(prev => ({ ...prev, [key]: val })), [])

  const onPickImage = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set('profilePic', String(reader.result))
    reader.readAsDataURL(file)
  }, [set])

  const addSkill = useCallback(() => {
    const s = skillDraft.trim()
    if (!s) return
    setP(prev => prev.skills.includes(s) ? prev : { ...prev, skills: [...prev.skills, s] })
    setSkillDraft('')
  }, [skillDraft])

  const onSkillKey = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill() }
  }, [addSkill])

  const removeSkill = useCallback((s) => {
    setP(prev => ({ ...prev, skills: prev.skills.filter(x => x !== s) }))
  }, [])

  const submit = useCallback(async (e) => {
    e.preventDefault()
    if (!p.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      await onSave(p)
    } catch (err) {
      setError(String(err?.message || 'Could not save'))
      setSaving(false)
    }
  }, [p, onSave])

  const fr = p.friendliness === null || p.friendliness === '' ? null : Number(p.friendliness)

  return (
    <form className="rel-form" onSubmit={submit}>
      <div className="rel-form-pic">
        <Avatar person={p} size={72} />
        <div className="rel-form-pic-actions">
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} hidden />
          <button type="button" className="rel-btn-ghost" onClick={() => fileRef.current?.click()}>
            {p.profilePic ? 'Change photo' : 'Upload photo'}
          </button>
          {p.profilePic && (
            <button type="button" className="rel-btn-ghost rel-btn-danger" onClick={() => set('profilePic', null)}>Remove</button>
          )}
        </div>
      </div>

      <label className="rel-field">
        <span className="rel-label">Full Name <em>*</em></span>
        <input className="rel-input" value={p.name} onChange={e => set('name', e.target.value)} placeholder="Jane Doe" autoFocus />
      </label>

      <div className="rel-field-row">
        <label className="rel-field">
          <span className="rel-label">Phone</span>
          <input className="rel-input" value={p.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+1 555-0100" />
        </label>
        <label className="rel-field">
          <span className="rel-label">Email</span>
          <input className="rel-input" type="email" value={p.email || ''} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" />
        </label>
      </div>

      <div className="rel-field-row">
        <label className="rel-field">
          <span className="rel-label">Birthday</span>
          <input className="rel-input" type="date" value={p.birthday || ''} onChange={e => set('birthday', e.target.value)} />
        </label>
        <label className="rel-field">
          <span className="rel-label">Location</span>
          <input className="rel-input" value={p.location || ''} onChange={e => set('location', e.target.value)} placeholder="City, Country" />
        </label>
      </div>

      <label className="rel-field">
        <span className="rel-label">Description</span>
        <textarea className="rel-input rel-textarea" rows={3} value={p.description || ''} onChange={e => set('description', e.target.value)} placeholder="How you know them, notes…" />
      </label>

      <label className="rel-field">
        <span className="rel-label">
          Friendliness {fr != null && <span className="rel-fr-num" style={{ color: friendlinessColor(fr) }}>{fr}%</span>}
        </span>
        <div className="rel-slider-wrap">
          <input
            className="rel-slider"
            type="range" min="0" max="100" step="1"
            value={fr == null ? 50 : fr}
            onChange={e => set('friendliness', Number(e.target.value))}
            style={{ '--fr-color': friendlinessColor(fr == null ? 50 : fr) }}
          />
          {fr == null
            ? <button type="button" className="rel-btn-ghost" onClick={() => set('friendliness', 50)}>Set</button>
            : <button type="button" className="rel-btn-ghost" onClick={() => set('friendliness', null)}>Clear</button>}
        </div>
      </label>

      <div className="rel-field">
        <span className="rel-label">Skills</span>
        <div className="rel-tag-input">
          {p.skills.map(s => (
            <span key={s} className="rel-tag rel-tag-removable" onClick={() => removeSkill(s)}>
              {s}<span className="rel-tag-x">×</span>
            </span>
          ))}
          <input
            className="rel-tag-field"
            value={skillDraft}
            onChange={e => setSkillDraft(e.target.value)}
            onKeyDown={onSkillKey}
            onBlur={addSkill}
            placeholder={p.skills.length ? 'Add…' : 'Type a skill and press Enter'}
          />
        </div>
      </div>

      <div className="rel-field-row">
        <label className="rel-field">
          <span className="rel-label">How We Met</span>
          <input className="rel-input" value={p.howWeMet || ''} onChange={e => set('howWeMet', e.target.value)} placeholder="Conference, mutual friend…" />
        </label>
        <label className="rel-field">
          <span className="rel-label">Relationship Type</span>
          <input className="rel-input" value={p.relationshipType || ''} onChange={e => set('relationshipType', e.target.value)} placeholder="friend, colleague, mentor…" list="rel-types" />
          <datalist id="rel-types">
            <option value="Friend" /><option value="Colleague" /><option value="Mentor" />
            <option value="Mentee" /><option value="Acquaintance" /><option value="Investor" />
            <option value="Freelancer" /><option value="Family" />
          </datalist>
        </label>
      </div>

      {error && <div className="rel-form-error">{error}</div>}

      <div className="rel-form-actions">
        <button type="button" className="rel-btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="rel-btn-primary" disabled={saving || !p.name.trim()}>
          {saving ? 'Saving…' : (initial?.id ? 'Save changes' : 'Add person')}
        </button>
      </div>
    </form>
  )
}
