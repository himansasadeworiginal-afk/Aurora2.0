import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync, statSync } from 'fs'
import { extname, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { startDesmond, stopDesmond, getDesmondStatus } from './desmond-launcher.js'
import { aiAvailable, distill, concepts, rerank, brief, relationsSearch, relationsDetect } from './server-ai.js'
import { enqueueCommand, listCommands, ackCommands, getVaultChanges, startVaultWatch } from './agent-bridge.js'
import { getBrainIndex, refreshBrainIndex } from './brain-index.js'
import { pushChanges, pullChanges } from './sync-store.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function readJson(req) {
  return new Promise(resolve => {
    let data = ''
    req.on('data', chunk => { data += chunk; if (data.length > 1e6) req.destroy() })
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}) } catch { resolve({}) } })
    req.on('error', () => resolve({}))
  })
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
}

export default defineConfig({
  base: '',
  plugins: [react(), {
    name: 'nexo-static',
    configureServer(server) {
      startDesmond()
      refreshBrainIndex()
      startVaultWatch(undefined, refreshBrainIndex)

      server.middlewares.use(async (req, res, next) => {
        const url = req.url.split('?')[0]
        const method = req.method
        const query = new URLSearchParams(req.url.split('?')[1] || '')

        // Aurora ↔ Desmond bridge: command queue + vault changes.
        if (url === '/api/agent/command' && method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(enqueueCommand(await readJson(req))))
          return
        }
        if (url === '/api/agent/queue' && method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(listCommands()))
          return
        }
        if (url === '/api/agent/ack' && method === 'POST') {
          const b = await readJson(req)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(ackCommands(b.ids || [])))
          return
        }
        if (url === '/api/vault/changes' && method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(getVaultChanges(query.get('since'))))
          return
        }
        if (url === '/api/brain/index' && method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(getBrainIndex()))
          return
        }

        // Multi-device data sync (desktop <-> phone).
        if (url === '/api/sync/push' && method === 'POST') {
          const b = await readJson(req)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(pushChanges(b.changes || [])))
          return
        }
        if (url === '/api/sync/pull' && method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(pullChanges(query.get('since'))))
          return
        }

        if (url === '/api/ai/status' && method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ available: aiAvailable() }))
          return
        }

        const aiRoutes = { '/api/ai/distill': distill, '/api/ai/concepts': concepts, '/api/ai/rerank': rerank, '/api/ai/brief': brief, '/api/ai/relations-search': relationsSearch, '/api/ai/relations-detect': relationsDetect }
        if (aiRoutes[url] && method === 'POST') {
          const body = await readJson(req)
          let out
          try { out = await aiRoutes[url](body) } catch (err) { out = { ok: false, reason: String(err?.message || err) } }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(out))
          return
        }

        if (url === '/api/health' && method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ desmond: getDesmondStatus() }))
          return
        }

        if (url === '/api/desmond/start' && method === 'POST') {
          startDesmond()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ desmond: getDesmondStatus() }))
          return
        }

        if (url === '/api/desmond/stop' && method === 'POST') {
          stopDesmond()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ desmond: getDesmondStatus() }))
          return
        }

        if (req.url.startsWith('/nexo/')) {
          const nexoPath = join(__dirname, req.url)
          if (!existsSync(nexoPath) || statSync(nexoPath).isDirectory()) {
            res.statusCode = 404
            res.end('Not Found')
            return
          }
          const ext = extname(nexoPath).toLowerCase()
          res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
          res.end(readFileSync(nexoPath))
          return
        }
        next()
      })

      server.httpServer?.on('close', stopDesmond)
      process.on('SIGINT', stopDesmond)
      process.on('SIGTERM', stopDesmond)
    },
  }],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
