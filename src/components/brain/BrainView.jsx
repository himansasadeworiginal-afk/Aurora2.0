import { useState, useCallback, useMemo, useEffect } from 'react'
import Scene3D from '../Scene3D'
import LinkPanel from '../LinkPanel'
import AuroraTitle from '../AuroraTitle'
import ErrorBoundary from '../ErrorBoundary'
import PARASidebar from '../PARASidebar'
import PlacementChecklist from '../PlacementChecklist'
import ProjectKickoff from '../ProjectKickoff'
import Inbox from '../Inbox'
import DialDownScope from '../DialDownScope'
import ExportDialog from '../ExportDialog'
import BrainToolbar from './BrainToolbar'
import BrainPanels from './BrainPanels'
import { ideas, tests } from '../../data/ideas'
import './BrainView.css'

// Below this width, don't try to render the orbiting WebGL force-graph — it's
// not realistically touch-usable at phone size. Matches the nav-collapse
// breakpoint already used for the same "is this a phone" check in shell.css.
const MOBILE_BREAKPOINT = 900

function useIsNarrowViewport(breakpoint = MOBILE_BREAKPOINT) {
  const [isNarrow, setIsNarrow] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia(`(max-width: ${breakpoint}px)`).matches
  ))
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const onChange = (e) => setIsNarrow(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [breakpoint])
  return isNarrow
}

// The Second Brain workspace: 3D scene + CODE/AI toolbars + workflow panels.
// A single `panel` map holds at most one open workflow panel (the original
// 18 booleans were mutually exclusive — closeAll ran before every open).
export default function BrainView({ captureSignal = 0, openNoteId = null, onOpenedNote }) {
  const isNarrow = useIsNarrowViewport()
  const [selected, setSelected] = useState(null)
  const [showList, setShowList] = useState(true)
  const [hoveredIdea, setHoveredIdea] = useState(null)
  const [showChecklist, setShowChecklist] = useState(false)
  const [showKickoff, setShowKickoff] = useState(false)
  const [showInbox, setShowInbox] = useState(false)
  const [showDialDown, setShowDialDown] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [activeTab, setActiveTab] = useState('scene')
  const [paraFilter, setParaFilter] = useState(null)
  const [panel, setPanel] = useState(null)            // active workflow panel name | null
  const [zoomNoteId, setZoomNoteId] = useState(null)
  const [showPeople, setShowPeople] = useState(true)
  const [archipelagoPacket, setArchipelagoPacket] = useState(null)

  const panels = useMemo(() => (panel ? { [panel]: true } : {}), [panel])
  const anyPanelOpen = panel !== null

  const allTags = useMemo(() => {
    const tagSet = new Set()
    ideas.forEach(idea => idea.tags?.forEach(t => tagSet.add(t.toLowerCase())))
    return [...tagSet].sort()
  }, [])

  const closeAllPanels = useCallback(() => {
    setPanel(null)
    setShowInbox(false)
    setActiveTab('scene')
  }, [])

  const openPanel = useCallback((name, tab) => {
    setShowInbox(false)
    setPanel(name)
    if (tab) setActiveTab(tab)
  }, [])

  const togglePanel = useCallback((name, tab) => {
    setPanel(prev => (prev === name ? null : name))
    setShowInbox(false)
    setActiveTab(prev => (panel === name ? 'scene' : (tab || prev)))
  }, [panel])

  // Honor a "capture" navigation intent coming from the dashboard / nav.
  // captureSignal is a monotonically increasing nonce so repeated requests
  // (even while already on the Brain view) re-open Quick Capture.
  useEffect(() => {
    if (captureSignal > 0) openPanel('quickCapture', 'capture')
  }, [captureSignal, openPanel])

  // On phone-width viewports there's no 3D scene to fall back to (see below),
  // so the list is the entire view — keep it forced open rather than letting
  // a stale "closed" state leave the screen blank.
  useEffect(() => {
    if (isNarrow) setShowList(true)
  }, [isNarrow])

  const toolbarActions = useMemo(() => ({
    toggle: togglePanel,
    openAI: () => openPanel('semanticSearch', 'ai'),
    openInbox: () => { setPanel(null); setShowInbox(true); setActiveTab('inbox') },
    clearFilter: () => setParaFilter(null),
  }), [togglePanel, openPanel])

  const handleSelect = useCallback((id) => {
    setSelected(id)
    if (id) setShowList(false)
  }, [])

  const handleInboxLand = useCallback(() => { closeAllPanels() }, [closeAllPanels])

  const openZoomEditor = useCallback((note) => {
    setShowInbox(false)
    setZoomNoteId(note.id || note.ideaId)
    setPanel('zoomEditor')
  }, [])

  // Deep-link from a Relations profile's linked note: open that note's editor.
  useEffect(() => {
    if (openNoteId == null) return
    openZoomEditor({ id: openNoteId })
    onOpenedNote?.()
  }, [openNoteId, openZoomEditor, onOpenedNote])

  const handleOpenArchipelago = useCallback((packet) => {
    setShowInbox(false)
    setArchipelagoPacket(packet)
    setPanel('archipelago')
  }, [])

  const handleBackFromArchipelago = useCallback(() => setPanel('packets'), [])

  const handleToggleParaFilter = useCallback((category) => {
    setParaFilter(prev => (prev === category ? null : category))
  }, [])

  return (
    <div className="brain-v2">
      <AuroraTitle
        onToggleList={() => setShowList(s => !s)}
        showList={showList}
        ideaCount={ideas.length}
        testCount={tests.length}
        onNewNote={() => setShowChecklist(true)}
        onNewProject={() => setShowKickoff(true)}
      />
      <div className="decorative-bar" />

      <BrainToolbar panels={panels} activeTab={activeTab} paraFilter={paraFilter} actions={toolbarActions} />

      {anyPanelOpen && (
        <BrainPanels
          panels={panels}
          allTags={allTags}
          zoomNoteId={zoomNoteId}
          archipelagoPacket={archipelagoPacket}
          onClose={closeAllPanels}
          onCapture={handleInboxLand}
          onClip={handleInboxLand}
          onSelectNote={openZoomEditor}
          onOpenArchipelago={handleOpenArchipelago}
          onBackFromArchipelago={handleBackFromArchipelago}
        />
      )}

      {showDialDown && <div className="checklist-overlay"><DialDownScope project={null} onClose={() => setShowDialDown(false)} /></div>}
      {showExport && <div className="checklist-overlay"><ExportDialog onClose={() => setShowExport(false)} /></div>}

      {!isNarrow && (
        <ErrorBoundary>
          <div className="scene-container">
            <Scene3D
              selected={selected} onSelect={handleSelect}
              onNodeHover={setHoveredIdea} paraFilter={paraFilter}
              onToggleParaFilter={handleToggleParaFilter}
              showPeople={showPeople && !paraFilter}
            />
            <button
              className={`brain-people-toggle${showPeople ? ' active' : ''}`}
              onClick={() => setShowPeople(s => !s)}
              title={showPeople ? 'Hide people' : 'Show people'}
            >
              <span className="brain-people-dot" />
              People
            </button>
          </div>
        </ErrorBoundary>
      )}

      {activeTab === 'inbox' && showInbox && (
        <div className="inbox-container">
          <Inbox onSelect={handleInboxLand} onClose={handleInboxLand} />
        </div>
      )}

      {hoveredIdea && !selected && (
        <div className="hover-bar" style={{ borderColor: hoveredIdea.color }}>
          <span className="hover-dot" style={{ background: hoveredIdea.color }} />
          <span className="hover-title">{hoveredIdea.title}</span>
          <span className="hover-desc">{hoveredIdea.description.slice(0, 60)}...</span>
        </div>
      )}

      {selected && <LinkPanel selected={selected} onClose={() => setSelected(null)} />}
      {showList && <PARASidebar selected={selected} onSelect={handleSelect} onClose={() => setShowList(false)} />}
      {showChecklist && <PlacementChecklist onClose={() => setShowChecklist(false)} onCreated={(note) => { handleSelect(note.id); setShowList(true) }} />}
      {showKickoff && <ProjectKickoff onClose={() => setShowKickoff(false)} />}

      <div className="phase5-float-actions">
        <button className="float-btn" onClick={() => setShowExport(true)} title="Export">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 10V3M4 6l3-3 3 3" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 10v2h10v-2" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          Export
        </button>
        <button className="float-btn" onClick={() => setShowDialDown(true)} title="Dial Down Scope">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            <line x1="7" y1="4" x2="7" y2="8" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="7" cy="10.5" r="0.8" fill="currentColor" />
          </svg>
          Scope
        </button>
      </div>
    </div>
  )
}
