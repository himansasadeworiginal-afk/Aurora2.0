import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { makeOrbMaterial } from './orbMaterial'

// The central hub — a glowing crystalline energy core inside a translucent glass
// shell, cohesive with the glass-bubble idea orbs but richer: a white-hot heart,
// a faceted inner crystal, a sharp counter-rotating wire lattice, and a warm
// glass shell with a bright fresnel rim. Clicking it deselects.

export default function GlobeCore({ radius = 22, onClick }) {
  const heartRef = useRef()
  const crystalRef = useRef()
  const latticeRef = useRef()
  const haloRef = useRef()

  // Sizes scale with the layout radius.
  const heartR = radius * 0.028
  const crystalR = radius * 0.052
  const latticeR = radius * 0.078
  const shellR = radius * 0.095

  // Aurora-tinted glass shell (reuses the orb glass shader for visual cohesion).
  const shellMat = useMemo(() => {
    const m = makeOrbMaterial({ rimPower: 2.0, centerAlpha: 0.12, rimAlpha: 1.0 })
    m.color = new THREE.Color('#2DD4BF')
    return m
  }, [])

  const lattice = useMemo(
    () => new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(latticeR, 1)),
    [latticeR],
  )

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (heartRef.current) heartRef.current.scale.setScalar(1 + Math.sin(t * 2.0) * 0.12)
    if (crystalRef.current) {
      crystalRef.current.rotation.y = t * 0.5
      crystalRef.current.rotation.x = t * 0.22
    }
    if (latticeRef.current) {
      latticeRef.current.rotation.y = -t * 0.3
      latticeRef.current.rotation.z = t * 0.14
    }
    if (haloRef.current) haloRef.current.material.opacity = 0.18 + Math.sin(t * 1.1) * 0.05
  })

  return (
    <group>
      {/* white-hot heart (the clickable deselect target) */}
      <mesh ref={heartRef} onClick={(e) => { e.stopPropagation(); onClick?.() }}>
        <sphereGeometry args={[heartR, 24, 24]} />
        <meshBasicMaterial color="#eafcff" toneMapped={false} />
      </mesh>

      {/* faceted inner crystal — bright additive facets */}
      <mesh ref={crystalRef} raycast={() => null}>
        <icosahedronGeometry args={[crystalR, 0]} />
        <meshBasicMaterial
          color="#7fe9d8"
          toneMapped={false}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* sharp counter-rotating wire lattice */}
      <lineSegments ref={latticeRef} geometry={lattice} raycast={() => null} frustumCulled={false}>
        <lineBasicMaterial
          color="#8B7CF6"
          toneMapped={false}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* translucent warm glass shell with a bright fresnel rim */}
      <mesh raycast={() => null} material={shellMat}>
        <sphereGeometry args={[shellR, 48, 48]} />
      </mesh>

      {/* soft outer halo */}
      <mesh ref={haloRef} raycast={() => null}>
        <sphereGeometry args={[shellR * 1.5, 24, 24]} />
        <meshBasicMaterial
          color="#2DD4BF"
          toneMapped={false}
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
