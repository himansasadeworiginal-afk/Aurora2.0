import db from './db.js'
import { ideas } from './ideas.js'
import { indexNotes } from './embeddings.js'

const PARA_MAP = {
  work: 'projects',
  'black-hall-corp': 'projects',
  'project-aurora': 'projects',
  'project-desmond': 'projects',
  'free-lancing': 'projects',
  'homebite-solutions': 'projects',
  study: 'resources',
  entertainment: 'resources',
}

function mapParaCategory(idea) {
  return PARA_MAP[idea.id] || 'resources'
}

export async function seedFromIdeas() {
  try {
    const count = await db.notes.count()
    if (count > 0) return

    const notes = ideas.map(idea => ({
      title: idea.title,
      content: idea.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      paraCategory: mapParaCategory(idea),
      tags: idea.tags || [],
      source: idea.link || '',
      ideaId: idea.id,
      color: idea.color,
      parentId: idea.parentId || null,
      links: idea.links || [],
    }))

    await db.notes.bulkAdd(notes)
    await indexNotes()
    console.log(`[seed] Seeded ${notes.length} ideas from ideas.js`)
  } catch (err) {
    console.error('[seed] seedFromIdeas failed:', err)
  }
}

export async function seedFromVault(vaultEntries) {
  if (!vaultEntries || vaultEntries.length === 0) return

  try {
    const existing = await db.notes.where('source').startsWith('file://').count()
    if (existing > 0) return

    const notes = vaultEntries.map(entry => ({
      title: entry.title,
      content: entry.content,
      createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
      updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
      paraCategory: entry.paraCategory || 'resources',
      tags: entry.tags || [],
      source: entry.source || '',
      wikilinks: entry.wikilinks || [],
      vaultPath: entry.vaultPath || '',
    }))

    await db.notes.bulkAdd(notes)
    await indexNotes()
    console.log(`[seed] Seeded ${notes.length} vault files`)
  } catch (err) {
    console.error('[seed] seedFromVault failed:', err)
  }
}
