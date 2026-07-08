import React from 'react';

const S = { stroke: 'currentColor', fill: 'none', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round' }

const ICONS = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 18 18" {...S}>
      <path d="M3 8l6-5 6 5v7a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
    </svg>
  ),
  brain: (
    <svg width="18" height="18" viewBox="0 0 18 18" {...S}>
      <circle cx="9" cy="5" r="2.5" />
      <circle cx="4.5" cy="13" r="2.5" />
      <circle cx="13.5" cy="13" r="2.5" />
      <line x1="7.5" y1="7" x2="5.5" y2="10.5" />
      <line x1="10.5" y1="7" x2="12.5" y2="10.5" />
      <line x1="4.5" y1="13" x2="13.5" y2="13" />
    </svg>
  ),
  agenda: (
    <svg width="18" height="18" viewBox="0 0 18 18" {...S}>
      <rect x="3" y="3" width="12" height="12" rx="1.5" />
      <path d="M6 10l2 2 4-4" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 18 18" {...S}>
      <rect x="2.5" y="4.5" width="13" height="11" rx="1.5" />
      <line x1="2.5" y1="8" x2="15.5" y2="8" />
      <line x1="6" y1="2.5" x2="6" y2="5.5" />
      <line x1="12" y1="2.5" x2="12" y2="5.5" />
    </svg>
  ),
  trackers: (
    <svg width="18" height="18" viewBox="0 0 18 18" {...S}>
      <circle cx="9" cy="9" r="6.5" />
      <circle cx="9" cy="9" r="3.5" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  todos: (
    <svg width="18" height="18" viewBox="0 0 18 18" {...S}>
      <path d="M3 5l1.5 1.5L7 4" />
      <path d="M3 11l1.5 1.5L7 9" />
      <line x1="9.5" y1="5" x2="15" y2="5" />
      <line x1="9.5" y1="11" x2="15" y2="11" />
    </svg>
  ),
  relations: (
    <svg width="18" height="18" viewBox="0 0 18 18" {...S}>
      <circle cx="9" cy="6" r="2.2" />
      <path d="M4.5 14.5c0-2.2 2-3.6 4.5-3.6s4.5 1.4 4.5 3.6" />
      <circle cx="3" cy="8" r="1.3" />
      <circle cx="15" cy="8" r="1.3" />
      <line x1="6.9" y1="6.6" x2="4.1" y2="7.6" />
      <line x1="11.1" y1="6.6" x2="13.9" y2="7.6" />
    </svg>
  ),
  nexo: (
    <svg width="18" height="18" viewBox="0 0 18 18" {...S}>
      <path d="M3 3h12v12H3z" />
      <path d="M3 3v12l6-4 6 4V3" />
    </svg>
  ),
  desmond: (
    <svg width="18" height="18" viewBox="0 0 18 18" {...S}>
      <circle cx="9" cy="5.5" r="2.5" />
      <circle cx="4" cy="14" r="2.5" />
      <circle cx="14" cy="14" r="2.5" />
      <line x1="7.2" y1="7.8" x2="5.2" y2="11.5" />
      <line x1="10.8" y1="7.8" x2="12.8" y2="11.5" />
      <line x1="4" y1="14" x2="14" y2="14" />
    </svg>
  ),
  diary: (
    <svg width="18" height="18" viewBox="0 0 18 18" {...S}>
      <path d="M4 3h8a1 1 0 011 1v11l-3-1.5L7 15V4a1 1 0 00-1-1z" />
      <path d="M4 3a1 1 0 00-1 1v10a1 1 0 001 1h3" />
      <line x1="9" y1="6" x2="11" y2="6" />
    </svg>
  ),
}

const NAV_ITEMS = [
  { id: 'dashboard', icon: ICONS.dashboard, label: 'Dashboard' },
  { id: 'brain', icon: ICONS.brain, label: 'Second Brain' },
  { id: 'agenda', icon: ICONS.agenda, label: 'Agenda' },
  { id: 'calendar', icon: ICONS.calendar, label: 'Calendar' },
  { id: 'trackers', icon: ICONS.trackers, label: 'Trackers' },
  { id: 'todos', icon: ICONS.todos, label: 'To-Do' },
  { id: 'nexo', icon: ICONS.nexo, label: 'NExo' },
  { id: 'desmond', icon: ICONS.desmond, label: 'Desmond' },
  { id: 'relations', icon: ICONS.relations, label: 'Relations' },
  { id: 'diary', icon: ICONS.diary, label: 'Diary' },
];

export default function NavSidebar({ section, onNavigate, pendingReminders }) {
  return (
    <aside className="nav-sidebar">
      <div className="nav-brand">
        <div className="nav-brand-mark" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="5" r="2" />
            <circle cx="4.5" cy="13" r="2" />
            <circle cx="13.5" cy="13" r="2" />
            <line x1="7.6" y1="6.6" x2="5.6" y2="11.2" />
            <line x1="10.4" y1="6.6" x2="12.4" y2="11.2" />
            <line x1="6.3" y1="13" x2="11.7" y2="13" />
          </svg>
        </div>
        <span className="nav-brand-text">Aurora</span>
      </div>

      <nav>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-btn${section === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={item.label}
          >
            <span className="nav-btn-icon">{item.icon}</span>
            <span className="nav-btn-label">{item.label}</span>
            {item.id === 'agenda' && pendingReminders > 0 && (
              <span className="nav-btn-badge">{pendingReminders}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="nav-foot">
        <div className="nav-user">
          <div className="nav-user-avatar" aria-hidden="true">W</div>
          <div className="nav-user-meta">
            <span className="nav-user-name">Wolf</span>
            <span className="nav-user-role">Power User</span>
          </div>
        </div>
        <div className="nav-version">Aurora · 5.0</div>
      </div>
    </aside>
  );
}
