import { useState, useRef, useCallback } from 'react'
import db from '../data/db'
import { reindexNote } from '../data/embeddings'
import { usePersonMentions } from './PersonMention/usePersonMentions'
import { syncNoteMentions } from './PersonMention/personMentionData'
import PersonMentionDropdown from './PersonMention/PersonMentionDropdown'

export default function QuickCapture({ onCapture, allTags, onClose }) {
  const [expanded, setExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('text')
  const [tagSuggestions, setTagSuggestions] = useState([])
  const [voiceSupported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  const inputRef = useRef()
  const recognitionRef = useRef(null)
  const [listening, setListening] = useState(false)

  const mention = usePersonMentions({ textareaRef: inputRef, value: input, setValue: setInput })

  const handleInputChange = useCallback((e) => {
    const val = e.target.value
    setInput(val)
    mention.onValueChange(val, e.target.selectionStart)
    const match = val.match(/#(\w*)$/)
    if (match) {
      const partial = match[1].toLowerCase()
      const suggestions = allTags.filter(t => t.startsWith(partial))
      setTagSuggestions(suggestions.slice(0, 6))
    } else {
      setTagSuggestions([])
    }
  }, [allTags])

  const insertTag = useCallback((tag) => {
    setInput(prev => prev.replace(/#\w*$/, `#${tag} `))
    setTagSuggestions([])
    inputRef.current?.focus()
  }, [])

  const extractUrl = useCallback(async (text) => {
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/)
    if (!urlMatch) return null
    try {
      const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(urlMatch[0])}`, { signal: AbortSignal.timeout(8000) })
      const data = await res.json()
      if (data?.data) {
        return {
          title: data.data.title || urlMatch[0],
          description: data.data.description || '',
          image: data.data.image?.url || '',
          url: urlMatch[0],
        }
      }
    } catch {}
    return { title: urlMatch[0], description: '', image: '', url: urlMatch[0] }
  }, [])

  const handleCapture = useCallback(async () => {
    if (!input.trim()) return
    const tags = [...input.matchAll(/#(\w+)/g)].map(m => m[1].toLowerCase())
    let content = input.replace(/#\w+/g, '').trim()
    let source = 'aurora://quick-capture'

    if (mode === 'url') {
      const metadata = await extractUrl(input)
      if (metadata) {
        content = metadata.description || content
        source = metadata.url
      }
    }

    const title = content.split('\n')[0].slice(0, 80) || 'Quick Capture'
    const note = {
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      paraCategory: 'inbox',
      tags,
      source,
      mentions: mention.mentions,
    }

    const id = await db.notes.add(note)
    if (mention.mentions.length > 0) await syncNoteMentions(id, title, mention.mentions)
    reindexNote({ ...note, id }) // index for search (+ AI concepts when available); fire-and-forget
    onCapture?.({ ...note, id })
    setInput('')
    setExpanded(false)
  }, [input, mode, onCapture, extractUrl, mention.mentions])

  const toggleVoice = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('')
      setInput(prev => prev + ' ' + transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
  }, [listening])

  if (!expanded) {
    return (
      <div className="quick-capture-collapsed">
        <button className="quick-capture-trigger" onClick={() => { setExpanded(true); setTimeout(() => inputRef.current?.focus(), 100) }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.2" />
            <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Quick Capture
        </button>
      </div>
    )
  }

  return (
    <div className="quick-capture">
      <div className="quick-capture-header">
        <span className="quick-capture-label">Quick Capture</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className="quick-capture-modes">
          <button className={`qc-mode ${mode === 'text' ? 'active' : ''}`} onClick={() => setMode('text')}>Text</button>
          <button className={`qc-mode ${mode === 'url' ? 'active' : ''}`} onClick={() => setMode('url')}>URL</button>
          {voiceSupported && (
            <button className={`qc-mode ${listening ? 'listening' : ''}`} onClick={toggleVoice}>
              {listening ? 'Listening...' : 'Voice'}
            </button>
          )}
        </div>
          <button className="qc-close" onClick={onClose} title="Close">✕</button>
        </div>
      </div>
      <div className="quick-capture-body">
        <div className="pm-anchor">
          <textarea
            ref={inputRef}
            className="quick-capture-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => {
              if (mention.open) { mention.onKeyDown(e); if (e.defaultPrevented) return }
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCapture()
            }}
            placeholder={mode === 'url' ? 'Paste a URL to clip...' : 'Capture a thought... (#tags, @*people)'}
            rows={2}
          />
          {mention.open && (
            <PersonMentionDropdown
              query={mention.query}
              people={mention.people}
              controlRef={mention.controlRef}
              onPick={mention.pick}
              onCreate={mention.create}
            />
          )}
        </div>
        {tagSuggestions.length > 0 && (
          <div className="qc-tag-suggestions">
            {tagSuggestions.map(tag => (
              <button key={tag} className="qc-tag-chip" onClick={() => insertTag(tag)}>#{tag}</button>
            ))}
          </div>
        )}
      </div>
      <div className="quick-capture-actions">
        <button className="btn-secondary" onClick={() => setExpanded(false)}>Cancel</button>
        <button className="btn-primary" onClick={handleCapture} disabled={!input.trim()}>
          Capture
        </button>
      </div>
    </div>
  )
}
