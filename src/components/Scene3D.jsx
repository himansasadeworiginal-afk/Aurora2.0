import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense, useMemo, useState, useCallback } from 'react'
import * as THREE from 'three'
import BrainSphere from './BrainSphere'
import IdeaNode from './IdeaNode'
import BranchLink from './BranchLink'
import ParticleField from './ParticleField'
import PARAZone from './PARAZone'
import { ideas } from '../data/ideas'

const ANCHOR_IDS = new Set(['work', 'study', 'entertainment'])

const PARA_COLORS = {
  work: '#ff4444',
  study: '#aa44dd',
  entertainment: '#4488ff',
}

const ROOT_POSITIONS = {
  work: new THREE.Vector3(8, 4, 5),
  study: new THREE.Vector3(-8, -4, -5),
  entertainment: new THREE.Vector3(-4, 9, -5),
}

function getParaCategory(idea) {
  if (idea.tags?.includes('work')) return 'work'
  if (idea.tags?.includes('study')) return 'study'
  if (idea.tags?.includes('entertainment')) return 'entertainment'
  return 'resources'
}

function getConnectionCount(idea) {
  let count = (idea.links || []).length
  ideas.forEach(other => {
    if (other.links?.includes(idea.id)) count++
  })
  return count
}

function getDistillationDepth(idea) {
  return idea.tags?.includes('distilled') ? 1 : 0
}

export default function Scene3D({ selected, onSelect, onNodeHover, paraFilter, onToggleParaFilter }) {
  const layout = useMemo(() => {
    const positions = {}
    const childrenOf = {}

    ideas.forEach(idea => {
      const pid = idea.parentId || '__root__'
      if (!childrenOf[pid]) childrenOf[pid] = []
      childrenOf[pid].push(idea.id)
    })

    function layoutBranch(parentId, parentPos, depth, seed) {
      const kids = childrenOf[parentId] || []
      const n = kids.length
      if (n === 0) return

      const radius = depth === 0 ? 3.5 : depth === 1 ? 3.0 : 2.5

      kids.forEach((childId, i) => {
        const golden = Math.PI * (3 - Math.sqrt(5))
        const theta = golden * i + seed + depth * 0.7
        const phi = Math.acos(1 - 2 * (i + 0.5) / n)

        const pos = new THREE.Vector3(
          parentPos.x + radius * Math.sin(phi) * Math.cos(theta),
          parentPos.y + radius * Math.cos(phi),
          parentPos.z + radius * Math.sin(phi) * Math.sin(theta)
        )
        positions[childId] = pos
        layoutBranch(childId, pos, depth + 1, theta + seed)
      })
    }

    Object.keys(ROOT_POSITIONS).forEach(rootId => {
      positions[rootId] = ROOT_POSITIONS[rootId]
      layoutBranch(rootId, ROOT_POSITIONS[rootId], 0, 1.3)
    })

    Object.keys(positions).forEach(id => {
      if (ANCHOR_IDS.has(id)) return
      const pos = positions[id]
      const dist = pos.length()
      const minDist = 3.5
      if (dist < minDist) {
        pos.normalize().multiplyScalar(minDist)
      }
    })

    return positions
  }, [])

  const coreLinks = useMemo(() => {
    const links = []
    const origin = new THREE.Vector3(0, 0, 0)
    ideas.forEach(idea => {
      if (ANCHOR_IDS.has(idea.id) && layout[idea.id]) {
        links.push({
          from: origin,
          to: layout[idea.id],
          color: PARA_COLORS[getParaCategory(idea)] || '#4488ff',
        })
      }
    })
    return links
  }, [])

  const branches = useMemo(() => {
    const links = []
    ideas.forEach(idea => {
      if (idea.parentId && layout[idea.parentId] && layout[idea.id]) {
        links.push({
          from: layout[idea.parentId],
          to: layout[idea.id],
          color: PARA_COLORS[getParaCategory(idea)] || '#4488ff',
        })
      }
    })
    return links
  }, [])

  const crossLinks = useMemo(() => {
    const links = []
    ideas.forEach(idea => {
      if (idea.links && idea.links.length > 0 && layout[idea.id]) {
        idea.links.forEach(targetId => {
          if (layout[targetId]) {
            links.push({
              from: layout[idea.id],
              to: layout[targetId],
              color: '#8866cc',
            })
          }
        })
      }
    })
    return links
  }, [])

  const visibleIdeas = useMemo(() => {
    if (!paraFilter) return ideas
    return ideas.filter(idea => {
      const cat = getParaCategory(idea)
      return cat === paraFilter || ANCHOR_IDS.has(idea.id)
    })
  }, [paraFilter])

  const handleDoubleClickZone = useCallback((category) => {
    onToggleParaFilter?.(category)
  }, [onToggleParaFilter])

  return (
    <Canvas
      camera={{ position: [5, 8, 22], fov: 40 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ background: '#050000' }}
      onCreated={({ gl }) => gl.setClearColor('#050000')}
      frameloop="always"
    >
      <Suspense fallback={null}>
        <SceneContent
          selected={selected}
          onSelect={onSelect}
          onNodeHover={onNodeHover}
          positions={layout}
          coreLinks={coreLinks}
          branches={branches}
          crossLinks={crossLinks}
          visibleIdeas={visibleIdeas}
          onDoubleClickZone={handleDoubleClickZone}
        />
      </Suspense>
    </Canvas>
  )
}

function SceneContent({ selected, onSelect, onNodeHover, positions, coreLinks, branches, crossLinks, visibleIdeas, onDoubleClickZone }) {
  const [hoveredCategory, setHoveredCategory] = useState(null)

  return (
    <>
      <ParticleField />

      <BrainSphere onClick={() => onSelect(null)} />

      {Object.entries(ROOT_POSITIONS).map(([cat, center]) => (
        <PARAZone
          key={cat}
          category={cat}
          center={center}
          color={PARA_COLORS[cat]}
          onClick={() => onDoubleClickZone(cat)}
          hovered={hoveredCategory === cat}
        />
      ))}

      {coreLinks.map((b, i) => (
        <BranchLink key={'c' + i} start={b.from} end={b.to} color={b.color} index={i} core />
      ))}
      {branches.map((b, i) => (
        <BranchLink key={'b' + i} start={b.from} end={b.to} color={b.color} index={i} />
      ))}
      {crossLinks.map((b, i) => (
        <BranchLink key={'x' + i} start={b.from} end={b.to} color={b.color} index={i} thin />
      ))}

      {visibleIdeas.map((idea, i) => {
        const pos = positions[idea.id]
        if (!pos) return null
        const cat = getParaCategory(idea)
        return (
          <IdeaNode
            key={idea.id}
            idea={idea}
            position={pos}
            index={i}
            total={visibleIdeas.length}
            onSelect={onSelect}
            onHover={onNodeHover}
            selected={selected}
            anchor={ANCHOR_IDS.has(idea.id)}
            paraColor={PARA_COLORS[cat]}
            connectionCount={getConnectionCount(idea)}
            distillationDepth={getDistillationDepth(idea)}
          />
        )
      })}

      <EffectComposer>
        <Bloom luminanceThreshold={0.02} luminanceSmoothing={0.9} intensity={0.8} mipmapBlur />
      </EffectComposer>

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={80}
      />
    </>
  )
}
