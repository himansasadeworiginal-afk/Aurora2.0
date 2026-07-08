import { useState, useEffect, useCallback, useRef } from 'react'
import db from '../data/db'
import './QuickCapturePage.css'

const DRAFT_KEY = 'aurora-capture-draft'

// Vault routing → PARA category + tag + accent colour
const VAULTS = [
  { key: 'research', label: 'Research', para: 'resources', color: '#ddb7ff', icon: 'flask' },
  { key: 'ideas',    label: 'Ideas',    para: 'inbox',     color: '#4cd7f6', icon: 'bulb' },
  { key: 'personal', label: 'Personal', para: 'areas',     color: '#ffb690', icon: 'person' },
  { key: 'projects', label: 'Projects', para: 'projects',  color: '#b76dff', icon: 'work' },
]

const Ico = {
  flask: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6"/><path d="M10 3v6l-5 8a2 2 0 002 3h10a2 2 0 002-3l-5-8V3"/><path d="M7 15h10"/></svg>,
  bulb: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 00-4 10.5c.7.7 1 1.2 1 2.5h6c0-1.3.3-1.8 1-2.5A6 6 0 0012 3z"/></svg>,
  person: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/></svg>,
  work: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.2 14.2l-4-4 1.4-1.4 2.6 2.6 5.6-5.6L17.8 9z"/></svg>,
  mic: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0012 0"/><path d="M12 17v4"/></svg>,
  link: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1"/><path d="M14 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l1-1"/></svg>,
  image: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-9 9"/></svg>,
  code: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 8l-4 4 4 4"/><path d="M15 8l4 4-4 4"/></svg>,
  doc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4"/><path d="M9 13h6"/><path d="M9 17h4"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4l10-10-4-4L4 16z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"/><path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13"/></svg>,
}

function relTime(d) {
  const ms = Date.now() - new Date(d).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`
  const day = Math.floor(hr / 24)
  return `${day} day${day === 1 ? '' : 's'} ago`
}

export default function QuickCapturePage({ onClose }) {
  const [text, setText] = useState(() => localStorage.getItem(DRAFT_KEY) || '')
  const [vault, setVault] = useState('research')
  const [recent, setRecent] = useState([])
  const [saving, setSaving] = useState(false)
  const taRef = useRef(null)

  const loadRecent = useCallback(async () => {
    try {
      const notes = await db.notes.toArray()
      notes.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      setRecent(notes.slice(0, 6))
    } catch {}
  }, [])

  useEffect(() => { loadRecent(); taRef.current?.focus() }, [loadRecent])

  // Auto-save draft to localStorage
  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, text)
      setSaving(false)
    }, 500)
    if (text) setSaving(true)
    return () => clearTimeout(id)
  }, [text])

  const capture = useCallback(async () => {
    const body = text.trim()
    if (!body) return
    const v = VAULTS.find(x => x.key === vault) || VAULTS[0]
    const inlineTags = [...body.matchAll(/#(\w+)/g)].map(m => m[1].toLowerCase())
    const title = body.split('\n')[0].replace(/#\w+/g, '').trim().slice(0, 80) || 'Quick Capture'
    await db.notes.add({
      title,
      content: body,
      createdAt: new Date(),
      updatedAt: new Date(),
      paraCategory: v.para,
      tags: [...new Set([v.key, ...inlineTags])],
      source: 'aurora://quick-capture',
      mentions: [],
    })
    setText('')
    localStorage.removeItem(DRAFT_KEY)
    window.dispatchEvent(new CustomEvent('aurora-data-changed'))
    loadRecent()
    taRef.current?.focus()
  }, [text, vault, loadRecent])

  const deleteNote = useCallback(async (id) => {
    await db.notes.delete(id)
    window.dispatchEvent(new CustomEvent('aurora-data-changed'))
    loadRecent()
  }, [loadRecent])

  // Toolbar helpers — insert markdown at the cursor
  const insertAtCursor = (before, after = '') => {
    const ta = taRef.current
    if (!ta) return
    const s = ta.selectionStart, e = ta.selectionEnd
    const sel = text.slice(s, e)
    const next = text.slice(0, s) + before + sel + after + text.slice(e)
    setText(next)
    requestAnimationFrame(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = s + before.length + sel.length + after.length })
  }
  const addLink = () => {
    const url = window.prompt('Link URL')
    if (url) insertAtCursor(`[link](${url})`)
  }

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); capture() }
    if (e.key === 'Escape') setText('')
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="qc">
      <div className="qc-topbar">
        <div className="qc-topnav">
          <button className="qc-topnav-item" onClick={() => (location.hash = 'dashboard')}>Dashboard</button>
          <button className="qc-topnav-item active">Quick Capture</button>
          <button className="qc-topnav-item" onClick={() => (location.hash = 'brain')}>Second Brain</button>
        </div>
        {onClose && <button className="qc-close" onClick={onClose} title="Back to dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
        </button>}
      </div>

      <div className="qc-body">
        {/* Center */}
        <div className="qc-center">
          <div className="qc-head">
            <div>
              <h1 className="qc-title">Quick Capture</h1>
              <p className="qc-sub">Focus on the thought, let Aurora handle the rest.</p>
            </div>
            <div className="qc-autosave">
              <span className={'qc-autosave-dot' + (saving ? ' on' : '')} />
              {saving ? 'Auto-saving…' : (text ? 'Saved' : 'Ready')}
            </div>
          </div>

          <div className="qc-editor">
            <div className="qc-editor-keys">
              <span className="qc-key">⌘ + S</span>
              <span className="qc-key">ESC</span>
            </div>
            <textarea
              ref={taRef}
              className="qc-textarea"
              placeholder="Start typing your brilliance here..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <div className="qc-editor-foot">
              <div className="qc-tools">
                <button className="qc-tool" title="Voice note (offline)" onClick={() => insertAtCursor('🎤 ')}>{Ico.mic}</button>
                <button className="qc-tool sec" title="Add link" onClick={addLink}>{Ico.link}</button>
                <button className="qc-tool ter" title="Image reference" onClick={() => insertAtCursor('![image]()')}>{Ico.image}</button>
                <button className="qc-tool" title="Code block" onClick={() => insertAtCursor('\n```\n', '\n```\n')}>{Ico.code}</button>
                <span className="qc-wordcount">{words} word{words === 1 ? '' : 's'}</span>
              </div>
              <button className="qc-capture" onClick={capture} disabled={!text.trim()}>Capture &amp; Clear</button>
            </div>
          </div>

          {/* Recent captures */}
          <section className="qc-recent">
            <div className="qc-recent-head">
              <h2>Recent Captures</h2>
              <button className="qc-viewall" onClick={() => (location.hash = 'brain')}>View All History</button>
            </div>
            <div className="qc-recent-list">
              {recent.length === 0 ? (
                <div className="qc-recent-empty">Nothing captured yet. Your notes will appear here.</div>
              ) : recent.map(n => {
                const tag = (n.tags && n.tags[0]) || n.paraCategory || 'inbox'
                const color = VAULTS.find(v => v.key === tag)?.color || '#ddb7ff'
                return (
                  <div className="qc-item" key={n.id}>
                    <span className="qc-item-ico" style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>{Ico.doc}</span>
                    <div className="qc-item-body">
                      <h4>{n.title || 'Untitled'}</h4>
                      <p>Captured {relTime(n.createdAt)} in <span style={{ color }}>#{tag}</span></p>
                    </div>
                    <div className="qc-item-actions">
                      <button className="qc-item-act" title="Open in Second Brain" onClick={() => window.dispatchEvent(new CustomEvent('aurora-open-note', { detail: { noteId: n.id } }))}>{Ico.edit}</button>
                      <button className="qc-item-act del" title="Delete" onClick={() => deleteNote(n.id)}>{Ico.trash}</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Right rail */}
        <aside className="qc-rail">
          <div className="qc-routing">
            <h3>Vault Routing</h3>
            <div className="qc-vaults">
              {VAULTS.map(v => (
                <button
                  key={v.key}
                  className={'qc-vault' + (vault === v.key ? ' active' : '')}
                  style={{ '--vc': v.color }}
                  onClick={() => setVault(v.key)}
                >
                  <span className="qc-vault-left">
                    <span className="qc-vault-ico">{Ico[v.icon]}</span>
                    <span className="qc-vault-name">{v.label}</span>
                  </span>
                  {vault === v.key && <span className="qc-vault-check">{Ico.check}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="qc-shortcuts">
            <span className="qc-shortcuts-glow" />
            <h3>Shortcuts</h3>
            <div className="qc-shortcut-list">
              <div className="qc-shortcut"><span>Capture &amp; Clear</span><span className="qc-kbd">⌘ + S</span></div>
              <div className="qc-shortcut"><span>Clear Draft</span><span className="qc-kbd">ESC</span></div>
              <div className="qc-shortcut"><span>Add Link</span><span className="qc-kbd">⌘ + K</span></div>
              <div className="qc-shortcut"><span>Focus Search</span><span className="qc-kbd">/</span></div>
            </div>
          </div>

          <div className="qc-insight">
            <p className="qc-insight-cap">Weekly Insight</p>
            <p className="qc-insight-quote">“The shortest pencil is longer than the longest memory.”</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
