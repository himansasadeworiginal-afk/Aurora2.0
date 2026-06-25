import Dexie from 'dexie'

const db = new Dexie('Aurora5')

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

export default db
