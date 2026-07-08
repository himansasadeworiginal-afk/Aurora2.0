import { useEffect, useState, useMemo, useCallback } from 'react'
import { searchPeople } from './personMentionData'
import { initials } from '../../sections/Relations/relations-data'
import './person-mention.css'

// The @* search dropdown. Controlled by the host editor: it passes the current
// query + people, an absolute {top,left} anchor, and callbacks. Keyboard nav
// (↑/↓/Enter/Escape) is driven from the host's keydown via the `controlRef`
// imperative handle so it works while focus stays in the textarea.

export default function PersonMentionDropdown({ query, people, anchor, onPick, onCreate, controlRef }) {
  const matches = useMemo(() => searchPeople(query, people, 5), [query, people])
  const [active, setActive] = useState(0)

  useEffect(() => { setActive(0) }, [query])

  const choose = useCallback((i) => {
    if (matches.length === 0) { onCreate?.(query); return }
    const p = matches[Math.max(0, Math.min(matches.length - 1, i))]
    if (p) onPick?.(p)
  }, [matches, query, onCreate, onPick])

  // Expose keyboard handling to the host textarea. Returns true if it consumed
  // the key (so the host can preventDefault).
  useEffect(() => {
    if (!controlRef) return
    controlRef.current = (e) => {
      if (e.key === 'ArrowDown') { setActive(a => Math.min(matches.length - 1, a + 1)); return true }
      if (e.key === 'ArrowUp') { setActive(a => Math.max(0, a - 1)); return true }
      if (e.key === 'Enter' || e.key === 'Tab') { choose(active); return true }
      if (e.key === 'Escape') return 'close'
      return false
    }
    return () => { if (controlRef) controlRef.current = null }
  }, [controlRef, matches, active, choose])

  const style = anchor ? { top: anchor.top, left: anchor.left } : {}

  return (
    <div className="pm-dropdown" style={style} role="listbox">
      {matches.length === 0 ? (
        <button className="pm-dd-item pm-dd-create" onMouseDown={e => { e.preventDefault(); onCreate?.(query) }}>
          No match — <strong>create “{query}”</strong>
        </button>
      ) : matches.map((p, i) => (
        <button
          key={p.id}
          className={`pm-dd-item${i === active ? ' active' : ''}`}
          onMouseEnter={() => setActive(i)}
          onMouseDown={e => { e.preventDefault(); onPick?.(p) }}
        >
          <span className="pm-dd-avatar" aria-hidden="true">{p.profilePic
            ? <img src={p.profilePic} alt="" />
            : initials(p.name)}</span>
          <span className="pm-dd-name">{p.name}</span>
          {(p.skills || [])[0] && <span className="pm-dd-skill">{p.skills[0]}</span>}
        </button>
      ))}
    </div>
  )
}
