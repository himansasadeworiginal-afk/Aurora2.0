import { useState, useEffect, useCallback } from 'react'
import db from '../data/db'

export default function ExportDialog({ onClose }) {
  const [notes, setNotes] = useState([])
  const [packets, setPackets] = useState([])
  const [selectedType, setSelectedType] = useState('notes')
  const [exportFormat, setExportFormat] = useState('markdown')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [selectAll, setSelectAll] = useState(true)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    const allNotes = await db.notes.toArray()
    setNotes(allNotes.filter(n => n.paraCategory !== 'inbox'))
    const allPackets = await db.packets.toArray()
    setPackets(allPackets)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const items = selectedType === 'notes' ? notes : packets
    if (selectAll) setSelectedIds(new Set(items.map(i => i.id)))
    else setSelectedIds(new Set())
  }, [selectAll, selectedType, notes, packets])

  const toggleItem = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSelectAll(false)
  }

  const handleExport = async () => {
    setExporting(true)
    let content = ''
    const ext = exportFormat === 'markdown' ? 'md' : exportFormat === 'html' ? 'html' : 'txt'
    const mime = exportFormat === 'markdown' ? 'text/markdown' : exportFormat === 'html' ? 'text/html' : 'text/plain'

    if (selectedType === 'notes') {
      const selected = notes.filter(n => selectedIds.has(n.id))
      if (exportFormat === 'markdown') {
        content = `# Aurora 3.3 Export — Notes\n\n_Exported ${new Date().toLocaleString()}_\n\n---\n\n`
        selected.forEach(n => {
          content += `## ${n.title}\n\n`
          content += `${n.content || 'No content'}\n\n`
          content += `**Category:** ${n.paraCategory}\n`
          content += `**Tags:** ${(n.tags || []).join(', ')}\n`
          content += `**Created:** ${new Date(n.createdAt).toLocaleDateString()}\n`
          content += `**Distillation:** ${n.distillationDepth || 0}/4 layers\n`
          content += `\n---\n\n`
        })
      } else if (exportFormat === 'html') {
        content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Aurora 3.3 Export</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6}h1{color:#e60000}hr{border:none;border-top:1px solid #ddd}pre{background:#f5f5f5;padding:12px;border-radius:6px}</style></head><body>`
        content += `<h1>Aurora 3.3 Export — Notes</h1><p><em>Exported ${new Date().toLocaleString()}</em></p><hr>`
        selected.forEach(n => {
          content += `<h2>${n.title}</h2><p>${n.content || 'No content'}</p>`
          content += `<p><strong>Category:</strong> ${n.paraCategory} &middot; <strong>Tags:</strong> ${(n.tags || []).join(', ')}</p><hr>`
        })
        content += `</body></html>`
      } else {
        content = `Aurora 3.3 Export — Notes\nExported: ${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n`
        selected.forEach(n => {
          content += `${n.title}\n${'-'.repeat(n.title.length)}\n${n.content || 'No content'}\n\nCategory: ${n.paraCategory} | Tags: ${(n.tags || []).join(', ')}\n\n${'='.repeat(50)}\n\n`
        })
      }
    } else {
      const selected = packets.filter(p => selectedIds.has(p.id))
      if (exportFormat === 'markdown') {
        content = `# Aurora 3.3 Export — Packets\n\n_Exported ${new Date().toLocaleString()}_\n\n---\n\n`
        for (const pkt of selected) {
          content += `## Packet: ${pkt.name}\n\n`
          const items = await db.packetItems.where('packetId').equals(pkt.id).toArray()
          for (const item of items.sort((a, b) => a.position - b.position)) {
            const note = await db.notes.get(item.noteId)
            if (note) {
              content += `### ${note.title}\n\n${note.content || 'No content'}\n\n`
            }
          }
          content += `---\n\n`
        }
      } else {
        content = `Packet export in ${exportFormat} format — ${selected.length} packets`
      }
    }

    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aurora-export-${new Date().toISOString().split('T')[0]}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const items = selectedType === 'notes' ? notes : packets

  return (
    <div className="export-dialog">
      <div className="ed-header">
        <h3>Export</h3>
        <span className="ed-sub">Export notes and packets to Markdown, HTML, or Plain Text</span>
        <div className="ed-header-actions">
          <button className="qc-close" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="ed-body">
        <div className="ed-options">
          <div className="ed-type-toggle">
            <button
              className={`ed-type-btn ${selectedType === 'notes' ? 'active' : ''}`}
              onClick={() => { setSelectedType('notes'); setSelectAll(true) }}
            >Notes ({notes.length})</button>
            <button
              className={`ed-type-btn ${selectedType === 'packets' ? 'active' : ''}`}
              onClick={() => { setSelectedType('packets'); setSelectAll(true) }}
            >Packets ({packets.length})</button>
          </div>

          <div className="ed-format-select">
            <label>Format:</label>
            <select value={exportFormat} onChange={e => setExportFormat(e.target.value)}>
              <option value="markdown">Markdown (.md)</option>
              <option value="html">HTML (.html)</option>
              <option value="text">Plain Text (.txt)</option>
            </select>
          </div>
        </div>

        <div className="ed-items">
          <div className="ed-items-header">
            <label className="ed-check-all">
              <input type="checkbox" checked={selectAll} onChange={() => setSelectAll(!selectAll)} />
              <span>{selectAll ? 'Deselect All' : 'Select All'}</span>
            </label>
            <span className="ed-count">{selectedIds.size} selected</span>
          </div>
          <div className="ed-items-list">
            {items.map(item => (
              <div key={item.id} className="ed-item" onClick={() => toggleItem(item.id)}>
                <input type="checkbox" checked={selectedIds.has(item.id)} readOnly />
                <div className="ed-item-body">
                  <strong>{item.title || item.name}</strong>
                  <span className="ed-item-meta">
                    {'tags' in item ? item.paraCategory : `packet`}
                  </span>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="ed-empty">Nothing to export</div>
            )}
          </div>
        </div>

        <div className="ed-actions">
          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={exporting || selectedIds.size === 0}
          >
            {exporting ? 'Exporting...' : `Export ${selectedIds.size} item(s) as ${exportFormat.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  )
}
