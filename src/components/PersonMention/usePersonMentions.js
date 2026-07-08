import { useState, useRef, useCallback, useEffect } from 'react'
import { listRelations } from '../../sections/Relations/relations-data'
import { createMinimalPerson } from './personMentionData'

// Hook that adds @* person-mention support to a controlled textarea. The host
// supplies the textarea ref, the current value, and a setter. It calls
// `onValueChange(text, caret)` from its onChange and `onKeyDown(e)` from its
// keydown; it renders `dropdown` inside a position:relative wrapper around the
// textarea. Picked people accumulate in `mentions` for the host to persist.

const TRIGGER = /@\*([^\s@*]{0,40})$/

export function usePersonMentions({ textareaRef, value, setValue, initialMentions }) {
  const [people, setPeople] = useState([])
  const [trigger, setTrigger] = useState(null) // { start, caret, query }
  const [mentions, setMentions] = useState(initialMentions || [])
  const controlRef = useRef(null)

  useEffect(() => { listRelations().then(setPeople) }, [])
  useEffect(() => { setMentions(initialMentions || []) }, [initialMentions])

  const close = useCallback(() => setTrigger(null), [])

  const onValueChange = useCallback((text, caret) => {
    const pos = caret == null ? text.length : caret
    const before = text.slice(0, pos)
    const m = before.match(TRIGGER)
    if (m) setTrigger({ start: pos - m[0].length, caret: pos, query: m[1] })
    else setTrigger(null)
  }, [])

  const addMention = useCallback((person) => {
    setMentions(prev => prev.some(x => x.personId === person.id) ? prev : [...prev, { personId: person.id, displayName: person.name }])
  }, [])

  const insert = useCallback((person) => {
    if (!trigger) return
    const next = value.slice(0, trigger.start) + `@${person.name} ` + value.slice(trigger.caret)
    setValue(next)
    addMention(person)
    setTrigger(null)
    // Restore caret just after the inserted mention.
    const caretPos = trigger.start + person.name.length + 2
    requestAnimationFrame(() => {
      const ta = textareaRef.current
      if (ta) { ta.focus(); ta.setSelectionRange(caretPos, caretPos) }
    })
  }, [trigger, value, setValue, addMention, textareaRef])

  const pick = useCallback((person) => insert(person), [insert])

  const create = useCallback(async (name) => {
    const clean = (name || '').trim()
    if (!clean) { setTrigger(null); return }
    const person = await createMinimalPerson(clean)
    setPeople(prev => [...prev, { id: person.id, name: clean, skills: [] }])
    insert({ id: person.id, name: clean })
  }, [insert])

  const onKeyDown = useCallback((e) => {
    if (!trigger || !controlRef.current) return
    const res = controlRef.current(e)
    if (res === 'close') { setTrigger(null); e.preventDefault(); return }
    if (res) e.preventDefault()
  }, [trigger])

  return {
    people,
    mentions,
    open: !!trigger,
    query: trigger?.query || '',
    controlRef,
    onValueChange,
    onKeyDown,
    pick,
    create,
    close,
  }
}
