import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// The 3 special "main connections": glowing tapered beams from the central hub
// out to each top-level section root (Work / Study / Entertainment). Real
// thickness (cylinders, since GL line width is always 1px) + a soft pulse so
// they read as the primary links — clearly distinct from the thin idea links.

const UP = new THREE.Vector3(0, 1, 0)

export default function GlobeSpokes({ roots, radius = 22 }) {
  const groupRef = useRef()

  const beams = useMemo(() => {
    return (roots || []).filter(r => r.position).map(r => {
      const dir = r.position.clone()
      const len = dir.length() || 0.001
      const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize())
      const mid = dir.clone().multiplyScalar(0.5)
      return { color: r.color, len, quat, mid, key: r.id }
    })
  }, [roots])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    groupRef.current.children.forEach((beam, i) => {
      const core = beam.children[0]?.material
      if (core) core.opacity = 0.7 + Math.sin(t * 2 + i * 1.6) * 0.22
    })
  })

  const tube = radius * 0.03

  return (
    <group ref={groupRef}>
      {beams.map(b => (
        <group key={b.key} position={b.mid} quaternion={b.quat}>
          {/* bright tapered core beam (thick at the hub, thin at the section) */}
          <mesh raycast={() => null}>
            <cylinderGeometry args={[tube * 0.45, tube * 1.7, b.len, 16, 1, true]} />
            <meshBasicMaterial
              color={b.color}
              toneMapped={false}
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* soft glow sheath */}
          <mesh raycast={() => null}>
            <cylinderGeometry args={[tube * 1.4, tube * 4.2, b.len, 16, 1, true]} />
            <meshBasicMaterial
              color={b.color}
              toneMapped={false}
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
