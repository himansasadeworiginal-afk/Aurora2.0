import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function BranchLink({ start, end, color, index, thin, core }) {
  const ref = useRef()

  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
  const len = start.distanceTo(end)
  const dir = new THREE.Vector3().subVectors(end, start).normalize()
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
  const radius = core ? 0.025 : thin ? 0.008 : 0.015

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    const beam = core
      ? 0.6 + Math.sin(t * 0.8 + index * 1.5) * 0.2
      : thin
        ? 0.15 + Math.sin(t * 1.2 + index * 1.5) * 0.1
        : 0.3 + Math.sin(t * 1.5 + index * 1.2) * 0.2
    ref.current.material.opacity = beam
  })

  return (
    <mesh ref={ref} position={mid} quaternion={quat} scale={[1, len, 1]}>
      <cylinderGeometry args={[radius, radius, 1, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.35} />
    </mesh>
  )
}
