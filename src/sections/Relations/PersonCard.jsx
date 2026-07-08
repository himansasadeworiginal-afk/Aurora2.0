import { initials, friendlinessColor } from './relations-data'

// A single person in the list/grid. Profile pic or initials avatar, name,
// friendliness bar, up to 3 skills, optional location. Click → detail modal.
// Also used to render AI-search results (with an optional `reason` line).

export default function PersonCard({ person, reason, onOpen }) {
  const skills = person.skills || []
  const shown = skills.slice(0, 3)
  const extra = skills.length - shown.length
  const fr = person.friendliness
  const color = friendlinessColor(fr)

  return (
    <button className="rel-card" onClick={() => onOpen?.(person)} type="button">
      <div className="rel-card-top">
        <Avatar person={person} />
        <div className="rel-card-id">
          <span className="rel-card-name">{person.name || 'Unnamed'}</span>
          {person.relationshipType && <span className="rel-card-type">{person.relationshipType}</span>}
        </div>
      </div>

      <div className="rel-friend">
        <div className="rel-friend-track">
          <div
            className="rel-friend-fill"
            style={{ transform: `scaleX(${fr == null ? 0 : Math.max(0, Math.min(100, fr)) / 100})`, background: color }}
          />
        </div>
        <span className="rel-friend-val" style={{ color: fr == null ? 'var(--text-faint)' : color }}>
          {fr == null ? '—' : `${fr}%`}
        </span>
      </div>

      {shown.length > 0 && (
        <div className="rel-card-skills">
          {shown.map(s => <span key={s} className="rel-tag">{s}</span>)}
          {extra > 0 && <span className="rel-tag rel-tag-more">+{extra}</span>}
        </div>
      )}

      {person.location && (
        <div className="rel-card-loc">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 1.2c2 0 3.4 1.5 3.4 3.4C9.4 7 6 10.8 6 10.8S2.6 7 2.6 4.6C2.6 2.7 4 1.2 6 1.2z" />
            <circle cx="6" cy="4.6" r="1.1" />
          </svg>
          {person.location}
        </div>
      )}

      {reason && <div className="rel-card-reason">{reason}</div>}
    </button>
  )
}

export function Avatar({ person, size = 44 }) {
  const dim = { width: size, height: size }
  if (person.profilePic) {
    return <img className="rel-avatar" style={dim} src={person.profilePic} alt={person.name || ''} />
  }
  return (
    <div className="rel-avatar rel-avatar-initials" style={dim}>
      {initials(person.name)}
    </div>
  )
}
