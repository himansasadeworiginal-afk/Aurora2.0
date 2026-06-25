import { ideas, tests } from '../data/ideas'

export default function LinkPanel({ selected, onClose }) {
  const idea = ideas.find(i => i.id === selected)
  if (!idea) return null

  const ideaTests = tests.filter(t => t.ideaId === idea.id)

  const linkedIdeas = (idea.links || [])
    .map(targetId => ideas.find(i => i.id === targetId))
    .filter(Boolean)

  return (
    <div className="link-panel" key={idea.id}>
      <button className="link-panel-close" onClick={onClose}>✕</button>

      <div className="link-panel-header" style={{ borderLeftColor: idea.color }}>
        <h2 className="link-panel-title">{idea.title}</h2>
        <p className="link-panel-desc">{idea.description}</p>
      </div>

      <div className="link-panel-tags">
        {idea.tags.map(tag => (
          <span key={tag} className="tag" style={{ borderColor: idea.color, color: idea.color }}>
            {tag}
          </span>
        ))}
      </div>

      <a
        href={idea.link}
        target="_blank"
        rel="noopener noreferrer"
        className="link-panel-button"
        style={{ background: `linear-gradient(135deg, ${idea.color}, ${idea.color}88)` }}
      >
        Learn More ↗
      </a>

      {ideaTests.length > 0 && (
        <div className="link-panel-section">
          <h3>Linked Tests</h3>
          {ideaTests.map(t => (
            <div key={t.id} className="test-item">
              <strong>{t.title}</strong>
              <p>{t.description}</p>
              <div className="test-meta">
                <code>{t.run}</code>
                <span className="test-file">{t.file || 'src/tests/aurora.test.js'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {linkedIdeas.length > 0 && (
        <div className="link-panel-section">
          <h3>Linked Ideas</h3>
          {linkedIdeas.map(linked => (
            <div key={linked.id} className="test-item" style={{ cursor: 'pointer' }}>
              <strong style={{ color: linked.color }}>{linked.title}</strong>
              <p>{linked.description.slice(0, 80)}</p>
              <span className="test-related" style={{ color: linked.color }}>
                ← {linked.tags.slice(0, 3).join(', ')}
              </span>
            </div>
          ))}
        </div>
      )}

      {idea.link && (
        <div className="link-panel-section">
          <h3>External Resource</h3>
          <div className="test-item">
            <strong>{new URL(idea.link).hostname}</strong>
            <p>{idea.link}</p>
            <a href={idea.link} target="_blank" rel="noopener noreferrer" className="link-external">
              Open in new tab →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
