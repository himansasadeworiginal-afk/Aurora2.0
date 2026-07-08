import { describe, it, expect } from 'vitest'
import { getParaCategory, getConnectionCount, nodeRadius, globeRadius } from '../components/globe/useGlobeLayout'

describe('getParaCategory', () => {
  it('resolves category from the first matching tag', () => {
    expect(getParaCategory({ tags: ['work', 'other'] })).toBe('work')
    expect(getParaCategory({ tags: ['study'] })).toBe('study')
    expect(getParaCategory({ tags: ['entertainment'] })).toBe('entertainment')
  })

  it('falls back to resources when no known tag matches', () => {
    expect(getParaCategory({ tags: ['random'] })).toBe('resources')
    expect(getParaCategory({ tags: [] })).toBe('resources')
    expect(getParaCategory({})).toBe('resources')
  })
})

describe('getConnectionCount', () => {
  const all = [
    { id: 'a', parentId: null, links: ['b'] },
    { id: 'b', parentId: 'a', links: [] },
    { id: 'c', parentId: 'a', links: ['a'] },
  ]

  it('counts own links plus parent plus children/back-references', () => {
    // 'a': own links ['b'] = 1, no parent, 'b'.parentId===a (+1), 'c'.parentId===a (+1), 'c'.links includes 'a' (+1)
    expect(getConnectionCount(all[0], all)).toBe(4)
  })

  it('counts a leaf node with a parent link plus an inbound cross-link', () => {
    // 'b': own links [] = 0, has parent (+1), and 'a' links to 'b' (+1)
    expect(getConnectionCount(all[1], all)).toBe(2)
  })

  it('counts own links, parent, and no back-references', () => {
    // 'c': own links ['a'] = 1, has parent (+1)
    expect(getConnectionCount(all[2], all)).toBe(2)
  })
})

describe('nodeRadius', () => {
  it('is monotonically non-decreasing in connection count', () => {
    let prev = nodeRadius(0)
    for (const c of [1, 2, 5, 10, 18, 30]) {
      const r = nodeRadius(c)
      expect(r).toBeGreaterThanOrEqual(prev)
      prev = r
    }
  })

  it('stays within [MIN_RADIUS, MAX_RADIUS] bounds', () => {
    expect(nodeRadius(0)).toBeCloseTo(0.22, 5)
    expect(nodeRadius(18)).toBeCloseTo(0.98, 5)
    expect(nodeRadius(1000)).toBeCloseTo(0.98, 5) // clamps past MAX_CONNECTIONS
  })
})

describe('globeRadius', () => {
  it('has a floor of 11 for small counts', () => {
    expect(globeRadius(0)).toBe(11)
    expect(globeRadius(1)).toBe(11)
  })

  it('scales with sqrt(n) above the floor', () => {
    expect(globeRadius(400)).toBeCloseTo(21, 5) // sqrt(400)*1.05 = 21
  })
})
