import { useMemo } from 'react'
import * as THREE from 'three'
import { ideas } from '../../data/ideas'

// Force-directed 3D layout (Fruchterman–Reingold). Connected ideas attract,
// every pair repels, a light gravity keeps the whole thing centered, and a
// virtual CORE node pinned at the origin (which every top-level idea links to)
// makes the graph radiate out from one central hub structure — the hub-and-
// spoke read from the reference. Deterministic: a fixed seed makes the layout
// stable across renders.

export const CATEGORIES = ['work', 'study', 'entertainment', 'resources']

// Aurora-borealis category coding — cool aurora hues, all distinguishable.
export const CATEGORY_COLORS = {
  work: '#2DD4BF',          // teal
  study: '#8B7CF6',         // violet
  entertainment: '#56C6E8', // aurora cyan
  resources: '#52E3A4',     // green
}

export const CROSSLINK_COLOR = '#8B7CF6'

const MIN_RADIUS = 0.22
const MAX_RADIUS = 0.98
const MAX_CONNECTIONS = 18

export function getParaCategory(idea) {
  if (idea.tags?.includes('work')) return 'work'
  if (idea.tags?.includes('study')) return 'study'
  if (idea.tags?.includes('entertainment')) return 'entertainment'
  return 'resources'
}

export function getConnectionCount(idea, all) {
  let count = (idea.links || []).length
  if (idea.parentId) count++
  all.forEach(other => {
    if (other.parentId === idea.id) count++
    if (other.links?.includes(idea.id)) count++
  })
  return count
}

export function nodeRadius(connectionCount) {
  // Eased so well-connected hubs swell into big orbs while leaves stay small.
  const f = Math.min(connectionCount, MAX_CONNECTIONS) / MAX_CONNECTIONS
  return MIN_RADIUS + Math.pow(f, 0.6) * (MAX_RADIUS - MIN_RADIUS)
}

// Kept for API compatibility (Scene3D imports nothing from here besides the
// hook + helpers, but other modules may reference it).
export function globeRadius(n) {
  return Math.max(11, Math.sqrt(n) * 1.05)
}

// Small deterministic PRNG so the seeded initial placement is reproducible.
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function useGlobeLayout() {
  return useMemo(() => {
    const n = ideas.length
    const idIndex = new Map(ideas.map((d, i) => [d.id, i]))
    const rng = mulberry32(20240611)

    // Seeded initial placement inside a small ball.
    const pos = ideas.map(() => {
      const u = rng() * 2 - 1
      const t = rng() * Math.PI * 2
      const r = Math.cbrt(rng()) * (n * 0.25)
      const s = Math.sqrt(1 - u * u)
      return new THREE.Vector3(r * s * Math.cos(t), r * s * Math.sin(t), r * u)
    })

    // A virtual CORE node pinned at the origin: every top-level idea (no parent)
    // links to it, so the whole graph radiates out from one glowing middle
    // structure — the hub-and-spoke read from the reference. The core is index
    // n; it participates in the sim but is forced back to the origin each step.
    const CORE = n
    pos.push(new THREE.Vector3(0, 0, 0))
    const N = n + 1

    // Unique undirected edges from the parent tree + cross-links + root→core.
    const edges = []
    const seen = new Set()
    const addEdge = (a, b) => {
      if (a === b) return
      const key = a < b ? `${a}|${b}` : `${b}|${a}`
      if (seen.has(key)) return
      seen.add(key)
      edges.push([a, b])
    }
    const rootIdx = []
    ideas.forEach((d, i) => {
      if (d.parentId != null && idIndex.has(d.parentId)) addEdge(i, idIndex.get(d.parentId))
      else { addEdge(i, CORE); rootIdx.push(i) } // top-level → core
      d.links?.forEach(l => { if (idIndex.has(l)) addEdge(i, idIndex.get(l)) })
    })

    // Resolve each node's top-level section (walk parentId up to a root) so we
    // can pull the 3 sections (Work / Study / Entertainment) into 3 clearly
    // separated lobes around the hub.
    const ORIGIN3 = new THREE.Vector3(0, 0, 0)
    const sectionRootOf = new Array(n).fill(-1)
    for (let i = 0; i < n; i++) {
      let cur = ideas[i], guard = 0
      while (cur && cur.parentId != null && idIndex.has(cur.parentId) && guard++ < 64) {
        cur = ideas[idIndex.get(cur.parentId)]
      }
      sectionRootOf[i] = cur ? idIndex.get(cur.id) : i
    }

    // One anchor per top-level root, spread in genuine 3D directions (not
    // coplanar) so the 3 section lobes — and the 3 main spokes — fan out in
    // space rather than forming a flat triangle.
    const anchorByRoot = new Map()
    const ANCHOR_DIST = 30
    const DIRS = [
      new THREE.Vector3(0.15, 0.95, 0.28),    // up / slightly front
      new THREE.Vector3(-0.92, -0.32, 0.42),  // lower-left / front
      new THREE.Vector3(0.85, -0.30, -0.50),  // lower-right / back
    ]
    rootIdx.forEach((ri, ai) => {
      const dir = (DIRS[ai] || DIRS[ai % DIRS.length]).clone().normalize()
      anchorByRoot.set(ri, dir.multiplyScalar(ANCHOR_DIST))
    })
    const anchorOf = (i) => anchorByRoot.get(sectionRootOf[i]) || ORIGIN3

    // Fruchterman–Reingold in 3D. `k` is the ideal edge length — kept modest so
    // the orb radii stay proportional to the spacing between nodes.
    const k = 8.5 // ideal edge length
    const disp = pos.map(() => new THREE.Vector3())
    const delta = new THREE.Vector3()
    const ITER = 280
    let temp = k * 1.5
    const cool = temp / (ITER + 1)

    for (let it = 0; it < ITER; it++) {
      for (let i = 0; i < N; i++) disp[i].set(0, 0, 0)

      // Repulsion between every pair (incl. core).
      for (let i = 0; i < N; i++) {
        const pi = pos[i]
        for (let j = i + 1; j < N; j++) {
          delta.subVectors(pi, pos[j])
          let dist = delta.length() || 0.01
          const force = (k * k) / dist
          delta.multiplyScalar(force / dist)
          disp[i].add(delta)
          disp[j].sub(delta)
        }
      }

      // Attraction along edges.
      for (let e = 0; e < edges.length; e++) {
        const a = edges[e][0]
        const b = edges[e][1]
        delta.subVectors(pos[a], pos[b])
        let dist = delta.length() || 0.01
        const force = (dist * dist) / k
        delta.multiplyScalar(force / dist)
        disp[a].sub(delta)
        disp[b].add(delta)
      }

      // Section gravity: pull every node gently toward its section anchor so the
      // 3 sections settle into separated lobes (instead of one blended cloud).
      for (let i = 0; i < n; i++) {
        const a = anchorOf(i)
        disp[i].x += (a.x - pos[i].x) * 0.02
        disp[i].y += (a.y - pos[i].y) * 0.02
        disp[i].z += (a.z - pos[i].z) * 0.02
      }

      // Apply, capped by the cooling temperature.
      for (let i = 0; i < N; i++) {
        const d = disp[i]
        const len = d.length() || 0.01
        pos[i].addScaledVector(d, Math.min(len, temp) / len)
      }
      // Pin the core at the origin, and pull the 3 roots firmly to their anchors
      // so the main spokes stay clean and the lobes stay separated.
      pos[CORE].set(0, 0, 0)
      rootIdx.forEach(ri => pos[ri].lerp(anchorByRoot.get(ri), 0.5))
      temp -= cool
    }

    // The core is pinned at the origin, so the origin IS the center — no need to
    // recenter. NORMALIZE the layout to a fixed target radius about the origin
    // so the cloud always fills a known size (orb sizes stay proportionate, the
    // camera framing stays consistent regardless of node count).
    const dists = []
    for (let i = 0; i < n; i++) dists.push(pos[i].length())
    const sorted = [...dists].sort((a, b) => a - b)
    const framingRadius = sorted[Math.floor(sorted.length * 0.74)] || sorted[sorted.length - 1] || 10

    const TARGET_RADIUS = 22
    const scale = TARGET_RADIUS / (framingRadius || 1)
    for (let i = 0; i < n; i++) pos[i].multiplyScalar(scale)
    const maxR = TARGET_RADIUS

    const positions = new Map()
    const meta = new Map()
    ideas.forEach((d, i) => {
      positions.set(d.id, pos[i])
      const cat = getParaCategory(d)
      const connections = getConnectionCount(d, ideas)
      meta.set(d.id, {
        category: cat,
        color: d.color || CATEGORY_COLORS[cat],
        radius: nodeRadius(connections),
        connections,
      })
    })

    // Region anchors: centroid of each category cluster (for the PARA labels).
    const regions = CATEGORIES.map(cat => {
      const members = ideas.filter(d => getParaCategory(d) === cat)
      if (!members.length) return null
      const c = new THREE.Vector3()
      members.forEach(d => c.add(positions.get(d.id)))
      c.divideScalar(members.length)
      return { category: cat, color: CATEGORY_COLORS[cat], center: c }
    }).filter(Boolean)

    // The 3 main sections (top-level roots) — used to draw the special spokes
    // from the central hub and to label the lobes.
    const mainRoots = rootIdx.map(ri => {
      const d = ideas[ri]
      return {
        id: d.id,
        title: d.title,
        category: getParaCategory(d),
        color: CATEGORY_COLORS[getParaCategory(d)],
        position: positions.get(d.id),
      }
    })

    return { positions, meta, regions, radius: maxR, count: n, mainRoots }
  }, [])
}
