import { useEffect, useState, useMemo } from 'react'
import PersonMentionToken from './PersonMentionToken'
import { listRelations } from '../../sections/Relations/relations-data'

// Renders note text with @mentions turned into hoverable PersonMentionToken
// links. `mentions` is the note's stored [{ personId, displayName }] list; the
// people graph is loaded to resolve each mention to a live record. Plain text
// (and notes without mentions) render unchanged.

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default function NoteContent({ content, mentions, onOpen }) {
  const [people, setPeople] = useState(null)
  const hasMentions = Array.isArray(mentions) && mentions.length > 0

  useEffect(() => {
    if (!hasMentions) return
    let alive = true
    listRelations().then(p => { if (alive) setPeople(p) })
    return () => { alive = false }
  }, [hasMentions])

  const nodes = useMemo(() => {
    const text = content || ''
    if (!hasMentions) return [text]
    const byName = new Map()
    for (const m of mentions) if (m?.displayName) byName.set(m.displayName, m)
    const names = [...byName.keys()].sort((a, b) => b.length - a.length)
    if (names.length === 0) return [text]
    const re = new RegExp(`@(${names.map(escapeRe).join('|')})`, 'g')
    const out = []
    let last = 0
    let m
    let k = 0
    while ((m = re.exec(text)) != null) {
      if (m.index > last) out.push(text.slice(last, m.index))
      const mention = byName.get(m[1])
      const person = people?.find(p => p.id === mention.personId) || null
      out.push(
        <PersonMentionToken key={`m${k++}`} person={person} displayName={mention.displayName} onOpen={onOpen} />
      )
      last = m.index + m[0].length
    }
    if (last < text.length) out.push(text.slice(last))
    return out
  }, [content, mentions, hasMentions, people, onOpen])

  return <>{nodes}</>
}
