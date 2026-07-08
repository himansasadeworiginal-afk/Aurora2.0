// Builds a compact "brain index" — one short line per note (title, path, PARA,
// tags, summary) — so the agent can read a small map of the whole second brain
// instead of every note. This is the token-efficiency layer: Desmond reads the
// index to know WHAT exists, and only fetches full note bodies for the few it
// actually needs to edit.
//
// Node-only. Reused by server.js (served at /api/brain/index, rebuilt when the
// vault changes) and runnable standalone via `npm run brain:index`.

import fs from 'fs'
import path from 'path'
import { homedir } from 'os'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const VAULT_PATH = path.join(homedir(), 'Documents', 'Second Brains', '1.0', 'Second Brain version 1.0')
const STATE_DIR = path.join(homedir(), '.config', 'aurora-5.0')
const JSON_OUT = path.join(STATE_DIR, 'brain-index.json')

const PARA_MAP = { Study: 'resources', Work: 'projects', Entertainment: 'resources' }

function paraOf(relPath) {
  const top = relPath.split('/')[0]
  return PARA_MAP[top] || 'resources'
}

// A cheap one-line summary: the note's frontmatter summary/description, else the
// first non-empty, non-heading line of the body. No model call — free + offline.
function summarize(data, content) {
  const fm = data?.summary || data?.description
  if (fm) return String(fm).slice(0, 200)
  const line = (content || '')
    .split('\n')
    .map(l => l.trim())
    .find(l => l && !l.startsWith('#') && !l.startsWith('---'))
  return line ? line.replace(/[*_`>[\]]/g, '').slice(0, 200) : ''
}

function walk(dir, rel = '', out = []) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    const relPath = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) {
      if (!e.name.startsWith('.')) walk(full, relPath, out)
    } else if (e.isFile() && e.name.endsWith('.md') && !e.name.startsWith('.') && e.name !== 'INDEX.md') {
      try {
        const parsed = matter(fs.readFileSync(full, 'utf-8'))
        out.push({
          title: parsed.data?.title || e.name.replace(/\.md$/, ''),
          path: relPath,
          para: paraOf(relPath),
          tags: parsed.data?.tags || [],
          summary: summarize(parsed.data, parsed.content),
        })
      } catch { /* skip */ }
    }
  }
  return out
}

// Build the index object (and write the JSON + INDEX.md side files). Safe to call
// when the vault is missing — returns an empty index.
export function buildBrainIndex(vaultPath = VAULT_PATH) {
  const notes = fs.existsSync(vaultPath) ? walk(vaultPath) : []
  const index = { generatedAt: new Date().toISOString(), count: notes.length, notes }

  try {
    fs.mkdirSync(STATE_DIR, { recursive: true })
    fs.writeFileSync(JSON_OUT, JSON.stringify(index))
  } catch { /* non-fatal */ }

  // Human-readable INDEX.md at the vault root, grouped by PARA.
  if (fs.existsSync(vaultPath)) {
    try {
      const byPara = {}
      for (const n of notes) (byPara[n.para] ||= []).push(n)
      let md = `# Brain Index\n\n_${notes.length} notes · generated ${index.generatedAt}_\n`
      for (const para of Object.keys(byPara).sort()) {
        md += `\n## ${para}\n\n`
        for (const n of byPara[para]) md += `- **${n.title}** (\`${n.path}\`)${n.summary ? ` — ${n.summary}` : ''}\n`
      }
      fs.writeFileSync(path.join(vaultPath, 'INDEX.md'), md)
    } catch { /* non-fatal */ }
  }

  return index
}

let cached = null
export function getBrainIndex() {
  if (!cached) cached = buildBrainIndex()
  return cached
}
export function refreshBrainIndex() {
  cached = buildBrainIndex()
  return cached
}

// Standalone CLI: `node brain-index.js` / `npm run brain:index`.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const idx = buildBrainIndex()
  console.log(`[brain-index] ${idx.count} notes → ${JSON_OUT}`)
}
