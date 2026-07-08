// Shared helpers for @* person mentions in notes. Mentions are stored on the
// note record as `note.mentions = [{ personId, displayName }]`; the reverse link
// lives on the person as `linkedItems = [{ noteId, noteTitle, linkedAt }]`.

import db from '../../data/db'

// Fuzzy name search for the @* dropdown — prefix matches first, then substring.
export function searchPeople(query, people, limit = 5) {
  const q = (query || '').toLowerCase().trim()
  const list = people || []
  if (!q) return list.slice(0, limit)
  const scored = []
  for (const p of list) {
    const name = (p.name || '').toLowerCase()
    if (!name) continue
    let score = -1
    if (name === q) score = 100
    else if (name.startsWith(q)) score = 80
    else if (name.split(/\s+/).some(w => w.startsWith(q))) score = 60
    else if (name.includes(q)) score = 30
    if (score >= 0) scored.push({ p, score })
  }
  scored.sort((a, b) => b.score - a.score || (a.p.name || '').localeCompare(b.p.name || ''))
  return scored.slice(0, limit).map(s => s.p)
}

// Create a minimal person record (name only) — used when @* finds no match.
export async function createMinimalPerson(name) {
  const now = Date.now()
  const id = await db.relations.add({
    name: (name || '').trim() || 'Unnamed',
    phone: null, email: null, birthday: null, location: null, description: null,
    profilePic: null, friendliness: null, skills: [], howWeMet: null,
    relationshipType: null, diaryMentions: [], linkedItems: [],
    createdAt: now, updatedAt: now,
  })
  return { id, name }
}

// Reconcile a note's mentions against the people graph. Adds a linkedItems entry
// for every currently-mentioned person and removes stale entries for this note
// from anyone no longer mentioned. Safe to call on every note save.
export async function syncNoteMentions(noteId, noteTitle, mentions) {
  if (noteId == null) return
  const ids = new Set((mentions || []).map(m => m.personId).filter(v => v != null))
  let all
  try { all = await db.relations.toArray() } catch { return }
  const now = Date.now()
  for (const p of all) {
    const items = Array.isArray(p.linkedItems) ? p.linkedItems : []
    const has = items.some(i => i.noteId === noteId)
    const should = ids.has(p.id)
    if (should && !has) {
      await db.relations.update(p.id, { linkedItems: [...items, { noteId, noteTitle: noteTitle || '', linkedAt: now }], updatedAt: now })
    } else if (!should && has) {
      await db.relations.update(p.id, { linkedItems: items.filter(i => i.noteId !== noteId), updatedAt: now })
    } else if (should && has && noteTitle) {
      // Keep the cached title fresh.
      const next = items.map(i => i.noteId === noteId ? { ...i, noteTitle } : i)
      await db.relations.update(p.id, { linkedItems: next })
    }
  }
}

// Remove this note from every person's linkedItems (call when a note is deleted).
export async function unlinkNote(noteId) {
  if (noteId == null) return
  let all
  try { all = await db.relations.toArray() } catch { return }
  for (const p of all) {
    const items = Array.isArray(p.linkedItems) ? p.linkedItems : []
    if (items.some(i => i.noteId === noteId)) {
      await db.relations.update(p.id, { linkedItems: items.filter(i => i.noteId !== noteId), updatedAt: Date.now() })
    }
  }
}

// Navigate to a person's full profile in the Relations section (App listens).
export function openPersonProfile(personId) {
  window.dispatchEvent(new CustomEvent('aurora-open-person', { detail: { personId } }))
}
