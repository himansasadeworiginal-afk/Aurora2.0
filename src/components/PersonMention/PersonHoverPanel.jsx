import { Avatar } from '../../sections/Relations/PersonCard'
import { friendlinessColor } from '../../sections/Relations/relations-data'

// Compact profile shown on hovering a @mention. Presentational — positioning
// (and the 200ms delay) is handled by PersonMentionToken.

export default function PersonHoverPanel({ person, onOpen }) {
  if (!person) return null
  const fr = person.friendliness
  const skills = (person.skills || []).slice(0, 3).join(', ')
  return (
    <div className="pm-hover" role="dialog">
      <div className="pm-hover-head">
        <Avatar person={person} size={34} />
        <strong className="pm-hover-name">{person.name || 'Unnamed'}</strong>
      </div>
      <dl className="pm-hover-rows">
        {person.location && <div className="pm-hover-row"><LocIcon /><span>{person.location}</span></div>}
        {skills && <div className="pm-hover-row"><SkillIcon /><span>{skills}</span></div>}
        {fr != null && (
          <div className="pm-hover-row">
            <span className="pm-hover-dot" style={{ background: friendlinessColor(fr) }} />
            <span style={{ color: friendlinessColor(fr) }}>{fr}% friendly</span>
          </div>
        )}
      </dl>
      <button className="pm-hover-link" onClick={() => onOpen?.(person.id)}>View Full Profile →</button>
    </div>
  )
}

function LocIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 1.2c2 0 3.4 1.5 3.4 3.4C9.4 7 6 10.8 6 10.8S2.6 7 2.6 4.6C2.6 2.7 4 1.2 6 1.2z" /><circle cx="6" cy="4.6" r="1.1" />
    </svg>
  )
}
function SkillIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 1l1.5 3L11 4.5 8.5 7l.7 3.5L6 8.8 2.8 10.5 3.5 7 1 4.5 4.5 4z" />
    </svg>
  )
}
