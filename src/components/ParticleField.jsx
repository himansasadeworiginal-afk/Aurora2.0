import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function ParticleField() {
  const ref = useRef()
  const count = 3000

  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const siz = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const radius = 4 + Math.random() * 18
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)
      const hue = 0.0 + Math.random() * 0.05
      const lightness = 0.2 + Math.random() * 0.35
      const c = new THREE.Color().setHSL(hue, 1, lightness)
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
      siz[i] = 0.01 + Math.random() * 0.04
    }
    return [pos, col, siz]
  }, [])

  const startPos = useMemo(() => positions.slice(), [positions])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    const p = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const drift = Math.sin(t * 0.12 + i * 0.005) * 0.8
      const angleDrift = t * 0.025 + i * 0.0005
      p[i3] = startPos[i3] + Math.sin(angleDrift) * drift
      p[i3 + 1] = startPos[i3 + 1] + Math.cos(angleDrift * 0.6) * drift * 0.6
      p[i3 + 2] = startPos[i3 + 2] + Math.sin(angleDrift * 1.2) * drift * 0.8
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
