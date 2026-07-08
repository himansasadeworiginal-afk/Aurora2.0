import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ideas } from '../../data/ideas'
import { getParaCategory, CATEGORY_COLORS } from './useGlobeLayout'

// Every edge as TWO short segments (endpoint → midpoint → endpoint) in a single
// LineSegments (one draw call). Per-vertex color is bright at the node endpoints
// and fades to near-nothing at the middle, so links read as clean glowing
// connections emanating from each orb — elegant, not a messy web. Cool
// blue-white tint, matching the reference.

const ideaById = new Map(ideas.map(i => [i.id, i]))
const catColor = (id) => {
  const idea = ideaById.get(id)
  return idea ? (CATEGORY_COLORS[getParaCategory(idea)] || '#2DD4BF') : '#2DD4BF'
}
const LINK_RGB = new THREE.Color('#9fb4ff')   // soft icy blue
const mid = new THREE.Vector3()

export default function GlobeLinks({ positions, visibleIds, selected, hovered }) {
  const matRef = useRef()

  const geometry = useMemo(() => {
    const verts = []
    const cols = []
    const er = LINK_RGB.r, eg = LINK_RGB.g, eb = LINK_RGB.b // bright endpoint
    const mr = er * 0.12, mg = eg * 0.12, mb = eb * 0.12     // dim middle

    const isVisible = (id) => !visibleIds || visibleIds.has(id)

    // endpoint → midpoint → endpoint, bright ends / dim middle.
    const pushLink = (from, to) => {
      mid.copy(from).add(to).multiplyScalar(0.5)
      verts.push(from.x, from.y, from.z, mid.x, mid.y, mid.z)
      cols.push(er, eg, eb, mr, mg, mb)
      verts.push(mid.x, mid.y, mid.z, to.x, to.y, to.z)
      cols.push(mr, mg, mb, er, eg, eb)
    }

    ideas.forEach(idea => {
      const from = positions.get(idea.id)
      if (!from || !isVisible(idea.id)) return

      // Branch link to parent. (Top-level roots connect to the hub via the
      // special glowing spokes in GlobeSpokes, not these thin lines.)
      if (idea.parentId) {
        const pp = positions.get(idea.parentId)
        if (pp && isVisible(idea.parentId)) pushLink(from, pp)
      }

      // Cross links.
      if (idea.links?.length) {
        idea.links.forEach(targetId => {
          const tp = positions.get(targetId)
          if (tp && isVisible(targetId)) pushLink(from, tp)
        })
      }
    })

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    return g
  }, [positions, visibleIds])

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.opacity = 0.5 + Math.sin(clock.getElapsedTime() * 0.8) * 0.08
    }
  })

  return (
    <>
      <lineSegments geometry={geometry} raycast={() => null} frustumCulled={false}>
        <lineBasicMaterial
          ref={matRef}
          vertexColors
          toneMapped={false}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
      {/* hover highlight (softer) + selection firework (brighter, faster) */}
      <IncidentLinks positions={positions} focusId={hovered} fast={false} />
      <IncidentLinks positions={positions} focusId={selected} fast />
    </>
  )
}

// Highlights the edges incident to one node — its neighbors' links light up as
// bright white-hot straight rays. Used for both hover (soft) and selection (the
// brighter, faster "firework"). Recomputed only when the focus id changes.
function IncidentLinks({ positions, focusId, fast }) {
  const matRef = useRef()

  const geometry = useMemo(() => {
    if (!focusId || !positions.get(focusId)) return null
    const from = positions.get(focusId)
    const neighbors = new Set()
    const self = ideaById.get(focusId)
    if (self?.links) self.links.forEach(id => neighbors.add(id))
    if (self?.parentId) neighbors.add(self.parentId)
    ideas.forEach(o => {
      if (o.parentId === focusId) neighbors.add(o.id)
      if (o.links?.includes(focusId)) neighbors.add(o.id)
    })

    const verts = []
    const cols = []
    const cHot = new THREE.Color('#ffffff')
    neighbors.forEach(id => {
      const to = positions.get(id)
      if (!to) return
      const cTip = new THREE.Color(catColor(id))
      verts.push(from.x, from.y, from.z, to.x, to.y, to.z)
      cols.push(cHot.r, cHot.g, cHot.b, cTip.r, cTip.g, cTip.b)
    })
    if (!verts.length) return null
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    return g
  }, [positions, focusId])

  useFrame(({ clock }) => {
    if (matRef.current) {
      const t = clock.getElapsedTime()
      matRef.current.opacity = fast
        ? 0.75 + Math.sin(t * 4) * 0.25
        : 0.55 + Math.sin(t * 2.5) * 0.15
    }
  })

  if (!geometry) return null
  return (
    <lineSegments geometry={geometry} raycast={() => null} frustumCulled={false}>
      <lineBasicMaterial
        ref={matRef}
        vertexColors
        toneMapped={false}
        transparent
        opacity={fast ? 0.85 : 0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  )
}
