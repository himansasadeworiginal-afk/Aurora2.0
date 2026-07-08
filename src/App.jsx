import { useState, useCallback, useEffect } from 'react'
import db from './data/db'
import { startAgentSync } from './data/agentSync'
import NavSidebar from './components/NavSidebar'
import Notifier from './components/Notifier'
import AlarmOverlay from './components/AlarmOverlay'
import TaskTimer from './components/TaskTimer'
import Toast from './components/Toast'
import AmbientBackground from './components/AmbientBackground'
import MainDashboard from './components/MainDashboard'
import BrainView from './components/brain/BrainView'
import DailyAgenda from './components/DailyAgenda'
import CalendarView from './components/CalendarView'
import TrackerView from './components/TrackerView'
import TodoView from './components/TodoView'
import QuickCapturePage from './components/QuickCapturePage'
import NExoView from './components/NExoView'
import DesmondView from './components/DesmondView'
import Relations from './sections/Relations/Relations'
import DiaryView from './sections/Diary/DiaryView'

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

// App is the shell: persistent nav + ambient backdrop + global notifications,
// with one active section rendered in the main region. Section-local state
// lives inside each *View, keeping this component small.
const SECTIONS = ['dashboard', 'brain', 'agenda', 'calendar', 'trackers', 'todos', 'capture', 'nexo', 'desmond', 'relations', 'diary']

function initialSection() {
  const h = (typeof location !== 'undefined' ? location.hash : '').replace('#', '')
  return SECTIONS.includes(h) ? h : 'dashboard'
}

export default function App() {
  const [section, setSection] = useState(initialSection)
  const [pendingReminders, setPendingReminders] = useState(0)
  const [toasts, setToasts] = useState([])
  const [captureSignal] = useState(0)
  const [activeAlarm, setActiveAlarm] = useState(null)
  const [openPersonId, setOpenPersonId] = useState(null)
  const [openNoteId, setOpenNoteId] = useState(null)

  // A @mention's "View Full Profile" (or any aurora-open-person dispatch) jumps
  // to Relations and opens that person's detail modal. The reverse — a profile's
  // linked Second Brain note — jumps to the brain and opens that note's editor.
  useEffect(() => {
    const openPerson = (e) => {
      const id = e?.detail?.personId
      if (id == null) return
      setOpenPersonId(id)
      setSection('relations')
    }
    const openNote = (e) => {
      const id = e?.detail?.noteId
      if (id == null) return
      setOpenNoteId(id)
      setSection('brain')
    }
    window.addEventListener('aurora-open-person', openPerson)
    window.addEventListener('aurora-open-note', openNote)
    return () => {
      window.removeEventListener('aurora-open-person', openPerson)
      window.removeEventListener('aurora-open-note', openNote)
    }
  }, [])

  // First visit of the day jumps to the agenda as a morning briefing — unless a
  // section was deep-linked via the URL hash.
  useEffect(() => {
    const today = getToday()
    if (!location.hash && localStorage.getItem('aurora-agenda-last-shown') !== today) {
      const timer = setTimeout(() => {
        setSection('agenda')
        localStorage.setItem('aurora-agenda-last-shown', today)
      }, 1800)
      return () => clearTimeout(timer)
    }
  }, [])

  // Poll the agent bridge: apply Desmond's queued commands + vault MD changes
  // to IndexedDB so voice-driven edits show up in the app within a few seconds.
  useEffect(() => {
    const stop = startAgentSync()
    return stop
  }, [])

  const handleNavigate = useCallback((s) => {
    setSection(s)
  }, [])

  const handleNotify = useCallback((note) => {
    // Hard alarms take over the screen; everything else is a passive toast.
    if (note.alarm) {
      setActiveAlarm(note)
    } else {
      setToasts(prev => [...prev, { ...note, id: Date.now() }])
    }
  }, [])

  const snoozeAlarm = useCallback(async (minutes) => {
    if (activeAlarm?.id != null) {
      try { await db.reminders.update(activeAlarm.id, { snoozedUntil: Date.now() + minutes * 60000 }) } catch {}
    }
    setActiveAlarm(null)
  }, [activeAlarm])

  const dismissAlarm = useCallback(() => setActiveAlarm(null), [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const goDashboard = useCallback(() => setSection('dashboard'), [])

  return (
    <div className="app">
      <Notifier onPendingChange={setPendingReminders} onNotify={handleNotify} />
      {activeAlarm && <AlarmOverlay alarm={activeAlarm} onSnooze={snoozeAlarm} onDismiss={dismissAlarm} />}
      <TaskTimer />
      <Toast notifications={toasts} onDismiss={dismissToast} />
      <NavSidebar section={section} onNavigate={handleNavigate} pendingReminders={pendingReminders} />

      <div className="app-main">
        <AmbientBackground />

        {section === 'dashboard' && <MainDashboard onNavigate={handleNavigate} />}

        {section === 'brain' && <BrainView captureSignal={captureSignal} openNoteId={openNoteId} onOpenedNote={() => setOpenNoteId(null)} />}

        {section === 'agenda' && (
          <div className="section-page">
            <div className="section-page-inner">
              <DailyAgenda onClose={goDashboard} autoOpen={false} />
            </div>
          </div>
        )}

        {section === 'calendar' && (
          <div className="section-page">
            <CalendarView onClose={goDashboard} />
          </div>
        )}

        {section === 'trackers' && (
          <div className="section-page">
            <TrackerView onClose={goDashboard} />
          </div>
        )}

        {section === 'todos' && (
          <div className="section-page">
            <TodoView onClose={goDashboard} />
          </div>
        )}

        {section === 'capture' && <QuickCapturePage onClose={goDashboard} />}

        {section === 'nexo' && <NExoView onClose={goDashboard} />}

        {section === 'desmond' && <DesmondView onClose={goDashboard} />}

        {section === 'relations' && <Relations onClose={goDashboard} openPersonId={openPersonId} onOpenedPerson={() => setOpenPersonId(null)} />}
        {section === 'diary' && <DiaryView onClose={goDashboard} />}
      </div>
    </div>
  )
}
