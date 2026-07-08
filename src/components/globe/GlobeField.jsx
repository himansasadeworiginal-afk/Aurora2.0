import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Ambient red star-shell around the globe. Positions are static; the whole
// Points object rotates as one transform — no per-frame CPU work, no GPU
// re-uploads. Scales for free.

export default function GlobeField({ radius = 7, count = 1600 }) {
  const ref = useRef()

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const c = new THREE.Color()
    const inner = radius * 1.6
    const outer = radius * 3.4

    for (let i = 0; i < count; i++) {
      // Even-ish spherical shell via golden spiral + jittered radius.
      const y = 1 - (i / (count - 1)) * 2
      const rXZ = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = (Math.PI * (3 - Math.sqrt(5))) * i
      const rad = inner + (outer - inner) * ((i * 0.6180339887) % 1)
      positions[i * 3] = rad * rXZ * Math.cos(theta)
      positions[i * 3 + 1] = rad * y
      positions[i * 3 + 2] = rad * rXZ * Math.sin(theta)

      // Aurora field: mostly cool teal, with occasional violet / azure / green
      // accent stars so the starfield carries the aurora color story.
      if (i % 13 === 0) {
        c.setHSL(0.72, 0.65, 0.6)          // violet
      } else if (i % 9 === 0) {
        c.setHSL(0.55, 0.7, 0.58)          // azure / cyan
      } else if (i % 7 === 0) {
        c.setHSL(0.40, 0.7, 0.55)          // aurora green
      } else {
        c.setHSL(0.46 + ((i % 7) / 7) * 0.04, 0.55, 0.36 + ((i % 5) / 5) * 0.22) // teal → cool
      }
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
      sizes[i] = 0.04 + ((i % 11) / 11) * 0.08
    }
    return { positions, colors, sizes }
  }, [radius, count])

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.012
      ref.current.rotation.x += delta * 0.004
    }
  })

  return (
    <points ref={ref} raycast={() => null} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        toneMapped={false}
        size={0.08}
        sizeAttenuation
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
