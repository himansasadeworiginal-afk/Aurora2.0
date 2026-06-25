import db from './db'

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

  const qVector = buildTokenVector(qTokens)
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
  return results.slice(0, limit)
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
