import { useState } from 'react'
import db from '../data/db'

const STEPS = [
  {
    title: 'Capture',
    desc: 'What are you trying to achieve?',
    placeholder: 'Describe the project goal...',
    field: 'goal',
  },
  {
    title: 'Review',
    desc: 'Check existing notes for relevant material',
    placeholder: 'Any existing notes or folders to review?',
    field: 'review',
  },
  {
    title: 'Search',
    desc: 'Search for related terms across PARA',
    placeholder: 'Keywords to search for...',
    field: 'search',
  },
  {
    title: 'Organize',
    desc: 'Move relevant notes into the project folder',
    placeholder: 'Which notes should be included?',
    field: 'organize',
  },
  {
    title: 'Outline',
    desc: 'Create an Archipelago of Ideas outline',
    placeholder: 'Main sections of the project plan...',
    field: 'outline',
  },
]

export default function ProjectKickoff({ onClose }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({})

  const update = (field, value) => setData(prev => ({ ...prev, [field]: value }))

  const handleFinish = async () => {
    const project = {
      name: data.goal?.slice(0, 60) || 'New Project',
      deadline: null,
      status: 'active',
      paraCategory: 'projects',
      content: Object.entries(data)
        .filter(([k]) => k !== 'review')
        .map(([k, v]) => `## ${k}\n${v}`)
        .join('\n\n'),
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['project'],
      source: 'aurora://kickoff',
    }

    await db.notes.add(project)
    onClose()
  }

  return (
    <div className="kickoff-overlay">
      <div className="kickoff-modal">
        <div className="kickoff-header">
          <h2>New Project</h2>
          <div className="kickoff-steps">
            {STEPS.map((s, i) => (
              <div key={s.title} className={`kickoff-step-dot ${i <= step ? 'active' : ''} ${i === step ? 'current' : ''}`}>
                <span>{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="kickoff-step-title">{STEPS[step].title} — {STEPS[step].desc}</p>
        </div>

        <textarea
          className="kickoff-input"
          value={data[STEPS[step].field] || ''}
          onChange={e => update(STEPS[step].field, e.target.value)}
          placeholder={STEPS[step].placeholder}
          rows={6}
          autoFocus
        />

        <div className="kickoff-actions">
          <button className="btn-secondary" onClick={step === 0 ? onClose : () => setStep(s => s - 1)}>
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <button
            className="btn-primary"
            onClick={step === STEPS.length - 1 ? handleFinish : () => setStep(s => s + 1)}
          >
            {step === STEPS.length - 1 ? 'Create Project' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
