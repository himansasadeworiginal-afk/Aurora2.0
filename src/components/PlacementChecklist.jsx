import { useState } from 'react'
import db from '../data/db'

const QUESTIONS = [
  { key: 'project', label: 'Which Project will this be most useful for?', desc: 'A specific outcome with a deadline' },
  { key: 'area', label: 'If no project: Which Area?', desc: 'A long-term responsibility without a deadline' },
  { key: 'resource', label: 'If no area: Which Resource?', desc: 'A topic or interest that may be useful' },
]

const PARA_MAP = {
  project: 'projects',
  area: 'areas',
  resource: 'resources',
}

export default function PlacementChecklist({ onClose, onCreated }) {
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selection, setSelection] = useState(null)

  const handleSubmit = async () => {
    const paraCategory = selection ? PARA_MAP[selection] : 'archives'

    const note = {
      title: title || 'Untitled',
      content: content || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      paraCategory,
      tags: [],
      source: 'aurora://capture',
    }

    const id = await db.notes.add(note)
    onCreated?.({ ...note, id })
    onClose()
  }

  if (step === 0) {
    return (
      <div className="checklist-overlay">
        <div className="checklist-modal">
          <h2>New Note</h2>
          <div className="checklist-field">
            <label>Title</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What is this about?"
              onKeyDown={e => e.key === 'Enter' && setStep(1)}
            />
          </div>
          <div className="checklist-field">
            <label>Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Capture your thought..."
              rows={4}
            />
          </div>
          <div className="checklist-actions">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={() => setStep(1)} disabled={!title.trim()}>
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checklist-overlay">
      <div className="checklist-modal">
        <h2>Placement Checklist</h2>
        <p className="checklist-sub">Where will this note be most useful?</p>

        {QUESTIONS.map((q, i) => (
          <div
            key={q.key}
            className={`checklist-option ${selection === q.key ? 'selected' : ''}`}
            onClick={() => { setSelection(q.key); setStep(2) }}
          >
            <div className="checklist-option-num">{i + 1}</div>
            <div className="checklist-option-body">
              <strong>{q.label}</strong>
              <p>{q.desc}</p>
            </div>
          </div>
        ))}

        <div
          className={`checklist-option ${selection === 'archive' ? 'selected' : ''}`}
          onClick={() => { setSelection('archive'); setStep(2) }}
        >
          <div className="checklist-option-num">4</div>
          <div className="checklist-option-body">
            <strong>If none: Archives</strong>
            <p>Inactive or unsorted items</p>
          </div>
        </div>

        {step === 2 && (
          <div className="checklist-actions">
            <button className="btn-secondary" onClick={() => { setSelection(null); setStep(1) }}>Back</button>
            <button className="btn-primary" onClick={handleSubmit}>
              Create in {selection === 'archive' ? 'Archives' : QUESTIONS.find(q => q.key === selection)?.label || 'Archives'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
