import { useState, useEffect, useCallback } from 'react'
import db from '../data/db'

export default function ArchipelagoEditor({ packet, onClose, onBack }) {
  const [items, setItems] = useState([])
  const [bridges, setBridges] = useState({})
  const [packetName, setPacketName] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!packet) return
    setPacketName(packet.name)
    const raw = await db.packetItems.where('packetId').equals(packet.id).toArray()
    const ordered = raw.sort((a, b) => a.position - b.position)
    const enriched = await Promise.all(ordered.map(async item => {
      const note = await db.notes.get(item.noteId)
      return { ...item, note }
    }))
    setItems(enriched)

    const stored = await db.packets.get(packet.id)
    if (stored?.bridges) {
      setBridges(stored.bridges)
    }
  }, [packet])

  useEffect(() => { load() }, [load])

  const handleBridgeChange = (fromIdx, value) => {
    setBridges(prev => ({ ...prev, [`bridge-${fromIdx}`]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    await db.packets.update(packet.id, { bridges, updatedAt: new Date() })
    setSaving(false)
  }

  const handleExport = () => {
    let md = `# Archipelago: ${packetName}\n\n`
    items.forEach((item, idx) => {
      md += `## Island ${idx + 1}: ${item.note?.title || 'Untitled'}\n\n`
      md += `${item.note?.content || 'No content'}\n\n`
      const bridge = bridges[`bridge-${idx}`]
      if (bridge) {
        md += `### Bridge Text\n\n${bridge}\n\n---\n\n`
      }
    })
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${packetName.replace(/\s+/g, '-').toLowerCase()}-archipelago.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="archipelago-editor">
      <div className="ae-header">
        <div className="ae-header-left">
          <button className="btn-secondary" onClick={onBack} style={{ fontSize: '0.65rem', padding: '4px 10px' }}>
            ← Back to Packets
          </button>
          <h3>Archipelago: {packetName}</h3>
        </div>
        <div className="ae-header-actions">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Bridges'}
          </button>
          <button className="btn-secondary" onClick={handleExport} style={{ fontSize: '0.65rem', padding: '4px 12px' }}>
            Export MD
          </button>
          <button className="qc-close" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="ae-body">
        {items.map((item, idx) => (
          <div key={item.id} className="ae-island">
            <div className="ae-island-header">
              <span className="ae-island-num">Island {idx + 1}</span>
              <strong>{item.note?.title || 'Untitled'}</strong>
              <span className="ae-island-meta">
                {item.note?.tags?.slice(0, 3).join(', ')}
              </span>
            </div>
            <div className="ae-island-content">
              <p>{(item.note?.content || 'No content').slice(0, 300)}</p>
            </div>

            {idx < items.length - 1 && (
              <div className="ae-bridge">
                <div className="ae-bridge-label">
                  <span className="ae-bridge-icon">∼</span>
                  Bridge Text
                </div>
                <textarea
                  className="ae-bridge-input"
                  placeholder={`How does "${item.note?.title}" connect to "${items[idx + 1]?.note?.title}"? Write the bridge...`}
                  value={bridges[`bridge-${idx}`] || ''}
                  onChange={e => handleBridgeChange(idx, e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="ae-empty">
            <div className="ae-empty-icon">🏝</div>
            <p>No islands in this archipelago yet</p>
            <span>Add notes to this packet in the Packets workspace first</span>
          </div>
        )}
      </div>
    </div>
  )
}
