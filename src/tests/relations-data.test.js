import { describe, it, expect } from 'vitest'
import {
  friendlinessColor,
  initials,
  normalizeFields,
  friendlinessFromText,
  heuristicDetect,
  keywordSearch,
  buildTimeline,
  compactPerson,
} from '../sections/Relations/relations-data'

describe('friendlinessColor', () => {
  it('returns neutral grey for null/NaN', () => {
    expect(friendlinessColor(null)).toBe('#6E6E7A')
    expect(friendlinessColor(undefined)).toBe('#6E6E7A')
    expect(friendlinessColor(NaN)).toBe('#6E6E7A')
  })

  it('buckets scores across the cool->warm scale', () => {
    expect(friendlinessColor(0)).toBe('#8B7CF6')
    expect(friendlinessColor(39)).toBe('#8B7CF6')
    expect(friendlinessColor(40)).toBe('#7FA8F0')
    expect(friendlinessColor(54)).toBe('#7FA8F0')
    expect(friendlinessColor(55)).toBe('#56C6E8')
    expect(friendlinessColor(69)).toBe('#56C6E8')
    expect(friendlinessColor(70)).toBe('#3BD6C6')
    expect(friendlinessColor(84)).toBe('#3BD6C6')
    expect(friendlinessColor(85)).toBe('#52E3A4')
    expect(friendlinessColor(100)).toBe('#52E3A4')
  })

  it('clamps out-of-range scores', () => {
    expect(friendlinessColor(-50)).toBe('#8B7CF6')
    expect(friendlinessColor(500)).toBe('#52E3A4')
  })
})

describe('initials', () => {
  it('returns ? for empty/falsy names', () => {
    expect(initials('')).toBe('?')
    expect(initials(null)).toBe('?')
    expect(initials(undefined)).toBe('?')
  })

  it('takes first two letters of a single-word name', () => {
    expect(initials('Madonna')).toBe('MA')
  })

  it('takes first+last initials of a multi-word name', () => {
    expect(initials('Jane Doe')).toBe('JD')
    expect(initials('Mary Jane Watson')).toBe('MW')
  })
})

describe('normalizeFields', () => {
  it('returns empty object for null/non-object input', () => {
    expect(normalizeFields(null)).toEqual({})
    expect(normalizeFields('foo')).toEqual({})
  })

  it('drops unknown keys', () => {
    expect(normalizeFields({ notAField: 'x', name: 'Bob' })).toEqual({ name: 'Bob' })
  })

  it('splits comma-string skills and trims/filters array skills', () => {
    expect(normalizeFields({ skills: 'js, react ,  ' })).toEqual({ skills: ['js', 'react'] })
    expect(normalizeFields({ skills: ['go', ' ', 'rust'] })).toEqual({ skills: ['go', 'rust'] })
  })

  it('clamps friendliness to [0,100] and nulls on empty', () => {
    expect(normalizeFields({ friendliness: 150 }).friendliness).toBe(100)
    expect(normalizeFields({ friendliness: -20 }).friendliness).toBe(0)
    expect(normalizeFields({ friendliness: '' }).friendliness).toBeNull()
    expect(normalizeFields({ friendliness: null }).friendliness).toBeNull()
  })

  it('drops blank string fields', () => {
    expect(normalizeFields({ name: '   ' })).toEqual({})
    expect(normalizeFields({ location: 'Colombo' })).toEqual({ location: 'Colombo' })
  })
})

describe('friendlinessFromText', () => {
  it('extracts an explicit percentage', () => {
    expect(friendlinessFromText('about 82% friendly')).toBe(82)
    expect(friendlinessFromText('150%')).toBe(100)
  })

  it('maps each sentiment bucket to its documented score', () => {
    expect(friendlinessFromText('had amazing energy today')).toBe(90)
    expect(friendlinessFromText('very warm and kind')).toBe(78)
    expect(friendlinessFromText('was fine, pretty neutral')).toBe(60)
    expect(friendlinessFromText('quite shy and reserved')).toBe(45)
    expect(friendlinessFromText('honestly quite rude')).toBe(25)
  })

  it('returns null when there is no detectable sentiment', () => {
    expect(friendlinessFromText('met at the conference')).toBeNull()
    expect(friendlinessFromText('')).toBeNull()
    expect(friendlinessFromText(null)).toBeNull()
  })
})

describe('heuristicDetect', () => {
  it('flags an unknown name as new with low confidence', () => {
    const [result] = heuristicDetect(['Alex seemed really friendly'], [])
    expect(result.type).toBe('new')
    expect(result.matchedId).toBeNull()
    expect(result.confidence).toBe(30)
    expect(result.extractedFields.name).toBe('Alex')
    expect(result.extractedFields.friendliness).toBe(78)
  })

  it('matches an existing contact as an update', () => {
    const people = [{ id: 7, name: 'Alex Rivera' }]
    // "distant" is checked before "cold" in friendlinessFromText, so the
    // reserved bucket (45) wins even though "cold" also appears.
    const [result] = heuristicDetect(['Alex was distant and cold today'], people)
    expect(result.type).toBe('update')
    expect(result.matchedId).toBe(7)
    expect(result.confidence).toBe(55)
    expect(result.extractedFields.friendliness).toBe(45)
  })

  it('gives higher confidence for an exact name match', () => {
    const people = [{ id: 3, name: 'Sam' }]
    const [result] = heuristicDetect(['Sam was very welcoming'], people)
    expect(result.confidence).toBe(65)
  })
})

describe('keywordSearch', () => {
  const people = [
    { id: 1, name: 'Alex', skills: ['design'], description: 'friend from college', friendliness: 80 },
    { id: 2, name: 'Sam', skills: ['engineering'], description: 'coworker', friendliness: 30 },
  ]

  it('returns everyone unscored for an empty query', () => {
    const result = keywordSearch('', people)
    expect(result.map(r => r.person.id)).toEqual([1, 2])
  })

  it('scores by term overlap and sorts descending', () => {
    const result = keywordSearch('design college', people)
    expect(result[0].person.id).toBe(1)
  })

  it('honors an "above N" friendliness threshold', () => {
    const result = keywordSearch('more than 70', people)
    expect(result.map(r => r.person.id)).toEqual([1])
  })

  it('honors a "below N" friendliness threshold', () => {
    const result = keywordSearch('below 50', people)
    expect(result.map(r => r.person.id)).toEqual([2])
  })
})

describe('buildTimeline', () => {
  it('merges diary mentions and manual memories, newest first', () => {
    const person = {
      diaryMentions: [{ entryId: 1, date: '2026-01-01', text: 'met for coffee', at: 100 }],
      memories: [{ id: 'm1', text: 'birthday party', date: '2026-06-01', at: 200 }],
    }
    const timeline = buildTimeline(person)
    expect(timeline.map(t => t.text)).toEqual(['birthday party', 'met for coffee'])
    expect(timeline[1].source).toBe('diary')
    expect(timeline[0].source).toBe('manual')
  })

  it('filters out diary mentions with empty text', () => {
    const person = { diaryMentions: [{ entryId: 1, date: '2026-01-01', text: '', at: 100 }], memories: [] }
    expect(buildTimeline(person)).toEqual([])
  })

  it('handles a person with no memories at all', () => {
    expect(buildTimeline({})).toEqual([])
  })
})

describe('compactPerson', () => {
  it('projects only the whitelisted AI-search fields', () => {
    const p = { id: 5, name: 'Alex', skills: ['x'], friendliness: 50, location: 'Colombo', relationshipType: 'friend', phone: '123', email: 'a@b.com' }
    expect(compactPerson(p)).toEqual({
      id: 5,
      name: 'Alex',
      skills: ['x'],
      friendliness: 50,
      location: 'Colombo',
      relationshipType: 'friend',
    })
  })

  it('defaults missing optional fields to null/empty', () => {
    expect(compactPerson({ id: 1, name: 'Bob' })).toEqual({
      id: 1,
      name: 'Bob',
      skills: [],
      friendliness: null,
      location: null,
      relationshipType: null,
    })
  })
})
