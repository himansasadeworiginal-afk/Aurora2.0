// Electron main process for Aurora 5.0.
//
// It starts the existing Node HTTP server (server.js) bound to 127.0.0.1:8080
// and loads http://localhost:8080 in the window. Loading over the same origin
// the browser/systemd setup uses means the IndexedDB store is identical, so all
// existing user data (reminders, trackers, edited notes) carries over.
//
// server.js / desmond-launcher.js are ESM; this file is CommonJS (.cjs), so we
// load them via dynamic import(). AURORA_DESMOND_DIR is set before that import
// because desmond-launcher.js resolves its paths at module-load time.

const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { pathToFileURL } = require('url')

const PORT = 8080
const HOST = '127.0.0.1'
const URL = `http://localhost:${PORT}`

let mainWindow = null
let serverModule = null
let desmondModule = null

function resolvePaths() {
  if (app.isPackaged) {
    const base = process.resourcesPath
    // The bundled Desmond/ is read-only (no venv), so prefer a writable copy in
    // userData if the user set one up there via scripts/setup-desmond.sh.
    const userDesmond = path.join(app.getPath('userData'), 'Desmond')
    const desmondDir = fs.existsSync(path.join(userDesmond, 'main.py'))
      ? userDesmond
      : path.join(base, 'Desmond')
    return {
      dist: path.join(base, 'dist'),
      nexoRoot: base, // nexo/ copied to <resources>/nexo
      desmondDir,
    }
  }
  const appRoot = path.resolve(__dirname, '..')
  return {
    dist: path.join(appRoot, 'dist'),
    nexoRoot: appRoot, // /nexo/ -> <appRoot>/nexo
    desmondDir: path.resolve(appRoot, '..', 'Desmond'),
  }
}

async function startBackend() {
  const { dist, nexoRoot, desmondDir } = resolvePaths()
  process.env.AURORA_DESMOND_DIR = desmondDir

  desmondModule = await import(pathToFileURL(path.join(__dirname, '..', 'desmond-launcher.js')).href)
  serverModule = await import(pathToFileURL(path.join(__dirname, '..', 'server.js')).href)

  const server = serverModule.startServer({
    port: PORT,
    host: HOST,
    dist,
    nexoRoot,
    autoStartDesmond: false, // launched on demand from the Desmond view
  })

  if (!server.listening) {
    await new Promise((resolve) => server.once('listening', resolve))
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#080101',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  // Open external links (if any) in the system browser, not a new window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://localhost') || url.startsWith(`http://${HOST}`)) return { action: 'allow' }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  loadWithRetry(8)
}

function loadWithRetry(attempts) {
  mainWindow.loadURL(URL).catch(() => {
    if (attempts > 0) setTimeout(() => loadWithRetry(attempts - 1), 300)
  })
}

app.whenReady().then(async () => {
  try {
    await startBackend()
  } catch (err) {
    console.error('Failed to start Aurora backend:', err)
  }
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

function shutdown() {
  try { desmondModule?.stopDesmond?.() } catch {}
}

app.on('window-all-closed', () => {
  shutdown()
  app.quit()
})

app.on('before-quit', shutdown)
process.on('exit', shutdown)
