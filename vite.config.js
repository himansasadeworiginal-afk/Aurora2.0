import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync, statSync } from 'fs'
import { extname, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { startDesmond, stopDesmond, getDesmondStatus } from './desmond-launcher.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0]
        const method = req.method

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
