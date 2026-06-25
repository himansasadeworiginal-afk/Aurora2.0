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
}

const NAV_ITEMS = [
  { id: 'dashboard', icon: ICONS.dashboard, label: 'Dashboard' },
  { id: 'brain', icon: ICONS.brain, label: 'Second Brain' },
  { id: 'agenda', icon: ICONS.agenda, label: 'Agenda' },
  { id: 'calendar', icon: ICONS.calendar, label: 'Calendar' },
  { id: 'trackers', icon: ICONS.trackers, label: 'Trackers' },
  { id: 'nexo', icon: ICONS.nexo, label: 'NExo' },
  { id: 'desmond', icon: ICONS.desmond, label: 'Desmond' },
];

export default function NavSidebar({ section, onNavigate, pendingReminders }) {
  return (
    <aside className="nav-sidebar">
      <div className="nav-logo" />
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
          </button>
        ))}
      </nav>
      {pendingReminders > 0 && (
        <button
          className="nav-bell-btn"
          onClick={() => onNavigate('agenda')}
          title={pendingReminders + ' pending task' + (pendingReminders > 1 ? 's' : '')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v1" />
            <path d="M12.5 11l.5 1H3l.5-1 .5-.5V7a4 4 0 018 0v3l.5.5z" />
            <circle cx="8" cy="13.5" r="0.8" />
          </svg>
          <span className="nav-bell-badge">{pendingReminders}</span>
        </button>
      )}
      <div className="nav-version">5.0</div>
    </aside>
  );
}
