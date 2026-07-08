import { useMemo, useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { makeOrbMaterial } from '../globe/orbMaterial'
import { listRelations, friendlinessColor } from '../../sections/Relations/relations-data'

// People overlay for the Knowledge Globe. Renders the Relations people as their
// own category — pure-white frosted orbs on an outer shell around the knowledge
// cloud — with shared-skill links between them. Toggled on/off from BrainView.
// Clicking a person jumps to their full Relations profile. Self-loads from the
// `relations` store and stays live on `aurora-data-changed`. Different id space
// from the knowledge nodes, so it never disturbs the existing graph/layout.

const tmpObj = new THREE.Object3D()
const tmpColor = new THREE.Color()
const WHITE = new THREE.Color('#ffffff')

function useLivePeople(enabled) {
  const [people, setPeople] = useState([])
  useEffect(() => {
    if (!enabled) return
    let alive = true
    const load = () => listRelations().then(p => { if (alive) setPeople(p) })
    load()
    window.addEventListener('aurora-data-changed', load)
    return () => { alive = false; window.removeEventListener('aurora-data-changed', load) }
  }, [enabled])
  return people
}

// Fibonacci-sphere placement on a shell of the given radius, ordered by primary
// skill so people who share one sit near each other; size encodes friendliness.
function usePeopleLayout(people, shellRadius) {
  return useMemo(() => {
    const sorted = [...people].sort((a, b) => {
      const sa = (a.skills?.[0] || 'zzzz').toLowerCase()
      const sb = (b.skills?.[0] || 'zzzz').toLowerCase()
      return sa.localeCompare(sb) || (a.id - b.id)
    })
    const n = sorted.length
    const nodes = sorted.map((p, i) => {
      const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2
      const rXZ = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = (Math.PI * (3 - Math.sqrt(5))) * i
      const pos = new THREE.Vector3(shellRadius * rXZ * Math.cos(theta), shellRadius * y, shellRadius * rXZ * Math.sin(theta))
      const fr = p.friendliness
      const f = fr == null ? 0.5 : Math.max(0, Math.min(100, fr)) / 100
      const radius = 0.6 + f * 0.9
      return { id: p.id, person: p, position: pos, radius, accent: friendlinessColor(fr) }
    })

    const edges = []
    const seen = new Set()
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
        edges.push([nodes[i].position, nodes[j].position])
      }
    }
    return { nodes, edges }
  }, [people, shellRadius])
}

export default function BrainPeopleLayer({ show, radius = 22, onOpenPerson }) {
  const people = useLivePeople(show)
  const shellRadius = radius * 1.5
  const { nodes, edges } = usePeopleLayout(people, shellRadius)

  if (!show || nodes.length === 0) return null

  return (
    <>
      <PeopleLinks edges={edges} />
      <PeopleOrbs nodes={nodes} onOpenPerson={onOpenPerson} />
      <Billboard position={[0, shellRadius + radius * 0.12, 0]}>
        <Text fontSize={Math.max(0.45, radius * 0.045)} color="#eef0fb" anchorX="center" anchorY="middle"
          letterSpacing={0.18} outlineWidth={0.015} outlineColor="#000000" fillOpacity={0.5}>
          PEOPLE
        </Text>
      </Billboard>
    </>
  )
}

function PeopleOrbs({ nodes, onOpenPerson }) {
  const bodyRef = useRef()
  const glowRef = useRef()
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const orbMat = useMemo(() => makeOrbMaterial({ centerAlpha: 0.22 }), [])
  const count = nodes.length

  useLayoutEffect(() => {
    const body = bodyRef.current
    const glow = glowRef.current
    if (!body || !glow) return
    nodes.forEach((node, i) => {
      tmpObj.position.copy(node.position)
      tmpObj.scale.setScalar(node.radius)
      tmpObj.updateMatrix()
      body.setMatrixAt(i, tmpObj.matrix)

      tmpObj.scale.setScalar(node.radius * 0.7)
      tmpObj.updateMatrix()
      glow.setMatrixAt(i, tmpObj.matrix)

      body.setColorAt(i, WHITE)
      tmpColor.set(node.accent).lerp(WHITE, 0.55)
      glow.setColorAt(i, tmpColor)
    })
    body.instanceMatrix.needsUpdate = true
    glow.instanceMatrix.needsUpdate = true
    if (body.instanceColor) body.instanceColor.needsUpdate = true
    if (glow.instanceColor) glow.instanceColor.needsUpdate = true
  }, [nodes])

  const handleMove = useCallback((e) => {
    e.stopPropagation()
    const i = e.instanceId
    if (i !== hoveredIdx) setHoveredIdx(i)
  }, [hoveredIdx])
  const handleOut = useCallback(() => setHoveredIdx(null), [])
  const handleClick = useCallback((e) => {
    e.stopPropagation()
    const i = e.instanceId
    if (i != null && i < nodes.length) onOpenPerson?.(nodes[i].person)
  }, [nodes, onOpenPerson])

  const active = hoveredIdx != null && hoveredIdx < nodes.length ? nodes[hoveredIdx] : null

  return (
    <>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, count]} material={orbMat}
        onPointerMove={handleMove} onPointerOut={handleOut} onClick={handleClick} frustumCulled={false}>
        <sphereGeometry args={[1, 32, 32]} />
      </instancedMesh>

      <instancedMesh ref={glowRef} args={[undefined, undefined, count]} frustumCulled={false} raycast={() => null}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.65} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>

      {active && (
        <Billboard position={[active.position.x, active.position.y + active.radius * 2.4, active.position.z]}>
          <Text fontSize={Math.max(0.5, active.radius * 0.95)} color="#ffffff" anchorX="center" anchorY="middle"
            outlineWidth={0.012} outlineColor="#000000" renderOrder={10}>
            {active.person.name}
          </Text>
        </Billboard>
      )}
    </>
  )
}

function PeopleLinks({ edges }) {
  const geometry = useMemo(() => {
    const verts = []
    const cols = []
    const c = new THREE.Color('#e6e9f5')
    const mid = new THREE.Vector3()
    const er = c.r, eg = c.g, eb = c.b
    const mr = er * 0.1, mg = eg * 0.1, mb = eb * 0.1
    for (const [from, to] of edges) {
      mid.copy(from).add(to).multiplyScalar(0.5)
      verts.push(from.x, from.y, from.z, mid.x, mid.y, mid.z)
      cols.push(er, eg, eb, mr, mg, mb)
      verts.push(mid.x, mid.y, mid.z, to.x, to.y, to.z)
      cols.push(mr, mg, mb, er, eg, eb)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    return g
  }, [edges])

  return (
    <lineSegments geometry={geometry} raycast={() => null} frustumCulled={false}>
      <lineBasicMaterial vertexColors transparent opacity={0.35} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  )
}
