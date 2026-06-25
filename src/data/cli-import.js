import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const USER_HOME = '/home/wolf'
const VAULT_PATH = path.resolve(USER_HOME, 'Documents/Second Brains/1.0/Second Brain version 1.0')
const OUTPUT_PATH = path.resolve('src/data/vault-seed.json')

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

function walkDir(dirPath, relativePath = '') {
  const results = []
  let entries
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true })
  } catch (err) {
    console.error(`Cannot read ${dirPath}: ${err.message}`)
    return results
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.')) {
        results.push(...walkDir(fullPath, relPath))
      }
    } else if (entry.isFile() && isMarkdownFile(entry.name)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const parsed = matter(content)
        results.push({
          title: parsed.data?.title || entry.name.replace(/\.md$/, ''),
          content: parsed.content,
          createdAt: parsed.data?.createdAt || null,
          updatedAt: parsed.data?.updatedAt || null,
          paraCategory: determineParaCategory(relPath),
          tags: parsed.data?.tags || [],
          source: `file://${fullPath}`,
          wikilinks: extractWikilinks(content),
          vaultPath: relPath,
        })
      } catch (err) {
        console.error(`Error reading ${relPath}: ${err.message}`)
      }
    }
  }
  return results
}

function main() {
  console.log('[Aurora 3.2] Scanning vault...')

  if (!fs.existsSync(VAULT_PATH)) {
    console.error(`Vault path not found: ${VAULT_PATH}`)
    process.exit(1)
  }

  const entries = walkDir(VAULT_PATH)
  const data = { vaultFiles: entries, importedAt: new Date().toISOString() }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2))

  console.log(`  → ${entries.length} files imported`)
  console.log(`  → Written to ${OUTPUT_PATH}`)
  console.log('[Aurora 3.2] Import complete')
}

main()
