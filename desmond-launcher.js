import { spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
// AURORA_DESMOND_DIR lets the Electron packaged build point at the bundled
// Desmond/ under process.resourcesPath; falls back to the sibling dir in dev.
const DESMOND_DIR = process.env.AURORA_DESMOND_DIR || join(__dirname, '..', 'Desmond')
const PYTHON = join(DESMOND_DIR, 'venv', 'bin', 'python')
const SCRIPT = join(DESMOND_DIR, 'main.py')

let desmondProcess = null
let state = 'stopped'
let lastError = null
let startedAt = 0

export function getDesmondStatus() {
  return { state, running: state === 'running', error: lastError }
}

export function startDesmond() {
  if (state === 'running' || state === 'starting') return

  state = 'starting'
  lastError = null
  console.log(`  Starting Desmond from ${DESMOND_DIR}...`)

  let stderrBuf = ''
  startedAt = Date.now()

  const proc = spawn(PYTHON, [SCRIPT], {
    cwd: DESMOND_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
    env: {
      ...process.env,
      DISPLAY: process.env.DISPLAY || ':0',
    },
  })

  proc.stdout.on('data', (data) => {
    for (const line of data.toString().trim().split('\n')) {
      if (line) console.log(`  [Desmond] ${line}`)
    }
  })

  proc.stderr.on('data', (data) => {
    stderrBuf += data.toString()
    for (const line of data.toString().trim().split('\n')) {
      if (line) console.log(`  [Desmond:err] ${line}`)
    }
  })

  proc.on('error', (err) => {
    console.log(`  [Desmond] Failed to start: ${err.message}`)
    state = 'error'
    lastError = err.message
    desmondProcess = null
  })

  proc.on('exit', (code, signal) => {
    console.log(`  [Desmond] Exited (code: ${code}, signal: ${signal})`)

    if (state === 'starting' || (state === 'running' && Date.now() - startedAt < 10000)) {
      const lines = stderrBuf.trim().split('\n').filter(Boolean)
      lastError = lines.slice(-3).join(' | ') || `exit code ${code}`
      state = 'error'
    } else {
      state = 'stopped'
    }
    desmondProcess = null
  })

  desmondProcess = proc

  setTimeout(() => {
    if (desmondProcess && state === 'starting') {
      state = 'running'
      lastError = null
      console.log('  [Desmond] Started successfully')
    }
  }, 2000)
}

export function stopDesmond() {
  if (!desmondProcess) return
  console.log('  Stopping Desmond...')
  state = 'stopped'
  try {
    desmondProcess.kill('SIGTERM')
    setTimeout(() => {
      if (desmondProcess) {
        try { desmondProcess.kill('SIGKILL') } catch {}
      }
    }, 3000)
  } catch {}
  desmondProcess = null
}

export function getDesmondProcess() {
  return desmondProcess
}
