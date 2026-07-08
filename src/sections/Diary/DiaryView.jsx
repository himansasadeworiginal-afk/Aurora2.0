import { useState, useEffect, useCallback } from 'react'
import DiaryEntryEditor from './DiaryEntryEditor'
import DiaryDetectionQueue from '../Relations/DiaryDetectionQueue'
import UndoToast from '../Relations/UndoToast'
import { listEntries, deleteEntry, emptyEntry } from './diary-data'
import { listRelations } from '../Relations/relations-data'
import { aiStatus } from '../../data/ai-client'
import './diary-v2.css'

// Diary — dated journal entries with a relationship-flag (*…*) auto-detection
// pipeline. Writing *…* segments and saving (or hitting "Scan Entry") extracts
// people into the Relations DB through a review modal, with a 30-second undo.

export default function DiaryView({ onClose }) {
  const [entries, setEntries] = useState([])
  const [people, setPeople] = useState([])
  const [aiAvail, setAiAvail] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(null) // unsaved new-entry buffer
  const [queue, setQueue] = useState(null) // { entry, detections }
  const [undos, setUndos] = useState([])

  const loadEntries = useCallback(async () => setEntries(await listEntries()), [])
  const loadPeople = useCallback(async () => setPeople(await listRelations()), [])

  useEffect(() => { loadEntries(); loadPeople() }, [loadEntries, loadPeople])
  useEffect(() => { aiStatus().then(s => setAiAvail(!!s.available)) }, [])
  useEffect(() => {
    const h = () => { loadEntries(); loadPeople() }
    window.addEventListener('aurora-data-changed', h)
    return () => window.removeEventListener('aurora-data-changed', h)
  }, [loadEntries, loadPeople])

  const selected = draft || entries.find(e => e.id === selectedId) || null

  const newEntry = useCallback(() => {
    setDraft({ ...emptyEntry() })
    setSelectedId(null)
  }, [])

  const openEntry = useCallback((e) => { setDraft(null); setSelectedId(e.id) }, [])

  const handleSaved = useCallback(async (saved) => {
    setDraft(null)
    setSelectedId(saved.id)
    await loadEntries()
  }, [loadEntries])

  const handleDetections = useCallback((entry, detections) => {
    setQueue({ entry, detections })
  }, [])

  const handleDelete = useCallback(async (e) => {
    await deleteEntry(e.id)
    setSelectedId(null)
    setDraft(null)
    await loadEntries()
  }, [loadEntries])

  const pushUndo = useCallback((result) => {
    if (!result) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setUndos(u => [...u, { id, ...result }])
    loadPeople()
  }, [loadPeople])

  const dismissUndo = useCallback((id) => setUndos(u => u.filter(x => x.id !== id)), [])

  return (
    <div className="diary-v2">
      <header className="diary-head">
        <div className="diary-head-id">
          <h1 className="diary-title">Diary</h1>
          <p className="diary-sub">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>
        </div>
        <div className="diary-head-actions">
          <button className="rel-btn-primary diary-new-btn" onClick={newEntry}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <line x1="7" y1="2.5" x2="7" y2="11.5" /><line x1="2.5" y1="7" x2="11.5" y2="7" />
            </svg>
            New Entry
          </button>
          {onClose && <button className="rel-close" onClick={onClose} title="Back">✕</button>}
        </div>
      </header>

      <div className="diary-body">
        <aside className="diary-list">
          {entries.length === 0 && !draft && (
            <div className="diary-empty">No entries yet. Start writing with “New Entry”.</div>
          )}
          {draft && (
            <button className="diary-list-item active" onClick={() => {}}>
              <span className="diary-li-date">{draft.date}</span>
              <span className="diary-li-title">{draft.title || 'New entry…'}</span>
            </button>
          )}
          {entries.map(e => (
            <button
              key={e.id}
              className={`diary-list-item${!draft && e.id === selectedId ? ' active' : ''}`}
              onClick={() => openEntry(e)}
            >
              <span className="diary-li-date">
                {e.date}
                {e.scanned && <span className="diary-li-badge" title="Scanned for people" />}
              </span>
              <span className="diary-li-title">{e.title || (e.body || '').slice(0, 40) || 'Untitled'}</span>
            </button>
          ))}
        </aside>

        <main className="diary-main">
          {selected ? (
            <DiaryEntryEditor
              key={selected.id || 'draft'}
              entry={selected}
              people={people}
              aiAvailable={aiAvail}
              onSaved={handleSaved}
              onDetections={handleDetections}
              onDelete={handleDelete}
            />
          ) : (
            <div className="diary-placeholder">
              <p>Select an entry or start a new one.</p>
              <p className="diary-hint">Wrap relationship notes in <code>*asterisks*</code> — Aurora extracts the people into Relations.</p>
            </div>
          )}
        </main>
      </div>

      {queue && (
        <DiaryDetectionQueue
          detections={queue.detections}
          people={people}
          entry={queue.entry}
          onClose={() => setQueue(null)}
          onSaved={pushUndo}
        />
      )}

      <UndoToast items={undos} onDismiss={dismissUndo} />
    </div>
  )
}
