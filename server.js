import { createServer } from 'http'
import { readFileSync, statSync, existsSync } from 'fs'
import { extname, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { startDesmond, stopDesmond, getDesmondStatus } from './desmond-launcher.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = 8080
const DIST = join(__dirname, 'dist')

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

createServer((req, res) => {
  const url = req.url.split('?')[0]
  const method = req.method

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
    const nexoPath = join(__dirname, url)
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
}).listen(PORT, () => {
  console.log(`Aurora 5.0 running at http://localhost:${PORT}`)
})

startDesmond()

process.on('SIGINT', () => { stopDesmond(); process.exit(0) })
process.on('SIGTERM', () => { stopDesmond(); process.exit(0) })
process.on('exit', stopDesmond)
