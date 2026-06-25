import { useState, useCallback, useMemo, useEffect } from 'react'
import Scene3D from './components/Scene3D'
import LinkPanel from './components/LinkPanel'
import AuroraTitle from './components/AuroraTitle'
import ErrorBoundary from './components/ErrorBoundary'
import PARASidebar from './components/PARASidebar'
import PlacementChecklist from './components/PlacementChecklist'
import ProjectKickoff from './components/ProjectKickoff'
import QuickCapture from './components/QuickCapture'
import Inbox from './components/Inbox'
import WebClipper from './components/WebClipper'
import FavoriteProblems from './components/FavoriteProblems'
import ZoomEditor from './components/ZoomEditor'
import DistillDashboard from './components/DistillDashboard'
import BatchDistill from './components/BatchDistill'
import PacketsWorkspace from './components/PacketsWorkspace'
import ArchipelagoEditor from './components/ArchipelagoEditor'
import HemingwayBridge from './components/HemingwayBridge'
import DialDownScope from './components/DialDownScope'
import ExportDialog from './components/ExportDialog'
import SemanticSearch from './components/SemanticSearch'
import ScoredProblems from './components/ScoredProblems'
import SerendipityEngine from './components/SerendipityEngine'
import ContextRetrieval from './components/ContextRetrieval'
import KnowledgeSuggest from './components/KnowledgeSuggest'
import WeeklyReview from './components/WeeklyReview'
import MonthlyReview from './components/MonthlyReview'
import HabitNudges from './components/HabitNudges'
import IntegrationSettings from './components/IntegrationSettings'
import DailyAgenda from './components/DailyAgenda'
import NavSidebar from './components/NavSidebar'
import MainDashboard from './components/MainDashboard'
import CalendarView from './components/CalendarView'
import TrackerView from './components/TrackerView'
import NExoView from './components/NExoView'
import DesmondView from './components/DesmondView'
import Notifier from './components/Notifier'
import Toast from './components/Toast'
import { ideas, tests } from './data/ideas'

const PARA_COLORS = {
  work: '#ff4444',
  study: '#aa44dd',
  entertainment: '#4488ff',
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export default function App() {
  const [section, setSection] = useState('dashboard')
  const [selected, setSelected] = useState(null)
  const [showList, setShowList] = useState(true)
  const [hoveredIdea, setHoveredIdea] = useState(null)
  const [showChecklist, setShowChecklist] = useState(false)
  const [showKickoff, setShowKickoff] = useState(false)
  const [showInbox, setShowInbox] = useState(false)
  const [pendingReminders, setPendingReminders] = useState(0)
  const [toasts, setToasts] = useState([])
  const [showQuickCapture, setShowQuickCapture] = useState(false)
  const [showWebClipper, setShowWebClipper] = useState(false)
  const [showFavoriteProblems, setShowFavoriteProblems] = useState(false)
  const [showZoomEditor, setShowZoomEditor] = useState(false)
  const [zoomNoteId, setZoomNoteId] = useState(null)
  const [showDistillDashboard, setShowDistillDashboard] = useState(false)
  const [showBatchDistill, setShowBatchDistill] = useState(false)
  const [showPackets, setShowPackets] = useState(false)
  const [showArchipelago, setShowArchipelago] = useState(false)
  const [archipelagoPacket, setArchipelagoPacket] = useState(null)
  const [showHemingway, setShowHemingway] = useState(false)
  const [showDialDown, setShowDialDown] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showSemanticSearch, setShowSemanticSearch] = useState(false)
  const [showScoredProblems, setShowScoredProblems] = useState(false)
  const [showSerendipity, setShowSerendipity] = useState(false)
  const [showContextRetrieval, setShowContextRetrieval] = useState(false)
  const [showKnowledgeSuggest, setShowKnowledgeSuggest] = useState(false)
  const [showWeeklyReview, setShowWeeklyReview] = useState(false)
  const [showMonthlyReview, setShowMonthlyReview] = useState(false)
  const [showHabitNudges, setShowHabitNudges] = useState(false)
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [activeTab, setActiveTab] = useState('scene')
  const [paraFilter, setParaFilter] = useState(null)

  const anyPanelOpen = useMemo(() =>
    showQuickCapture || showWebClipper || showFavoriteProblems ||
    showDistillDashboard || showBatchDistill || showZoomEditor ||
    showPackets || showArchipelago || showHemingway ||
    showSemanticSearch || showScoredProblems || showSerendipity ||
    showContextRetrieval || showKnowledgeSuggest ||
    showWeeklyReview || showMonthlyReview || showHabitNudges || showIntegrations,
    [showQuickCapture, showWebClipper, showFavoriteProblems,
      showDistillDashboard, showBatchDistill, showZoomEditor,
      showPackets, showArchipelago, showHemingway,
      showSemanticSearch, showScoredProblems, showSerendipity,
      showContextRetrieval, showKnowledgeSuggest,
      showWeeklyReview, showMonthlyReview, showHabitNudges, showIntegrations]
  )

  const allTags = useMemo(() => {
    const tagSet = new Set()
    ideas.forEach(idea => idea.tags?.forEach(t => tagSet.add(t.toLowerCase())))
    return [...tagSet].sort()
  }, [])

  // Auto-navigate to agenda on first load of the day
  useEffect(() => {
    const today = getToday()
    const lastShown = localStorage.getItem('aurora-agenda-last-shown')
    if (lastShown !== today) {
      const timer = setTimeout(() => {
        setSection('agenda')
        localStorage.setItem('aurora-agenda-last-shown', today)
      }, 1800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNavigate = useCallback((s) => {
    setSection(s)
    if (s === 'capture') {
      setSection('brain')
      setShowQuickCapture(true)
      setActiveTab('capture')
    }
    if (s === 'brain') {
      setShowList(true)
    }
  }, [])

  const handleNotify = useCallback((note) => {
    setToasts(prev => [...prev, { ...note, id: Date.now() }])
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const closeAllPanels = useCallback(() => {
    setShowInbox(false)
    setShowQuickCapture(false)
    setShowWebClipper(false)
    setShowFavoriteProblems(false)
    setShowZoomEditor(false)
    setShowDistillDashboard(false)
    setShowBatchDistill(false)
    setShowPackets(false)
    setShowArchipelago(false)
    setShowHemingway(false)
    setShowSemanticSearch(false)
    setShowScoredProblems(false)
    setShowSerendipity(false)
    setShowContextRetrieval(false)
    setShowKnowledgeSuggest(false)
    setShowWeeklyReview(false)
    setShowMonthlyReview(false)
    setShowHabitNudges(false)
    setShowIntegrations(false)
    setActiveTab('scene')
  }, [])

  const handleSelect = useCallback((id) => {
    setSelected(id)
    if (id) setShowList(false)
  }, [])

  const handleQuickCapture = useCallback(() => {
    closeAllPanels()
    setShowInbox(true)
    setActiveTab('inbox')
  }, [closeAllPanels])

  const handleWebClip = useCallback(() => {
    closeAllPanels()
    setShowInbox(true)
    setActiveTab('inbox')
  }, [closeAllPanels])

  const openZoomEditor = useCallback((note) => {
    closeAllPanels()
    setZoomNoteId(note.id || note.ideaId)
    setShowZoomEditor(true)
  }, [closeAllPanels])

  const handleOpenArchipelago = useCallback((packet) => {
    closeAllPanels()
    setArchipelagoPacket(packet)
    setShowArchipelago(true)
  }, [closeAllPanels])

  const handleBackFromArchipelago = useCallback(() => {
    setShowArchipelago(false)
    setShowPackets(true)
  }, [])

  const handleToggleParaFilter = useCallback((category) => {
    setParaFilter(prev => prev === category ? null : category)
  }, [])

  const selectedIdea = useMemo(() => {
    if (!selected) return null
    return ideas.find(i => i.id === selected)
  }, [selected])

  const renderBrain = () => (
    <>
      <AuroraTitle
        onToggleList={() => setShowList(s => !s)}
        showList={showList}
        ideaCount={ideas.length}
        testCount={tests.length}
        onNewNote={() => setShowChecklist(true)}
        onNewProject={() => setShowKickoff(true)}
      />
      <div className="decorative-bar" />

      <div className="phase3-toolbar">
        <button
          className={`phase3-toolbar-btn ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => { closeAllPanels(); setShowInbox(true); setActiveTab('inbox') }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M1 4l2-2h10l2 2v9a1 1 0 01-1 1H2a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <path d="M1 4l7 4 7-4" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          Inbox
        </button>
        <button
          className={`phase3-toolbar-btn ${showQuickCapture ? 'active' : ''}`}
          onClick={() => { if (showQuickCapture) { closeAllPanels() } else { closeAllPanels(); setShowQuickCapture(true); setActiveTab('capture') } }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.2" />
            <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Capture
        </button>
        <button
          className={`phase3-toolbar-btn ${showWebClipper ? 'active' : ''}`}
          onClick={() => { if (showWebClipper) { closeAllPanels() } else { closeAllPanels(); setShowWebClipper(true); setActiveTab('clipper') } }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 1v12l4-3 4 3V1H3z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
          </svg>
          Clipper
        </button>
        <button
          className={`phase3-toolbar-btn ${showFavoriteProblems ? 'active' : ''}`}
          onClick={() => { if (showFavoriteProblems) { closeAllPanels() } else { closeAllPanels(); setShowFavoriteProblems(true); setActiveTab('problems') } }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1 2-4z" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          Problems
        </button>
        <div className="phase3-toolbar-sep" />
        <button
          className={`phase3-toolbar-btn ${showDistillDashboard ? 'active' : ''}`}
          onClick={() => { if (showDistillDashboard) { closeAllPanels() } else { closeAllPanels(); setShowDistillDashboard(true); setActiveTab('distill') } }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Distill
        </button>
        <button
          className={`phase3-toolbar-btn ${showBatchDistill ? 'active' : ''}`}
          onClick={() => { if (showBatchDistill) { closeAllPanels() } else { closeAllPanels(); setShowBatchDistill(true); setActiveTab('batch') } }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Batch
        </button>
        <div className="phase3-toolbar-sep" />
        <button
          className={`phase3-toolbar-btn ${showPackets ? 'active' : ''}`}
          onClick={() => { if (showPackets) { closeAllPanels() } else { closeAllPanels(); setShowPackets(true); setActiveTab('packets') } }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="12" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <rect x="1" y="8" width="12" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <line x1="1" y1="3.5" x2="13" y2="3.5" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
            <line x1="1" y1="10.5" x2="13" y2="10.5" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
          </svg>
          Packets
        </button>
        <button
          className={`phase3-toolbar-btn ${showHemingway ? 'active' : ''}`}
          onClick={() => { if (showHemingway) { closeAllPanels() } else { closeAllPanels(); setShowHemingway(true); setActiveTab('express') } }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 13l3-3 1 1 2-2 1 1 3-3 1 1-4 4-1-1-2 2-1-1-3 3" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <path d="M12 3l-1-2-2 1" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          Express
        </button>
        <div className="phase3-toolbar-sep" />
        <button
          className={`phase3-toolbar-btn ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => { closeAllPanels(); setActiveTab('ai'); setShowSemanticSearch(true) }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <circle cx="7" cy="7" r="2" fill="currentColor" opacity="0.3" />
          </svg>
          AI
        </button>
      </div>

      <div className="phase6-subbar">
        <button
          className={`p6-btn ${showSemanticSearch ? 'active' : ''}`}
          onClick={() => { if (showSemanticSearch) { closeAllPanels() } else { closeAllPanels(); setActiveTab('ai'); setShowSemanticSearch(true) } }}
        >Search</button>
        <button
          className={`p6-btn ${showScoredProblems ? 'active' : ''}`}
          onClick={() => { if (showScoredProblems) { closeAllPanels() } else { closeAllPanels(); setActiveTab('ai'); setShowScoredProblems(true) } }}
        >Score</button>
        <button
          className={`p6-btn ${showSerendipity ? 'active' : ''}`}
          onClick={() => { if (showSerendipity) { closeAllPanels() } else { closeAllPanels(); setActiveTab('ai'); setShowSerendipity(true) } }}
        >Serendipity</button>
        <button
          className={`p6-btn ${showContextRetrieval ? 'active' : ''}`}
          onClick={() => { if (showContextRetrieval) { closeAllPanels() } else { closeAllPanels(); setActiveTab('ai'); setShowContextRetrieval(true) } }}
        >Context</button>
        <button
          className={`p6-btn ${showKnowledgeSuggest ? 'active' : ''}`}
          onClick={() => { if (showKnowledgeSuggest) { closeAllPanels() } else { closeAllPanels(); setActiveTab('ai'); setShowKnowledgeSuggest(true) } }}
        >Suggest</button>
        <div className="p6-sep" />
        <button className={`p6-btn ${paraFilter ? 'active' : ''}`} onClick={() => setParaFilter(null)}>Clear Filter</button>
        <div className="p6-sep" />
        <button className={`p6-btn ${showWeeklyReview ? 'active' : ''}`} onClick={() => { if (showWeeklyReview) { closeAllPanels() } else { closeAllPanels(); setShowWeeklyReview(true) } }}>Weekly</button>
        <button className={`p6-btn ${showMonthlyReview ? 'active' : ''}`} onClick={() => { if (showMonthlyReview) { closeAllPanels() } else { closeAllPanels(); setShowMonthlyReview(true) } }}>Monthly</button>
        <button className={`p6-btn ${showHabitNudges ? 'active' : ''}`} onClick={() => { if (showHabitNudges) { closeAllPanels() } else { closeAllPanels(); setShowHabitNudges(true) } }}>Nudges</button>
        <button className={`p6-btn ${showIntegrations ? 'active' : ''}`} onClick={() => { if (showIntegrations) { closeAllPanels() } else { closeAllPanels(); setShowIntegrations(true) } }}>Integrations</button>
      </div>

      {paraFilter && (
        <div className="para-filter-badge" style={{ borderColor: PARA_COLORS[paraFilter] || '#666' }}>
          <span className="para-filter-dot" style={{ background: PARA_COLORS[paraFilter] || '#666' }} />
          Filtered: {paraFilter}
          <button className="para-filter-clear" onClick={() => setParaFilter(null)}>✕</button>
        </div>
      )}

      {anyPanelOpen && (
      <div className="phase3-panels">
        <div className="panels-close-area">
          <button className="panels-close-btn" onClick={closeAllPanels} title="Close panel">✕</button>
        </div>
        {showQuickCapture && <div className="phase3-panel visible"><QuickCapture onCapture={handleQuickCapture} allTags={allTags} onClose={closeAllPanels} /></div>}
        {showWebClipper && <div className="phase3-panel visible"><WebClipper onClip={handleWebClip} onClose={closeAllPanels} /></div>}
        {showFavoriteProblems && <div className="phase3-panel visible"><FavoriteProblems onClose={closeAllPanels} /></div>}
        {showDistillDashboard && <div className="phase3-panel visible"><DistillDashboard onSelectNote={openZoomEditor} onClose={closeAllPanels} /></div>}
        {showBatchDistill && <div className="phase3-panel visible"><BatchDistill onClose={closeAllPanels} /></div>}
        {showZoomEditor && <div className="phase3-panel visible"><ZoomEditor noteId={zoomNoteId} onClose={closeAllPanels} /></div>}
        {showPackets && <div className="phase3-panel visible"><PacketsWorkspace onClose={closeAllPanels} onOpenArchipelago={handleOpenArchipelago} /></div>}
        {showArchipelago && <div className="phase3-panel visible"><ArchipelagoEditor packet={archipelagoPacket} onClose={closeAllPanels} onBack={handleBackFromArchipelago} /></div>}
        {showHemingway && <div className="phase3-panel visible"><HemingwayBridge onClose={closeAllPanels} /></div>}
        {showSemanticSearch && <div className="phase3-panel visible"><SemanticSearch onClose={closeAllPanels} onSelectNote={openZoomEditor} /></div>}
        {showScoredProblems && <div className="phase3-panel visible"><ScoredProblems onClose={closeAllPanels} /></div>}
        {showSerendipity && <div className="phase3-panel visible"><SerendipityEngine onClose={closeAllPanels} onSelectNote={openZoomEditor} /></div>}
        {showContextRetrieval && <div className="phase3-panel visible"><ContextRetrieval onClose={closeAllPanels} onSelectNote={openZoomEditor} /></div>}
        {showKnowledgeSuggest && <div className="phase3-panel visible"><KnowledgeSuggest onClose={closeAllPanels} onSelectNote={openZoomEditor} /></div>}
        {showWeeklyReview && <div className="phase3-panel visible"><WeeklyReview onClose={closeAllPanels} /></div>}
        {showMonthlyReview && <div className="phase3-panel visible"><MonthlyReview onClose={closeAllPanels} /></div>}
        {showHabitNudges && <div className="phase3-panel visible"><HabitNudges onClose={closeAllPanels} /></div>}
        {showIntegrations && <div className="phase3-panel visible"><IntegrationSettings onClose={closeAllPanels} /></div>}
      </div>
      )}

      {showDialDown && <div className="checklist-overlay"><DialDownScope project={null} onClose={() => setShowDialDown(false)} /></div>}
      {showExport && <div className="checklist-overlay"><ExportDialog onClose={() => setShowExport(false)} /></div>}

      <ErrorBoundary>
        <div className="scene-container">
          <Scene3D
            selected={selected} onSelect={handleSelect}
            onNodeHover={setHoveredIdea} paraFilter={paraFilter}
            onToggleParaFilter={handleToggleParaFilter}
          />
        </div>
      </ErrorBoundary>

      {activeTab === 'inbox' && showInbox && (
        <div className="inbox-container">
          <Inbox onSelect={(note) => { setActiveTab('scene'); setShowInbox(false) }} onClose={() => { setShowInbox(false); setActiveTab('scene') }} />
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
    </>
  )

  return (
    <div className="app">
      <Notifier onPendingChange={setPendingReminders} onNotify={handleNotify} />
      <Toast notifications={toasts} onDismiss={dismissToast} />
      <NavSidebar section={section} onNavigate={handleNavigate} pendingReminders={pendingReminders} />

      <div className="app-main">
        <div className="particle-layer">
          <div className="p" /><div className="p" /><div className="p" /><div className="p" /><div className="p" />
          <div className="p" /><div className="p" /><div className="p" /><div className="p" /><div className="p" />
          <div className="p" /><div className="p" /><div className="p" /><div className="p" /><div className="p" />
        </div>
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />
        <div className="glow-orb glow-orb-3" />
        {section === 'dashboard' && <MainDashboard onNavigate={handleNavigate} />}

        {section === 'brain' && renderBrain()}

        {section === 'agenda' && (
          <div className="section-page">
            <div className="section-page-inner">
              <DailyAgenda
                onClose={() => setSection('dashboard')}
                autoOpen={false}
              />
            </div>
          </div>
        )}

        {section === 'calendar' && (
          <div className="section-page">
            <CalendarView onClose={() => setSection('dashboard')} />
          </div>
        )}

        {section === 'trackers' && (
          <div className="section-page">
            <TrackerView onClose={() => setSection('dashboard')} />
          </div>
        )}

        {section === 'nexo' && (
          <NExoView onClose={() => setSection('dashboard')} />
        )}

        {section === 'desmond' && (
          <DesmondView onClose={() => setSection('dashboard')} />
        )}
      </div>
    </div>
  )
}
