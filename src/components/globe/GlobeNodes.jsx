import { useRef, useLayoutEffect, useMemo, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { makeOrbMaterial } from './orbMaterial'

// Each idea is a translucent glass-bubble sphere (the glass shader: see-through
// body, bright fresnel rim, specular highlight) plus a small additive inner glow
// for luminosity — two instanced draw calls regardless of node count. Sharp and
// glassy, matching the reference. Only the hovered/selected node animates via
// <ActiveNode>.

const tmpObj = new THREE.Object3D()
const tmpColor = new THREE.Color()
const white = new THREE.Color('#ffffff')

export default function GlobeNodes({ list, meta, selected, onSelect, onHover }) {
  const bodyRef = useRef()
  const glowRef = useRef()
  const [hoveredId, setHoveredId] = useState(null)

  const orbMat = useMemo(() => makeOrbMaterial(), [])

  const count = list.length

  // Place instances + per-instance color once per visible set.
  useLayoutEffect(() => {
    const body = bodyRef.current
    const glow = glowRef.current
    if (!body || !glow) return
    list.forEach((item, i) => {
      const m = meta.get(item.id)
      const r = m?.radius ?? 0.2
      const p = item.position

      // glass bubble body
      tmpObj.position.copy(p)
      tmpObj.scale.setScalar(r)
      tmpObj.updateMatrix()
      body.setMatrixAt(i, tmpObj.matrix)

      // small additive inner glow (luminous heart)
      tmpObj.scale.setScalar(r * 0.72)
      tmpObj.updateMatrix()
      glow.setMatrixAt(i, tmpObj.matrix)

      tmpColor.set(m?.color ?? '#2DD4BF')
      body.setColorAt(i, tmpColor)
      tmpColor.lerp(white, 0.4)
      glow.setColorAt(i, tmpColor)
    })
    body.instanceMatrix.needsUpdate = true
    glow.instanceMatrix.needsUpdate = true
    if (body.instanceColor) body.instanceColor.needsUpdate = true
    if (glow.instanceColor) glow.instanceColor.needsUpdate = true
  }, [list, meta])

  const idAt = useCallback((i) => (i != null && i < list.length ? list[i].id : null), [list])

  const handleMove = useCallback((e) => {
    e.stopPropagation()
    const id = idAt(e.instanceId)
    if (id !== hoveredId) {
      setHoveredId(id)
      const item = id ? list.find(l => l.id === id) : null
      onHover?.(item?.idea ?? null)
    }
  }, [idAt, hoveredId, list, onHover])

  const handleOut = useCallback(() => {
    setHoveredId(null)
    onHover?.(null)
  }, [onHover])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    const id = idAt(e.instanceId)
    if (id) onSelect(id)
  }, [idAt, onSelect])

  const activeId = hoveredId || selected
  const active = useMemo(() => {
    if (!activeId) return null
    const item = list.find(l => l.id === activeId)
    if (!item) return null
    return { item, m: meta.get(activeId) }
  }, [activeId, list, meta])

  return (
    <>
      {/* translucent glass-bubble body — the main clickable orb */}
      <instancedMesh
        ref={bodyRef}
        args={[undefined, undefined, count]}
        material={orbMat}
        onPointerMove={handleMove}
        onPointerOut={handleOut}
        onClick={handleClick}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 32, 32]} />
      </instancedMesh>

      {/* small additive inner glow — luminous heart */}
      <instancedMesh ref={glowRef} args={[undefined, undefined, count]} frustumCulled={false} raycast={() => null}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          toneMapped={false}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      {active && (
        <ActiveNode
          key={active.item.id}
          position={active.item.position}
          radius={active.m?.radius ?? 0.2}
          color={active.m?.color ?? '#2DD4BF'}
          title={active.item.idea.title}
        />
      )}
    </>
  )
}

function ActiveNode({ position, radius, color, title }) {
  const coreRef = useRef()
  const ring1 = useRef()
  const ring2 = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (coreRef.current) coreRef.current.scale.setScalar(radius * (1.15 + Math.sin(t * 3) * 0.08))
    if (ring1.current) { ring1.current.rotation.x = t * 0.6; ring1.current.rotation.z = t * 0.3 }
    if (ring2.current) { ring2.current.rotation.y = t * 0.5; ring2.current.rotation.x = -t * 0.4 }
  })

  return (
    <group position={position}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshBasicMaterial color={white} toneMapped={false} />
      </mesh>
      <mesh ref={ring1} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[radius * 2.0, radius * 0.06, 8, 40]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.85} />
      </mesh>
      <mesh ref={ring2} rotation={[1.4, 0.5, 0.8]}>
        <torusGeometry args={[radius * 2.6, radius * 0.04, 8, 40]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.5} />
      </mesh>
      <Text
        position={[0, radius * 3.2, 0]}
        fontSize={Math.max(0.16, radius * 0.9)}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor="#000000"
        renderOrder={10}
      >
        {title}
      </Text>
    </group>
  )
}
