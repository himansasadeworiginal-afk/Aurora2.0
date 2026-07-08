import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Billboard } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { Suspense, useMemo, useRef, useState, useLayoutEffect, useCallback } from 'react'
import * as THREE from 'three'
import GlobeField from '../../components/globe/GlobeField'
import GlobeCore from '../../components/globe/GlobeCore'
import { makeOrbMaterial } from '../../components/globe/orbMaterial'
import { friendlinessColor } from './relations-data'

// The people graph — "Constellations". People are spatially CLUSTERED by their
// primary skill: each skill is a community that sits together in its own region
// around the central "You" core, so structure is legible instead of a hairball.
// Colour = community, size = friendliness. Within-community links glow in the
// community hue; cross-community "bridges" render bright. Hovering a person
// lights their direct connections and dims the rest. Aurora-void scene.

const BG = '#0A0A0F'
const ZERO = new THREE.Vector3(0, 0, 0)
const RADIUS = 24
// Self-hosted TTF so 3D labels render offline. troika's default font is a CDN
// fetch (fails offline) and it can't parse woff2 — hence a decompressed .ttf.
const LABEL_FONT = '/fonts/inter-label.ttf'

// Distinct aurora hues cycled across communities.
const CLUSTER_HUES = [
  '#2DD4BF', '#8B7CF6', '#56C6E8', '#52E3A4', '#7FA8F0',
  '#A78BFA', '#3BD6C6', '#6FDDB4', '#5B9BF0', '#C08BFA',
]
const UNAFFILIATED_HUE = '#6E6E7A'

const tmpObj = new THREE.Object3D()
const tmpColor = new THREE.Color()
const WHITE = new THREE.Color('#ffffff')

// Fibonacci-sphere unit direction for index i of n points.
function fibDir(i, n) {
  const y = n <= 1 ? 0 : 1 - (i / (n - 1)) * 2
  const rXZ = Math.sqrt(Math.max(0, 1 - y * y))
  const theta = (Math.PI * (3 - Math.sqrt(5))) * i
  return new THREE.Vector3(rXZ * Math.cos(theta), y, rXZ * Math.sin(theta))
}

// Group people into skill communities, lay each community out as its own small
// constellation around the core, and compute edges + adjacency + stats.
function useRelationLayout(people) {
  return useMemo(() => {
    // 1. build communities around SHARED skills. Each person joins the community
    //    of their most-common skill (the one the most others also have), so real
    //    clusters form instead of a cloud of singletons. All-unique -> Unaffiliated.
    const skillFreq = new Map()
    const skillLabel = new Map()
    for (const p of people) {
      for (const raw of (p.skills || [])) {
        const k = raw.trim().toLowerCase()
        if (!k) continue
        skillFreq.set(k, (skillFreq.get(k) || 0) + 1)
        if (!skillLabel.has(k)) skillLabel.set(k, raw.trim())
      }
    }
    const communityOf = (p) => {
      let bestKey = null, bestN = 1
      for (const raw of (p.skills || [])) {
        const k = raw.trim().toLowerCase()
        if (!k) continue
        const n = skillFreq.get(k) || 0
        if (n > bestN || (n === bestN && bestKey && k < bestKey)) { bestKey = k; bestN = n }
      }
      return bestKey
    }

    const groups = new Map()
    for (const p of people) {
      const ck = communityOf(p)
      const key = ck || 'unaffiliated_'
      if (!groups.has(key)) groups.set(key, { key, label: ck ? skillLabel.get(ck) : 'Unaffiliated', people: [] })
      groups.get(key).people.push(p)
    }
    // biggest communities first so they get the strongest hues + stable order
    const clusters = [...groups.values()].sort((a, b) => b.people.length - a.people.length || a.key.localeCompare(b.key))
    clusters.forEach((c, ci) => {
      c.hue = c.key === 'unaffiliated_' ? UNAFFILIATED_HUE : CLUSTER_HUES[ci % CLUSTER_HUES.length]
      c.center = fibDir(ci, clusters.length).multiplyScalar(clusters.length === 1 ? 0 : RADIUS)
      c.localR = Math.min(2.4 + c.people.length * 0.32, 5.6)
    })

    // 2. place each person within its community's local sphere
    const nodes = []
    const indexOfPerson = new Map()
    for (const c of clusters) {
      const m = c.people.length
      c.people.forEach((p, i) => {
        const local = fibDir(i, m).multiplyScalar(m === 1 ? 0 : c.localR)
        const pos = c.center.clone().add(local)
        const fr = p.friendliness
        const f = fr == null ? 0.5 : Math.max(0, Math.min(100, fr)) / 100
        const radius = 0.5 + f * 0.85
        indexOfPerson.set(p.id, nodes.length)
        nodes.push({ id: p.id, person: p, position: pos, radius, hue: c.hue, clusterKey: c.key, accent: friendlinessColor(fr) })
      })
    }

    // 3. edges: each person → up to 2 most-skill-shared neighbours (whole graph)
    const edges = []
    const seen = new Set()
    const adjacency = nodes.map(() => new Set())
    for (let i = 0; i < nodes.length; i++) {
      const askills = new Set((nodes[i].person.skills || []).map(s => s.toLowerCase()))
      if (!askills.size) continue
      const shared = []
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue
        let c = 0
        for (const s of (nodes[j].person.skills || [])) if (askills.has(s.toLowerCase())) c++
        if (c > 0) shared.push({ j, c })
      }
      shared.sort((x, z) => z.c - x.c)
      for (const { j } of shared.slice(0, 2)) {
        const key = i < j ? `${i}|${j}` : `${j}|${i}`
        if (seen.has(key)) continue
        seen.add(key)
        const bridge = nodes[i].clusterKey !== nodes[j].clusterKey
        edges.push({ a: i, b: j, bridge, hue: nodes[i].hue })
        adjacency[i].add(j)
        adjacency[j].add(i)
      }
    }

    // 4. network read-out
    let hubIdx = -1
    for (let i = 0; i < nodes.length; i++) if (hubIdx < 0 || adjacency[i].size > adjacency[hubIdx].size) hubIdx = i
    const stats = {
      people: nodes.length,
      connections: edges.length,
      bridges: edges.filter(e => e.bridge).length,
      hub: hubIdx >= 0 && adjacency[hubIdx].size > 0
        ? { name: nodes[hubIdx].person.name, degree: adjacency[hubIdx].size } : null,
    }
    const legend = clusters
      .filter(c => c.people.length > 0)
      .map(c => ({ label: c.label, hue: c.hue, count: c.people.length }))

    return { nodes, edges, adjacency, clusters, legend, stats }
  }, [people])
}

export default function RelationsGraph({ people, onOpen }) {
  const [minFriend, setMinFriend] = useState(0)
  const [hovered, setHovered] = useState(null) // { node, idx }

  const visible = useMemo(
    () => people.filter(p => minFriend === 0 || (p.friendliness != null && p.friendliness >= minFriend)),
    [people, minFriend],
  )
  const { nodes, edges, adjacency, clusters, legend, stats } = useRelationLayout(visible)

  const focusIdx = hovered?.idx ?? null
  const focusSet = useMemo(() => {
    if (focusIdx == null) return null
    const s = new Set(adjacency[focusIdx] || [])
    s.add(focusIdx)
    return s
  }, [focusIdx, adjacency])

  if (people.length === 0) {
    return <div className="rel-empty rel-graph-empty">No people to plot yet. Add some in the List view.</div>
  }

  return (
    <div className="rel-graph">
      <Canvas
        camera={{ position: [0, RADIUS * 0.12, RADIUS * 2.05], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.75]}
        style={{ background: BG }}
        onCreated={({ gl, scene }) => { gl.setClearColor(BG); scene.fog = new THREE.Fog(BG, RADIUS * 1.7, RADIUS * 5.2) }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.55} />
          <pointLight position={[RADIUS * 1.5, RADIUS * 1.8, RADIUS * 1.2]} intensity={0.7} distance={RADIUS * 6} color="#bfe6ff" />

          <GlobeField radius={RADIUS} />
          <GlobeCore radius={RADIUS} />
          <RelationLinks edges={edges} nodes={nodes} focusSet={focusSet} />
          <PersonOrbs nodes={nodes} focusSet={focusSet} onOpen={onOpen} onHover={setHovered} />
          {/* Labels isolated in their own Suspense — a font hiccup can never blank the scene. */}
          <Suspense fallback={null}>
            <ClusterLabels clusters={clusters} dimmed={focusIdx != null} />
          </Suspense>

          <EffectComposer multisampling={0}>
            <Bloom luminanceThreshold={0.28} luminanceSmoothing={0.7} intensity={0.9} mipmapBlur />
            <Vignette eskil={false} offset={0.22} darkness={0.86} />
          </EffectComposer>

          <OrbitControls makeDefault enablePan minDistance={RADIUS * 0.6} maxDistance={RADIUS * 5}
            autoRotate={!hovered} autoRotateSpeed={0.28} enableDamping dampingFactor={0.08} target={ZERO} />
        </Suspense>
      </Canvas>

      <div className="rel-graph-panel">
        <div className="rel-graph-stats">
          <div className="rel-graph-stat"><b>{stats.people}</b><span>people</span></div>
          <div className="rel-graph-stat"><b>{stats.connections}</b><span>links</span></div>
          <div className="rel-graph-stat"><b>{stats.bridges}</b><span>bridges</span></div>
        </div>
        {stats.hub && (
          <div className="rel-graph-hub">Most connected · <b>{stats.hub.name}</b> ({stats.hub.degree})</div>
        )}
        <div className="rel-graph-legend">
          {legend.slice(0, 8).map(c => (
            <div className="rel-graph-legrow" key={c.label}>
              <span className="rel-graph-swatch" style={{ background: c.hue, boxShadow: `0 0 8px ${c.hue}99` }} />
              <span className="rel-graph-legname">{c.label}</span>
              <span className="rel-graph-legcount">{c.count}</span>
            </div>
          ))}
          {legend.length > 8 && <div className="rel-graph-legmore">+{legend.length - 8} more communities</div>}
        </div>
        <label className="rel-friend-filter">
          <span>Friendliness ≥ <strong>{minFriend}%</strong></span>
          <input type="range" min="0" max="100" step="5" value={minFriend} onChange={e => setMinFriend(Number(e.target.value))} className="rel-slider" />
        </label>
      </div>

      {hovered && (
        <div className="rel-graph-tip">
          <span className="rel-graph-tip-name">{hovered.node.person.name}</span>
          <span className="rel-graph-tip-fr" style={{ color: friendlinessColor(hovered.node.person.friendliness) }}>
            {hovered.node.person.friendliness == null ? 'friendliness —' : `${hovered.node.person.friendliness}% friendly`}
          </span>
          {hovered.node.person.skills?.length > 0 && (
            <span className="rel-graph-tip-skills">{hovered.node.person.skills.slice(0, 3).join(' · ')}</span>
          )}
          <span className="rel-graph-tip-links">{(adjacency[hovered.idx]?.size ?? 0)} connection{(adjacency[hovered.idx]?.size ?? 0) === 1 ? '' : 's'}</span>
        </div>
      )}
    </div>
  )
}

function PersonOrbs({ nodes, focusSet, onOpen, onHover }) {
  const bodyRef = useRef()
  const glowRef = useRef()
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const orbMat = useMemo(() => makeOrbMaterial({ centerAlpha: 0.24 }), [])
  const count = nodes.length

  // Position once per layout; recolour whenever focus changes (ego-highlight).
  useLayoutEffect(() => {
    const body = bodyRef.current
    const glow = glowRef.current
    if (!body || !glow) return
    nodes.forEach((node, i) => {
      tmpObj.position.copy(node.position)
      tmpObj.scale.setScalar(node.radius)
      tmpObj.updateMatrix()
      body.setMatrixAt(i, tmpObj.matrix)
      tmpObj.scale.setScalar(node.radius * 0.72)
      tmpObj.updateMatrix()
      glow.setMatrixAt(i, tmpObj.matrix)
    })
    body.instanceMatrix.needsUpdate = true
    glow.instanceMatrix.needsUpdate = true
  }, [nodes])

  useLayoutEffect(() => {
    const body = bodyRef.current
    const glow = glowRef.current
    if (!body || !glow) return
    nodes.forEach((node, i) => {
      const focused = !focusSet || focusSet.has(i)
      const hue = tmpColor.set(node.hue)
      // frosted-glass body: pale tint of the community hue
      const bodyCol = hue.clone().lerp(WHITE, 0.62)
      // vivid glow in the community hue
      const glowCol = hue.clone()
      if (!focused) { bodyCol.multiplyScalar(0.18); glowCol.multiplyScalar(0.12) }
      body.setColorAt(i, bodyCol)
      glow.setColorAt(i, glowCol)
    })
    if (body.instanceColor) body.instanceColor.needsUpdate = true
    if (glow.instanceColor) glow.instanceColor.needsUpdate = true
  }, [nodes, focusSet])

  const handleMove = useCallback((e) => {
    e.stopPropagation()
    const i = e.instanceId
    if (i !== hoveredIdx) {
      setHoveredIdx(i)
      onHover?.(i != null && i < nodes.length ? { node: nodes[i], idx: i } : null)
    }
  }, [hoveredIdx, nodes, onHover])

  const handleOut = useCallback(() => { setHoveredIdx(null); onHover?.(null) }, [onHover])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    const i = e.instanceId
    if (i != null && i < nodes.length) onOpen?.(nodes[i].person)
  }, [nodes, onOpen])

  const active = hoveredIdx != null && hoveredIdx < nodes.length ? nodes[hoveredIdx] : null

  return (
    <>
      <instancedMesh key={`body-${count}`} ref={bodyRef} args={[undefined, undefined, count]} material={orbMat}
        onPointerMove={handleMove} onPointerOut={handleOut} onClick={handleClick} frustumCulled={false}>
        <sphereGeometry args={[1, 32, 32]} />
      </instancedMesh>

      <instancedMesh key={`glow-${count}`} ref={glowRef} args={[undefined, undefined, count]} frustumCulled={false} raycast={() => null}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>

      {active && (
        <Suspense fallback={null}>
          <Billboard position={[active.position.x, active.position.y + active.radius * 2.4, active.position.z]}>
            <Text font={LABEL_FONT} fontSize={Math.max(0.55, active.radius * 0.95)} color="#ffffff" anchorX="center" anchorY="middle"
              outlineWidth={0.014} outlineColor="#000000" renderOrder={12}>
              {active.person.name}
            </Text>
          </Billboard>
        </Suspense>
      )}
    </>
  )
}

// Small persistent labels at each community centre — the "you are here" of the map.
function ClusterLabels({ clusters, dimmed }) {
  return clusters.filter(c => c.people.length >= 2).map(c => (
    <Billboard key={c.key} position={[c.center.x, c.center.y + c.localR + 2.1, c.center.z]}>
      <Text font={LABEL_FONT} fontSize={1.15} color={c.hue} anchorX="center" anchorY="middle"
        fillOpacity={dimmed ? 0.28 : 0.85} outlineWidth={0.02} outlineColor="#05060a" renderOrder={8}
        maxWidth={14} letterSpacing={0.02}>
        {c.label.toUpperCase()}
      </Text>
    </Billboard>
  ))
}

function RelationLinks({ edges, nodes, focusSet }) {
  // Base web: intra-community links in the community hue, bridges bright white.
  const baseGeom = useMemo(() => {
    const verts = []
    const cols = []
    const mid = new THREE.Vector3()
    const col = new THREE.Color()
    for (const e of edges) {
      const from = nodes[e.a].position, to = nodes[e.b].position
      col.set(e.bridge ? '#eaf2ff' : e.hue)
      const r = col.r, g = col.g, b = col.b
      const mr = r * 0.08, mg = g * 0.08, mb = b * 0.08
      mid.copy(from).add(to).multiplyScalar(0.5)
      verts.push(from.x, from.y, from.z, mid.x, mid.y, mid.z)
      cols.push(r, g, b, mr, mg, mb)
      verts.push(mid.x, mid.y, mid.z, to.x, to.y, to.z)
      cols.push(mr, mg, mb, r, g, b)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    return geo
  }, [edges, nodes])

  // Highlight overlay: only the focused person's incident edges, drawn bright.
  const focusGeom = useMemo(() => {
    if (!focusSet) return null
    const verts = []
    for (const e of edges) {
      // the focused person's ego web: edges among the focus node + its neighbours
      if (!focusSet.has(e.a) || !focusSet.has(e.b)) continue
      const from = nodes[e.a].position, to = nodes[e.b].position
      verts.push(from.x, from.y, from.z, to.x, to.y, to.z)
    }
    if (!verts.length) return null
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    return geo
  }, [focusSet, edges, nodes])

  return (
    <>
      <lineSegments geometry={baseGeom} raycast={() => null} frustumCulled={false}>
        <lineBasicMaterial vertexColors transparent opacity={focusSet ? 0.12 : 0.4} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      {focusGeom && (
        <lineSegments geometry={focusGeom} raycast={() => null} frustumCulled={false}>
          <lineBasicMaterial color="#dff6ff" transparent opacity={0.9} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
        </lineSegments>
      )}
    </>
  )
}
