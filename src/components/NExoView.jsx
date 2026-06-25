import React from 'react';

export default function NExoView({ onClose }) {
  return (
    <div className="nexo-page">
      <div className="nexo-header">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" />
          <path d="M4 3v14l6-4 6 4V3" />
        </svg>
        <span>NExo 1.0 — Interactive Book Summaries</span>
        <button className="nexo-close-btn" onClick={onClose} title="Back to Dashboard">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
        </button>
      </div>
      <iframe
        className="nexo-iframe"
        src="/nexo/index.html"
        title="NExo 1.0"
      />
    </div>
  );
}
