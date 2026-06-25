import db from './db'

export async function trackEvent(noteId, eventType, sessionId) {
  await db.resonanceEvents.add({
    noteId,
    eventType,
    timestamp: new Date(),
    sessionId: sessionId || 'default',
  })
}

export async function getNoteStats(noteId) {
  const events = await db.resonanceEvents.where('noteId').equals(noteId).toArray()
  return {
    views: events.filter(e => e.eventType === 'view').length,
    edits: events.filter(e => e.eventType === 'edit').length,
    distills: events.filter(e => e.eventType === 'distill').length,
    captures: events.filter(e => e.eventType === 'capture').length,
    total: events.length,
    lastEvent: events.length > 0 ? events[events.length - 1].timestamp : null,
  }
}

export async function getAllNoteStats() {
  const all = await db.resonanceEvents.toArray()
  const stats = {}
  for (const event of all) {
    if (!stats[event.noteId]) {
      stats[event.noteId] = { views: 0, edits: 0, distills: 0, captures: 0, total: 0, lastEvent: null }
    }
    stats[event.noteId][event.eventType]++
    stats[event.noteId].total++
    if (!stats[event.noteId].lastEvent || new Date(event.timestamp) > new Date(stats[event.noteId].lastEvent)) {
      stats[event.noteId].lastEvent = event.timestamp
    }
  }
  return stats
}

export async function getRecentEvents(limit = 50) {
  return db.resonanceEvents
    .orderBy('timestamp')
    .reverse()
    .limit(limit)
    .toArray()
}

export async function getResonanceScore() {
  const allNotes = await db.notes.count()
  const allEvents = await db.resonanceEvents.count()
  const recentEvents = await db.resonanceEvents
    .where('timestamp')
    .above(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .count()
  return {
    totalNotes: allNotes,
    totalEvents: allEvents,
    weeklyEvents: recentEvents,
    engagementRate: allNotes > 0 ? (allEvents / allNotes).toFixed(1) : '0',
  }
}
