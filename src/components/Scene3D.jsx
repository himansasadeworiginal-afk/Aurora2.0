import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Billboard } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { Suspense, useMemo, useCallback, useState } from 'react'
import * as THREE from 'three'
import GlobeNodes from './globe/GlobeNodes'
import GlobeLinks from './globe/GlobeLinks'
import GlobeField from './globe/GlobeField'
import GlobeCore from './globe/GlobeCore'
import GlobeSpokes from './globe/GlobeSpokes'
import BrainPeopleLayer from './brain/BrainPeopleLayer'
import { useGlobeLayout, getParaCategory } from './globe/useGlobeLayout'
import { ideas } from '../data/ideas'

const BG = '#0A0A0F'
const ZERO = new THREE.Vector3(0, 0, 0)

// People jump to their full Relations profile (App routes the event).
const openPerson = (person) => window.dispatchEvent(new CustomEvent('aurora-open-person', { detail: { personId: person.id } }))

export default function Scene3D({ selected, onSelect, onNodeHover, paraFilter, onToggleParaFilter, showPeople = false }) {
  const { positions, meta, regions, radius, mainRoots } = useGlobeLayout()
  const [hovered, setHovered] = useState(null)

  // Track hover locally (to highlight the node's links) AND forward to BrainView.
  const handleHover = useCallback((idea) => {
    setHovered(idea?.id ?? null)
    onNodeHover?.(idea)
  }, [onNodeHover])

  const visibleIds = useMemo(() => {
    if (!paraFilter) return null
    const s = new Set()
    ideas.forEach(idea => { if (getParaCategory(idea) === paraFilter) s.add(idea.id) })
    return s
  }, [paraFilter])

  const list = useMemo(() => {
    const arr = []
    ideas.forEach(idea => {
      const p = positions.get(idea.id)
      if (!p) return
      if (visibleIds && !visibleIds.has(idea.id)) return
      arr.push({ id: idea.id, position: p, idea })
    })
    return arr
  }, [positions, visibleIds])

  const selectedPos = selected ? positions.get(selected) : null

  return (
    <Canvas
      camera={{ position: [0, radius * 0.12, radius * 1.55], fov: 45 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 1.75]}
      style={{ background: BG }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(BG)
        scene.fog = new THREE.Fog(BG, radius * 1.5, radius * 5)
      }}
      onPointerMissed={() => onSelect(null)}
      frameloop="always"
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.45} />
        {/* Cool rim from above keeps the colored nodes from going all-red. */}
        <pointLight position={[radius * 1.5, radius * 1.8, radius * 1.2]} intensity={0.8} distance={radius * 6} color="#5a7bff" />

        <GlobeField radius={radius} />
        {!paraFilter && <GlobeCore radius={radius} onClick={() => onSelect(null)} />}
        {!paraFilter && <GlobeSpokes roots={mainRoots} radius={radius} />}
        <GlobeLinks positions={positions} visibleIds={visibleIds} selected={selected} hovered={hovered} />
        <GlobeNodes list={list} meta={meta} selected={selected} onSelect={onSelect} onHover={handleHover} />
        {!paraFilter && <BrainPeopleLayer show={showPeople} radius={radius} onOpenPerson={openPerson} />}

        {regions.map(r => (
          <Billboard key={r.category} position={[r.center.x, r.center.y + radius * 0.5, r.center.z]}>
            <Text
              fontSize={Math.max(0.4, radius * 0.04)}
              color={r.color}
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.18}
              outlineWidth={0.015}
              outlineColor="#000000"
              fillOpacity={paraFilter && paraFilter !== r.category ? 0.18 : 0.5}
              onClick={(e) => { e.stopPropagation(); onToggleParaFilter?.(r.category) }}
            >
              {r.category.toUpperCase()}
            </Text>
          </Billboard>
        ))}

        <Rig selectedPos={selectedPos} />

        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={0.34} luminanceSmoothing={0.7} intensity={0.82} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.9} />
        </EffectComposer>

        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={radius * 0.7}
          maxDistance={radius * 6}
          autoRotate={!selected}
          autoRotateSpeed={0.35}
          enableDamping
          dampingFactor={0.08}
        />
      </Suspense>
    </Canvas>
  )
}

// Eases the orbit target toward the selected node (focus-on-select), or back to
// the globe center when nothing is selected.
function Rig({ selectedPos }) {
  useFrame((state) => {
    const controls = state.controls
    if (!controls) return
    controls.target.lerp(selectedPos || ZERO, 0.06)
  })
  return null
}
