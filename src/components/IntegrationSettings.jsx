import { useState, useEffect } from 'react'
import db from '../data/db'

const INTEGRATIONS = [
  {
    id: 'obsidian-sync',
    name: 'Obsidian Vault Sync',
    desc: 'Bidirectional sync between Aurora and your Obsidian vault. Keeps markdown files in sync with your 3D knowledge graph.',
    icon: '📓',
    configFields: [
      { key: 'vaultPath', label: 'Vault Path', placeholder: '/home/wolf/Documents/Second Brains/1.0/', type: 'text' },
      { key: 'autoSync', label: 'Auto-sync on change', type: 'checkbox' },
    ],
  },
  {
    id: 'readlater-pocket',
    name: 'Pocket',
    desc: 'Import your Pocket reading list into the Aurora inbox for processing.',
    icon: '📥',
    configFields: [
      { key: 'consumerKey', label: 'Consumer Key', placeholder: 'your-pocket-consumer-key', type: 'password' },
      { key: 'accessToken', label: 'Access Token', placeholder: 'your-pocket-access-token', type: 'password' },
    ],
  },
  {
    id: 'readwise',
    name: 'Readwise Highlights',
    desc: 'Sync your Readwise highlights as new notes in your second brain.',
    icon: '✨',
    configFields: [
      { key: 'apiToken', label: 'API Token', placeholder: 'your-readwise-token', type: 'password' },
    ],
  },
  {
    id: 'github',
    name: 'GitHub Issues',
    desc: 'Link GitHub issues and PRs to your Aurora projects.',
    icon: '🐙',
    configFields: [
      { key: 'token', label: 'GitHub Token', placeholder: 'ghp_...', type: 'password' },
      { key: 'repos', label: 'Repositories (comma-separated)', placeholder: 'owner/repo1, owner/repo2', type: 'text' },
    ],
  },
]

export default function IntegrationSettings({ onClose }) {
  const [settings, setSettings] = useState({})
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const all = await db.integrationSettings.toArray()
    const map = {}
    all.forEach(s => map[s.name] = s)
    setSettings(map)
  }

  const toggleIntegration = async (id) => {
    const existing = settings[id]
    if (existing) {
      await db.integrationSettings.update(existing.id, { enabled: !existing.enabled })
    } else {
      await db.integrationSettings.add({
        name: id,
        type: id,
        enabled: true,
        config: {},
      })
    }
    await loadSettings()
  }

  const updateConfig = async (id, key, value) => {
    const existing = settings[id]
    if (existing) {
      const config = { ...existing.config, [key]: value }
      await db.integrationSettings.update(existing.id, { config })
    } else {
      await db.integrationSettings.add({
        name: id,
        type: id,
        enabled: true,
        config: { [key]: value },
      })
    }
    await loadSettings()
  }

  return (
    <div className="integration-panel">
      <div className="review-header">
        <div className="review-header-left">
          <h3>Integrations</h3>
          <span className="review-sub">Connect external services to your second brain</span>
        </div>
        <button className="qc-close" onClick={onClose}>✕</button>
      </div>
      <div className="integration-list">
        {INTEGRATIONS.map(integration => {
          const setting = settings[integration.id]
          const enabled = setting?.enabled || false
          return (
            <div key={integration.id} className="integration-card">
              <div className="integration-card-header">
                <div className="integration-card-left">
                  <span className="integration-icon">{integration.icon}</span>
                  <div>
                    <strong>{integration.name}</strong>
                    <p>{integration.desc}</p>
                  </div>
                </div>
                <label className="integration-toggle">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleIntegration(integration.id)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              {enabled && (
                <div className="integration-config">
                  {integration.configFields.map(field => (
                    <div key={field.key} className="integration-field">
                      <label>{field.label}</label>
                      {field.type === 'checkbox' ? (
                        <input
                          type="checkbox"
                          checked={setting?.config?.[field.key] || false}
                          onChange={(e) => updateConfig(integration.id, field.key, e.target.checked)}
                        />
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={setting?.config?.[field.key] || ''}
                          onChange={(e) => updateConfig(integration.id, field.key, e.target.value)}
                          className="integration-input"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
