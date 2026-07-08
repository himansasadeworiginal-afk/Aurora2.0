import db from './db'
import { aiExpandConcepts, aiRerank } from './ai-client'

const STOP_WORDS = new Set('a,an,the,is,was,are,were,be,been,being,have,has,had,do,does,did,will,would,can,could,shall,should,may,might,to,of,in,for,on,with,at,by,from,as,into,through,during,before,after,above,below,between,out,off,over,under,again,further,then,once,here,there,when,where,why,how,all,each,every,both,few,more,most,other,some,such,no,nor,not,only,own,same,so,than,too,very,just,about,up,this,that,these,those,it,its,what,which,who,whom'.split(','))

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t))
}

function buildTokenVector(tokens) {
  const freq = {}
  for (const t of tokens) {
    freq[t] = (freq[t] || 0) + 1
  }
  return freq
}

function cosineSimilarity(a, b) {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)])
  let dot = 0, normA = 0, normB = 0
  for (const key of allKeys) {
    const va = a[key] || 0
    const vb = b[key] || 0
    dot += va * vb
    normA += va * va
    normB += vb * vb
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function indexNotes() {
  const notes = await db.notes.toArray()
  const existing = await db.embeddings.count()
  if (existing > 0) return

  const entries = notes.map(note => {
    const text = `${note.title} ${note.content || ''} ${(note.tags || []).join(' ')}`
    const tokens = tokenize(text)
    return {
      noteId: note.id,
      model: 'keyword-tf',
      dimension: tokens.length,
      tokens,
      createdAt: new Date(),
    }
  })
  await db.embeddings.bulkAdd(entries)
}

export async function search(query, limit = 20) {
  const qTokens = tokenize(query)
  if (qTokens.length === 0) return []

  // When AI is available, expand the query into related concepts/synonyms so we
  // match by meaning, not just exact words. Falls back to the bare query tokens.
  let matchTokens = qTokens
  const expanded = await aiExpandConcepts(query)
  if (expanded.ok && expanded.tokens?.length) {
    const extra = expanded.tokens.flatMap(tokenize)
    matchTokens = [...new Set([...qTokens, ...extra])]
  }

  const qVector = buildTokenVector(matchTokens)
  const allEmbeddings = await db.embeddings.toArray()
  const notes = await db.notes.toArray()
  const noteMap = {}
  for (const n of notes) noteMap[n.id] = n

  const results = []
  for (const emb of allEmbeddings) {
    const docVector = buildTokenVector(emb.tokens)
    const score = cosineSimilarity(qVector, docVector)
    if (score > 0) {
      results.push({
        note: noteMap[emb.noteId],
        score: Math.round(score * 1000) / 1000,
        matches: qTokens.filter(t => emb.tokens.includes(t)),
      })
    }
  }

  results.sort((a, b) => b.score - a.score)

  // Re-rank the top candidates by meaning via Claude. If it's offline or fails,
  // keep the cosine ordering exactly as before.
  const top = results.slice(0, Math.max(limit, 12))
  if (top.length > 1) {
    const candidates = top
      .filter(r => r.note)
      .map(r => ({ id: r.note.id, title: r.note.title, snippet: r.note.content || '' }))
    const ranked = await aiRerank(query, candidates)
    if (ranked.ok && ranked.ids?.length) {
      const byId = new Map(top.map(r => [String(r.note?.id), r]))
      const reordered = []
      for (const id of ranked.ids) {
        const r = byId.get(String(id))
        if (r) { reordered.push(r); byId.delete(String(id)) }
      }
      // Append any candidates Claude dropped, preserving cosine order.
      for (const r of top) if (byId.has(String(r.note?.id))) reordered.push(r)
      return reordered.slice(0, limit)
    }
  }

  return results.slice(0, limit)
}

// Enrich a single note's embedding with Claude-extracted concept tokens (merged
// into the keyword tokens) so it can be found by meaning. Call this after a note
// is created or edited. No-ops gracefully when AI is offline. Incremental by
// design — we never bulk-call the API for the whole corpus on boot.
export async function reindexNote(note) {
  if (!note?.id) return
  const text = `${note.title || ''} ${note.content || ''} ${(note.tags || []).join(' ')}`
  const base = tokenize(text)
  let tokens = base
  let model = 'keyword-tf'
  const res = await aiExpandConcepts(text)
  if (res.ok && res.tokens?.length) {
    const concepts = res.tokens.flatMap(tokenize)
    tokens = [...new Set([...base, ...concepts])]
    model = 'claude-concepts'
  }
  const existing = await db.embeddings.where('noteId').equals(note.id).first()
  if (existing) await db.embeddings.update(existing.id, { tokens, model, dimension: tokens.length })
  else await db.embeddings.add({ noteId: note.id, model, dimension: tokens.length, tokens, createdAt: new Date() })
}

export async function findRelated(noteId, limit = 3) {
  const emb = await db.embeddings.where('noteId').equals(noteId).first()
  if (!emb) return []

  const docVector = buildTokenVector(emb.tokens)
  const allEmbeddings = await db.embeddings.toArray()
  const notes = await db.notes.toArray()
  const noteMap = {}
  for (const n of notes) noteMap[n.id] = n

  const results = []
  for (const other of allEmbeddings) {
    if (other.noteId === noteId) continue
    const otherVector = buildTokenVector(other.tokens)
    const score = cosineSimilarity(docVector, otherVector)
    if (score > 0) {
      results.push({
        note: noteMap[other.noteId],
        score: Math.round(score * 1000) / 1000,
      })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit)
}

export async function findSerendipity(limit = 5) {
  const notes = await db.notes.toArray()
  const embeddings = await db.embeddings.toArray()
  const noteMap = {}
  for (const n of notes) noteMap[n.id] = n

  const results = []
  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      const a = embeddings[i]
      const b = embeddings[j]
      const noteA = noteMap[a.noteId]
      const noteB = noteMap[b.noteId]
      if (!noteA || !noteB) continue
      if (noteA.paraCategory === noteB.paraCategory) continue

      const aTokens = new Set(a.tokens)
      const bTokens = new Set(b.tokens)
      const shared = [...aTokens].filter(t => bTokens.has(t))

      if (shared.length >= 2) {
        const score = shared.length / Math.min(aTokens.size, bTokens.size)
        if (score > 0.1) {
          results.push({
            a: noteA,
            b: noteB,
            shared,
            score: Math.round(score * 100) / 100,
          })
        }
      }
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit)
}
