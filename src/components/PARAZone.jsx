import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

export default function PARAZone({ category, center, color: colorOverride, onClick, hovered }) {
  const ringRef = useRef()
  const outerRef = useRef()
  const labelColor = colorOverride || '#666666'
  const name = category.charAt(0).toUpperCase() + category.slice(1)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ringRef.current) {
      ringRef.current.rotation.y = t * 0.04
    }
    if (outerRef.current) {
      outerRef.current.rotation.x = Math.sin(t * 0.02) * 0.1
      outerRef.current.rotation.z = Math.cos(t * 0.015) * 0.05
    }
  })

  return (
    <group position={center}>
      <group ref={outerRef}>
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.8, 3.0, 48]} />
          <meshBasicMaterial
            color={labelColor}
            transparent
            opacity={hovered ? 0.12 : 0.04}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        <mesh rotation={[0, 0, Math.PI / 3]}>
          <ringGeometry args={[2.8, 3.0, 48]} />
          <meshBasicMaterial
            color={labelColor}
            transparent
            opacity={hovered ? 0.08 : 0.025}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        <mesh rotation={[0, 0, -Math.PI / 3]}>
          <ringGeometry args={[2.8, 3.0, 48]} />
          <meshBasicMaterial
            color={labelColor}
            transparent
            opacity={hovered ? 0.08 : 0.025}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      <group onClick={(e) => { e.stopPropagation(); onClick?.() }} style={{ cursor: 'pointer' }}>
        <Text
          position={[0, -2.0, 0]}
          fontSize={0.4}
          color={labelColor}
          anchorX="center"
          anchorY="middle"
          fontWeight={200}
          opacity={hovered ? 0.4 : 0.15}
          transparent
        >
          {name}
        </Text>
        <Text
          position={[0, -2.5, 0]}
          fontSize={0.15}
          color={labelColor}
          anchorX="center"
          anchorY="middle"
          fontWeight={100}
          opacity={hovered ? 0.3 : 0}
          transparent
        >
          Double-click to filter
        </Text>
      </group>
    </group>
  )
}
