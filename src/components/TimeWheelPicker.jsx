import { useState, useRef, useCallback, useEffect } from 'react'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const ITEM_HEIGHT = 32
const VISIBLE_ITEMS = 5
const CENTER_INDEX = Math.floor(VISIBLE_ITEMS / 2)

function WheelColumn({ items, value, onChange, label }) {
  const currentIndex = items.indexOf(value)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startYRef = useRef(0)
  const startOffsetRef = useRef(0)
  const containerRef = useRef(null)

  const snapTo = useCallback((idx) => {
    const newOffset = -idx * ITEM_HEIGHT
    setOffset(newOffset)
  }, [])

  useEffect(() => {
    snapTo(currentIndex >= 0 ? currentIndex : 0)
  }, [currentIndex, snapTo])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const dir = e.deltaY > 0 ? 1 : -1
    const newIdx = Math.max(0, Math.min(items.length - 1, currentIndex + dir))
    onChange(items[newIdx])
  }, [currentIndex, items, onChange])

  const handleMouseDown = useCallback((e) => {
    setDragging(true)
    startYRef.current = e.clientY
    startOffsetRef.current = offset
  }, [offset])

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return
    const dy = e.clientY - startYRef.current
    const newOffset = startOffsetRef.current + dy
    const idx = Math.round(-newOffset / ITEM_HEIGHT)
    const clamped = Math.max(0, Math.min(items.length - 1, idx))
    setOffset(-clamped * ITEM_HEIGHT)
  }, [dragging, items.length, offset, startOffsetRef])

  const handleMouseUp = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    const idx = Math.round(-offset / ITEM_HEIGHT)
    const clamped = Math.max(0, Math.min(items.length - 1, idx))
    onChange(items[clamped])
  }, [dragging, offset, items, onChange])

  useEffect(() => {
    if (!dragging) return
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  const padded = ['', '', '', ...items, '', '', '']

  return (
    <div className="tw-column" ref={containerRef}>
      <div className="tw-column-label">{label}</div>
      <div
        className="tw-window"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        style={{ cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}
      >
        <div
          className="tw-strip"
          style={{ transform: `translateY(${offset + CENTER_INDEX * ITEM_HEIGHT}px)` }}
        >
          {padded.map((v, i) => {
            if (!v) return <div key={i} className="tw-item tw-item-empty" style={{ height: ITEM_HEIGHT }} />
            const isSelected = v === value
            return (
              <div
                key={v}
                className={'tw-item' + (isSelected ? ' tw-selected' : '')}
                style={{ height: ITEM_HEIGHT }}
                onPointerDown={() => onChange(v)}
              >
                {v}
              </div>
            )
          })}
        </div>
      </div>
      <div className="tw-arrows">
        <button
          className="tw-arrow"
          onClick={() => {
            const idx = items.indexOf(value)
            if (idx > 0) onChange(items[idx - 1])
          }}
          disabled={currentIndex <= 0}
        >
          ▲
        </button>
        <button
          className="tw-arrow"
          onClick={() => {
            const idx = items.indexOf(value)
            if (idx < items.length - 1) onChange(items[idx + 1])
          }}
          disabled={currentIndex >= items.length - 1}
        >
          ▼
        </button>
      </div>
    </div>
  )
}

export default function TimeWheelPicker({ value, onChange }) {
  const [h, m] = (value || '09:00').split(':')
  const [hour, setHour] = useState(h)
  const [minute, setMinute] = useState(m)

  useEffect(() => {
    const [nh, nm] = (value || '09:00').split(':')
    setHour(nh)
    setMinute(nm)
  }, [value])

  const handleHour = useCallback((h) => {
    setHour(h)
    onChange(h + ':' + minute)
  }, [minute, onChange])

  const handleMinute = useCallback((m) => {
    setMinute(m)
    onChange(hour + ':' + m)
  }, [hour, onChange])

  return (
    <div className="tw-picker">
      <div className="tw-display">
        <span className="tw-display-hm">{hour}</span>
        <span className="tw-display-sep">:</span>
        <span className="tw-display-hm">{minute}</span>
      </div>
      <div className="tw-columns">
        <WheelColumn items={HOURS} value={hour} onChange={handleHour} label="Hour" />
        <WheelColumn items={MINUTES} value={minute} onChange={handleMinute} label="Min" />
      </div>
    </div>
  )
}
