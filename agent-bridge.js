// Aurora ↔ agent bridge (Node-only, Dexie-free).
//
// Aurora's data lives in browser IndexedDB, which neither this server nor the
// Python agent (Desmond) can touch directly. This module is the seam:
//
//   1. Command queue — Desmond POSTs structured intents (create reminder / event
//      / todo / note, or "organize brain"); they are buffered here (in-memory +
//      a small JSON file so they survive a restart). The browser drains the
//      queue, applies each command to IndexedDB, and acks it.
//
//   2. Vault channel — a chokidar watcher tracks .md file changes in the Obsidian
//      vault and exposes them as parsed JSON via a sequence cursor. The browser
//      polls and upserts notes into IndexedDB. This lets Desmond (or Obsidian)
//      edit MD files and have Aurora pick them up within ~1s.
//
// Everything degrades gracefully: no vault → no watcher, queue still works.

import { homedir } from 'os'
import { join, basename, relative, sep } from 'path'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'

const STATE_DIR = join(homedir(), '.config', 'aurora-5.0')
const QUEUE_FILE = join(STATE_DIR, 'agent-queue.json')
const VAULT_PATH = join(homedir(), 'Documents', 'Second Brains', '1.0', 'Second Brain version 1.0')

const VALID_TYPES = new Set(['reminder', 'event', 'todo', 'note', 'organize'])

// ---------------------------------------------------------------------------
// Command queue
// ---------------------------------------------------------------------------

let queue = []
let nextId = 1

function loadQueue() {
  try {
    const raw = JSON.parse(readFileSync(QUEUE_FILE, 'utf-8'))
    if (Array.isArray(raw.commands)) queue = raw.commands
    if (typeof raw.nextId === 'number') nextId = raw.nextId
  } catch { /* no file yet */ }
}

function persistQueue() {
  try {
    mkdirSync(STATE_DIR, { recursive: true })
    writeFileSync(QUEUE_FILE, JSON.stringify({ commands: queue, nextId }))
  } catch { /* non-fatal */ }
}

loadQueue()

export function enqueueCommand(cmd = {}) {
  const type = String(cmd.type || '').toLowerCase()
  if (!VALID_TYPES.has(type)) return { ok: false, reason: `unknown command type: ${type}` }
  const entry = { id: nextId++, type, payload: cmd.payload || {}, createdAt: Date.now() }
  queue.push(entry)
  // keep the buffer bounded
  if (queue.length > 500) queue = queue.slice(-500)
  persistQueue()
  return { ok: true, id: entry.id }
}

export function listCommands() {
  return { ok: true, commands: queue }
}

export function ackCommands(ids = []) {
  const set = new Set(ids.map(Number))
  const before = queue.length
  queue = queue.filter(c => !set.has(c.id))
  persistQueue()
  return { ok: true, removed: before - queue.length }
}

// ---------------------------------------------------------------------------
// Vault watch channel
// ---------------------------------------------------------------------------

let changes = []      // ring buffer of { seq, action, vaultPath, title, content, tags, wikilinks }
let seq = 0
let watcher = null

function extractWikilinks(content) {
  const links = []
  const re = /\[\[([^\]]+)\]\]/g
  let m
  while ((m = re.exec(content)) !== null) links.push(m[1].split('|')[0].trim())
  return links
}

async function recordChange(action, fullPath, matter) {
  try {
    const relPath = relative(VAULT_PATH, fullPath).split(sep).join('/')
    if (action === 'remove') {
      changes.push({ seq: ++seq, action, vaultPath: relPath })
    } else {
      const raw = readFileSync(fullPath, 'utf-8')
      const parsed = matter(raw)
      changes.push({
        seq: ++seq,
        action: 'upsert',
        vaultPath: relPath,
        title: parsed.data?.title || basename(fullPath, '.md'),
        content: parsed.content,
        tags: parsed.data?.tags || [],
        wikilinks: extractWikilinks(raw),
        updatedAt: parsed.data?.updatedAt || null,
      })
    }
    if (changes.length > 1000) changes = changes.slice(-1000)
  } catch { /* skip unreadable file */ }
}

// Start watching the vault. Safe to call when the vault or deps are missing.
// `onChange` (optional) fires, debounced, after any MD change — used to refresh
// the brain index. Ignore INDEX.md so our own writes don't loop.
export async function startVaultWatch(vaultPath = VAULT_PATH, onChange = null) {
  if (watcher || !existsSync(vaultPath)) return null
  let chokidar, matter
  try {
    chokidar = (await import('chokidar')).default
    matter = (await import('gray-matter')).default
  } catch {
    console.warn('[agent-bridge] chokidar/gray-matter unavailable — vault watch disabled')
    return null
  }
  const isMd = (p) => p.endsWith('.md') && !basename(p).startsWith('.') && basename(p) !== 'INDEX.md'
  let debounce = null
  const handle = (action, p) => {
    if (!isMd(p)) return
    recordChange(action, p, matter)
    if (onChange) { clearTimeout(debounce); debounce = setTimeout(onChange, 1200) }
  }
  watcher = chokidar.watch(`${vaultPath}/**/*.md`, {
    ignored: /(^|[/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  })
  watcher.on('add', p => handle('upsert', p))
  watcher.on('change', p => handle('upsert', p))
  watcher.on('unlink', p => handle('remove', p))
  console.log(`[agent-bridge] watching vault: ${vaultPath}`)
  return watcher
}

export function getVaultChanges(since = 0) {
  const s = Number(since) || 0
  return { ok: true, seq, changes: changes.filter(c => c.seq > s) }
}
