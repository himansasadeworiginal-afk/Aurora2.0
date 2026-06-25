import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import db from './db.js'

const USER_HOME = '/home/wolf'
const VAULT_PATH = path.resolve(USER_HOME, 'Documents/Second Brains/1.0/Second Brain version 1.0')

const PARA_MAP = {
  Study: 'resources',
  Work: 'projects',
  Entertainment: 'resources',
}

function extractWikilinks(content) {
  const links = []
  const regex = /\[\[([^\]]+)\]\]/g
  let match
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].split('|')[0].trim())
  }
  return links
}

function isMarkdownFile(file) {
  return file.endsWith('.md') && !file.startsWith('.')
}

function determineParaCategory(relativePath) {
  const parts = relativePath.split(path.sep)
  for (const [dir, category] of Object.entries(PARA_MAP)) {
    if (parts[0] === dir) return category
  }
  return 'resources'
}

export async function importVaultFiles(vaultPath = VAULT_PATH) {
  const results = { imported: 0, skipped: 0, errors: [] }

  async function walkDir(dirPath, relativePath = '') {
    let entries
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true })
    } catch (err) {
      results.errors.push(`Cannot read ${dirPath}: ${err.message}`)
      return
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name

      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.')) {
          await walkDir(fullPath, relPath)
        }
      } else if (entry.isFile() && isMarkdownFile(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8')
          const parsed = matter(content)
          const title = parsed.data?.title || entry.name.replace(/\.md$/, '')
          const wikilinks = extractWikilinks(content)

          const existing = await db.vaultFiles
            .where('path')
            .equals(relPath)
            .first()

          const noteData = {
            title,
            content: parsed.content,
            createdAt: parsed.data?.createdAt ? new Date(parsed.data.createdAt) : new Date(),
            updatedAt: parsed.data?.updatedAt ? new Date(parsed.data.updatedAt) : new Date(),
            paraCategory: determineParaCategory(relPath),
            tags: parsed.data?.tags || [],
            source: `file://${fullPath}`,
            wikilinks,
            vaultPath: relPath,
          }

          if (existing) {
            await db.vaultFiles.put({ ...existing, ...noteData })
            await db.notes.put({ ...noteData, id: existing.noteId || undefined })
          } else {
            const noteId = await db.notes.add(noteData)
            await db.vaultFiles.add({
              path: relPath,
              title,
              updatedAt: new Date(),
              noteId,
            })
          }

          results.imported++
        } catch (err) {
          results.errors.push(`Error importing ${relPath}: ${err.message}`)
        }
      }
    }
  }

  if (!fs.existsSync(vaultPath)) {
    results.errors.push(`Vault path does not exist: ${vaultPath}`)
    return results
  }

  await walkDir(vaultPath)
  return results
}
