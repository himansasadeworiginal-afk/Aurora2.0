// Data helpers for the Diary section. Diary entries are dated free-text notes.
// Segments wrapped in *asterisks* are "relationship flags" — they feed the
// Relations auto-detection pipeline (see DiaryDetectionModal). Kept separate
// from the components so the DB shape and the small pure helpers are reusable.

import db from '../../data/db'

// A fresh entry. `body` is the only meaningful field on create; `date` defaults
// to today (local) so entries group by day.
export function emptyEntry() {
  const today = new Date()
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return { title: '', body: '', date: iso, mood: null, scanned: false }
}

function clean(entry) {
  const blank = (v) => (v == null || (typeof v === 'string' && v.trim() === '')) ? null : v
  return {
    title: (entry.title || '').trim() || null,
    body: entry.body || '',
    date: entry.date || emptyEntry().date,
    mood: blank(entry.mood),
    scanned: !!entry.scanned,
  }
}

export async function listEntries() {
  try {
    const all = await db.diary.toArray()
    // Newest first by date, then by creation.
    all.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0))
    return all
  } catch {
    return []
  }
}

export async function createEntry(entry) {
  const now = Date.now()
  const record = { ...clean(entry), createdAt: now, updatedAt: now }
  const id = await db.diary.add(record)
  return { id, ...record }
}

export async function updateEntry(id, entry) {
  const record = { ...clean(entry), updatedAt: Date.now() }
  await db.diary.update(id, record)
  return { id, ...record }
}

export async function deleteEntry(id) {
  await db.diary.delete(id)
}

export async function markScanned(id) {
  await db.diary.update(id, { scanned: true, updatedAt: Date.now() })
}

// Pull every *…* flagged segment out of a body. Non-greedy, multiline-safe,
// trims whitespace, drops empties and bold-markdown false positives (`**bold**`
// is not a flag — those produce empty inner captures and are skipped).
export function extractFlags(body) {
  if (!body) return []
  const out = []
  const re = /\*([^*\n][^*]*?)\*/g
  let m
  while ((m = re.exec(body)) != null) {
    const seg = m[1].trim()
    if (seg) out.push(seg)
  }
  return out
}

export function hasFlags(body) {
  return extractFlags(body).length > 0
}

// Split a body into ordered text/flag tokens for the syntax-highlight overlay.
// `{ text }` for plain runs, `{ flag, raw }` for a *…* segment (raw includes the
// asterisks so the overlay stays character-aligned with the textarea).
export function tokenizeBody(body) {
  if (!body) return []
  const tokens = []
  const re = /\*([^*\n][^*]*?)\*/g
  let last = 0
  let m
  while ((m = re.exec(body)) != null) {
    if (m.index > last) tokens.push({ text: body.slice(last, m.index) })
    tokens.push({ flag: m[1], raw: m[0] })
    last = m.index + m[0].length
  }
  if (last < body.length) tokens.push({ text: body.slice(last) })
  return tokens
}
