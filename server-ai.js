// Server-side Claude helpers for Aurora's AI features. This module is Node-only
// (it holds the Anthropic SDK and reads ANTHROPIC_API_KEY); it is imported by
// server.js and vite.config.js, never by the browser bundle — the API key never
// leaves the machine.
//
// Every function degrades gracefully: with no key (or on any API error) it
// resolves to `{ ok: false }` so callers fall back to Aurora's non-AI behavior.

import Anthropic from '@anthropic-ai/sdk'

// Quality tier for distillation (the writing matters); fast tier for the
// high-volume / low-stakes calls (concept expansion, rerank, daily brief).
const MODEL_QUALITY = 'claude-opus-4-8'
const MODEL_FAST = 'claude-haiku-4-5'

let _client = null
function client() {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!_client) _client = new Anthropic()
  return _client
}

export function aiAvailable() {
  return !!process.env.ANTHROPIC_API_KEY
}

// Pull the concatenated text out of a Messages response, skipping thinking blocks.
function textOf(message) {
  return (message.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim()
}

// Drop null/empty/empty-array fields so the detection review never shows a blank
// "detected" field (and friendliness never lands as a meaningless default).
function stripEmpty(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj || {})) {
    if (v == null) continue
    if (typeof v === 'string' && v.trim() === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    out[k] = v
  }
  return out
}

// ---------------------------------------------------------------------------
// Distillation — draft one progressive-summarization layer for a note.
// ---------------------------------------------------------------------------

const LAYER_GUIDE = {
  oil: `You are drafting the OIL layer of progressive summarization. Take the source text and surface what matters: keep the author's wording but tighten it to the essential passages, using **bold** for the most important phrases. Roughly 40-60% of the source length.`,
  gold: `You are drafting the GOLD layer of progressive summarization. From the bolded/important passages, extract ONLY the most valuable insights as a short set of crisp bullet points. Be ruthless — keep just the best.`,
  gems: `You are drafting the GEMS layer of progressive summarization. Write 1-3 sentences IN YOUR OWN WORDS capturing the single transferable principle or takeaway — the thing worth remembering months from now.`,
  soil: `You are cleaning up the SOIL layer (the raw capture). Lightly tidy formatting and fix obvious typos without changing meaning or removing detail.`,
}

export async function distill({ title, source, layer } = {}) {
  const c = client()
  if (!c) return { ok: false }
  const guide = LAYER_GUIDE[layer] || LAYER_GUIDE.gold
  if (!source || !source.trim()) return { ok: false, reason: 'empty-source' }
  try {
    const message = await c.messages.create({
      model: MODEL_QUALITY,
      max_tokens: 4000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: `${guide}\n\nOutput ONLY the layer text itself — no preamble, no headings, no "Here is", no surrounding quotes.`,
      messages: [{ role: 'user', content: `Note title: ${title || 'Untitled'}\n\nSource text:\n${source}` }],
    })
    const text = textOf(message)
    if (!text) return { ok: false }
    return { ok: true, text }
  } catch (err) {
    return { ok: false, reason: String(err?.message || err) }
  }
}

// ---------------------------------------------------------------------------
// Concept expansion — normalized concept tokens for a note (index-time).
// ---------------------------------------------------------------------------

export async function concepts({ text } = {}) {
  const c = client()
  if (!c) return { ok: false }
  if (!text || !text.trim()) return { ok: false, reason: 'empty' }
  try {
    const message = await c.messages.create({
      model: MODEL_FAST,
      max_tokens: 400,
      system: `Extract the key concepts, themes, synonyms, and closely related terms for the given note so it can be found by meaning, not just exact words. Output a single comma-separated list of lowercase terms (1-3 words each), no other text.`,
      messages: [{ role: 'user', content: text.slice(0, 6000) }],
    })
    const raw = textOf(message)
    const tokens = raw
      .toLowerCase()
      .split(/[,\n]/)
      .map(t => t.trim())
      .filter(t => t.length > 1 && t.length < 40)
    return { ok: true, tokens }
  } catch (err) {
    return { ok: false, reason: String(err?.message || err) }
  }
}

// ---------------------------------------------------------------------------
// Rerank — given a query and candidate notes, return ids best-first.
// ---------------------------------------------------------------------------

export async function rerank({ query, candidates } = {}) {
  const c = client()
  if (!c) return { ok: false }
  if (!query || !Array.isArray(candidates) || candidates.length === 0) return { ok: false }
  try {
    const list = candidates
      .slice(0, 30)
      .map(n => `[${n.id}] ${n.title || 'Untitled'}: ${(n.snippet || '').slice(0, 200)}`)
      .join('\n')
    const message = await c.messages.create({
      model: MODEL_FAST,
      max_tokens: 300,
      system: `You rank notes by how well they answer the user's query by MEANING. Return ONLY a comma-separated list of the note ids (the bracketed values) in best-to-worst order. Drop ids that are clearly irrelevant. No other text.`,
      messages: [{ role: 'user', content: `Query: ${query}\n\nNotes:\n${list}` }],
    })
    const raw = textOf(message)
    const ids = raw
      .split(/[,\s]+/)
      .map(s => s.replace(/[^a-zA-Z0-9_-]/g, ''))
      .filter(Boolean)
    if (!ids.length) return { ok: false }
    return { ok: true, ids }
  } catch (err) {
    return { ok: false, reason: String(err?.message || err) }
  }
}

// ---------------------------------------------------------------------------
// Relations search — natural-language query over the people graph. Given the
// query and a compact list of people, return matching ids best-first with a
// short reason each. The browser falls back to keyword matching with no key.
// ---------------------------------------------------------------------------

export async function relationsSearch({ query, relations } = {}) {
  const c = client()
  if (!c) return { ok: false }
  if (!query || !Array.isArray(relations) || relations.length === 0) return { ok: false }
  try {
    const list = relations
      .slice(0, 200)
      .map(p => {
        const skills = Array.isArray(p.skills) ? p.skills.join(', ') : ''
        const fr = p.friendliness == null ? 'unknown' : `${p.friendliness}%`
        return `[${p.id}] ${p.name || 'Unknown'} — friendliness ${fr}; type ${p.relationshipType || '—'}; location ${p.location || '—'}; skills: ${skills || '—'}`
      })
      .join('\n')
    const message = await c.messages.create({
      model: MODEL_FAST,
      max_tokens: 700,
      system: `You search a personal relationship database. Given a natural-language query and a list of people, return ONLY the people that genuinely match, best match first. Interpret friendliness as a 0-100 closeness score and honor numeric conditions (e.g. "more than 60% friendly"). Match skills, location, and relationship type by meaning, not just exact words.\n\nReturn ONLY a JSON array (no prose, no code fences) of objects: [{"id": <number>, "reason": "<short reason, max 12 words>"}]. If nothing matches, return [].`,
      messages: [{ role: 'user', content: `Query: ${query}\n\nPeople:\n${list}` }],
    })
    const raw = textOf(message).replace(/^```json\s*|\s*```$/g, '').trim()
    let parsed
    try { parsed = JSON.parse(raw) } catch { return { ok: false } }
    if (!Array.isArray(parsed)) return { ok: false }
    const results = parsed
      .filter(r => r && r.id != null)
      .map(r => ({ id: Number(r.id), reason: String(r.reason || '').slice(0, 120) }))
      .filter(r => Number.isFinite(r.id))
    return { ok: true, results }
  } catch (err) {
    return { ok: false, reason: String(err?.message || err) }
  }
}

// ---------------------------------------------------------------------------
// Relations detect — read *…* flagged segments from a diary entry and extract
// structured person data. For each segment decide whether it's a NEW person or
// an UPDATE to an existing one (fuzzy match against the supplied compact list),
// with a confidence score. The browser shows a review UI before anything saves.
// ---------------------------------------------------------------------------

export async function relationsDetect({ flaggedSegments, existingRelations } = {}) {
  const c = client()
  if (!c) return { ok: false }
  if (!Array.isArray(flaggedSegments) || flaggedSegments.length === 0) return { ok: false }
  try {
    const existing = Array.isArray(existingRelations) ? existingRelations : []
    const people = existing
      .slice(0, 300)
      .map(p => {
        const skills = Array.isArray(p.skills) ? p.skills.join(', ') : ''
        return `[${p.id}] ${p.name || 'Unknown'} — location ${p.location || '—'}; skills: ${skills || '—'}`
      })
      .join('\n') || '(none yet)'
    const segments = flaggedSegments
      .slice(0, 12)
      .map((s, i) => `${i + 1}. ${String(s).slice(0, 400)}`)
      .join('\n')

    const message = await c.messages.create({
      model: MODEL_FAST,
      max_tokens: 1200,
      system: `You extract relationship data from a personal diary. You are given an EXISTING CONTACTS list and numbered flagged segments (one observation each). For EACH segment, return one detection.

MATCHING — decide new vs update by comparing the segment to the existing contacts:
- Find the contact whose name best matches the person in the segment (fuzzy: ignore case, honor partial/nickname matches, e.g. "Test Four" matches "Test Four", "Marcus" matches "Marcus Wellington").
- If a confident name match exists (confidence >= 70): type "update", set matchedId to that contact's id, and put ONLY the new/changed fields in extractedFields.
- If a plausible-but-unsure match exists (confidence 50-69): type "uncertain", set matchedId to your best-guess contact's id.
- If no contact matches (confidence < 50): type "new", matchedId null, put all extracted fields in extractedFields.
Always set a confidence 0-100.

FIELDS — extract every field you can find: name, location, skills (array of short tags), phone, email, relationshipType, description (a clean one-line summary of the observation), howWeMet, birthday (ISO).

FRIENDLINESS — a 0-100 score from the sentiment in the text:
- "very friendly", "great energy", "super enthusiastic" -> 85-95
- "friendly", "easy to talk to", "warm" -> 70-84
- "okay", "professional", "neutral" -> 50-69
- "quiet", "hard to read", "reserved" -> 35-49
- "cold", "unfriendly", "difficult" -> 0-34
- If the user states a percentage ("around 90% friendly") use that EXACT number.
- If there is NO sentiment in the segment, OMIT friendliness entirely. Never default to 80.

OUTPUT — omit any field you cannot extract (do not emit nulls). Return ONLY a JSON object, no prose, no code fences:
{"detections":[{"type":"new"|"update"|"uncertain","matchedId":<number|null>,"confidence":<number>,"extractedFields":{...}}]}
One detection per input segment, in order. If a segment has no person info, omit it.`,
      messages: [{ role: 'user', content: `Existing contacts:\n${people}\n\nFlagged segments:\n${segments}` }],
    })

    const raw = textOf(message).replace(/^```json\s*|\s*```$/g, '').trim()
    let parsed
    try { parsed = JSON.parse(raw) } catch { return { ok: false } }
    const arr = Array.isArray(parsed?.detections) ? parsed.detections : (Array.isArray(parsed) ? parsed : null)
    if (!arr) return { ok: false }
    const detections = arr
      .filter(d => d && d.extractedFields && typeof d.extractedFields === 'object')
      .map(d => {
        // "uncertain" rides the update path with a sub-70 confidence so the
        // browser's "Is this the right person?" step fires.
        const matchedId = d.matchedId == null ? null : Number(d.matchedId)
        const isUpdate = (d.type === 'update' || d.type === 'uncertain') && Number.isFinite(matchedId)
        return {
          type: isUpdate ? 'update' : 'new',
          matchedId: isUpdate ? matchedId : null,
          confidence: Math.max(0, Math.min(100, Number(d.confidence) || 0)),
          extractedFields: stripEmpty(d.extractedFields),
        }
      })
    return { ok: true, detections }
  } catch (err) {
    return { ok: false, reason: String(err?.message || err) }
  }
}

// ---------------------------------------------------------------------------
// Daily brief — a short personal briefing for Wolf.
// ---------------------------------------------------------------------------

export async function brief({ reminders = [], events = [], staleNotes = [], date } = {}) {
  const c = client()
  if (!c) return { ok: false }
  try {
    const payload = {
      today: date || new Date().toISOString().slice(0, 10),
      reminders: reminders.map(r => ({ title: r.title, priority: r.priority, time: r.notificationTime || null, done: !!r.completed })),
      events: events.map(e => ({ title: e.title, time: e.time || null })),
      staleNotes: staleNotes.map(n => ({ title: n.title, depth: n.distillationDepth || 0 })),
    }
    const message = await c.messages.create({
      model: MODEL_FAST,
      max_tokens: 600,
      system: `You are Aurora, Wolf's personal second-brain assistant. Write a warm, sharp daily brief addressed directly to "Wolf". 3-5 short sentences. Lead with the most important / high-priority items for today, mention timing where given, then gently nudge ONE or TWO stale/undistilled notes worth revisiting. If there is nothing scheduled, say so encouragingly. No markdown headings, no bullet lists — just a short spoken-style paragraph.`,
      messages: [{ role: 'user', content: JSON.stringify(payload) }],
    })
    const text = textOf(message)
    if (!text) return { ok: false }
    return { ok: true, text }
  } catch (err) {
    return { ok: false, reason: String(err?.message || err) }
  }
}
