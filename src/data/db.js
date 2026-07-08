import Dexie from 'dexie'

const db = new Dexie('Aurora5')

// Tables that sync to a server-side SQLite store (see sync-store.js) so a
// phone and desktop can share live data. Everything else (projects, areas,
// resources, packets, sessions, embeddings, reviews, habits, integration
// settings, the aiArtifacts cache, etc.) stays desktop-only for now — no
// phone-editing need for those, and aiArtifacts is regenerable anyway.
export const SYNC_TABLES = ['notes', 'reminders', 'events', 'trackers', 'trackerLogs', 'todos', 'relations', 'diary']

db.version(14).stores({
  notes: '++id, title, paraCategory, createdAt, updatedAt, *tags, source, distillationDepth',
  projects: '++id, name, deadline, status, areaId',
  areas: '++id, name',
  resources: '++id, name, topic',
  packets: '++id, name, createdAt, updatedAt, category',
  packetItems: '++id, packetId, noteId, position, addedAt',
  sessions: '++id, createdAt, endedAt',
  sessionBlocks: '++id, sessionId, type, content, createdAt',
  embeddings: '++id, noteId, model, dimension, *tokens',
  resonanceEvents: '++id, noteId, eventType, timestamp, sessionId',
  serendipityLinks: '++id, sourceNoteId, targetNoteId, reason, score, discoveredAt',
  contextFilters: '++id, name, category, tags, active',
  vaultFiles: '++id, path, title, updatedAt',
  reviews: '++id, type, completedAt, *items, duration',
  reviewItems: '++id, reviewId, action, completed, noteId',
  habits: '++id, name, category, streak, lastTriggered, enabled',
  integrationSettings: '++id, name, type, enabled, config',
  reminders: '++id, title, date, priority, category, completed, recurring, notificationTime, alarm, snoozedUntil, createdAt',
  events: '++id, title, date, time, endTime, allDay, color, description, location, category, recurring, createdAt',
  trackers: '++id, name, frequency, category, type, target, unit, color, createdAt',
  trackerLogs: '++id, trackerId, date, value, note, createdAt',
  aiArtifacts: '++id, &key, createdAt',
  todos: '++id, text, done, order, listName, createdAt',
  relations: '++id, name, friendliness, *skills, relationshipType, createdAt, updatedAt',
  diary: '++id, date, scanned, createdAt, updatedAt',
  // Outbound queue of local writes to SYNC_TABLES waiting to be pushed to the
  // server (see sync-store.js's /api/sync/push). Cleared once acknowledged.
  syncOutbox: '++id, tableName, rowId, updatedAt',
})

db.version(13).stores({
  notes: '++id, title, paraCategory, createdAt, updatedAt, *tags, source, distillationDepth',
  projects: '++id, name, deadline, status, areaId',
  areas: '++id, name',
  resources: '++id, name, topic',
  packets: '++id, name, createdAt, updatedAt, category',
  packetItems: '++id, packetId, noteId, position, addedAt',
  sessions: '++id, createdAt, endedAt',
  sessionBlocks: '++id, sessionId, type, content, createdAt',
  embeddings: '++id, noteId, model, dimension, *tokens',
  resonanceEvents: '++id, noteId, eventType, timestamp, sessionId',
  serendipityLinks: '++id, sourceNoteId, targetNoteId, reason, score, discoveredAt',
  contextFilters: '++id, name, category, tags, active',
  vaultFiles: '++id, path, title, updatedAt',
  reviews: '++id, type, completedAt, *items, duration',
  reviewItems: '++id, reviewId, action, completed, noteId',
  habits: '++id, name, category, streak, lastTriggered, enabled',
  integrationSettings: '++id, name, type, enabled, config',
  reminders: '++id, title, date, priority, category, completed, recurring, notificationTime, alarm, snoozedUntil, createdAt',
  events: '++id, title, date, time, endTime, allDay, color, description, location, category, recurring, createdAt',
  trackers: '++id, name, frequency, category, type, target, unit, color, createdAt',
  trackerLogs: '++id, trackerId, date, value, note, createdAt',
  aiArtifacts: '++id, &key, createdAt',
  todos: '++id, text, done, order, listName, createdAt',
  relations: '++id, name, friendliness, *skills, relationshipType, createdAt, updatedAt',
  // Diary — dated free-text journal entries. `*…*` flagged segments feed the
  // Relations auto-detection pipeline; `scanned` records whether a detection
  // pass has run so the entry can show a subtle "scanned" badge.
  diary: '++id, date, scanned, createdAt, updatedAt',
})

db.version(12).stores({
  notes: '++id, title, paraCategory, createdAt, updatedAt, *tags, source, distillationDepth',
  projects: '++id, name, deadline, status, areaId',
  areas: '++id, name',
  resources: '++id, name, topic',
  packets: '++id, name, createdAt, updatedAt, category',
  packetItems: '++id, packetId, noteId, position, addedAt',
  sessions: '++id, createdAt, endedAt',
  sessionBlocks: '++id, sessionId, type, content, createdAt',
  embeddings: '++id, noteId, model, dimension, *tokens',
  resonanceEvents: '++id, noteId, eventType, timestamp, sessionId',
  serendipityLinks: '++id, sourceNoteId, targetNoteId, reason, score, discoveredAt',
  contextFilters: '++id, name, category, tags, active',
  vaultFiles: '++id, path, title, updatedAt',
  reviews: '++id, type, completedAt, *items, duration',
  reviewItems: '++id, reviewId, action, completed, noteId',
  habits: '++id, name, category, streak, lastTriggered, enabled',
  integrationSettings: '++id, name, type, enabled, config',
  reminders: '++id, title, date, priority, category, completed, recurring, notificationTime, alarm, snoozedUntil, createdAt',
  events: '++id, title, date, time, endTime, allDay, color, description, location, category, recurring, createdAt',
  trackers: '++id, name, frequency, category, type, target, unit, color, createdAt',
  trackerLogs: '++id, trackerId, date, value, note, createdAt',
  aiArtifacts: '++id, &key, createdAt',
  todos: '++id, text, done, order, listName, createdAt',
  // People graph — the Relations / Superbrain foundation. Only `name` is
  // required; every other field is optional and handled sparsely. *skills is a
  // multi-entry index so people can be filtered by skill.
  relations: '++id, name, friendliness, *skills, relationshipType, createdAt, updatedAt',
})

db.version(11).stores({
  notes: '++id, title, paraCategory, createdAt, updatedAt, *tags, source, distillationDepth',
  projects: '++id, name, deadline, status, areaId',
  areas: '++id, name',
  resources: '++id, name, topic',
  packets: '++id, name, createdAt, updatedAt, category',
  packetItems: '++id, packetId, noteId, position, addedAt',
  sessions: '++id, createdAt, endedAt',
  sessionBlocks: '++id, sessionId, type, content, createdAt',
  embeddings: '++id, noteId, model, dimension, *tokens',
  resonanceEvents: '++id, noteId, eventType, timestamp, sessionId',
  serendipityLinks: '++id, sourceNoteId, targetNoteId, reason, score, discoveredAt',
  contextFilters: '++id, name, category, tags, active',
  vaultFiles: '++id, path, title, updatedAt',
  reviews: '++id, type, completedAt, *items, duration',
  reviewItems: '++id, reviewId, action, completed, noteId',
  habits: '++id, name, category, streak, lastTriggered, enabled',
  integrationSettings: '++id, name, type, enabled, config',
  // reminders gain an optional hard-alarm flag + a transient snooze target.
  reminders: '++id, title, date, priority, category, completed, recurring, notificationTime, alarm, snoozedUntil, createdAt',
  // events gain end time, all-day, and location for richer planning.
  events: '++id, title, date, time, endTime, allDay, color, description, location, category, recurring, createdAt',
  // trackers gain a type (boolean check-in vs numeric count), target, unit, color.
  trackers: '++id, name, frequency, category, type, target, unit, color, createdAt',
  // trackerLogs gain a numeric value for count-type trackers.
  trackerLogs: '++id, trackerId, date, value, note, createdAt',
  aiArtifacts: '++id, &key, createdAt',
  // A simple ordered checklist, separate from time-based reminders.
  todos: '++id, text, done, order, listName, createdAt',
})

db.version(10).stores({
  notes: '++id, title, paraCategory, createdAt, updatedAt, *tags, source, distillationDepth',
  projects: '++id, name, deadline, status, areaId',
  areas: '++id, name',
  resources: '++id, name, topic',
  packets: '++id, name, createdAt, updatedAt, category',
  packetItems: '++id, packetId, noteId, position, addedAt',
  sessions: '++id, createdAt, endedAt',
  sessionBlocks: '++id, sessionId, type, content, createdAt',
  embeddings: '++id, noteId, model, dimension, *tokens',
  resonanceEvents: '++id, noteId, eventType, timestamp, sessionId',
  serendipityLinks: '++id, sourceNoteId, targetNoteId, reason, score, discoveredAt',
  contextFilters: '++id, name, category, tags, active',
  vaultFiles: '++id, path, title, updatedAt',
  reviews: '++id, type, completedAt, *items, duration',
  reviewItems: '++id, reviewId, action, completed, noteId',
  habits: '++id, name, category, streak, lastTriggered, enabled',
  integrationSettings: '++id, name, type, enabled, config',
  reminders: '++id, title, date, priority, category, completed, recurring, notificationTime, createdAt',
  events: '++id, title, date, time, color, description, category, recurring, createdAt',
  trackers: '++id, name, frequency, category, createdAt',
  trackerLogs: '++id, trackerId, date, note, createdAt',
  // AI-generated artifacts cached by a unique key (e.g. "brief:2026-06-26") so
  // we don't re-call the model on every mount.
  aiArtifacts: '++id, &key, createdAt',
})

db.version(9).stores({
  notes: '++id, title, paraCategory, createdAt, updatedAt, *tags, source, distillationDepth',
  projects: '++id, name, deadline, status, areaId',
  areas: '++id, name',
  resources: '++id, name, topic',
  packets: '++id, name, createdAt, updatedAt, category',
  packetItems: '++id, packetId, noteId, position, addedAt',
  sessions: '++id, createdAt, endedAt',
  sessionBlocks: '++id, sessionId, type, content, createdAt',
  embeddings: '++id, noteId, model, dimension, *tokens',
  resonanceEvents: '++id, noteId, eventType, timestamp, sessionId',
  serendipityLinks: '++id, sourceNoteId, targetNoteId, reason, score, discoveredAt',
  contextFilters: '++id, name, category, tags, active',
  vaultFiles: '++id, path, title, updatedAt',
  reviews: '++id, type, completedAt, *items, duration',
  reviewItems: '++id, reviewId, action, completed, noteId',
  habits: '++id, name, category, streak, lastTriggered, enabled',
  integrationSettings: '++id, name, type, enabled, config',
  reminders: '++id, title, date, priority, category, completed, recurring, notificationTime, createdAt',
  events: '++id, title, date, time, color, description, category, recurring, createdAt',
  trackers: '++id, name, frequency, category, createdAt',
  trackerLogs: '++id, trackerId, date, note, createdAt',
})

db.version(8).stores({
  notes: '++id, title, paraCategory, createdAt, updatedAt, *tags, source, distillationDepth',
  projects: '++id, name, deadline, status, areaId',
  areas: '++id, name',
  resources: '++id, name, topic',
  packets: '++id, name, createdAt, updatedAt, category',
  packetItems: '++id, packetId, noteId, position, addedAt',
  sessions: '++id, createdAt, endedAt',
  sessionBlocks: '++id, sessionId, type, content, createdAt',
  embeddings: '++id, noteId, model, dimension, *tokens',
  resonanceEvents: '++id, noteId, eventType, timestamp, sessionId',
  serendipityLinks: '++id, sourceNoteId, targetNoteId, reason, score, discoveredAt',
  contextFilters: '++id, name, category, tags, active',
  vaultFiles: '++id, path, title, updatedAt',
  reviews: '++id, type, completedAt, *items, duration',
  reviewItems: '++id, reviewId, action, completed, noteId',
  habits: '++id, name, category, streak, lastTriggered, enabled',
  integrationSettings: '++id, name, type, enabled, config',
  reminders: '++id, title, date, priority, category, completed, recurring, createdAt',
  events: '++id, title, date, time, color, description, createdAt',
  trackers: '++id, name, frequency, category, createdAt',
  trackerLogs: '++id, trackerId, date, note, createdAt',
})

db.version(7).stores({
  notes: '++id, title, paraCategory, createdAt, updatedAt, *tags, source, distillationDepth',
  projects: '++id, name, deadline, status, areaId',
  areas: '++id, name',
  resources: '++id, name, topic',
  packets: '++id, name, createdAt, updatedAt, category',
  packetItems: '++id, packetId, noteId, position, addedAt',
  sessions: '++id, createdAt, endedAt',
  sessionBlocks: '++id, sessionId, type, content, createdAt',
  embeddings: '++id, noteId, model, dimension, *tokens',
  resonanceEvents: '++id, noteId, eventType, timestamp, sessionId',
  serendipityLinks: '++id, sourceNoteId, targetNoteId, reason, score, discoveredAt',
  contextFilters: '++id, name, category, tags, active',
  vaultFiles: '++id, path, title, updatedAt',
  reviews: '++id, type, completedAt, *items, duration',
  reviewItems: '++id, reviewId, action, completed, noteId',
  habits: '++id, name, category, streak, lastTriggered, enabled',
  integrationSettings: '++id, name, type, enabled, config',
  reminders: '++id, title, date, priority, category, completed, recurring, createdAt',
})

db.version(6).stores({
  notes: '++id, title, paraCategory, createdAt, updatedAt, *tags, source, distillationDepth',
  projects: '++id, name, deadline, status, areaId',
  areas: '++id, name',
  resources: '++id, name, topic',
  packets: '++id, name, createdAt, updatedAt, category',
  packetItems: '++id, packetId, noteId, position, addedAt',
  sessions: '++id, createdAt, endedAt',
  sessionBlocks: '++id, sessionId, type, content, createdAt',
  embeddings: '++id, noteId, model, dimension, *tokens',
  resonanceEvents: '++id, noteId, eventType, timestamp, sessionId',
  serendipityLinks: '++id, sourceNoteId, targetNoteId, reason, score, discoveredAt',
  contextFilters: '++id, name, category, tags, active',
  vaultFiles: '++id, path, title, updatedAt',
  reviews: '++id, type, completedAt, *items, duration',
  reviewItems: '++id, reviewId, action, completed, noteId',
  habits: '++id, name, category, streak, lastTriggered, enabled',
  integrationSettings: '++id, name, type, enabled, config',
})

db.version(5).stores({
  notes: '++id, title, paraCategory, createdAt, updatedAt, *tags, source, distillationDepth',
  projects: '++id, name, deadline, status, areaId',
  areas: '++id, name',
  resources: '++id, name, topic',
  packets: '++id, name, createdAt, updatedAt, category',
  packetItems: '++id, packetId, noteId, position, addedAt',
  sessions: '++id, createdAt, endedAt',
  sessionBlocks: '++id, sessionId, type, content, createdAt',
  embeddings: '++id, noteId, model, dimension, *tokens',
  resonanceEvents: '++id, noteId, eventType, timestamp, sessionId',
  serendipityLinks: '++id, sourceNoteId, targetNoteId, reason, score, discoveredAt',
  contextFilters: '++id, name, category, tags, active',
  vaultFiles: '++id, path, title, updatedAt',
})

db.version(4).stores({
  notes: '++id, title, paraCategory, createdAt, updatedAt, *tags, source, distillationDepth',
  projects: '++id, name, deadline, status, areaId',
  areas: '++id, name',
  resources: '++id, name, topic',
  packets: '++id, name, createdAt, updatedAt, category',
  packetItems: '++id, packetId, noteId, position, addedAt',
  sessions: '++id, createdAt, endedAt',
  sessionBlocks: '++id, sessionId, type, content, createdAt',
  embeddings: '++id, noteId, model, dimension, *tokens',
  resonanceEvents: '++id, noteId, eventType, timestamp, sessionId',
  contextFilters: '++id, name, category, tags, active',
  vaultFiles: '++id, path, title, updatedAt',
}).upgrade(tx => tx.notes.toCollection().modify(note => {
  if (note.distillationDepth === undefined) note.distillationDepth = 0
  if (!note.distillation) note.distillation = { soil: note.content || '', oil: '', gold: '', gems: '' }
}))

db.version(3).stores({
  notes: '++id, title, paraCategory, createdAt, updatedAt, *tags, source, distillationDepth',
  projects: '++id, name, deadline, status, areaId',
  areas: '++id, name',
  resources: '++id, name, topic',
  sessions: '++id, createdAt, endedAt',
  sessionBlocks: '++id, sessionId, type, content, createdAt',
  vaultFiles: '++id, path, title, updatedAt',
}).upgrade(tx => tx.notes.toCollection().modify(note => {
  if (note.distillationDepth === undefined) note.distillationDepth = 0
  if (!note.distillation) note.distillation = { soil: note.content || '', oil: '', gold: '', gems: '' }
}))

db.version(2).stores({
  notes: '++id, title, paraCategory, createdAt, updatedAt, *tags, source, distillationDepth',
}).upgrade(tx => tx.notes.toCollection().modify(note => {
  if (note.distillationDepth === undefined) note.distillationDepth = 0
  if (!note.distillation) note.distillation = { soil: note.content || '', oil: '', gold: '', gems: '' }
}))

db.version(1).stores({
  notes: '++id, title, paraCategory, createdAt, updatedAt, *tags, source',
  projects: '++id, name, deadline, status, areaId',
  areas: '++id, name',
  resources: '++id, name, topic',
  packets: '++id, name, createdAt, updatedAt, category',
  packetItems: '++id, packetId, noteId, position, addedAt',
  vaultFiles: '++id, path, title, updatedAt',
})

// --- Multi-device sync: outbox hooks ---------------------------------------
//
// Every write to a SYNC_TABLES table gets appended to syncOutbox for
// agentSync.js to push to the server, regardless of which component/call
// site made the write — so none of the ~20 files that call db.notes.add()
// etc. directly need to change.
//
// withoutSync() is used when applying a server-originated change (pulled by
// agentSync.js) so it doesn't get queued right back into the outbox it came
// from. This must NOT be a module-level boolean toggled synchronously around
// the write call — Dexie's creating/updating/deleting hooks do not
// necessarily fire within that same synchronous window (confirmed by an
// integration test: a plain flag caused pulled updates to loop back into the
// outbox). Instead, tag the actual transaction object via
// `Dexie.currentTransaction`, which every hook invocation for writes inside
// that transaction receives as its `transaction` argument regardless of when
// it fires — so the check is race-proof.
export function withoutSync(tables, fn) {
  return db.transaction('rw', tables, () => {
    Dexie.currentTransaction.__suppressSync = true
    return fn()
  })
}

function queueOutboxWrite(tableName, transaction, rowId, data) {
  if (transaction.__suppressSync) return
  transaction.on('complete', () => {
    db.syncOutbox.add({ tableName, rowId: String(rowId), data, updatedAt: Date.now() }).catch(() => {})
  })
}

for (const t of SYNC_TABLES) {
  // For auto-increment ('++id') tables, `primKey` is undefined here — the key
  // doesn't exist yet. Dexie's documented way to learn the real key once
  // assigned is `this.onsuccess`.
  db[t].hook('creating', function (primKey, obj, transaction) {
    this.onsuccess = (key) => queueOutboxWrite(t, transaction, key, { ...obj, id: key })
  })
  db[t].hook('updating', function (modifications, primKey, obj, transaction) {
    queueOutboxWrite(t, transaction, primKey, { ...obj, ...modifications, id: primKey })
  })
  db[t].hook('deleting', function (primKey, obj, transaction) {
    queueOutboxWrite(t, transaction, primKey, null)
  })
}

export default db
