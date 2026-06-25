import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

const MIN_RADIUS = 0.15
const MAX_RADIUS = 0.3
const MAX_CONNECTIONS = 15

export default function IdeaNode({ idea, position, index, total, onSelect, selected, onHover, anchor, paraColor, connectionCount = 0, distillationDepth = 0 }) {
  const nodeColor = paraColor || idea.color || '#4488ff'
  const meshRef = useRef()
  const glowRef = useRef()
  const coreRef = useRef()
  const labelRef = useRef()
  const ring1Ref = useRef()
  const ring2Ref = useRef()
  const ring3Ref = useRef()
  const ring4Ref = useRef()
  const groupRef = useRef()
  const [localHovered, setLocalHovered] = useState(false)

  const tilt = anchor ? 0 : index * 0.6

  const radius = useMemo(() => {
    if (anchor) return 0.45
    const connFactor = Math.min(connectionCount, MAX_CONNECTIONS) / MAX_CONNECTIONS
    return MIN_RADIUS + connFactor * (MAX_RADIUS - MIN_RADIUS)
  }, [anchor, connectionCount])

  const glowIntensity = useMemo(() => {
    if (anchor) return 0.15 + distillationDepth * 0.1
    return 0.08 + distillationDepth * 0.06
  }, [anchor, distillationDepth])

  const emissiveIntensity = useMemo(() => {
    if (anchor) return 0.8 + distillationDepth * 0.4
    return 0.3 + distillationDepth * 0.3
  }, [anchor, distillationDepth])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const speed = anchor ? 0.4 : 1
    const pulse = anchor
      ? 1 + Math.sin(t * 0.3 + index * 2) * 0.06
      : 1 + Math.sin(t * 0.8 + index * 2) * 0.04

    if (groupRef.current && position) {
      if (anchor) {
        groupRef.current.position.y = position.y + Math.sin(t * 0.2) * 0.1
        groupRef.current.position.x = position.x
        groupRef.current.position.z = position.z
      } else {
        const bobY = Math.sin(t * 0.5 + index * 1.7) * 0.25
        const orbit = t * 0.08 + index * 0.5
        const driftR = Math.sin(t * 0.15 + index) * 0.12
        groupRef.current.position.y = position.y + bobY
        groupRef.current.position.x = position.x + Math.cos(orbit) * driftR
        groupRef.current.position.z = position.z + Math.sin(orbit) * driftR
      }
    }

    if (meshRef.current) {
      meshRef.current.scale.setScalar(pulse)
      meshRef.current.material.emissiveIntensity = hovered ? 1.2 : emissiveIntensity + Math.sin(t * 0.6 * speed + index * 1.5) * 0.15
    }

    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(t * 0.5 * speed + index * 1.2) * (anchor ? 0.12 : 0.08))
      glowRef.current.material.opacity = glowIntensity + Math.sin(t * 0.4 * speed + index) * (anchor ? 0.06 : 0.04)
    }

    if (coreRef.current) {
      const corePulse = 1 + Math.sin(t * 1.2 * speed + index * 2.3) * (anchor ? 0.15 : 0.1)
      coreRef.current.scale.setScalar(corePulse)
      coreRef.current.material.opacity = (anchor ? 0.8 : 0.6) + Math.sin(t * 0.9 * speed + index * 1.8) * 0.3
    }

    const ringSpeed = anchor ? 0.4 : 1
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += 0.025 * ringSpeed
      ring1Ref.current.rotation.z += 0.018 * ringSpeed
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x -= 0.02 * ringSpeed
      ring2Ref.current.rotation.y += 0.022 * ringSpeed
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x += 0.022 * ringSpeed
      ring3Ref.current.rotation.z -= 0.016 * ringSpeed
    }
    if (ring4Ref.current) {
      ring4Ref.current.rotation.y += 0.015 * ringSpeed
      ring4Ref.current.rotation.x += 0.01 * ringSpeed
    }

    if (labelRef.current) {
      labelRef.current.position.y = (anchor ? 0.9 : 0.45) + Math.sin(t * 0.6 + index) * 0.05
    }
  })

  const hovered = localHovered || selected === idea.id

  if (anchor) {
    return (
      <group ref={groupRef}>
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.65, 16, 16]} />
          <meshBasicMaterial
            color={nodeColor}
            transparent
            opacity={glowIntensity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh ref={coreRef}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.8}
          />
        </mesh>

        <mesh
          ref={meshRef}
          onPointerEnter={() => { setLocalHovered(true); onHover?.(idea) }}
          onPointerLeave={() => { setLocalHovered(false); onHover?.(null) }}
          onClick={(e) => { e.stopPropagation(); onSelect(idea.id) }}
        >
          <sphereGeometry args={[0.35, 24, 24]} />
          <meshStandardMaterial
            color={hovered ? '#ffffff' : nodeColor}
            emissive={nodeColor}
            emissiveIntensity={hovered ? 1.5 : emissiveIntensity}
            roughness={0.15}
            metalness={0.8}
          />
        </mesh>

        <mesh ref={ring1Ref} rotation={[0.3, 0, 0]}>
          <torusGeometry args={[0.48, 0.018, 8, 32]} />
          <meshBasicMaterial color={nodeColor} transparent opacity={0.6} />
        </mesh>

        <mesh ref={ring2Ref} rotation={[1.5, 0.5, 0.8]}>
          <torusGeometry args={[0.58, 0.014, 8, 32]} />
          <meshBasicMaterial color={nodeColor} transparent opacity={0.45} />
        </mesh>

        <mesh ref={ring3Ref} rotation={[2.8, 0.3, 0.4]}>
          <torusGeometry args={[0.68, 0.01, 8, 32]} />
          <meshBasicMaterial color={nodeColor} transparent opacity={0.35} />
        </mesh>

        <mesh ref={ring4Ref} rotation={[0.8, 1.0, 0.6]}>
          <torusGeometry args={[0.8, 0.008, 8, 32]} />
          <meshBasicMaterial color={nodeColor} transparent opacity={0.2} />
        </mesh>

        {hovered && (
          <Text
            ref={labelRef}
            pointerEvents={false}
            position={[0, 0.9, 0]}
            fontSize={0.14}
            color={nodeColor}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.015}
            outlineColor="#000"
            fontWeight={500}
          >
            {idea.title}
          </Text>
        )}
      </group>
    )
  }

  return (
    <group ref={groupRef}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[radius * 1.6, 12, 12]} />
        <meshBasicMaterial
          color={nodeColor}
          transparent
          opacity={glowIntensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={coreRef}>
        <sphereGeometry args={[radius * 0.35, 12, 12]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.7}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onPointerEnter={() => { setLocalHovered(true); onHover?.(idea) }}
        onPointerLeave={() => { setLocalHovered(false); onHover?.(null) }}
        onClick={(e) => { e.stopPropagation(); onSelect(idea.id) }}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? '#ffffff' : nodeColor}
          emissive={nodeColor}
          emissiveIntensity={hovered ? 1.2 : emissiveIntensity}
          roughness={0.2}
          metalness={0.7}
          transparent
          opacity={hovered ? 0.9 : 0.55}
        />
      </mesh>

      <mesh ref={ring1Ref} rotation={[tilt, tilt * 0.5, 0]}>
        <torusGeometry args={[radius * 1.4, 0.01, 6, 24]} />
        <meshBasicMaterial color={nodeColor} transparent opacity={0.5} />
      </mesh>

      <mesh ref={ring2Ref} rotation={[tilt + 1.2, tilt * 0.5, 0.8]}>
        <torusGeometry args={[radius * 1.7, 0.008, 6, 24]} />
        <meshBasicMaterial color={nodeColor} transparent opacity={0.35} />
      </mesh>

      <mesh ref={ring3Ref} rotation={[tilt + 2.5, tilt * 0.5, 0.4]}>
        <torusGeometry args={[radius * 2.0, 0.006, 6, 24]} />
        <meshBasicMaterial color={nodeColor} transparent opacity={0.25} />
      </mesh>

      {hovered && (
        <Text
          ref={labelRef}
          pointerEvents={false}
          position={[0, radius + 0.3, 0]}
          fontSize={0.09}
          color={nodeColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000"
          fontWeight={400}
        >
          {idea.title}
        </Text>
      )}
    </group>
  )
}
