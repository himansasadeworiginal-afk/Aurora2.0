// Data + presentation helpers for the Relations section. Kept separate from the
// components so the DB shape and the small pure helpers (friendliness color,
// initials, compact AI payload) are reused across List, Graph, and AI Search.

import db from '../../data/db'

// A fresh person record. Only `name` is required; everything else is optional
// and may be null/empty. `diaryMentions` / `linkedItems` are reserved for future
// phases — included in the shape but never used by logic yet.
export function emptyPerson() {
  return {
    name: '',
    phone: null,
    email: null,
    birthday: null,
    location: null,
    description: null,
    profilePic: null,
    friendliness: null,
    skills: [],
    howWeMet: null,
    relationshipType: null,
    diaryMentions: [],
    linkedItems: [],
  }
}

// Normalize anything coming out of a form into a clean record for Dexie.
function clean(person) {
  const blank = (v) => (v == null || (typeof v === 'string' && v.trim() === '')) ? null : v
  return {
    name: (person.name || '').trim(),
    phone: blank(person.phone),
    email: blank(person.email),
    birthday: blank(person.birthday),
    location: blank(person.location),
    description: blank(person.description),
    profilePic: person.profilePic || null,
    friendliness: person.friendliness == null || person.friendliness === '' ? null : Number(person.friendliness),
    skills: Array.isArray(person.skills) ? person.skills.map(s => s.trim()).filter(Boolean) : [],
    howWeMet: blank(person.howWeMet),
    relationshipType: blank(person.relationshipType),
    diaryMentions: person.diaryMentions || [],
    linkedItems: person.linkedItems || [],
  }
}

export async function listRelations() {
  try {
    const all = await db.relations.toArray()
    all.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return all
  } catch {
    return []
  }
}

export async function createPerson(person) {
  const now = Date.now()
  const record = { ...clean(person), createdAt: now, updatedAt: now }
  if (!record.name) throw new Error('Name is required')
  const id = await db.relations.add(record)
  return { id, ...record }
}

export async function updatePerson(id, person) {
  const record = { ...clean(person), updatedAt: Date.now() }
  if (!record.name) throw new Error('Name is required')
  await db.relations.update(id, record)
  return { id, ...record }
}

export async function deletePerson(id) {
  await db.relations.delete(id)
}

// One-shot import of the bundled 50-person sample set (testing/demo). Skips if
// there are already people so it never duplicates real data.
export async function seedSamplePeople() {
  const { SAMPLE_PEOPLE } = await import('./seed-data')
  const existing = await db.relations.count()
  if (existing > 0) return existing
  const now = Date.now()
  await db.relations.bulkAdd(SAMPLE_PEOPLE.map(p => ({ ...clean(p), createdAt: now, updatedAt: now })))
  return SAMPLE_PEOPLE.length
}

// --- Diary auto-detection -------------------------------------------------

const PERSON_FIELDS = ['name', 'phone', 'email', 'birthday', 'location', 'description', 'friendliness', 'skills', 'howWeMet', 'relationshipType']

// Coerce an AI/heuristic `extractedFields` blob into a safe partial person
// record, keeping only known fields and dropping empties.
export function normalizeFields(fields) {
  const out = {}
  if (!fields || typeof fields !== 'object') return out
  for (const k of PERSON_FIELDS) {
    if (!(k in fields)) continue
    let v = fields[k]
    if (k === 'skills') {
      if (typeof v === 'string') v = v.split(',')
      out.skills = Array.isArray(v) ? v.map(s => String(s).trim()).filter(Boolean) : []
    } else if (k === 'friendliness') {
      out.friendliness = v == null || v === '' ? null : Math.max(0, Math.min(100, Number(v)))
    } else {
      const s = v == null ? '' : String(v).trim()
      if (s) out[k] = s
    }
  }
  return out
}

// Apply a confirmed detection. Returns an async `undo()` that fully reverts it
// (deletes a new person; restores prior field values on an update). `entry` is
// the diary entry the detection came from — a reference is appended to the
// person's `diaryMentions[]`.
export async function applyDetection(detection, entry) {
  const fields = normalizeFields(detection.extractedFields)
  const mention = entry
    ? { entryId: entry.id ?? null, date: entry.date || null, text: detection.sourceText || null, at: Date.now() }
    : null
  const now = Date.now()

  if (detection.type === 'update' && detection.matchedId != null) {
    const prev = await db.relations.get(detection.matchedId)
    if (!prev) {
      // Matched record vanished — fall through to creating it new.
      return applyDetection({ ...detection, type: 'new', matchedId: null }, entry)
    }
    const before = {}
    for (const k of Object.keys(fields)) before[k] = prev[k]
    const beforeMentions = prev.diaryMentions || []
    const patch = { ...fields, updatedAt: now }
    if (mention) patch.diaryMentions = [...beforeMentions, mention]
    await db.relations.update(detection.matchedId, patch)
    const id = detection.matchedId
    return {
      label: prev.name || fields.name || 'Person',
      kind: 'update',
      undo: async () => { await db.relations.update(id, { ...before, diaryMentions: beforeMentions, updatedAt: Date.now() }) },
    }
  }

  // New person.
  const record = { ...clean({ ...emptyPerson(), ...fields }), createdAt: now, updatedAt: now }
  if (mention) record.diaryMentions = [mention]
  if (!record.name) record.name = 'Unnamed'
  const id = await db.relations.add(record)
  return {
    label: record.name,
    kind: 'new',
    undo: async () => { await db.relations.delete(id) },
  }
}

// Friendliness from natural-language sentiment. Mirrors the AI guide so the
// offline path behaves like the online one. Returns null when there is no
// sentiment (never a hardcoded default), or an explicit percentage if stated.
export function friendlinessFromText(text) {
  const t = (text || '').toLowerCase()
  // Explicit "N% friendly" / "around N%".
  const pct = t.match(/(\d{1,3})\s*%/) || t.match(/\b(\d{1,3})\s*(?:percent)\b/)
  if (pct) return Math.max(0, Math.min(100, Number(pct[1])))
  if (/\b(very friendly|great energy|super enthusiastic|amazing energy|lovely|delightful)\b/.test(t)) return 90
  if (/\b(friendly|warm|easy to talk to|kind|supportive|generous|fun|welcoming)\b/.test(t)) return 78
  if (/\b(okay|professional|neutral|polite|fine)\b/.test(t)) return 60
  if (/\b(quiet|reserved|hard to read|shy|distant)\b/.test(t)) return 45
  if (/\b(cold|unfriendly|difficult|rude|hostile|mean|toxic|abrasive)\b/.test(t)) return 25
  return null
}

// Offline fallback when no API key is configured. Per flagged segment it guesses
// a name, matches it against the existing people (so known contacts become an
// "update", not a duplicate "new"), and derives friendliness from sentiment.
// Always sub-70 confidence so the review UI lets the user confirm/fix.
export function heuristicDetect(segments, people = []) {
  return (segments || []).map(seg => {
    const text = String(seg).trim()
    const nameMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z'’-]+)*)\b/)
    const guess = nameMatch ? nameMatch[1].trim() : ''
    const friendliness = friendlinessFromText(text)

    // Fuzzy match the guessed name against existing contacts.
    const gl = guess.toLowerCase()
    let match = null
    if (gl) {
      match = people.find(p => (p.name || '').toLowerCase() === gl)
        || people.find(p => { const n = (p.name || '').toLowerCase(); return n && (n.startsWith(gl) || gl.startsWith(n) || n.includes(gl) || gl.includes(n)) })
        || null
    }

    if (match) {
      // Treat as an update: only the new observation (+ any sentiment) changes.
      const fields = { description: text }
      if (friendliness != null) fields.friendliness = friendliness
      return {
        type: 'update',
        matchedId: match.id,
        confidence: (match.name || '').toLowerCase() === gl ? 65 : 55,
        sourceText: text,
        extractedFields: fields,
      }
    }

    const fields = {}
    if (guess) fields.name = guess
    fields.description = text
    if (friendliness != null) fields.friendliness = friendliness
    return { type: 'new', matchedId: null, confidence: 30, sourceText: text, extractedFields: fields }
  })
}

// --- Profile log: Memories (episodic) + Notes (evergreen facts) -----------

const rid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

// A person's Memories timeline merges auto-captured diary mentions with manual
// memories, newest first. Each item is normalized to { id, text, date, at,
// source }.
export function buildTimeline(person) {
  const fromDiary = (person?.diaryMentions || []).map((m, i) => ({
    id: `d${m.entryId ?? i}-${m.at ?? i}`,
    text: m.text || '',
    date: m.date || (m.at ? new Date(m.at).toISOString().slice(0, 10) : null),
    at: m.at || 0,
    source: 'diary',
  })).filter(m => m.text)
  const manual = (person?.memories || []).map(m => ({ ...m, source: 'manual' }))
  return [...fromDiary, ...manual].sort((a, b) => {
    const da = a.date || ''; const db_ = b.date || ''
    return db_.localeCompare(da) || (b.at || 0) - (a.at || 0)
  })
}

export async function addMemory(id, text, date) {
  const clean = (text || '').trim()
  if (!clean) return
  const person = await db.relations.get(id)
  const memories = Array.isArray(person?.memories) ? person.memories : []
  const item = { id: rid(), text: clean, date: date || new Date().toISOString().slice(0, 10), at: Date.now() }
  await db.relations.update(id, { memories: [...memories, item], updatedAt: Date.now() })
  return item
}

export async function deleteMemory(id, memId) {
  const person = await db.relations.get(id)
  const memories = (person?.memories || []).filter(m => m.id !== memId)
  await db.relations.update(id, { memories, updatedAt: Date.now() })
}

export async function addFact(id, text) {
  const clean = (text || '').trim()
  if (!clean) return
  const person = await db.relations.get(id)
  const facts = Array.isArray(person?.profileNotes) ? person.profileNotes : []
  const item = { id: rid(), text: clean, at: Date.now() }
  await db.relations.update(id, { profileNotes: [...facts, item], updatedAt: Date.now() })
  return item
}

export async function deleteFact(id, factId) {
  const person = await db.relations.get(id)
  const facts = (person?.profileNotes || []).filter(f => f.id !== factId)
  await db.relations.update(id, { profileNotes: facts, updatedAt: Date.now() })
}

// Compact projection sent to Claude for AI search — small on purpose.
export function compactPerson(p) {
  return {
    id: p.id,
    name: p.name,
    skills: p.skills || [],
    friendliness: p.friendliness ?? null,
    location: p.location || null,
    relationshipType: p.relationshipType || null,
  }
}

// Initials for the avatar placeholder (max two letters).
export function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Friendliness → a color on Aurora's cool→warm scale (distant violet → close
// green), staying entirely inside the aurora family. Null = neutral grey.
export function friendlinessColor(score) {
  if (score == null || Number.isNaN(score)) return '#6E6E7A'
  const s = Math.max(0, Math.min(100, score))
  if (s < 40) return '#8B7CF6'          // violet — distant
  if (s < 55) return '#7FA8F0'          // blue
  if (s < 70) return '#56C6E8'          // cyan
  if (s < 85) return '#3BD6C6'          // teal
  return '#52E3A4'                       // green — close
}

// Keyword fallback for AI search when no API key is configured. Scores by simple
// term overlap across name / skills / description / location / type.
export function keywordSearch(query, people) {
  const q = (query || '').toLowerCase().trim()
  if (!q) return people.map(p => ({ person: p, reason: null }))
  const terms = q.split(/\s+/).filter(t => t.length > 1)

  // Honor a "more than N%" / "above N" friendliness condition if present.
  const numMatch = q.match(/(\d{1,3})\s*%?/)
  const wantsAbove = /\b(more|above|over|greater|higher|>)\b/.test(q)
  const wantsBelow = /\b(less|below|under|lower|<)\b/.test(q)
  const threshold = numMatch ? Number(numMatch[1]) : null

  const scored = []
  for (const p of people) {
    if (threshold != null && p.friendliness != null) {
      if (wantsAbove && !(p.friendliness >= threshold)) continue
      if (wantsBelow && !(p.friendliness <= threshold)) continue
    }
    const hay = [
      p.name,
      (p.skills || []).join(' '),
      p.description,
      p.location,
      p.relationshipType,
      p.howWeMet,
    ].filter(Boolean).join(' ').toLowerCase()

    let score = 0
    for (const t of terms) {
      if (/^\d+%?$/.test(t)) continue // numeric handled above
      if (hay.includes(t)) score += 1
    }
    // If a threshold matched and there were no other text terms, keep it.
    const textTerms = terms.filter(t => !/^\d+%?$/.test(t) && !['more','above','over','greater','higher','less','below','under','lower','than','friendly','friendliness'].includes(t))
    if (score > 0 || (threshold != null && textTerms.length === 0)) {
      scored.push({ person: p, score })
    }
  }
  scored.sort((a, b) => b.score - a.score || (b.person.friendliness ?? 0) - (a.person.friendliness ?? 0))
  return scored.map(s => ({ person: s.person, reason: null }))
}
