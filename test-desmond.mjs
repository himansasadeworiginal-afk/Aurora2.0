import { startDesmond, stopDesmond, getDesmondProcess } from './desmond-launcher.js'
import { createConnection } from 'net'

function checkPort() {
  return new Promise((resolve) => {
    const s = createConnection(8765, '127.0.0.1')
    s.on('connect', () => { s.destroy(); resolve(true) })
    s.on('error', () => resolve(false))
  })
}

console.log('Testing Desmond launcher...')
await startDesmond()
const p = getDesmondProcess()
console.log('Process spawned:', !!p, p ? '(pid: ' + p.pid + ')' : '')

await new Promise(r => setTimeout(r, 6000))
console.log('Still running:', p ? p.exitCode === null : false)
console.log('Port 8765 open:', await checkPort())

stopDesmond()
await new Promise(r => setTimeout(r, 1000))
console.log('After stop:', await checkPort())
