import { useState, useRef, useCallback } from 'react'
import PersonHoverPanel from './PersonHoverPanel'
import { openPersonProfile } from './personMentionData'
import './person-mention.css'

// Inline @mention hyperlink rendered in note bodies. Hovering (after a 200ms
// delay) reveals the compact profile panel; clicking opens the person's full
// profile in Relations. The panel flips above the link when near the viewport
// bottom.

export default function PersonMentionToken({ person, displayName, onOpen }) {
  const [open, setOpen] = useState(false)
  const [flip, setFlip] = useState(false)
  const timer = useRef(null)
  const ref = useRef(null)

  const show = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const r = ref.current?.getBoundingClientRect()
      if (r) setFlip(r.bottom + 200 > window.innerHeight)
      setOpen(true)
    }, 200)
  }, [])
  const hide = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(false), 120)
  }, [])

  const handleOpen = useCallback((id) => {
    if (onOpen) onOpen(id)
    else openPersonProfile(id)
  }, [onOpen])

  const label = displayName || person?.name || 'Unknown'

  return (
    <span className="pm-token-wrap" ref={ref} onMouseEnter={show} onMouseLeave={hide}>
      <button
        className={`pm-token${person ? '' : ' pm-token-missing'}`}
        onClick={() => person && handleOpen(person.id)}
        type="button"
      >@{label}</button>
      {open && person && (
        <span className={`pm-hover-pos${flip ? ' flip' : ''}`} onMouseEnter={show} onMouseLeave={hide}>
          <PersonHoverPanel person={person} onOpen={handleOpen} />
        </span>
      )}
    </span>
  )
}
