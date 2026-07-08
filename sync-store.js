// Aurora multi-device sync store (Node-only, mirrors agent-bridge.js's shape).
//
// The browser's IndexedDB is per-origin, so a phone and a desktop hitting the
// same server today would each have their own empty, disconnected database.
// This module gives the server a durable SQLite copy of the "mobile-relevant"
// tables and a sequence-cursor changelog, so any number of browser clients can
// push local writes and pull a merged stream of everyone else's writes —
// exactly the poll + cursor + apply pattern agent-bridge.js already uses for
// the vault-watch channel, just made bidirectional and generalized across
// tables instead of single-purpose.
//
// Conflict rule: last-write-wins by `updatedAt`. This is a personal, single-
// user app used from at most a couple of devices — not a multi-tenant system —
// so we deliberately do not build CRDT-grade merge logic here.

import Database from 'better-sqlite3'
import { homedir } from 'os'
import { join } from 'path'
import { mkdirSync } from 'fs'

const STATE_DIR = join(homedir(), '.config', 'aurora-5.0')
mkdirSync(STATE_DIR, { recursive: true })
const DB_PATH = join(STATE_DIR, 'aurora-sync.db')

// The tables actually worth syncing to a phone day one. Everything else
// (projects/areas/resources/packets/sessions/embeddings/reviews/habits/
// integrationSettings/aiArtifacts/etc.) stays desktop-only for now — no
// phone-editing need, and aiArtifacts is a regenerable cache anyway.
export const SYNC_TABLES = ['notes', 'reminders', 'events', 'trackers', 'trackerLogs', 'todos', 'relations', 'diary']

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')

// `seq` is a monotonic version counter driven by sync_counter below (SQLite
// can't AUTOINCREMENT a column that's part of a composite primary key).
db.exec(`
  CREATE TABLE IF NOT EXISTS sync_rows (
    tableName  TEXT NOT NULL,
    rowId      TEXT NOT NULL,
    data       TEXT,               -- JSON payload, NULL = tombstone (deleted)
    updatedAt  INTEGER NOT NULL,
    seq        INTEGER NOT NULL,
    PRIMARY KEY (tableName, rowId)
  );
  CREATE INDEX IF NOT EXISTS sync_rows_seq ON sync_rows (seq);
  CREATE TABLE IF NOT EXISTS sync_counter (id INTEGER PRIMARY KEY CHECK (id = 1), value INTEGER NOT NULL);
  INSERT OR IGNORE INTO sync_counter (id, value) VALUES (1, 0);
`)

function nextSeq() {
  db.prepare('UPDATE sync_counter SET value = value + 1 WHERE id = 1').run()
  return db.prepare('SELECT value FROM sync_counter WHERE id = 1').get().value
}

const upsertStmt = db.prepare(`
  INSERT INTO sync_rows (tableName, rowId, data, updatedAt, seq)
  VALUES (@tableName, @rowId, @data, @updatedAt, @seq)
  ON CONFLICT(tableName, rowId) DO UPDATE SET
    data = excluded.data,
    updatedAt = excluded.updatedAt,
    seq = excluded.seq
  WHERE excluded.updatedAt >= sync_rows.updatedAt
`)

const getRowStmt = db.prepare('SELECT updatedAt FROM sync_rows WHERE tableName = ? AND rowId = ?')

// Apply a batch of client-originated changes. Each change:
//   { tableName, rowId, data (object or null for delete), updatedAt (ms epoch) }
// Rows older than what the server already has (by updatedAt) are silently
// dropped — last-write-wins. Returns how many actually applied.
export function pushChanges(changes = []) {
  let applied = 0
  const tx = db.transaction((batch) => {
    for (const c of batch) {
      if (!SYNC_TABLES.includes(c.tableName) || c.rowId == null) continue
      const existing = getRowStmt.get(c.tableName, String(c.rowId))
      if (existing && existing.updatedAt > (c.updatedAt || 0)) continue // server already has a newer write
      const res = upsertStmt.run({
        tableName: c.tableName,
        rowId: String(c.rowId),
        data: c.data == null ? null : JSON.stringify(c.data),
        updatedAt: c.updatedAt || Date.now(),
        seq: nextSeq(),
      })
      if (res.changes > 0) applied++
    }
  })
  tx(changes)
  return { ok: true, applied }
}

const pullStmt = db.prepare('SELECT tableName, rowId, data, updatedAt, seq FROM sync_rows WHERE seq > ? ORDER BY seq ASC LIMIT 500')
const maxSeqStmt = db.prepare('SELECT MAX(seq) AS seq FROM sync_rows')

// Everything changed since `since` (exclusive), oldest first. Callers apply
// these to their local IndexedDB and remember the highest `seq` seen as their
// new cursor.
export function pullChanges(since = 0) {
  const rows = pullStmt.all(Number(since) || 0)
  const changes = rows.map(r => ({
    tableName: r.tableName,
    rowId: r.rowId,
    data: r.data == null ? null : JSON.parse(r.data),
    updatedAt: r.updatedAt,
    seq: r.seq,
  }))
  const maxSeq = maxSeqStmt.get().seq || 0
  return { ok: true, changes, seq: maxSeq }
}
