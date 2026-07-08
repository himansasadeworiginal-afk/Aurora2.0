import { useState, useCallback, useMemo } from 'react'
import DiaryDetectionModal from './DiaryDetectionModal'
import { applyDetection } from './relations-data'

// Wraps one or more diary detections in a single modal. Shows "n of m" with
// prev/next navigation; each detection must be saved or discarded. On save it
// applies the change to the Relations DB and emits an undo bundle up to the
// parent (which shows the 30-second UndoToast). Closes once all are resolved.

export default function DiaryDetectionQueue({ detections, people, entry, onClose, onSaved }) {
  const [index, setIndex] = useState(0)
  const [resolved, setResolved] = useState({}) // index -> 'saved' | 'discarded'
  const [busy, setBusy] = useState(false)

  const byId = useMemo(() => {
    const m = new Map()
    ;(people || []).forEach(p => m.set(p.id, p))
    return m
  }, [people])

  const total = detections.length
  const current = detections[index]
  const matched = current?.matchedId != null ? byId.get(current.matchedId) : null

  const advance = useCallback((next) => {
    // Move to the next still-unresolved detection, else close.
    const nextResolved = next
    const remaining = detections.map((_, i) => i).filter(i => !nextResolved[i])
    if (remaining.length === 0) { onClose(); return }
    const after = remaining.find(i => i > index)
    setIndex(after != null ? after : remaining[0])
  }, [detections, index, onClose])

  const handleSave = useCallback(async (edited) => {
    if (busy) return
    setBusy(true)
    try {
      const result = await applyDetection(edited, entry)
      onSaved?.(result)
    } finally {
      setBusy(false)
    }
    const next = { ...resolved, [index]: 'saved' }
    setResolved(next)
    advance(next)
  }, [busy, entry, onSaved, resolved, index, advance])

  const handleDiscard = useCallback(() => {
    const next = { ...resolved, [index]: 'discarded' }
    setResolved(next)
    advance(next)
  }, [resolved, index, advance])

  if (!current) return null

  return (
    <div className="rel-modal-backdrop" onClick={onClose}>
      <div className="rel-modal rel-detect-modal" onClick={e => e.stopPropagation()}>
        <button className="rel-modal-close" onClick={onClose} title="Close">✕</button>

        {total > 1 && (
          <div className="rel-detect-nav">
            <button className="rel-detect-navbtn" disabled={index === 0} onClick={() => setIndex(i => Math.max(0, i - 1))} title="Previous">‹</button>
            <span className="rel-detect-count">{index + 1} of {total} detections</span>
            <button className="rel-detect-navbtn" disabled={index === total - 1} onClick={() => setIndex(i => Math.min(total - 1, i + 1))} title="Next">›</button>
          </div>
        )}

        <DiaryDetectionModal
          key={index}
          detection={current}
          matched={matched}
          onSave={handleSave}
          onDiscard={handleDiscard}
        />
      </div>
    </div>
  )
}
