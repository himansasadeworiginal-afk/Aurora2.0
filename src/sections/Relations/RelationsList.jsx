import { useState, useMemo } from 'react'
import PersonCard from './PersonCard'

// List view: text search + friendliness floor + skill chips + relationship-type
// dropdown, over the person cards grid. All filtering is in-memory (the dataset
// is small) and derived from the people passed down by the Relations shell.

export default function RelationsList({ people, onOpen, onSeed }) {
  const [q, setQ] = useState('')
  const [minFriend, setMinFriend] = useState(0)
  const [activeSkills, setActiveSkills] = useState([])
  const [type, setType] = useState('')
  const [skillsOpen, setSkillsOpen] = useState(false)
  const [skillQuery, setSkillQuery] = useState('')

  const allSkills = useMemo(() => {
    const s = new Set()
    people.forEach(p => (p.skills || []).forEach(k => s.add(k)))
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [people])

  const allTypes = useMemo(() => {
    const s = new Set()
    people.forEach(p => p.relationshipType && s.add(p.relationshipType))
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [people])

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim()
    return people.filter(p => {
      if (minFriend > 0 && (p.friendliness == null || p.friendliness < minFriend)) return false
      if (type && p.relationshipType !== type) return false
      if (activeSkills.length && !activeSkills.every(s => (p.skills || []).includes(s))) return false
      if (needle) {
        const hay = [p.name, (p.skills || []).join(' '), p.location, p.description]
          .filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [people, q, minFriend, type, activeSkills])

  const toggleSkill = (s) =>
    setActiveSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const clearFilters = () => { setQ(''); setMinFriend(0); setActiveSkills([]); setType(''); setSkillQuery('') }
  const anyFilter = q || minFriend > 0 || activeSkills.length > 0 || type

  // Selected skills always shown; the rest filtered by the in-panel search.
  const shownSkills = useMemo(() => {
    const needle = skillQuery.toLowerCase().trim()
    return allSkills.filter(s => activeSkills.includes(s) || !needle || s.toLowerCase().includes(needle))
  }, [allSkills, activeSkills, skillQuery])

  return (
    <div className="rel-list">
      <div className="rel-filters">
        <div className="rel-search">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <circle cx="7" cy="7" r="4.5" /><line x1="10.5" y1="10.5" x2="14" y2="14" />
          </svg>
          <input
            className="rel-search-input"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search name, skill, location…"
          />
        </div>

        <div className="rel-filter-controls">
          <label className="rel-friend-filter">
            <span>Friendliness ≥ <strong>{minFriend}%</strong></span>
            <input type="range" min="0" max="100" step="5" value={minFriend} onChange={e => setMinFriend(Number(e.target.value))} className="rel-slider" />
          </label>

          {allTypes.length > 0 && (
            <div className="rel-select-wrap">
              <select className="rel-select" value={type} onChange={e => setType(e.target.value)}>
                <option value="">All types</option>
                {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <svg className="rel-select-chevron" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4.5L6 7.5 9 4.5" />
              </svg>
            </div>
          )}

          {allSkills.length > 0 && (
            <button
              type="button"
              className={`rel-skill-toggle${skillsOpen ? ' open' : ''}`}
              onClick={() => setSkillsOpen(o => !o)}
            >
              Skills{activeSkills.length ? ` · ${activeSkills.length}` : ''}
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4.5L6 7.5 9 4.5" />
              </svg>
            </button>
          )}

          {anyFilter && <button className="rel-btn-ghost" onClick={clearFilters}>Clear</button>}
        </div>

        {allSkills.length > 0 && skillsOpen && (
          <div className="rel-skill-panel">
            <input
              className="rel-input rel-skill-search"
              value={skillQuery}
              onChange={e => setSkillQuery(e.target.value)}
              placeholder={`Search ${allSkills.length} skills…`}
            />
            <div className="rel-skill-cloud">
              {shownSkills.length === 0
                ? <span className="rel-skill-none">No skills match.</span>
                : shownSkills.map(s => (
                    <button
                      key={s}
                      className={`rel-tag rel-tag-filter${activeSkills.includes(s) ? ' active' : ''}`}
                      onClick={() => toggleSkill(s)}
                      type="button"
                    >{s}</button>
                  ))}
            </div>
          </div>
        )}
      </div>

      <div className="rel-count">{filtered.length} {filtered.length === 1 ? 'person' : 'people'}</div>

      {filtered.length === 0 ? (
        <div className="rel-empty">
          {people.length === 0 ? (
            <>
              <p>No people yet. Add your first with “Add Person”.</p>
              {onSeed && <button className="rel-btn-ghost" onClick={onSeed}>Load 50 sample people</button>}
            </>
          ) : 'No matches. Try clearing filters.'}
        </div>
      ) : (
        <div className="rel-grid">
          {filtered.map(p => <PersonCard key={p.id} person={p} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  )
}
