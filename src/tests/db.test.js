import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import db, { withoutSync } from '../data/db'

describe('db schema', () => {
  it('opens at the current schema version without throwing', async () => {
    await expect(db.open()).resolves.toBeDefined()
    expect(db.verno).toBe(14)
  })

  it('exposes the expected top-level tables', () => {
    const names = db.tables.map(t => t.name)
    for (const expected of ['notes', 'relations', 'diary', 'todos', 'trackers', 'reminders', 'events']) {
      expect(names).toContain(expected)
    }
  })
})

describe('db CRUD round-trip', () => {
  beforeEach(async () => {
    await db.notes.clear()
    await db.relations.clear()
    await db.todos.clear()
  })

  it('adds, gets, updates, and deletes a note', async () => {
    const id = await db.notes.add({ title: 'Test note', paraCategory: 'inbox', createdAt: Date.now(), updatedAt: Date.now(), tags: [] })
    const created = await db.notes.get(id)
    expect(created.title).toBe('Test note')

    await db.notes.update(id, { title: 'Updated note' })
    const updated = await db.notes.get(id)
    expect(updated.title).toBe('Updated note')

    await db.notes.delete(id)
    expect(await db.notes.get(id)).toBeUndefined()
  })

  it('adds a relation record with only name set', async () => {
    const id = await db.relations.add({ name: 'Test Person' })
    const person = await db.relations.get(id)
    expect(person.name).toBe('Test Person')
  })

  it('adds, gets, updates, and deletes a todo', async () => {
    const id = await db.todos.add({ text: 'Buy milk', done: false, order: 0, listName: 'default', createdAt: Date.now() })
    expect((await db.todos.get(id)).done).toBe(false)

    await db.todos.update(id, { done: true })
    expect((await db.todos.get(id)).done).toBe(true)

    await db.todos.delete(id)
    expect(await db.todos.get(id)).toBeUndefined()
  })
})

describe('sync outbox hooks', () => {
  beforeEach(async () => {
    await db.todos.clear()
    await db.syncOutbox.clear()
  })

  it('queues a create, an update, and a tombstone delete for a synced table', async () => {
    const id = await db.todos.add({ text: 'Sync me', done: false, order: 0, createdAt: Date.now() })
    await db.todos.update(id, { done: true })
    await db.todos.delete(id)

    const entries = await db.syncOutbox.where('rowId').equals(String(id)).toArray()
    expect(entries).toHaveLength(3)
    expect(entries[0].data.text).toBe('Sync me')
    expect(entries[1].data.done).toBe(true)
    expect(entries[2].data).toBeNull()
  })

  it('does not queue a create made via withoutSync (simulating an applied remote change)', async () => {
    const id = await withoutSync(['todos'], () => db.todos.add({ text: 'From phone', done: false, order: 0, createdAt: Date.now() }))
    const entries = await db.syncOutbox.where('rowId').equals(String(id)).toArray()
    expect(entries).toHaveLength(0)
  })

  it('does not queue an update made via withoutSync (this is the case a plain module-level flag got wrong — Dexie hooks do not fire synchronously with put())', async () => {
    const id = await db.todos.add({ text: 'Existing', done: false, order: 0, createdAt: Date.now() })
    await db.syncOutbox.clear() // discard the outbox entry from the create above
    await withoutSync(['todos'], () => db.todos.put({ id, text: 'Existing', done: true, order: 0, createdAt: Date.now() }))
    const entries = await db.syncOutbox.where('rowId').equals(String(id)).toArray()
    expect(entries).toHaveLength(0)
  })

  it('does not queue writes on a non-synced table', async () => {
    await db.areas.add({ name: 'Test area' })
    const all = await db.syncOutbox.toArray()
    expect(all).toHaveLength(0)
  })
})
