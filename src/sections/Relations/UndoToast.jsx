import { useState, useEffect, useCallback } from 'react'

// Stacked 30-second undo toasts for Relations changes from diary detection.
// Each item: { id, label, kind: 'new'|'update', undo: async () => void }.
// After 30s the toast auto-dismisses and the change becomes permanent.

const UNDO_MS = 30000

export default function UndoToast({ items, onDismiss }) {
  if (!items || items.length === 0) return null
  return (
    <div className="rel-undo-stack">
      {items.map(it => <UndoItem key={it.id} item={it} onDismiss={onDismiss} />)}
    </div>
  )
}

function UndoItem({ item, onDismiss }) {
  const [undone, setUndone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => onDismiss(item.id), UNDO_MS)
    return () => clearTimeout(t)
  }, [item.id, onDismiss])

  const handleUndo = useCallback(async () => {
    if (undone) return
    setUndone(true)
    try { await item.undo?.() } catch { /* best-effort revert */ }
    onDismiss(item.id)
    window.dispatchEvent(new Event('aurora-data-changed'))
  }, [item, undone, onDismiss])

  const verb = item.kind === 'update' ? 'updated in' : 'added to'

  return (
    <div className="rel-undo">
      <span className="rel-undo-msg"><strong>{item.label}</strong> {verb} Relations</span>
      <button className="rel-undo-btn" onClick={handleUndo} disabled={undone}>Undo</button>
      <button className="rel-undo-close" onClick={() => onDismiss(item.id)} title="Dismiss (keep change)" aria-label="Dismiss">✕</button>
      <div className="rel-undo-bar" />
    </div>
  )
}
