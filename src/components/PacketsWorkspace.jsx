import { useState, useEffect, useCallback } from 'react'
import db from '../data/db'

export default function PacketsWorkspace({ onClose, onOpenArchipelago }) {
  const [packets, setPackets] = useState([])
  const [notes, setNotes] = useState([])
  const [selectedPacket, setSelectedPacket] = useState(null)
  const [packetItems, setPacketItems] = useState([])
  const [newPacketName, setNewPacketName] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [draggedNoteId, setDraggedNoteId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const loadPackets = useCallback(async () => {
    const all = await db.packets.toArray()
    setPackets(all.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
  }, [])

  const loadNotes = useCallback(async () => {
    const all = await db.notes.toArray()
    setNotes(all.filter(n => n.paraCategory !== 'inbox'))
  }, [])

  const loadPacketItems = useCallback(async (packetId) => {
    if (!packetId) { setPacketItems([]); return }
    const items = await db.packetItems.where('packetId').equals(packetId).toArray()
    const ordered = items.sort((a, b) => a.position - b.position)
    const enriched = await Promise.all(ordered.map(async item => {
      const note = await db.notes.get(item.noteId)
      return { ...item, note }
    }))
    setPacketItems(enriched)
  }, [])

  useEffect(() => { loadPackets(); loadNotes() }, [loadPackets, loadNotes])

  useEffect(() => {
    if (selectedPacket) loadPacketItems(selectedPacket.id)
  }, [selectedPacket, loadPacketItems])

  const handleCreatePacket = async () => {
    if (!newPacketName.trim()) return
    const now = new Date()
    const id = await db.packets.add({ name: newPacketName.trim(), createdAt: now, updatedAt: now, category: 'general' })
    setNewPacketName('')
    setShowNewForm(false)
    await loadPackets()
    const created = await db.packets.get(id)
    setSelectedPacket(created)
  }

  const handleDeletePacket = async (packetId) => {
    await db.packets.delete(packetId)
    await db.packetItems.where('packetId').equals(packetId).delete()
    if (selectedPacket?.id === packetId) setSelectedPacket(null)
    await loadPackets()
  }

  const handleDragNoteStart = (noteId) => setDraggedNoteId(noteId)

  const handleDropNote = async (packetId) => {
    if (!draggedNoteId) return
    const existing = await db.packetItems.where({ packetId, noteId: draggedNoteId }).count()
    if (existing > 0) { setDraggedNoteId(null); return }
    const count = await db.packetItems.where('packetId').equals(packetId).count()
    await db.packetItems.add({ packetId, noteId: draggedNoteId, position: count, addedAt: new Date() })
    await db.packets.update(packetId, { updatedAt: new Date() })
    setDraggedNoteId(null)
    if (selectedPacket?.id === packetId) await loadPacketItems(packetId)
    await loadPackets()
  }

  const handleRemoveItem = async (itemId, packetId) => {
    await db.packetItems.delete(itemId)
    await db.packets.update(packetId, { updatedAt: new Date() })
    await loadPacketItems(packetId)
    await loadPackets()
  }

  const handleReorder = async (itemId, direction, packetId) => {
    const items = await db.packetItems.where('packetId').equals(packetId).toArray()
    const sorted = items.sort((a, b) => a.position - b.position)
    const idx = sorted.findIndex(i => i.id === itemId)
    if (idx === -1) return
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const a = sorted[idx]
    const b = sorted[swapIdx]
    await db.packetItems.update(a.id, { position: b.position })
    await db.packetItems.update(b.id, { position: a.position })
    await loadPacketItems(packetId)
  }

  const filteredNotes = notes.filter(n => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)
  })

  return (
    <div className="packets-workspace">
      <div className="pw-header">
        <div className="pw-header-left">
          <h3>Intermediate Packets</h3>
          <span className="pw-sub">Drag notes from PARA to build expressive packets</span>
        </div>
        <div className="pw-header-actions">
          <button className="btn-primary" onClick={() => setShowNewForm(true)}>
            + New Packet
          </button>
          <button className="qc-close" onClick={onClose}>✕</button>
        </div>
      </div>

      {showNewForm && (
        <div className="pw-new-form">
          <input
            className="pw-new-input"
            placeholder="Packet name..."
            value={newPacketName}
            onChange={e => setNewPacketName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreatePacket() }}
            autoFocus
          />
          <button className="btn-primary" onClick={handleCreatePacket}>Create</button>
          <button className="btn-secondary" onClick={() => { setShowNewForm(false); setNewPacketName('') }}>Cancel</button>
        </div>
      )}

      <div className="pw-body">
        <div className="pw-notes-panel">
          <div className="pw-notes-header">
            <strong>Notes</strong>
            <input
              className="pw-search"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="pw-notes-list">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                className="pw-note-item"
                draggable
                onDragStart={() => handleDragNoteStart(note.id)}
                style={{ borderLeftColor: note.color || '#884444' }}
              >
                <strong>{note.title}</strong>
                <p>{(note.content || '').slice(0, 80)}</p>
                <span className="pw-note-category" style={{
                  background: note.paraCategory === 'projects' ? 'rgba(255,68,68,0.15)' :
                    note.paraCategory === 'areas' ? 'rgba(255,136,51,0.15)' :
                    note.paraCategory === 'archives' ? 'rgba(136,136,136,0.15)' : 'rgba(68,136,255,0.15)',
                  color: note.paraCategory === 'projects' ? '#ff6666' :
                    note.paraCategory === 'areas' ? '#ffaa66' :
                    note.paraCategory === 'archives' ? '#aaaaaa' : '#66aaff',
                }}>
                  {note.paraCategory}
                </span>
              </div>
            ))}
            {filteredNotes.length === 0 && (
              <div className="pw-empty">No notes found</div>
            )}
          </div>
        </div>

        <div className="pw-packets-panel">
          <div className="pw-packets-list">
            {packets.map(pkt => (
              <div
                key={pkt.id}
                className={`pw-packet-card ${selectedPacket?.id === pkt.id ? 'active' : ''}`}
                onClick={() => setSelectedPacket(pkt)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDropNote(pkt.id)}
              >
                <div className="pw-packet-header">
                  <strong>{pkt.name}</strong>
                  <div className="pw-packet-actions">
                    <button
                      className="pw-packet-btn"
                      onClick={e => { e.stopPropagation(); handleDeletePacket(pkt.id) }}
                      title="Delete packet"
                    >🗑</button>
                  </div>
                </div>
                <span className="pw-packet-meta">Updated {new Date(pkt.updatedAt).toLocaleDateString()}</span>
              </div>
            ))}
            {packets.length === 0 && (
              <div className="pw-empty">No packets yet. Create one to start.</div>
            )}
          </div>

          {selectedPacket && (
            <div className="pw-packet-detail">
              <div className="pw-packet-detail-header">
                <h4>{selectedPacket.name}</h4>
                {packetItems.length > 0 && (
                  <button
                    className="btn-primary"
                    onClick={() => onOpenArchipelago(selectedPacket)}
                    style={{ fontSize: '0.65rem', padding: '4px 12px' }}
                  >
                    Open in Archipelago
                  </button>
                )}
              </div>
              <div className="pw-packet-items">
                {packetItems.map((item, idx) => (
                  <div key={item.id} className="pw-item-row">
                    <span className="pw-item-pos">{idx + 1}</span>
                    <div className="pw-item-body">
                      <strong>{item.note?.title || 'Unknown note'}</strong>
                      <p>{(item.note?.content || '').slice(0, 60)}</p>
                    </div>
                    <div className="pw-item-actions">
                      <button className="pw-item-btn" onClick={() => handleReorder(item.id, -1, selectedPacket.id)} disabled={idx === 0}>↑</button>
                      <button className="pw-item-btn" onClick={() => handleReorder(item.id, 1, selectedPacket.id)} disabled={idx === packetItems.length - 1}>↓</button>
                      <button className="pw-item-btn remove" onClick={() => handleRemoveItem(item.id, selectedPacket.id)}>✕</button>
                    </div>
                  </div>
                ))}
                {packetItems.length === 0 && (
                  <div className="pw-empty">Drop notes here to add them to this packet</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
