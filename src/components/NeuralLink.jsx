import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function NeuralLink({ start, end, color = '#ff003c', pulse = false, active = false }) {
  const ref = useRef()
  const glowRef = useRef()
  const progress = useRef(0)

  const { points, mid } = useMemo(() => {
    const m = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    const dist = start.distanceTo(end)
    const heightOffset = dist * 0.35
    m.y += heightOffset
    m.x += (Math.random() - 0.5) * dist * 0.1
    m.z += (Math.random() - 0.5) * dist * 0.1
    const curve = new THREE.QuadraticBezierCurve3(start, m, end)
    return { points: curve.getPoints(48), mid: m }
  }, [start, end])

  const geoPoints = useMemo(
    () => new Float32Array(points.flatMap(p => [p.x, p.y, p.z])),
    [points],
  )

  useFrame((_, delta) => {
    if (!ref.current) return
    if (pulse) {
      progress.current += delta * 2
      if (progress.current > 1) progress.current = 0
      const opacity = 0.1 + Math.sin(progress.current * Math.PI) * 0.8
      ref.current.material.opacity = opacity
      if (glowRef.current) glowRef.current.material.opacity = opacity * 0.3
    } else {
      ref.current.material.opacity = active ? 0.25 : 0.06
      if (glowRef.current) glowRef.current.material.opacity = 0
    }
  })

  const count = points.length

  return (
    <line ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={geoPoints}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.06}
      />
    </line>
  )
}
