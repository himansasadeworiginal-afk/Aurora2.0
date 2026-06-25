import { useState, useCallback, useEffect } from 'react'
import NavSidebar from './components/NavSidebar'
import Notifier from './components/Notifier'
import Toast from './components/Toast'
import AmbientBackground from './components/AmbientBackground'
import MainDashboard from './components/MainDashboard'
import BrainView from './components/brain/BrainView'
import DailyAgenda from './components/DailyAgenda'
import CalendarView from './components/CalendarView'
import TrackerView from './components/TrackerView'
import NExoView from './components/NExoView'
import DesmondView from './components/DesmondView'

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

// App is the shell: persistent nav + ambient backdrop + global notifications,
// with one active section rendered in the main region. Section-local state
// lives inside each *View, keeping this component small.
export default function App() {
  const [section, setSection] = useState('dashboard')
  const [pendingReminders, setPendingReminders] = useState(0)
  const [toasts, setToasts] = useState([])
  const [captureSignal, setCaptureSignal] = useState(0)

  // First visit of the day jumps to the agenda as a morning briefing.
  useEffect(() => {
    const today = getToday()
    if (localStorage.getItem('aurora-agenda-last-shown') !== today) {
      const timer = setTimeout(() => {
        setSection('agenda')
        localStorage.setItem('aurora-agenda-last-shown', today)
      }, 1800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNavigate = useCallback((s) => {
    if (s === 'capture') {
      setSection('brain')
      setCaptureSignal(n => n + 1)
      return
    }
    setSection(s)
  }, [])

  const handleNotify = useCallback((note) => {
    setToasts(prev => [...prev, { ...note, id: Date.now() }])
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const goDashboard = useCallback(() => setSection('dashboard'), [])

  return (
    <div className="app">
      <Notifier onPendingChange={setPendingReminders} onNotify={handleNotify} />
      <Toast notifications={toasts} onDismiss={dismissToast} />
      <NavSidebar section={section} onNavigate={handleNavigate} pendingReminders={pendingReminders} />

      <div className="app-main">
        <AmbientBackground />

        {section === 'dashboard' && <MainDashboard onNavigate={handleNavigate} />}

        {section === 'brain' && <BrainView captureSignal={captureSignal} />}

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

        {section === 'nexo' && <NExoView onClose={goDashboard} />}

        {section === 'desmond' && <DesmondView onClose={goDashboard} />}
      </div>
    </div>
  )
}
