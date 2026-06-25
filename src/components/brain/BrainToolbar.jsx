// Brain view toolbars: the primary CODE workflow bar (phase3-toolbar) and the
// AI / review sub-bar (phase6-subbar). Presentational — all state lives in
// BrainView. `panels` is the active-panel map, `actions` the handlers.
const PARA_COLORS = { work: '#ff4444', study: '#aa44dd', entertainment: '#4488ff' }

export default function BrainToolbar({ panels, activeTab, paraFilter, actions }) {
  const { toggle, openAI, clearFilter } = actions
  return (
    <>
      <div className="phase3-toolbar">
        <button
          className={`phase3-toolbar-btn ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={actions.openInbox}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M1 4l2-2h10l2 2v9a1 1 0 01-1 1H2a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <path d="M1 4l7 4 7-4" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          Inbox
        </button>
        <button className={`phase3-toolbar-btn ${panels.quickCapture ? 'active' : ''}`} onClick={() => toggle('quickCapture', 'capture')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.2" />
            <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Capture
        </button>
        <button className={`phase3-toolbar-btn ${panels.webClipper ? 'active' : ''}`} onClick={() => toggle('webClipper', 'clipper')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 1v12l4-3 4 3V1H3z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
          </svg>
          Clipper
        </button>
        <button className={`phase3-toolbar-btn ${panels.favoriteProblems ? 'active' : ''}`} onClick={() => toggle('favoriteProblems', 'problems')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1 2-4z" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          Problems
        </button>
        <div className="phase3-toolbar-sep" />
        <button className={`phase3-toolbar-btn ${panels.distillDashboard ? 'active' : ''}`} onClick={() => toggle('distillDashboard', 'distill')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Distill
        </button>
        <button className={`phase3-toolbar-btn ${panels.batchDistill ? 'active' : ''}`} onClick={() => toggle('batchDistill', 'batch')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Batch
        </button>
        <div className="phase3-toolbar-sep" />
        <button className={`phase3-toolbar-btn ${panels.packets ? 'active' : ''}`} onClick={() => toggle('packets', 'packets')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="12" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <rect x="1" y="8" width="12" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <line x1="1" y1="3.5" x2="13" y2="3.5" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
            <line x1="1" y1="10.5" x2="13" y2="10.5" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
          </svg>
          Packets
        </button>
        <button className={`phase3-toolbar-btn ${panels.hemingway ? 'active' : ''}`} onClick={() => toggle('hemingway', 'express')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 13l3-3 1 1 2-2 1 1 3-3 1 1-4 4-1-1-2 2-1-1-3 3" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <path d="M12 3l-1-2-2 1" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          Express
        </button>
        <div className="phase3-toolbar-sep" />
        <button className={`phase3-toolbar-btn ${activeTab === 'ai' ? 'active' : ''}`} onClick={openAI}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <circle cx="7" cy="7" r="2" fill="currentColor" opacity="0.3" />
          </svg>
          AI
        </button>
      </div>

      <div className="phase6-subbar">
        <button className={`p6-btn ${panels.semanticSearch ? 'active' : ''}`} onClick={() => toggle('semanticSearch', 'ai')}>Search</button>
        <button className={`p6-btn ${panels.scoredProblems ? 'active' : ''}`} onClick={() => toggle('scoredProblems', 'ai')}>Score</button>
        <button className={`p6-btn ${panels.serendipity ? 'active' : ''}`} onClick={() => toggle('serendipity', 'ai')}>Serendipity</button>
        <button className={`p6-btn ${panels.contextRetrieval ? 'active' : ''}`} onClick={() => toggle('contextRetrieval', 'ai')}>Context</button>
        <button className={`p6-btn ${panels.knowledgeSuggest ? 'active' : ''}`} onClick={() => toggle('knowledgeSuggest', 'ai')}>Suggest</button>
        <div className="p6-sep" />
        <button className={`p6-btn ${paraFilter ? 'active' : ''}`} onClick={clearFilter}>Clear Filter</button>
        <div className="p6-sep" />
        <button className={`p6-btn ${panels.weeklyReview ? 'active' : ''}`} onClick={() => toggle('weeklyReview')}>Weekly</button>
        <button className={`p6-btn ${panels.monthlyReview ? 'active' : ''}`} onClick={() => toggle('monthlyReview')}>Monthly</button>
        <button className={`p6-btn ${panels.habitNudges ? 'active' : ''}`} onClick={() => toggle('habitNudges')}>Nudges</button>
        <button className={`p6-btn ${panels.integrations ? 'active' : ''}`} onClick={() => toggle('integrations')}>Integrations</button>
      </div>

      {paraFilter && (
        <div className="para-filter-badge" style={{ borderColor: PARA_COLORS[paraFilter] || '#666' }}>
          <span className="para-filter-dot" style={{ background: PARA_COLORS[paraFilter] || '#666' }} />
          Filtered: {paraFilter}
          <button className="para-filter-clear" onClick={clearFilter}>✕</button>
        </div>
      )}
    </>
  )
}
