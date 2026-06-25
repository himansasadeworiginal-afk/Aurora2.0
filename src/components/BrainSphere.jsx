import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function BrainSphere({ onClick }) {
  const tetra1Ref = useRef()
  const tetra2Ref = useRef()
  const coreRef = useRef()
  const glowRef = useRef()

  const [geo1, geo2, edges1, edges2] = useMemo(() => {
    const g1 = new THREE.TetrahedronGeometry(1.6, 0)
    const g2 = g1.clone()
    g2.applyMatrix4(new THREE.Matrix4().makeScale(-1, -1, -1))
    g2.computeVertexNormals()

    const e1 = new THREE.EdgesGeometry(g1)
    const e2 = new THREE.EdgesGeometry(g2)

    return [g1, g2, e1, e2]
  }, [])

  useFrame((_, delta) => {
    if (tetra1Ref.current) {
      tetra1Ref.current.rotation.x += delta * 0.08
      tetra1Ref.current.rotation.y += delta * 0.12
      tetra1Ref.current.rotation.z += delta * 0.04
    }
    if (tetra2Ref.current) {
      tetra2Ref.current.rotation.x -= delta * 0.08
      tetra2Ref.current.rotation.y -= delta * 0.12
      tetra2Ref.current.rotation.z -= delta * 0.04
    }
    if (glowRef.current) {
      glowRef.current.rotation.y += delta * 0.3
      glowRef.current.rotation.x += delta * 0.15
    }
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.5
      coreRef.current.rotation.x += delta * 0.3
    }
  })

  return (
    <group onClick={onClick}>
      <group ref={tetra1Ref}>
        <mesh geometry={geo1}>
          <meshStandardMaterial
            color="#e60000"
            emissive="#e60000"
            emissiveIntensity={0.8}
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
        <lineSegments geometry={edges1}>
          <lineBasicMaterial
            color="#ff3333"
            transparent
            opacity={0.8}
          />
        </lineSegments>
      </group>

      <group ref={tetra2Ref}>
        <mesh geometry={geo2}>
          <meshStandardMaterial
            color="#cc0000"
            emissive="#cc0000"
            emissiveIntensity={1.0}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
        <lineSegments geometry={edges2}>
          <lineBasicMaterial
            color="#ff5555"
            transparent
            opacity={0.8}
          />
        </lineSegments>
      </group>

      <mesh ref={glowRef}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial
          color="#ff0000"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={coreRef}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}
