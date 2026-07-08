import { useState, useEffect, useCallback } from 'react'
import RelationsList from './RelationsList'
import RelationsGraph from './RelationsGraph'
import RelationsAISearch from './RelationsAISearch'
import PersonModal from './PersonModal'
import PersonForm from './PersonForm'
import { listRelations, createPerson, seedSamplePeople } from './relations-data'
import './relations-v2.css'

// Relations — the Superbrain's relationship-intelligence layer. A standalone
// section with three views (List / Graph / AI Search) over its own `relations`
// store, fully separate from the Second Brain. Person data is loaded once here
// and passed down so all three views stay in sync after edits.

const VIEWS = [
  { id: 'list', label: 'List' },
  { id: 'graph', label: 'Graph' },
  { id: 'search', label: 'AI Search' },
]

export default function Relations({ onClose, openPersonId, onOpenedPerson }) {
  const [view, setView] = useState('list')
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setPeople(await listRelations())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Deep-link from a note @mention: open the requested person's detail modal
  // once people are loaded, then clear the request.
  useEffect(() => {
    if (openPersonId == null || people.length === 0) return
    const person = people.find(p => p.id === openPersonId)
    if (person) setSelected(person)
    onOpenedPerson?.()
  }, [openPersonId, people, onOpenedPerson])

  // Stay live if Desmond/agent ever writes relations (same channel the rest of
  // Aurora listens on).
  useEffect(() => {
    const h = () => load()
    window.addEventListener('aurora-data-changed', h)
    return () => window.removeEventListener('aurora-data-changed', h)
  }, [load])

  const addPerson = useCallback(async (form) => {
    await createPerson(form)
    setAdding(false)
    await load()
  }, [load])

  const seed = useCallback(async () => {
    await seedSamplePeople()
    await load()
  }, [load])

  return (
    <div className="rel-v2">
      <header className="rel-head">
        <div className="rel-head-id">
          <h1 className="rel-title">Relations</h1>
          <p className="rel-sub">{loading ? 'Loading…' : `${people.length} ${people.length === 1 ? 'person' : 'people'} in your network`}</p>
        </div>

        <div className="rel-head-actions">
          <div className="rel-viewtoggle">
            {VIEWS.map(v => (
              <button
                key={v.id}
                className={`rel-viewbtn${view === v.id ? ' active' : ''}`}
                onClick={() => setView(v.id)}
                type="button"
              >{v.label}</button>
            ))}
          </div>
          <button className="rel-btn-primary rel-add-btn" onClick={() => setAdding(true)}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <line x1="7" y1="2.5" x2="7" y2="11.5" /><line x1="2.5" y1="7" x2="11.5" y2="7" />
            </svg>
            Add Person
          </button>
          {onClose && <button className="rel-close" onClick={onClose} title="Back">✕</button>}
        </div>
      </header>

      <div className="rel-body">
        {view === 'list' && <RelationsList people={people} onOpen={setSelected} onSeed={seed} />}
        {view === 'graph' && <RelationsGraph people={people} onOpen={setSelected} />}
        {view === 'search' && <RelationsAISearch people={people} onOpen={setSelected} />}
      </div>

      {selected && (
        <PersonModal person={selected} onClose={() => setSelected(null)} onChanged={load} />
      )}

      {adding && (
        <div className="rel-modal-backdrop" onClick={() => setAdding(false)}>
          <div className="rel-modal" onClick={e => e.stopPropagation()}>
            <button className="rel-modal-close" onClick={() => setAdding(false)} title="Close">✕</button>
            <h2 className="rel-modal-h">Add person</h2>
            <PersonForm onSave={addPerson} onCancel={() => setAdding(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
