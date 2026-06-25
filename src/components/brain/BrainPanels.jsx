// The CODE/AI workflow panels (phase3-panels). Only mounted when a panel is
// open (BrainView guards on this), so none of these heavy components run until
// the user opens them. One panel is active at a time.
import QuickCapture from '../QuickCapture'
import WebClipper from '../WebClipper'
import FavoriteProblems from '../FavoriteProblems'
import ZoomEditor from '../ZoomEditor'
import DistillDashboard from '../DistillDashboard'
import BatchDistill from '../BatchDistill'
import PacketsWorkspace from '../PacketsWorkspace'
import ArchipelagoEditor from '../ArchipelagoEditor'
import HemingwayBridge from '../HemingwayBridge'
import SemanticSearch from '../SemanticSearch'
import ScoredProblems from '../ScoredProblems'
import SerendipityEngine from '../SerendipityEngine'
import ContextRetrieval from '../ContextRetrieval'
import KnowledgeSuggest from '../KnowledgeSuggest'
import WeeklyReview from '../WeeklyReview'
import MonthlyReview from '../MonthlyReview'
import HabitNudges from '../HabitNudges'
import IntegrationSettings from '../IntegrationSettings'

export default function BrainPanels({
  panels, allTags, zoomNoteId, archipelagoPacket,
  onClose, onCapture, onClip, onSelectNote, onOpenArchipelago, onBackFromArchipelago,
}) {
  return (
    <div className="phase3-panels">
      <div className="panels-close-area">
        <button className="panels-close-btn" onClick={onClose} title="Close panel">✕</button>
      </div>
      {panels.quickCapture && <div className="phase3-panel visible"><QuickCapture onCapture={onCapture} allTags={allTags} onClose={onClose} /></div>}
      {panels.webClipper && <div className="phase3-panel visible"><WebClipper onClip={onClip} onClose={onClose} /></div>}
      {panels.favoriteProblems && <div className="phase3-panel visible"><FavoriteProblems onClose={onClose} /></div>}
      {panels.distillDashboard && <div className="phase3-panel visible"><DistillDashboard onSelectNote={onSelectNote} onClose={onClose} /></div>}
      {panels.batchDistill && <div className="phase3-panel visible"><BatchDistill onClose={onClose} /></div>}
      {panels.zoomEditor && <div className="phase3-panel visible"><ZoomEditor noteId={zoomNoteId} onClose={onClose} /></div>}
      {panels.packets && <div className="phase3-panel visible"><PacketsWorkspace onClose={onClose} onOpenArchipelago={onOpenArchipelago} /></div>}
      {panels.archipelago && <div className="phase3-panel visible"><ArchipelagoEditor packet={archipelagoPacket} onClose={onClose} onBack={onBackFromArchipelago} /></div>}
      {panels.hemingway && <div className="phase3-panel visible"><HemingwayBridge onClose={onClose} /></div>}
      {panels.semanticSearch && <div className="phase3-panel visible"><SemanticSearch onClose={onClose} onSelectNote={onSelectNote} /></div>}
      {panels.scoredProblems && <div className="phase3-panel visible"><ScoredProblems onClose={onClose} /></div>}
      {panels.serendipity && <div className="phase3-panel visible"><SerendipityEngine onClose={onClose} onSelectNote={onSelectNote} /></div>}
      {panels.contextRetrieval && <div className="phase3-panel visible"><ContextRetrieval onClose={onClose} onSelectNote={onSelectNote} /></div>}
      {panels.knowledgeSuggest && <div className="phase3-panel visible"><KnowledgeSuggest onClose={onClose} onSelectNote={onSelectNote} /></div>}
      {panels.weeklyReview && <div className="phase3-panel visible"><WeeklyReview onClose={onClose} /></div>}
      {panels.monthlyReview && <div className="phase3-panel visible"><MonthlyReview onClose={onClose} /></div>}
      {panels.habitNudges && <div className="phase3-panel visible"><HabitNudges onClose={onClose} /></div>}
      {panels.integrations && <div className="phase3-panel visible"><IntegrationSettings onClose={onClose} /></div>}
    </div>
  )
}
