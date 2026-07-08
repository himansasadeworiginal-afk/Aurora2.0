import db, { SYNC_TABLES, withoutSync } from './db'
import { reindexNote } from './embeddings'

// Browser side of the Aurora ↔ Desmond bridge. Aurora's data lives in IndexedDB
// (browser-only), so the agent can't write it directly — instead this poller:
//   1. drains the server command queue (/api/agent/queue) and applies each
//      command (reminder / event / todo / note) to IndexedDB, then acks it;
//   2. applies vault MD changes (/api/vault/changes) so files Desmond or Obsidian
//      writes show up as notes within ~1s;
//   3. flushes locally-queued writes (db.js's syncOutbox, filled by table hooks
//      on SYNC_TABLES) to /api/sync/push, then pulls /api/sync/pull for
//      changes from other devices (e.g. a phone) and applies them locally —
//      this is what makes desktop and mobile show the same data.
// All three degrade silently when the server/endpoints are unavailable.

function today() {
  return new Date().toISOString().slice(0, 10)
}

const VAULT_CURSOR_KEY = 'aurora-vault-cursor'
const SYNC_CURSOR_KEY = 'aurora-sync-cursor'
const SYNC_TABLE_SET = new Set(SYNC_TABLES)

// ---- apply one queued command to IndexedDB --------------------------------
async function applyCommand(cmd) {
  const p = cmd.payload || {}
  const now = new Date().toISOString()
  switch (cmd.type) {
    case 'reminder':
      await db.reminders.add({
        title: p.title || 'Reminder',
        date: p.date || today(),
        priority: p.priority || 'medium',
        category: p.category || 'general',
        recurring: p.recurring || 'none',
        notificationTime: p.notificationTime || p.time || null,
        alarm: !!p.alarm,
        completed: false,
        createdAt: now,
        updatedAt: now,
      })
      break
    case 'event':
      await db.events.add({
        title: p.title || 'Event',
        date: p.date || today(),
        time: p.time || null,
        endTime: p.endTime || null,
        allDay: !!p.allDay,
        location: p.location || null,
        color: p.color || '#e60000',
        description: p.description || null,
        category: p.category || 'general',
        recurring: p.recurring && p.recurring !== 'none' ? p.recurring : null,
        createdAt: now,
      })
      break
    case 'todo': {
      const count = await db.todos.count()
      await db.todos.add({ text: p.text || p.title || 'To-do', done: false, order: count + 1, createdAt: new Date() })
      break
    }
    case 'note': {
      const note = {
        title: p.title || (p.content ? p.content.split('\n')[0].slice(0, 80) : 'Note'),
        content: p.content || '',
        paraCategory: p.paraCategory || 'inbox',
        tags: Array.isArray(p.tags) ? p.tags : [],
        source: 'desmond',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const id = await db.notes.add(note)
      reindexNote({ ...note, id })
      break
    }
    case 'organize':
      // "Organize the brain" runs on Claude, driven by Desmond directly against
      // /api/ai/*. Nothing to apply locally — just ack it.
      break
    default:
      break
  }
}

async function drainQueue() {
  let res
  try {
    res = await fetch('/api/agent/queue', { cache: 'no-store' })
    if (!res.ok) return
  } catch { return }
  const data = await res.json().catch(() => null)
  if (!data?.commands?.length) return

  const done = []
  for (const cmd of data.commands) {
    try { await applyCommand(cmd); done.push(cmd.id) }
    catch (err) { console.warn('[agentSync] command failed', cmd, err); done.push(cmd.id) /* drop poison commands */ }
  }
  if (done.length) {
    try {
      await fetch('/api/agent/ack', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: done }),
      })
    } catch {}
    window.dispatchEvent(new CustomEvent('aurora-data-changed'))
  }
}

// ---- apply a single vault change ------------------------------------------
async function applyVaultChange(change) {
  const existing = await db.vaultFiles.where('path').equals(change.vaultPath).first()
  if (change.action === 'remove') {
    if (existing) {
      const note = await db.notes.get(existing.noteId)
      if (note) await db.notes.put({ ...note, paraCategory: 'archives', updatedAt: new Date() })
    }
    return
  }
  const noteData = {
    title: change.title,
    content: change.content || '',
    updatedAt: change.updatedAt ? new Date(change.updatedAt) : new Date(),
    tags: change.tags || [],
    source: `vault://${change.vaultPath}`,
    wikilinks: change.wikilinks || [],
    vaultPath: change.vaultPath,
  }
  if (existing) {
    const note = await db.notes.get(existing.noteId)
    if (note) await db.notes.put({ ...note, ...noteData, id: existing.noteId })
    await db.vaultFiles.put({ ...existing, title: change.title, updatedAt: new Date() })
  } else {
    const noteId = await db.notes.add({ ...noteData, createdAt: new Date(), paraCategory: 'inbox' })
    await db.vaultFiles.add({ path: change.vaultPath, title: change.title, updatedAt: new Date(), noteId })
    reindexNote({ id: noteId, ...noteData })
  }
}

async function syncVault() {
  const since = Number(localStorage.getItem(VAULT_CURSOR_KEY) || 0)
  let res
  try {
    res = await fetch(`/api/vault/changes?since=${since}`, { cache: 'no-store' })
    if (!res.ok) return
  } catch { return }
  const data = await res.json().catch(() => null)
  if (!data?.changes) return
  let changed = false
  for (const ch of data.changes) {
    try { await applyVaultChange(ch); changed = true } catch (err) { console.warn('[agentSync] vault change failed', err) }
  }
  if (typeof data.seq === 'number') localStorage.setItem(VAULT_CURSOR_KEY, String(data.seq))
  if (changed) window.dispatchEvent(new CustomEvent('aurora-data-changed'))
}

// ---- multi-device sync: push local writes, pull remote ones ---------------
async function flushOutbox() {
  const pending = await db.syncOutbox.toArray()
  if (!pending.length) return
  const changes = pending.map(p => ({ tableName: p.tableName, rowId: p.rowId, data: p.data, updatedAt: p.updatedAt }))
  try {
    const res = await fetch('/api/sync/push', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes }),
    })
    if (!res.ok) return
  } catch { return }
  await db.syncOutbox.bulkDelete(pending.map(p => p.id))
}

async function pullRemoteChanges() {
  const since = Number(localStorage.getItem(SYNC_CURSOR_KEY) || 0)
  let res
  try {
    res = await fetch(`/api/sync/pull?since=${since}`, { cache: 'no-store' })
    if (!res.ok) return
  } catch { return }
  const data = await res.json().catch(() => null)
  if (!data) return

  let changed = false
  for (const c of data.changes || []) {
    if (!SYNC_TABLE_SET.has(c.tableName)) continue
    const rowId = Number(c.rowId)
    try {
      await withoutSync([c.tableName], () => (
        c.data == null
          ? db.table(c.tableName).delete(rowId)
          : db.table(c.tableName).put({ ...c.data, id: rowId })
      ))
      if (c.tableName === 'notes' && c.data) reindexNote({ ...c.data, id: rowId }) // fire-and-forget, matches capture-path behavior
      changed = true
    } catch (err) { console.warn('[agentSync] sync-pull apply failed', err) }
  }
  if (typeof data.seq === 'number') localStorage.setItem(SYNC_CURSOR_KEY, String(data.seq))
  if (changed) window.dispatchEvent(new CustomEvent('aurora-data-changed'))
}

// Start polling. Returns a stop() function.
export function startAgentSync({ interval = 4000 } = {}) {
  const tick = () => { drainQueue(); syncVault(); flushOutbox(); pullRemoteChanges() }
  tick()
  const id = setInterval(tick, interval)
  return () => clearInterval(id)
}
