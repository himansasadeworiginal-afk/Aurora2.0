import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { seedFromIdeas, seedFromVault } from './data/seed'
import vaultSeed from './data/vault-seed.json'
import './App.css'
import './styles/tokens.css'
import './styles/base.css'

function hideSplash() {
  const el = document.getElementById('splash')
  if (el) el.classList.add('hidden')
}

async function initDB() {
  try {
    await seedFromIdeas()
    await seedFromVault(vaultSeed?.vaultFiles)
    console.log('[Aurora 5.0] Database ready')
  } catch (err) {
    console.error('[Aurora 5.0] DB init error:', err)
  }
}

initDB()

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Hide splash fallback: after 1.5s if 3D scene hasn't signaled ready
setTimeout(hideSplash, 1500)

// No-WebGL fallback
try {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  if (!gl) {
    document.getElementById('fallback').style.display = 'flex'
    hideSplash()
  }
} catch {
  document.getElementById('fallback').style.display = 'flex'
  hideSplash()
}
