import { useState, useEffect, useCallback } from 'react'
import db from '../data/db'
import { ideas as fallbackIdeas } from '../data/ideas'

const PARA_CONFIG = {
  projects: { label: 'Projects', color: '#ff4444', icon: '◆' },
  areas: { label: 'Areas', color: '#ff8833', icon: '●' },
  resources: { label: 'Resources', color: '#4488ff', icon: '▬' },
  archives: { label: 'Archives', color: '#888888', icon: '▼' },
}

const TAB_ORDER = ['projects', 'areas', 'resources', 'archives']

function mapParaCategory(idea) {
  if (idea.tags?.includes('work')) return 'projects'
  if (idea.tags?.includes('study')) return 'resources'
  if (idea.tags?.includes('entertainment')) return 'resources'
  const id = (idea.id || '').toLowerCase()
  if (['work', 'black-hall-corp', 'project-aurora', 'project-desmond', 'free-lancing', 'homebite-solutions'].includes(id)) return 'projects'
  return 'resources'
}

export default function PARASidebar({ selected, onSelect, onClose }) {
  const [activeTab, setActiveTab] = useState('projects')
  const [notes, setNotes] = useState([])
  const [counts, setCounts] = useState({})
  const [draggedId, setDraggedId] = useState(null)
  const [usingFallback, setUsingFallback] = useState(false)

  const loadNotes = useCallback(async () => {
    let data, isFallback = false
    try {
      const dbNotes = await db.notes.toArray()
      if (dbNotes.length > 0) {
        data = dbNotes
      } else {
        data = fallbackIdeas.map(idea => ({
          id: idea.id,
          ideaId: idea.id,
          title: idea.title,
          content: idea.description || '',
          paraCategory: mapParaCategory(idea),
          tags: idea.tags || [],
          source: idea.link || '',
          color: idea.color,
          parentId: idea.parentId || null,
          links: idea.links || [],
        }))
        isFallback = true
      }
    } catch {
      data = fallbackIdeas.map(idea => ({
        id: idea.id,
        ideaId: idea.id,
        title: idea.title,
        content: idea.description || '',
        paraCategory: mapParaCategory(idea),
        tags: idea.tags || [],
        source: idea.link || '',
        color: idea.color,
        parentId: idea.parentId || null,
        links: idea.links || [],
      }))
      isFallback = true
    }
    setNotes(data)
    setUsingFallback(isFallback)
    const c = {}
    for (const tab of TAB_ORDER) {
      c[tab] = data.filter(n => n.paraCategory === tab).length
    }
    setCounts(c)
  }, [])

  useEffect(() => {
    loadNotes()
    const interval = setInterval(loadNotes, 2000)
    return () => clearInterval(interval)
  }, [loadNotes])

  const filtered = notes.filter(n => n.paraCategory === activeTab)

  const handleDragStart = (id) => {
    if (!usingFallback) setDraggedId(id)
  }

  const handleDrop = async (category) => {
    if (!draggedId || usingFallback) return
    const note = notes.find(n => n.id === draggedId)
    if (note) {
      await db.notes.put({ ...note, paraCategory: category, updatedAt: new Date() })
      await loadNotes()
    }
    setDraggedId(null)
  }

  return (
    <div className="para-sidebar">
      <div className="para-header">
        <h2>PARA</h2>
        <button className="para-close" onClick={onClose}>✕</button>
      </div>

      <div className="para-tabs">
        {TAB_ORDER.map(tab => {
          const cfg = PARA_CONFIG[tab]
          return (
            <button
              key={tab}
              className={`para-tab ${activeTab === tab ? 'active' : ''}`}
              style={{
                '--tab-color': cfg.color,
                borderBottomColor: activeTab === tab ? cfg.color : 'transparent',
              }}
              onClick={() => setActiveTab(tab)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(tab)}
            >
              <span className="para-tab-icon">{cfg.icon}</span>
              <span className="para-tab-label">{cfg.label}</span>
              <span className="para-tab-count" style={{ background: cfg.color }}>{counts[tab] || 0}</span>
            </button>
          )
        })}
      </div>

      <div className="para-list">
        {filtered.map(note => (
          <div
            key={note.id}
            className={`para-item ${selected === note.ideaId || selected === note.id ? 'active' : ''}`}
            draggable
            onDragStart={() => handleDragStart(note.id)}
            onClick={() => onSelect(note.ideaId || note.id)}
            style={{ '--item-color': note.color || PARA_CONFIG[activeTab].color }}
          >
            <div className="para-item-bar" style={{ background: note.color || PARA_CONFIG[activeTab].color }} />
            <div className="para-item-body">
              <strong>{note.title}</strong>
              <p>{(note.content || '').slice(0, 60)}</p>
              <div className="para-item-tags">
                {(note.tags || []).slice(0, 3).map(t => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="para-empty">
            <span>No {PARA_CONFIG[activeTab].label.toLowerCase()} yet</span>
          </div>
        )}
      </div>
    </div>
  )
}
