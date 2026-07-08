import { useState, useCallback, useEffect } from 'react'
import { Avatar } from './PersonCard'
import PersonForm from './PersonForm'
import db from '../../data/db'
import {
  friendlinessColor, updatePerson, deletePerson,
  buildTimeline, addMemory, deleteMemory, addFact, deleteFact,
} from './relations-data'

// Full-profile modal. A read view with three tabs — Overview (structured
// fields), Memories (an episodic timeline merging diary mentions + manual
// memories), and Notes (evergreen facts + linked Second Brain notes). Edit mode
// reuses PersonForm in-place; Delete is guarded. `onChanged` refreshes the
// parent list/graph after any write.

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'memories', label: 'Memories' },
  { id: 'notes', label: 'Notes' },
]

export default function PersonModal({ person, onClose, onChanged }) {
  const [mode, setMode] = useState('view') // 'view' | 'edit'
  const [tab, setTab] = useState('overview')
  const [confirmDel, setConfirmDel] = useState(false)
  const [current, setCurrent] = useState(person)

  useEffect(() => { setCurrent(person) }, [person])

  // Close on Escape (view mode only — don't lose edits accidentally).
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && mode === 'view') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [mode, onClose])

  const reload = useCallback(async () => {
    const fresh = await db.relations.get(current.id)
    if (fresh) setCurrent(fresh)
    onChanged?.()
  }, [current.id, onChanged])

  const save = useCallback(async (form) => {
    const saved = await updatePerson(current.id, form)
    setCurrent(prev => ({ ...prev, ...saved }))
    setMode('view')
    onChanged?.()
  }, [current, onChanged])

  const doDelete = useCallback(async () => {
    await deletePerson(current.id)
    onChanged?.()
    onClose()
  }, [current, onChanged, onClose])

  const fr = current.friendliness

  return (
    <div className="rel-modal-backdrop" onClick={onClose}>
      <div className="rel-modal" onClick={e => e.stopPropagation()}>
        <button className="rel-modal-close" onClick={onClose} title="Close">✕</button>

        {mode === 'edit' ? (
          <>
            <h2 className="rel-modal-h">Edit person</h2>
            <PersonForm initial={current} onSave={save} onCancel={() => setMode('view')} />
          </>
        ) : (
          <>
            <div className="rel-modal-head">
              <Avatar person={current} size={84} />
              <div className="rel-modal-head-id">
                <h2 className="rel-modal-name">{current.name || 'Unnamed'}</h2>
                {current.relationshipType && <span className="rel-card-type">{current.relationshipType}</span>}
                <div className="rel-friend rel-friend-lg">
                  <div className="rel-friend-track">
                    <div className="rel-friend-fill" style={{ transform: `scaleX(${fr == null ? 0 : Math.max(0, Math.min(100, fr)) / 100})`, background: friendlinessColor(fr) }} />
                  </div>
                  <span className="rel-friend-val" style={{ color: fr == null ? 'var(--text-faint)' : friendlinessColor(fr) }}>
                    {fr == null ? 'Not set' : `${fr}% friendly`}
                  </span>
                </div>
              </div>
            </div>

            <div className="rel-tabs" role="tablist">
              {TABS.map(t => (
                <button
                  key={t.id}
                  role="tab"
                  className={`rel-tab${tab === t.id ? ' active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {t.id === 'memories' && buildTimeline(current).length > 0 && <span className="rel-tab-count">{buildTimeline(current).length}</span>}
                </button>
              ))}
            </div>

            {tab === 'overview' && <Overview person={current} />}
            {tab === 'memories' && <Memories person={current} onReload={reload} />}
            {tab === 'notes' && <Notes person={current} onReload={reload} />}

            <div className="rel-modal-actions">
              {confirmDel ? (
                <div className="rel-confirm">
                  <span>Delete {current.name}?</span>
                  <button className="rel-btn-ghost" onClick={() => setConfirmDel(false)}>Cancel</button>
                  <button className="rel-btn-primary rel-btn-danger" onClick={doDelete}>Delete</button>
                </div>
              ) : (
                <>
                  <button className="rel-btn-ghost rel-btn-danger" onClick={() => setConfirmDel(true)}>Delete</button>
                  <button className="rel-btn-primary" onClick={() => setMode('edit')}>Edit</button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Overview({ person }) {
  return (
    <div className="rel-tabpanel">
      {person.skills?.length > 0 && (
        <div className="rel-card-skills rel-modal-skills">
          {person.skills.map(s => <span key={s} className="rel-tag">{s}</span>)}
        </div>
      )}

      <dl className="rel-detail-grid">
        <Field label="Phone" value={person.phone} />
        <Field label="Email" value={person.email} />
        <Field label="Birthday" value={formatBirthday(person.birthday)} />
        <Field label="Location" value={person.location} />
        <Field label="How we met" value={person.howWeMet} />
        <Field label="Added" value={person.createdAt ? new Date(person.createdAt).toLocaleDateString() : null} />
      </dl>

      {person.description && (
        <div className="rel-detail-desc">
          <span className="rel-label">Bio</span>
          <p>{person.description}</p>
        </div>
      )}
    </div>
  )
}

function Memories({ person, onReload }) {
  const [text, setText] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const timeline = buildTimeline(person)

  const add = useCallback(async () => {
    if (!text.trim()) return
    await addMemory(person.id, text, date)
    setText('')
    await onReload()
  }, [text, date, person.id, onReload])

  const remove = useCallback(async (m) => {
    await deleteMemory(person.id, m.id)
    await onReload()
  }, [person.id, onReload])

  return (
    <div className="rel-tabpanel">
      <div className="rel-log-add">
        <input className="rel-input rel-log-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <input
          className="rel-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add() }}
          placeholder="Add a memory — what happened, a moment together…"
        />
        <button className="rel-btn-primary" onClick={add} disabled={!text.trim()}>Add</button>
      </div>

      {timeline.length === 0 ? (
        <p className="rel-log-empty">No memories yet. Diary mentions land here automatically, or add one above.</p>
      ) : (
        <ul className="rel-timeline">
          {timeline.map(m => (
            <li key={m.id} className="rel-timeline-item">
              <span className="rel-timeline-dot" />
              <div className="rel-timeline-body">
                <div className="rel-timeline-meta">
                  <span className="rel-timeline-date">{m.date || '—'}</span>
                  {m.source === 'diary' && <span className="rel-timeline-src">from diary</span>}
                </div>
                <p className="rel-timeline-text">{m.text}</p>
              </div>
              {m.source === 'manual' && (
                <button className="rel-log-del" onClick={() => remove(m)} title="Delete memory" aria-label="Delete">✕</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Notes({ person, onReload }) {
  const [text, setText] = useState('')
  const facts = person.profileNotes || []
  const linked = person.linkedItems || []

  const add = useCallback(async () => {
    if (!text.trim()) return
    await addFact(person.id, text)
    setText('')
    await onReload()
  }, [text, person.id, onReload])

  const remove = useCallback(async (f) => {
    await deleteFact(person.id, f.id)
    await onReload()
  }, [person.id, onReload])

  const openNote = (noteId) => window.dispatchEvent(new CustomEvent('aurora-open-note', { detail: { noteId } }))

  return (
    <div className="rel-tabpanel">
      <div className="rel-log-add">
        <input
          className="rel-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add() }}
          placeholder="Add a note — a fact worth remembering (allergies, kids, preferences…)"
        />
        <button className="rel-btn-primary" onClick={add} disabled={!text.trim()}>Add</button>
      </div>

      {facts.length === 0 ? (
        <p className="rel-log-empty">No notes yet. Jot down the things worth remembering.</p>
      ) : (
        <ul className="rel-facts">
          {facts.map(f => (
            <li key={f.id} className="rel-fact">
              <span className="rel-fact-mark" />
              <span className="rel-fact-text">{f.text}</span>
              <button className="rel-log-del" onClick={() => remove(f)} title="Delete note" aria-label="Delete">✕</button>
            </li>
          ))}
        </ul>
      )}

      {linked.length > 0 && (
        <div className="rel-linked">
          <span className="rel-label">Linked Second Brain notes</span>
          <ul className="rel-linked-list">
            {linked.map((l, i) => (
              <li key={`${l.noteId}-${i}`}>
                <button className="rel-linked-item" onClick={() => openNote(l.noteId)}>
                  <LinkIcon />
                  <span>{l.noteTitle || 'Untitled note'}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="rel-detail-field">
      <dt className="rel-label">{label}</dt>
      <dd className={value ? 'rel-detail-val' : 'rel-detail-val rel-detail-empty'}>{value || '—'}</dd>
    </div>
  )
}

function LinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a2.5 2.5 0 003.5 0l2-2A2.5 2.5 0 008 2.5l-1 1" />
      <path d="M8 6a2.5 2.5 0 00-3.5 0l-2 2A2.5 2.5 0 006 11.5l1-1" />
    </svg>
  )
}

function formatBirthday(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}
