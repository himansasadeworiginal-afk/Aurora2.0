import { createServer } from 'http'
import { readFileSync, statSync, existsSync } from 'fs'
import { extname, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { startDesmond, stopDesmond, getDesmondStatus } from './desmond-launcher.js'
import { aiAvailable, distill, concepts, rerank, brief, relationsSearch, relationsDetect } from './server-ai.js'
import { enqueueCommand, listCommands, ackCommands, getVaultChanges, startVaultWatch } from './agent-bridge.js'
import { getBrainIndex, refreshBrainIndex } from './brain-index.js'
import { pushChanges, pullChanges } from './sync-store.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Read and JSON-parse a request body (resolves to {} on empty/invalid).
function readJson(req) {
  return new Promise(resolve => {
    let data = ''
    req.on('data', chunk => { data += chunk; if (data.length > 1e6) req.destroy() })
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}) } catch { resolve({}) } })
    req.on('error', () => resolve({}))
  })
}

// Dispatch /api/ai/* routes. Returns true if it handled the request.
async function handleAi(url, method, req, res) {
  if (url === '/api/ai/status' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ available: aiAvailable() }))
    return true
  }
  const routes = { '/api/ai/distill': distill, '/api/ai/concepts': concepts, '/api/ai/rerank': rerank, '/api/ai/brief': brief, '/api/ai/relations-search': relationsSearch, '/api/ai/relations-detect': relationsDetect }
  const fn = routes[url]
  if (fn && method === 'POST') {
    const body = await readJson(req)
    let out
    try { out = await fn(body) } catch (err) { out = { ok: false, reason: String(err?.message || err) } }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(out))
    return true
  }
  return false
}

// Dispatch /api/agent/* and /api/vault/* — the Aurora ↔ Desmond bridge.
// Returns true if it handled the request.
async function handleAgent(url, method, req, res, query) {
  const send = (out) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(out)) }
  if (url === '/api/agent/command' && method === 'POST') { send(enqueueCommand(await readJson(req))); return true }
  if (url === '/api/agent/queue' && method === 'GET') { send(listCommands()); return true }
  if (url === '/api/agent/ack' && method === 'POST') { const b = await readJson(req); send(ackCommands(b.ids || [])); return true }
  if (url === '/api/vault/changes' && method === 'GET') { send(getVaultChanges(query.get('since'))); return true }
  if (url === '/api/brain/index' && method === 'GET') { send(getBrainIndex()); return true }
  if (url === '/api/brain/refresh' && method === 'POST') { send(refreshBrainIndex()); return true }
  return false
}

// Dispatch /api/sync/* — the multi-device (desktop <-> phone) data sync
// channel. Returns true if it handled the request.
async function handleSync(url, method, req, res, query) {
  const send = (out) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(out)) }
  if (url === '/api/sync/push' && method === 'POST') { const b = await readJson(req); send(pushChanges(b.changes || [])); return true }
  if (url === '/api/sync/pull' && method === 'GET') { send(pullChanges(query.get('since'))); return true }
  return false
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
}

// Start the Aurora HTTP server. Paths are configurable so the Electron build
// can point at the bundled dist/ and nexo/ under process.resourcesPath while
// the standalone systemd path uses the defaults relative to this file.
export function startServer({
  port = 8080,
  host = undefined,
  dist = join(__dirname, 'dist'),
  nexoRoot = __dirname,
  autoStartDesmond = true,
} = {}) {
  const DIST = dist

  const server = createServer(async (req, res) => {
  const url = req.url.split('?')[0]
  const method = req.method
  const query = new URLSearchParams(req.url.split('?')[1] || '')

  if (url.startsWith('/api/ai/')) {
    if (await handleAi(url, method, req, res)) return
  }

  if (url.startsWith('/api/agent/') || url.startsWith('/api/vault/') || url.startsWith('/api/brain/')) {
    if (await handleAgent(url, method, req, res, query)) return
  }

  if (url.startsWith('/api/sync/')) {
    if (await handleSync(url, method, req, res, query)) return
  }

  if (url === '/api/health' && method === 'GET') {
    const st = getDesmondStatus()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ desmond: st }))
    return
  }

  if (url === '/api/desmond/start' && method === 'POST') {
    startDesmond()
    const st = getDesmondStatus()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ desmond: st }))
    return
  }

  if (url === '/api/desmond/stop' && method === 'POST') {
    stopDesmond()
    const st = getDesmondStatus()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ desmond: st }))
    return
  }

  if (url.startsWith('/nexo/')) {
    const nexoPath = join(nexoRoot, url)
    if (!existsSync(nexoPath) || statSync(nexoPath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not Found')
      return
    }
    const ext = extname(nexoPath).toLowerCase()
    const mime = MIME[ext] || 'application/octet-stream'
    try {
      const content = readFileSync(nexoPath)
      res.writeHead(200, { 'Content-Type': mime })
      res.end(content)
    } catch {
      res.writeHead(500)
      res.end('Internal Server Error')
    }
    return
  }

  const filePath = join(DIST, url === '/' ? '/index.html' : url)

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
    return
  }

  const ext = extname(filePath).toLowerCase()
  const mime = MIME[ext] || 'application/octet-stream'

  try {
    const content = readFileSync(filePath)
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'max-age=31536000, immutable',
    })
    res.end(content)
  } catch {
    res.writeHead(500)
    res.end('Internal Server Error')
  }
  })

  server.listen(port, host, () => {
    console.log(`Aurora 5.0 running at http://${host || 'localhost'}:${port}`)
  })

  if (autoStartDesmond) startDesmond()
  refreshBrainIndex() // warm the brain index for cheap agent reads
  startVaultWatch(undefined, refreshBrainIndex) // watch vault; refresh index on change

  return server
}

// Run directly (systemd / `node server.js`) — preserve the original behavior.
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (invokedDirectly) {
  startServer()
  process.on('SIGINT', () => { stopDesmond(); process.exit(0) })
  process.on('SIGTERM', () => { stopDesmond(); process.exit(0) })
  process.on('exit', stopDesmond)
}
