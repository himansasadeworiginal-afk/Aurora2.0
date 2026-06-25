import chokidar from 'chokidar'
import path from 'path'
import fs from 'fs'
import matter from 'gray-matter'
import db from './db.js'

const USER_HOME = '/home/wolf'
const VAULT_PATH = path.resolve(USER_HOME, 'Documents/Second Brains/1.0/Second Brain version 1.0')

function extractWikilinks(content) {
  const links = []
  const regex = /\[\[([^\]]+)\]\]/g
  let match
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].split('|')[0].trim())
  }
  return links
}

function relativePath(fullPath) {
  return path.relative(VAULT_PATH, fullPath)
}

function isMarkdownFile(filePath) {
  return filePath.endsWith('.md') && !path.basename(filePath).startsWith('.')
}

async function handleChange(filePath) {
  if (!isMarkdownFile(filePath)) return

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const parsed = matter(content)
    const relPath = relativePath(filePath)
    const title = parsed.data?.title || path.basename(filePath, '.md')
    const wikilinks = extractWikilinks(content)

    const existing = await db.vaultFiles.where('path').equals(relPath).first()

    const noteData = {
      title,
      content: parsed.content,
      updatedAt: new Date(),
      tags: parsed.data?.tags || [],
      source: `file://${filePath}`,
      wikilinks,
      vaultPath: relPath,
    }

    if (existing) {
      const note = await db.notes.get(existing.noteId)
      if (note) {
        await db.notes.put({ ...note, ...noteData, id: existing.noteId })
      }
      await db.vaultFiles.put({ ...existing, title, updatedAt: new Date() })
    } else {
      const noteId = await db.notes.add({
        ...noteData,
        createdAt: new Date(),
        paraCategory: 'inbox',
      })
      await db.vaultFiles.add({
        path: relPath,
        title,
        updatedAt: new Date(),
        noteId,
      })
    }

    console.log(`[Sync] Updated: ${relPath}`)
  } catch (err) {
    console.error(`[Sync] Error processing ${filePath}:`, err.message)
  }
}

async function handleUnlink(filePath) {
  if (!isMarkdownFile(filePath)) return

  try {
    const relPath = relativePath(filePath)
    const existing = await db.vaultFiles.where('path').equals(relPath).first()

    if (existing) {
      const note = await db.notes.get(existing.noteId)
      if (note) {
        await db.notes.put({ ...note, paraCategory: 'archives', updatedAt: new Date() })
      }
      console.log(`[Sync] Archived: ${relPath}`)
    }
  } catch (err) {
    console.error(`[Sync] Error archiving ${filePath}:`, err.message)
  }
}

export function startWatcher(vaultPath = VAULT_PATH) {
  if (!fs.existsSync(vaultPath)) {
    console.warn(`[Sync] Vault path does not exist: ${vaultPath}. Watcher not started.`)
    return null
  }

  const watcher = chokidar.watch(`${vaultPath}/**/*.md`, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  })

  watcher.on('change', handleChange)
  watcher.on('add', handleChange)
  watcher.on('unlink', handleUnlink)

  console.log(`[Sync] Watching vault: ${vaultPath}`)
  return watcher
}
