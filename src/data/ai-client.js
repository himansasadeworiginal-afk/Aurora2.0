// Browser-side wrapper for Aurora's AI features. Every call POSTs to the
// server-side proxy (/api/ai/*) which holds the Anthropic key — the key never
// reaches the client. Every function resolves to `{ ok:false }` on any failure
// so callers can fall back to Aurora's non-AI behavior without try/catch.

async function post(path, body) {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    })
    if (!res.ok) return { ok: false }
    return await res.json()
  } catch {
    return { ok: false }
  }
}

// Is an API key configured server-side? Cached after the first check.
let _statusPromise = null
export function aiStatus() {
  if (!_statusPromise) {
    _statusPromise = fetch('/api/ai/status')
      .then(r => (r.ok ? r.json() : { available: false }))
      .catch(() => ({ available: false }))
  }
  return _statusPromise
}

export function aiDistill({ title, source, layer }) {
  return post('/api/ai/distill', { title, source, layer })
}

export function aiExpandConcepts(text) {
  return post('/api/ai/concepts', { text })
}

export function aiRerank(query, candidates) {
  return post('/api/ai/rerank', { query, candidates })
}

export function aiDailyBrief(payload) {
  return post('/api/ai/brief', payload)
}

export function aiRelationsSearch(query, relations) {
  return post('/api/ai/relations-search', { query, relations })
}

export function aiRelationsDetect(flaggedSegments, existingRelations) {
  return post('/api/ai/relations-detect', { flaggedSegments, existingRelations })
}
