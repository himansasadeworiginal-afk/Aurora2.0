import { useState, useEffect, useCallback, useRef } from 'react'
import db from '../data/db'
import './TodoView.css'

// A dead-simple ordered checklist, intentionally lighter than the time-based
// reminders in DailyAgenda. Add, check off, reorder (drag), and clear completed.
// Persisted in the `todos` store so it survives reloads.

export default function TodoView({ onClose }) {
  const [todos, setTodos] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const dragId = useRef(null)

  const load = useCallback(async () => {
    try {
      const all = await db.todos.toArray()
      all.sort((a, b) => (a.order || 0) - (b.order || 0))
      setTodos(all)
    } catch { /* empty/partial DB */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const h = () => load()
    window.addEventListener('aurora-data-changed', h)
    return () => window.removeEventListener('aurora-data-changed', h)
  }, [load])

  const add = useCallback(async (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    const order = (todos.length ? Math.max(...todos.map(x => x.order || 0)) : 0) + 1
    const id = await db.todos.add({ text: t, done: false, order, createdAt: new Date() })
    setTodos(prev => [...prev, { id, text: t, done: false, order }])
    setText('')
  }, [text, todos])

  const toggle = useCallback(async (todo) => {
    const done = !todo.done
    await db.todos.update(todo.id, { done })
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, done } : t))
  }, [])

  const remove = useCallback(async (id) => {
    await db.todos.delete(id)
    setTodos(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearDone = useCallback(async () => {
    const doneIds = todos.filter(t => t.done).map(t => t.id)
    await Promise.all(doneIds.map(id => db.todos.delete(id)))
    setTodos(prev => prev.filter(t => !t.done))
  }, [todos])

  // Drag-to-reorder: on drop, splice the dragged item before the target and
  // rewrite the order values.
  const onDrop = useCallback(async (targetId) => {
    const from = dragId.current
    dragId.current = null
    if (from == null || from === targetId) return
    const arr = [...todos]
    const fromIdx = arr.findIndex(t => t.id === from)
    const toIdx = arr.findIndex(t => t.id === targetId)
    if (fromIdx < 0 || toIdx < 0) return
    const [moved] = arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, moved)
    const reordered = arr.map((t, i) => ({ ...t, order: i + 1 }))
    setTodos(reordered)
    await Promise.all(reordered.map(t => db.todos.update(t.id, { order: t.order })))
  }, [todos])

  const active = todos.filter(t => !t.done)
  const done = todos.filter(t => t.done)
  const doneCount = done.length

  return (
    <div className="todo-v2">
      <header className="todo-head">
        <div>
          <h1 className="todo-title">To-Do</h1>
          <p className="todo-sub">{active.length} open{doneCount ? ` · ${doneCount} done` : ''}</p>
        </div>
        {onClose && <button className="todo-close" onClick={onClose} title="Back">✕</button>}
      </header>

      <form className="todo-add" onSubmit={add}>
        <input
          className="todo-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a to-do and press Enter…"
          autoFocus
        />
        <button className="todo-add-btn" type="submit" disabled={!text.trim()}>Add</button>
      </form>

      {loading ? (
        <div className="todo-empty">Loading…</div>
      ) : todos.length === 0 ? (
        <div className="todo-empty">Nothing yet. Add your first to-do above.</div>
      ) : (
        <>
          <ul className="todo-list">
            {active.map(todo => (
              <li
                key={todo.id}
                className="todo-item"
                draggable
                onDragStart={() => { dragId.current = todo.id }}
                onDragOver={e => e.preventDefault()}
                onDrop={() => onDrop(todo.id)}
              >
                <span className="todo-grip" title="Drag to reorder">⠿</span>
                <button className="todo-check" onClick={() => toggle(todo)} aria-label="Complete" />
                <span className="todo-text">{todo.text}</span>
                <button className="todo-del" onClick={() => remove(todo.id)} title="Delete">✕</button>
              </li>
            ))}
          </ul>

          {doneCount > 0 && (
            <div className="todo-done-section">
              <div className="todo-done-head">
                <span>Completed</span>
                <button className="todo-clear" onClick={clearDone}>Clear completed</button>
              </div>
              <ul className="todo-list">
                {done.map(todo => (
                  <li key={todo.id} className="todo-item done">
                    <button className="todo-check checked" onClick={() => toggle(todo)} aria-label="Reopen">✓</button>
                    <span className="todo-text">{todo.text}</span>
                    <button className="todo-del" onClick={() => remove(todo.id)} title="Delete">✕</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
