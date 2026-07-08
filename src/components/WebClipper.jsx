import { useState, useCallback } from 'react'
import db from '../data/db'
import { reindexNote } from '../data/embeddings'

export default function WebClipper({ onClip, onClose }) {
  const [url, setUrl] = useState('')
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchMetadata = useCallback(async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url.trim())}`, { signal: AbortSignal.timeout(8000) })
      const data = await res.json()
      if (data?.data) {
        setMetadata({
          title: data.data.title || url.trim(),
          description: data.data.description || '',
          image: data.data.image?.url || '',
          url: url.trim(),
          domain: data.data.domain || new URL(url.trim()).hostname,
        })
      } else {
        setMetadata({ title: url.trim(), description: '', image: '', url: url.trim(), domain: new URL(url.trim()).hostname })
      }
    } catch (err) {
      setError(err?.name === 'TimeoutError' ? 'Request timed out' : 'Could not fetch metadata for this URL')
      setMetadata(null)
    }
    setLoading(false)
  }, [url])

  const handleClip = useCallback(async () => {
    if (!metadata) return
    const note = {
      title: metadata.title,
      content: metadata.description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      paraCategory: 'inbox',
      tags: ['clipped', metadata.domain?.replace(/\./g, '-')].filter(Boolean),
      source: metadata.url,
    }
    const id = await db.notes.add(note)
    reindexNote({ ...note, id }) // index for search (+ AI concepts when available); fire-and-forget
    onClip?.({ ...note, id })
    setUrl('')
    setMetadata(null)
  }, [metadata, onClip])

  const bookmarkletCode = `javascript:(function(){
  var u=location.href;
  window.open('http://localhost:5173/clip?url='+encodeURIComponent(u),'aurora-clip','width=600,height=400');
})();`

  return (
    <div className="web-clipper">
      <div className="web-clipper-header">
        <h3>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 6, verticalAlign: 'middle' }}>
            <path d="M3 1v12l4-3 4 3V1H3z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
          </svg>
          Web Clipper
        </h3>
        <button className="qc-close" onClick={onClose} title="Close">✕</button>
      </div>
      <div className="web-clipper-input">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchMetadata()}
          placeholder="Paste a URL to clip..."
          className="clipper-url-input"
        />
        <button className="btn-primary" onClick={fetchMetadata} disabled={!url.trim() || loading}>
          {loading ? 'Fetching...' : 'Fetch'}
        </button>
      </div>

      {error && <div className="clipper-error">{error}</div>}

      {metadata && (
        <div className="clipper-preview">
          {metadata.image && (
            <img src={metadata.image} alt="" className="clipper-image" onError={e => { e.target.style.display = 'none' }} />
          )}
          <div className="clipper-info">
            <strong>{metadata.title}</strong>
            {metadata.description && <p>{metadata.description.slice(0, 200)}</p>}
            <span className="clipper-domain">{metadata.domain}</span>
          </div>
          <div className="clipper-actions">
            <button className="btn-secondary" onClick={() => setMetadata(null)}>Discard</button>
            <button className="btn-primary" onClick={handleClip}>Clip to Inbox</button>
          </div>
        </div>
      )}

      <details className="clipper-bookmarklet">
        <summary>Get Bookmarklet</summary>
        <p className="clipper-bookmarklet-desc">
          Drag this link to your bookmarks bar:
        </p>
        <a
          href={bookmarkletCode}
          className="clipper-bookmarklet-link"
          onClick={e => e.preventDefault()}
        >
          <code>{bookmarkletCode.slice(0, 80)}...</code>
        </a>
        <p className="clipper-bookmarklet-note">
          When clicked on any page, it opens the clipper to save that page.
        </p>
      </details>
    </div>
  )
}
