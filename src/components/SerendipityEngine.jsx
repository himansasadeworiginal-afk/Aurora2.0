import { useState, useCallback } from 'react'
import { findSerendipity } from '../data/embeddings'
import db from '../data/db'

export default function SerendipityEngine({ onClose, onSelectNote }) {
  const [connections, setConnections] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [savedLinks, setSavedLinks] = useState([])
  const [showSaved, setShowSaved] = useState(false)

  const handleScan = useCallback(async () => {
    setScanning(true)
    const results = await findSerendipity(10)
    setConnections(results)
    setScanning(false)
  }, [])

  const handleSaveLink = useCallback(async (conn) => {
    await db.serendipityLinks.add({
      sourceNoteId: conn.a.id || conn.a.ideaId,
      targetNoteId: conn.b.id || conn.b.ideaId,
      reason: conn.shared.slice(0, 5).join(', '),
      score: conn.score,
      discoveredAt: new Date(),
    })
    const links = await db.serendipityLinks.toArray()
    setSavedLinks(links)
  }, [])

  const handleLoadSaved = useCallback(async () => {
    const links = await db.serendipityLinks.toArray()
    setSavedLinks(links.reverse())
    setShowSaved(true)
  }, [])

  return (
    <div className="serendipity-engine">
      <div className="se-header">
        <div className="se-header-left">
          <h3>Serendipity Engine</h3>
          <span className="se-sub">Discover unexpected cross-domain connections</span>
        </div>
        <div className="se-header-actions">
          <button className="btn-secondary" onClick={handleLoadSaved} style={{ fontSize: '0.6rem', padding: '3px 10px' }}>
            Saved ({savedLinks.length})
          </button>
          <button className="qc-close" onClick={onClose}>✕</button>
        </div>
      </div>

      {!showSaved ? (
        <div className="se-body">
          {!connections ? (
            <div className="se-welcome">
              <div className="se-welcome-icon">⚡</div>
              <p>Discover unexpected connections between notes from different categories</p>
              <button className="btn-primary" onClick={handleScan} disabled={scanning}>
                {scanning ? 'Scanning...' : 'Find Serendipitous Connections'}
              </button>
            </div>
          ) : (
            <div className="se-connections">
              <div className="se-connections-header">
                <span>{connections.length} unexpected connections found</span>
                <button className="btn-secondary" onClick={handleScan} style={{ fontSize: '0.6rem', padding: '3px 10px' }}>
                  Rescan
                </button>
              </div>
              {connections.map((conn, i) => (
                <div key={i} className="se-connection">
                  <div className="se-conn-pair">
                    <div className="se-conn-note" onClick={() => onSelectNote?.(conn.a)} style={{ borderLeftColor: conn.a?.color || '#884444' }}>
                      <strong>{conn.a?.title || 'Untitled'}</strong>
                      <span className="se-conn-cat">{conn.a?.paraCategory}</span>
                    </div>
                    <div className="se-conn-bridge">
                      <span className="se-conn-score">{Math.round(conn.score * 100)}%</span>
                      <div className="se-conn-shared">{conn.shared.join(', ')}</div>
                    </div>
                    <div className="se-conn-note" onClick={() => onSelectNote?.(conn.b)} style={{ borderLeftColor: conn.b?.color || '#884444' }}>
                      <strong>{conn.b?.title || 'Untitled'}</strong>
                      <span className="se-conn-cat">{conn.b?.paraCategory}</span>
                    </div>
                  </div>
                  <button className="se-save-btn" onClick={() => handleSaveLink(conn)}>
                    Save Connection
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="se-saved">
          <div className="se-saved-header">
            <strong>Saved Connections</strong>
            <button className="btn-secondary" onClick={() => setShowSaved(false)} style={{ fontSize: '0.6rem', padding: '3px 10px' }}>
              Back
            </button>
          </div>
          {savedLinks.map((link, i) => (
            <div key={link.id || i} className="se-saved-item">
              <div className="se-saved-reason">{link.reason}</div>
              <span className="se-saved-date">{new Date(link.discoveredAt).toLocaleDateString()}</span>
            </div>
          ))}
          {savedLinks.length === 0 && (
            <div className="se-empty">No saved connections yet</div>
          )}
        </div>
      )}
    </div>
  )
}
