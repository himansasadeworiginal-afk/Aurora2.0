import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { tokenizeBody, extractFlags, createEntry, updateEntry, markScanned } from './diary-data'
import { aiRelationsDetect } from '../../data/ai-client'
import { heuristicDetect, compactPerson } from '../Relations/relations-data'

// The diary entry editor. A title + date header over a free-text body with a
// live syntax-highlight overlay for *…* relationship flags. Saving an entry
// that contains flags auto-scans it; a "Scan Entry" button runs the same pass
// manually. Detected people bubble up to DiaryView via onDetections.

export default function DiaryEntryEditor({ entry, people, aiAvailable, onSaved, onDetections, onDelete }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)
  const backdropRef = useRef(null)
  const taRef = useRef(null)

  useEffect(() => {
    setTitle(entry?.title || '')
    setDate(entry?.date || new Date().toISOString().slice(0, 10))
    setBody(entry?.body || '')
    setNote(null)
  }, [entry])

  // Keep the highlight backdrop scroll-aligned with the textarea.
  const syncScroll = useCallback(() => {
    if (backdropRef.current && taRef.current) {
      backdropRef.current.scrollTop = taRef.current.scrollTop
      backdropRef.current.scrollLeft = taRef.current.scrollLeft
    }
  }, [])

  const persist = useCallback(async () => {
    const payload = { ...(entry || {}), title, date, body }
    const saved = entry?.id ? await updateEntry(entry.id, payload) : await createEntry(payload)
    onSaved?.(saved)
    return saved
  }, [entry, title, date, body, onSaved])

  // Run AI (or heuristic) detection over the *…* segments and hand results up.
  const scan = useCallback(async (saved) => {
    const segments = extractFlags(body)
    if (segments.length === 0) { setNote('No *flags* in this entry to scan.'); return }
    setBusy(true)
    setNote(null)
    let detections = []
    if (aiAvailable) {
      const res = await aiRelationsDetect(segments, (people || []).map(compactPerson))
      if (res.ok && Array.isArray(res.detections)) {
        // Attach the source text for each detection (by order) for undo context.
        detections = res.detections.map((d, i) => ({ ...d, sourceText: segments[i] ?? null }))
      }
    }
    if (detections.length === 0) detections = heuristicDetect(segments, people)
    setBusy(false)
    if (saved?.id) await markScanned(saved.id)
    if (detections.length === 0) { setNote('Nothing to extract from those flags.'); return }
    onDetections?.(saved, detections)
  }, [body, aiAvailable, people, onDetections])

  const handleSave = useCallback(async () => {
    if (busy) return
    const saved = await persist()
    if (extractFlags(body).length > 0) await scan(saved)
  }, [busy, persist, body, scan])

  const handleScan = useCallback(async () => {
    if (busy) return
    const saved = await persist()
    await scan(saved)
  }, [busy, persist, scan])

  // Lightweight regex highlight only — recomputed solely when the text changes,
  // never on unrelated re-renders. The AI scan runs ONLY in handleSave /
  // handleScan, never here, so typing stays smooth.
  const tokens = useMemo(() => tokenizeBody(body), [body])
  const flagCount = useMemo(() => tokens.reduce((n, t) => n + (t.flag != null ? 1 : 0), 0), [tokens])

  return (
    <div className="diary-editor">
      <div className="diary-editor-head">
        <input
          className="diary-title-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Untitled entry"
        />
        <input
          className="diary-date-input"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      <div className="diary-input-wrap">
        <div className="diary-backdrop" ref={backdropRef} aria-hidden="true">
          {tokens.map((t, i) => t.flag != null
            ? <mark key={i} className="diary-flag">{t.raw}</mark>
            : <span key={i}>{t.text}</span>)}
          {'\n'}
        </div>
        <textarea
          ref={taRef}
          className="diary-textarea"
          value={body}
          spellCheck={false}
          onChange={e => setBody(e.target.value)}
          onScroll={syncScroll}
          placeholder="Write your day… wrap relationship notes in *asterisks* to capture people — e.g. *Met Nathan, backend dev, very friendly, lives in London*"
        />
      </div>

      <div className="diary-toolbar">
        <div className="diary-toolbar-info">
          {flagCount > 0 && (
            <span className="diary-flag-count">
              <FlagIcon /> {flagCount} {flagCount === 1 ? 'flag' : 'flags'}
            </span>
          )}
          {entry?.scanned && <span className="diary-scanned-badge"><RelIcon /> Scanned</span>}
          {note && <span className="diary-toolbar-note">{note}</span>}
          {!aiAvailable && flagCount > 0 && <span className="diary-toolbar-note">AI offline — review extracted fields manually</span>}
        </div>
        <div className="diary-toolbar-actions">
          {entry?.id && onDelete && <button className="rel-btn-ghost rel-btn-danger" onClick={() => onDelete(entry)}>Delete</button>}
          <button className="rel-btn-ghost" onClick={handleScan} disabled={busy || flagCount === 0}>
            {busy ? 'Scanning…' : 'Scan Entry'}
          </button>
          <button className="rel-btn-primary" onClick={handleSave} disabled={busy}>Save</button>
        </div>
      </div>
    </div>
  )
}

function FlagIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="1.5" x2="3" y2="10.5" /><path d="M3 2h6l-1.5 2L9 6H3" />
    </svg>
  )
}

function RelIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4" cy="4" r="1.6" /><circle cx="9" cy="8.5" r="1.4" /><line x1="5.2" y1="5" x2="7.9" y2="7.6" />
    </svg>
  )
}
