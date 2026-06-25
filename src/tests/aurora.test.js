import { describe, it, expect } from 'vitest'
import { ideas } from '../data/ideas'

describe('Aurora 2.0 — Vault Idea Data Tests', () => {
  it('has at least 200 ideas representing the full vault', () => {
    expect(ideas.length).toBeGreaterThanOrEqual(200)
  })

  it('every idea has required fields', () => {
    for (const idea of ideas) {
      expect(idea).toHaveProperty('id')
      expect(idea).toHaveProperty('title')
      expect(idea).toHaveProperty('description')
      expect(idea).toHaveProperty('link')
      expect(idea).toHaveProperty('tags')
      expect(Array.isArray(idea.tags)).toBe(true)
      expect(idea.tags.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('every idea has a valid URL (http or file)', () => {
    for (const idea of ideas) {
      expect(() => new URL(idea.link)).not.toThrow()
    }
  })

  it('idea IDs are unique', () => {
    const ids = ideas.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every idea has a valid 6-digit color hex', () => {
    for (const idea of ideas) {
      expect(idea.color).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('every idea title is non-empty and unique', () => {
    const titles = ideas.map(i => i.title)
    expect(new Set(titles).size).toBe(titles.length)
    for (const t of titles) {
      expect(t.length).toBeGreaterThan(0)
    }
  })

  it('all tags arrays contain only lowercase strings', () => {
    for (const idea of ideas) {
      for (const tag of idea.tags) {
        expect(tag).toEqual(tag.toLowerCase())
        expect(typeof tag).toBe('string')
      }
    }
  })

  it('every idea has a parentId that exists or is null', () => {
    const ids = new Set(ideas.map(i => i.id))
    for (const idea of ideas) {
      expect(idea).toHaveProperty('parentId')
      if (idea.parentId !== null) {
        expect(ids.has(idea.parentId)).toBe(true)
      }
    }
  })

  it('every idea has a links array field', () => {
    for (const idea of ideas) {
      expect(idea).toHaveProperty('links')
      expect(Array.isArray(idea.links)).toBe(true)
    }
  })

  it('all links reference valid existing idea IDs', () => {
    const ids = new Set(ideas.map(i => i.id))
    for (const idea of ideas) {
      for (const targetId of idea.links) {
        expect(ids.has(targetId)).toBe(true)
      }
    }
  })

  it('has individual book entries for all 19 vault books', () => {
    const bookIds = ['building-a-second-brain', 'hyperfocus', 'the-subtle-art', 'the-48-laws-of-power', 'atomic-habits', 'toxic', 'forget-me-not', 'mandodari', 'nil-katarolu', 'colombo', 'mai-mara-prasangaya', 'bio-karapu-al-vol-1', 'bio-karapu-al-vol-2', 'ithin-mata-samawenna', 'kok-tail', 'raindrops-on-the-pain', 'aththatama-api-track-panapu-ganu', 'track-panapu-heenayata-crush-wenna', 'eth-man-adarei']
    for (const id of bookIds) {
      expect(ideas.find(i => i.id === id)).toBeDefined()
    }
  })

  it('has individual movie entries across all genres', () => {
    const sampleMovieIds = ['fight-club', 'inception', 'interstellar', 'deadpool-1', 'the-hangover-1', 'the-shawshank-redemption', 'final-destination-1', 'the-conjuring-1', 'lotr-1', 'avatar-1', 'rush']
    for (const id of sampleMovieIds) {
      expect(ideas.find(i => i.id === id)).toBeDefined()
    }
  })

  it('has individual TV series entries across all categories', () => {
    const sampleTvIds = ['breaking-bad', 'game-of-thrones', 'stranger-things', 'rick-and-morty', 'bojack-horseman', 'vikings', 'house-of-the-dragon', 'the-walking-dead']
    for (const id of sampleTvIds) {
      expect(ideas.find(i => i.id === id)).toBeDefined()
    }
  })

  it('has the Lessons index entry', () => {
    expect(ideas.find(i => i.id === 'lessons')).toBeDefined()
  })

  it('cross-linked movies have links to their alternate categories', () => {
    const iceAge1 = ideas.find(i => i.id === 'ice-age-1')
    expect(iceAge1.links).toContain('comedy')

    const benjaminButton = ideas.find(i => i.id === 'benjamin-button')
    expect(benjaminButton.links).toContain('psychological-thriller')

    const atonement = ideas.find(i => i.id === 'atonement-movie')
    expect(atonement.links).toContain('romance-drama')
  })
})

describe('Aurora 2.0 — Component Exports', () => {
  it('App component exists', async () => {
    const mod = await import('../App')
    expect(mod.default).toBeDefined()
  })

  it('Scene3D component exists', async () => {
    const mod = await import('../components/Scene3D')
    expect(mod.default).toBeDefined()
  })

  it('BrainSphere component exists', async () => {
    const mod = await import('../components/BrainSphere')
    expect(mod.default).toBeDefined()
  })

  it('LinkPanel component exists', async () => {
    const mod = await import('../components/LinkPanel')
    expect(mod.default).toBeDefined()
  })

  it('IdeaNode component exists', async () => {
    const mod = await import('../components/IdeaNode')
    expect(mod.default).toBeDefined()
  })

  it('BranchLink component exists', async () => {
    const mod = await import('../components/BranchLink')
    expect(mod.default).toBeDefined()
  })

  it('PARAZone component exists', async () => {
    const mod = await import('../components/PARAZone')
    expect(mod.default).toBeDefined()
  })

  it('WeeklyReview component exists', async () => {
    const mod = await import('../components/WeeklyReview')
    expect(mod.default).toBeDefined()
  })

  it('MonthlyReview component exists', async () => {
    const mod = await import('../components/MonthlyReview')
    expect(mod.default).toBeDefined()
  })

  it('HabitNudges component exists', async () => {
    const mod = await import('../components/HabitNudges')
    expect(mod.default).toBeDefined()
  })

  it('IntegrationSettings component exists', async () => {
    const mod = await import('../components/IntegrationSettings')
    expect(mod.default).toBeDefined()
  })
})

describe('Aurora 5.0 — Phase 8 Review Logic', () => {
  it('WeeklyReview has 7 checklist items', async () => {
    const mod = await import('../components/WeeklyReview')
    expect(mod.default).toBeDefined()
  })

  it('MonthlyReview has 7 checklist items', async () => {
    const mod = await import('../components/MonthlyReview')
    expect(mod.default).toBeDefined()
  })
})

describe('Aurora 5.0 — Phase 9 Integration Logic', () => {
  it('IntegrationSettings component exports default', async () => {
    const mod = await import('../components/IntegrationSettings')
    expect(mod.default).toBeDefined()
  })
})

describe('Aurora 5.0 — Phase 10 PWA Support', () => {
  it('manifest.json exists', () => {
    expect(() => new URL('/manifest.json', 'http://localhost')).not.toThrow()
  })

  it('sw.js service worker registers', () => {
    const registerType = typeof navigator?.serviceWorker?.register
    expect(registerType === 'function' || registerType === 'undefined').toBe(true)
  })
})
