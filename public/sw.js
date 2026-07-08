const CACHE = 'aurora-5.0-v3'
const ASSETS = ['/', '/index.html']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))))
  self.clients.claim()
})

// Network-first for navigations/HTML so a freshly shipped build is always
// picked up (the old cache-first handler trapped the app on a stale index.html
// that referenced old hashed assets). Build assets are content-addressed —
// their filename changes every build — so cache-first stays safe and fast for
// them, and only HTML needs to bypass the cache.
self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET') return

  // /api/* responses are dynamic (agent queue, vault changes, AI status,
  // and — critically — the multi-device sync pull/push cursor) and must
  // never be cache-first. A real two-browser-context test caught this: the
  // very first /api/sync/pull?since=0 got cached here, and every identical
  // subsequent poll (the URL never changes shape) was served from that
  // stale cache forever instead of hitting the network, so a second device
  // never saw any update no matter how long it waited.
  if (new URL(req.url).pathname.startsWith('/api/')) return

  const isHTML = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html')

  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(req, clone))
          return res
        })
        .catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
    )
    return
  }

  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.status === 200) {
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(req, clone))
      }
      return res
    }))
  )
})
