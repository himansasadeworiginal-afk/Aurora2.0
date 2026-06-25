# Aurora 5.0

**Personal Hub — Dashboard, Second Brain, Agenda, Calendar, Trackers**

Aurora 5.0 is a central command center that brings together your knowledge, tasks, schedule, and habits in one place. The **Second Brain** (interactive 3D knowledge graph) is one section among equals — Aurora is no longer just a PKM tool, but a full daily operating system.

Built with React, Three.js, React Three Fiber, Dexie.js (IndexedDB), and post-processing bloom effects in a red/black neon sci-fi aesthetic. Features a polished navigation hub with custom line-art SVG icons, staggered entry animations, glow effects, and smooth micro-interactions throughout.

---

## Quick Start

```bash
# Aurora 5.0 starts automatically at boot.
# Or start/stop manually:
systemctl --user start aurora
systemctl --user stop aurora
systemctl --user status aurora

# Open in browser
xdg-open http://localhost:8080

# Rebuild production files
cd ~/Projects/Project\ Aurora/aurora\ 5.0
npm install
npm run build
```

> The server runs on `http://localhost:8080`. Configured as a systemd --user service and auto-opened on Hyprland startup.

### Data Layer Commands

```bash
npm run vault:import   # Re-scan vault .md files → regenerate src/data/vault-seed.json
```

---

## Architecture

```
aurora 5.0/
├── index.html              # Entry with animated splash + PWA service worker
├── package.json
├── vite.config.js
├── server.js               # Production static server (Node.js, serves /nexo/*)
├── desmond-launcher.js     # Spawns/kills Desmond Python process on startup/shutdown
├── nexo/                   # NExo 1.0 standalone book summaries app
├── dist/                   # Prebuilt output (ready to serve)
├── public/
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker for offline support
├── src/
│   ├── main.jsx            # React mount, splash hide, WebGL detection, DB init
│   ├── App.jsx             # Root: selection state, toolbar, panels for all 11 phases
│   ├── App.css             # Global red/black neon theme + all phase styles (6k+ lines)
│   ├── data/
│   │   ├── db.js           # Dexie.js IndexedDB v8 — 27 object stores
│   │   ├── seed.js         # Seeds DB from ideas.js + vault-seed.json (with error recovery)
│   │   ├── ideas.js        # 55 core entries + merged imports from sub-files
│   │   ├── books.js        # 19 individual book entries
│   │   ├── movies.js       # 90 individual movie entries across 8 genres
│   │   ├── tv.js           # 66 individual TV series entries across 4 categories
│   │   ├── cli-import.js   # CLI: reads vault .md files, outputs vault-seed.json
│   │   ├── vault-seed.json # Prebuilt vault import (230 files)
│   │   ├── importer.js     # Vault file reading + gray-matter parsing (Node)
│   │   ├── watcher.js      # Chokidar file watcher for real-time sync (Node)
│   │   ├── resonance.js    # Resonance event tracking for note interactions
│   │   └── embeddings.js   # Keyword-based semantic search + serendipity engine
│   ├── components/         # 41 components total
│   │   ├── Scene3D.jsx     # Golden-angle sphere layout (instant, no d3)
│   │   ├── IdeaNode.jsx    # PARA-coded nodes: color=category, size=connections, glow=distillation
│   │   ├── BrainSphere.jsx # Dual tetrahedra core with emissive glow
│   │   ├── BranchLink.jsx  # Pulsing cylinder links
│   │   ├── ParticleField.jsx# 3000 red-hued ambient particles
│   │   ├── PARAZone.jsx    # Triple-ring zone with double-click filter
│   │   ├── AuroraTitle.jsx # Header with glow, badge, live indicator
│   │   ├── LinkPanel.jsx   # Detail panel for selected node
│   │   ├── ErrorBoundary.jsx# 3D error boundary
│   │   ├── PARASidebar.jsx # PARA tree sidebar
│   │   ├── PlacementChecklist.jsx # PARA category assignment
│   │   ├── ProjectKickoff.jsx # 5-step project kickoff
│   │   ├── QuickCapture.jsx # Text, URL, voice capture
│   │   ├── Inbox.jsx       # Universal inbox
│   │   ├── WebClipper.jsx  # OG metadata clipper
│   │   ├── FavoriteProblems.jsx # Twelve Favorite Problems
│   │   ├── ZoomEditor.jsx  # 4-layer progressive summarization
│   │   ├── DistillDashboard.jsx # Distillation sorting
│   │   ├── BatchDistill.jsx # Batch distill mode
│   │   ├── PacketsWorkspace.jsx # Intermediate Packets
│   │   ├── ArchipelagoEditor.jsx # Island bridge editor
│   │   ├── HemingwayBridge.jsx # Session handoff
│   │   ├── DialDownScope.jsx # MVP suggestions
│   │   ├── ExportDialog.jsx # Export Markdown/HTML/Plain
│   │   ├── SemanticSearch.jsx # Keyword search
│   │   ├── ScoredProblems.jsx # Auto-scored problems
│   │   ├── SerendipityEngine.jsx # Cross-domain connections
│   │   ├── ContextRetrieval.jsx # Context pre-filter
│   │   ├── KnowledgeSuggest.jsx # Related note suggestions
│   │   ├── WeeklyReview.jsx  # 7-step weekly guided review
│   │   ├── MonthlyReview.jsx # 7-step monthly deep audit
│   │   ├── HabitNudges.jsx   # 5-category habit suggestions
│   │   ├── IntegrationSettings.jsx # Obsidian, Pocket, Readwise, GitHub config
│   │   ├── DailyAgenda.jsx   # Daily reminder system with CRUD + recurring
│   │   ├── NavSidebar.jsx    # Fixed left nav with SVG icons & hover labels
│   │   ├── MainDashboard.jsx # Hub page with stat cards to all sections
│   │   ├── CalendarView.jsx  # Monthly calendar with event CRUD
│   │   ├── TrackerView.jsx   # Habit trackers with daily check-in & streaks
│   │   ├── NExoView.jsx     # Iframe viewer for NExo 1.0 book summaries
│   │   ├── DesmondView.jsx  # Launch/status UI for Desmond AI assistant
│   │   └── NeuralLink.jsx    # Cross-node connection lines in 3D scene
│   └── tests/
│       └── aurora.test.js   # 31 tests covering data integrity & component exports
└── README.md
```

---

## Project Status — 100% Complete

### Phase 1 — Foundation & Vault Sync ✅
- [x] Dexie.js/IndexedDB with 15 object stores
- [x] Obsidian vault import (230 files)
- [x] Chokidar file watcher for live sync

### Phase 2 — PARA Organization ✅
- [x] Projects / Areas / Resources / Archives hierarchy
- [x] Tabbed PARA sidebar with tree view
- [x] Placement Checklist (4-question PARA assignment)
- [x] Drag-and-drop between PARA categories
- [x] 3D spatial zones mirroring PARA

### Phase 3 — CODE: Capture & Organize ✅
- [x] Universal inbox with classification
- [x] Quick capture (text, URL, voice)
- [x] Web clipper with OG metadata
- [x] Auto-suggest tags from corpus
- [x] Twelve Favorite Problems resonance scanning

### Phase 4 — CODE: Distill ✅
- [x] 4-layer progressive summarization (Soil → Oil → Gold → Gems)
- [x] Distillation dashboard with multi-sort
- [x] Batch distill mode with progress tracking

### Phase 5 — CODE: Express ✅
- [x] Intermediate Packets workspace (drag-and-drop)
- [x] Archipelago of Ideas (island bridge editor)
- [x] Hemingway Bridge (session handoff)
- [x] Dial Down Scope (MVP suggestions)
- [x] Export to Markdown, HTML, Plain Text

### Phase 6 — AI Intelligence Layer ✅
- [x] Semantic Search (keyword TF scoring)
- [x] Resonance Dashboard with auto-scored Twelve Favorite Problems
- [x] Resonance detection (views, edits, distills, captures)
- [x] Serendipity Engine (cross-domain connections)
- [x] Context-aware retrieval (pre-filter by project/area)
- [x] Knowledge compounding (related note suggestions)

### Phase 7 — 3D Visualization ✅
- [x] Deterministic golden-angle sphere layout (instant, no force simulation jitter)
- [x] PARA-coded visuals (color, size based on connections, glow based on distillation)
- [x] Double-click PARA zone filtering
- [x] Semantic connection lines (cross-links)
- [x] Fixed node sizing (0.15–0.3 radius, anchors at 0.45) for clean visibility

### Phase 8 — UI Polish & Habits ✅
- [x] Weekly Review — 7-step guided checklist with progress tracking
- [x] Monthly Review — deep audit with goals, projects, archives review
- [x] Habit Nudges — 5-category smart suggestions (titles, categories, merges, staleness, distillation)
- [x] Review persistence (IndexedDB history tracking)

### Phase 9 — External Integrations ✅
- [x] Integration settings panel with enable/disable toggles
- [x] Obsidian Vault Sync config
- [x] Pocket read-later import config
- [x] Readwise highlights sync config
- [x] GitHub issues/PRs config
- [x] Encrypted config fields (API tokens, keys)

### Phase 10 — Testing & Deployment ✅
- [x] 30+ test suite (data integrity, component exports, cross-links, phase logic)
- [x] PWA support (manifest.json, service worker with cache-first strategy)
- [x] Production build optimization
- [x] Local-first architecture

### Phase 11 — Boot Autostart & Daily Agenda ✅
- [x] Production Node.js static server
- [x] systemd --user service for boot-time launch
- [x] Browser auto-open on Hyprland startup
- [x] Port 8080 dedicated server
- [x] Clean startup/shutdown lifecycle
- [x] Daily Agenda greeting — auto-shows today's tasks on boot
- [x] Full reminder CRUD — add, edit, complete, delete
- [x] Priority levels (high/medium/low) with color coding
- [x] Task categories (work, study, personal, health, errands)
- [x] Recurring reminders (daily, weekdays, weekends, weekly, monthly)
- [x] Progress tracking with completion bar
- [x] All-tasks-complete celebration state

### Phase 13 — Animations & Micro-Interactions ✅
- [x] Staggered entry animations on all card grids and lists
- [x] Active indicator bar with glow pulse on nav buttons
- [x] Tooltip hover labels on nav items
- [x] scaleBounce on check/toggle interactions
- [x] Button scale on press, icon rotate on hover
- [x] Shimmer glow on progress bars and buttons
- [x] Floating ambient animation on stat values
- [x] Pulsing event dot indicators on calendar days
- [x] Spring-curve entrance animations on modals and sections
- [x] glowPulse, textGlow, shimmerSlide, slideDown, floatSlow, borderGlow keyframes
- [x] SVG icons across all menu components (no emojis or text symbols)

### Phase 14 — Ambient Background & Visual Depth ✅
- [x] Dynamic gradient background (`--bg-gradient`) applied to `.app` and `body`
- [x] Dark gradient with subtle red undertones for depth without distraction
- [x] 15 floating CSS particle elements with `floatParticle` keyframes
- [x] 3 drifting glow orbs with radial gradients and individual drift animations
- [x] Animated background shift via `ambientShift` keyframes
- [x] Dashboard focus glow (`dashboard::after`)
- [x] Panel glow rings on calendar, tracker, and agenda containers
- [x] Panel backgrounds use `linear-gradient` for contrast against gradient page bg
- [x] Nav sidebar uses dedicated gradient background
- [x] Ambient layer opacity tuned for subtlety — background remains near-black dominant

### Phase 15 — Robustness & NExo Integration ✅
- [x] DB error recovery — seed functions wrapped in try/catch
- [x] PARASidebar fallback — loads from static ideas.js when IndexedDB is empty
- [x] Drag-and-drop disabled in fallback mode (no DB writes)
- [x] Scene3D layout replaced: force simulation → deterministic golden-angle sphere placement
- [x] 3D node sizes tuned for clean visibility (0.15–0.3, anchors 0.45)
- [x] NExo 1.0 book summaries integrated as 6th nav section (iframe)
- [x] NExo theme patterns adapted to red/black palette
- [x] Production server serves `/nexo/*` from project root
- [x] Dev server (Vite) middleware for `/nexo/*`

### Phase 16 — Desmond AI Assistant ✅
- [x] Desmond as 7th nav section — launch/kill UI with live status (running/starting/stopped/error)
- [x] Auto-launch: Desmond Python process (MARK XXXIX / Gemini 2.5 Flash) starts automatically with Aurora
- [x] Graceful shutdown: Desmond process killed on Aurora exit
- [x] Status polling via `/api/health` endpoint (3-second interval)
- [x] Start/Stop API endpoints (`POST /api/desmond/start`, `POST /api/desmond/stop`)
- [x] Error reporting — last 3 stderr lines shown in UI when Desmond fails to start
- [x] 2-second startup grace period + 10-second error window for early crashes
- [x] `DISPLAY` env var fallback for headless/XWayland compatibility
- [x] PyQt6 import safety — `pyautogui` imports wrapped in `except Exception` (not just `ImportError`) to catch X11 auth errors
- [x] Dashboard card, custom SVG icon, and staggered animation

### Phase 12 — Navigation Hub & Menu System ✅
- [x] Fixed left nav sidebar with 7 core sections (Dashboard, Brain, Agenda, Calendar, Trackers, NExo, Desmond)
- [x] Custom line-art SVG icons throughout (no emojis or text symbols)
- [x] Tooltip-style hover labels on nav items
- [x] Active section indicator with glow pulse
- [x] Main dashboard with greeting, date, stat cards, and live DB stats
- [x] Staggered entry animations on all card grids and lists
- [x] Calendar view with month grid, event CRUD, and color picker
- [x] Habit tracker view with daily check-in, streak counting, and category colors
- [x] Bouncy scale animations on check/toggle interactions
- [x] Smooth micro-interactions: button scale on press, icon rotate on hover
- [x] Shimmer glow on progress bars and buttons
- [x] Floating ambient animation on stat values
- [x] Pulsing event dot indicators on calendar days
- [x] Spring-curve entrance animations on modals and sections
- [x] Clean interface: zero inline styles in tracker components

---

## Autostart System

### Desmond Auto-Launch

When Aurora starts (in both dev and production modes), the **Desmond AI assistant** (MARK XXXIX / Gemini 2.5 Flash) Python process is automatically spawned as a child process. It is killed when Aurora shuts down. No separate terminal needed.

The Desmond view in Aurora shows a status indicator (green = running, amber = starting, red = stopped/error) with a Launch/Stop button. Status is polled via `/api/health` every 3 seconds.

Aurora 5.0 uses two mechanisms to be ready at boot:

### 1. systemd User Service (`~/.config/systemd/user/aurora.service`)

- Runs the production server as a systemd --user service
- Starts automatically at boot (`WantedBy=default.target`)
- Restarts on failure (`Restart=on-failure`)
- Manage: `systemctl --user {start|stop|status|enable|disable} aurora`

### 2. Hyprland Autostart (`~/.config/hypr/autostart.conf`)

- Opens `http://localhost:8080` in the default browser after Hyprland starts
- Only triggers after the Aurora server is ready (3-second delay)

### 3. Daily Agenda — Your Morning Briefing

When Aurora loads in the browser, the **Daily Agenda** appears automatically — once per day. It shows:

- A time-of-day greeting ("Good morning", "Good afternoon", "Good evening")
- Today's date with a task count badge
- All reminders for today, sorted by priority
- A progress bar showing completion status
- Quick controls to add, edit, complete, or delete reminders
- Support for recurring tasks: daily, weekdays, weekends, weekly, monthly
- An "All tasks completed!" celebration when everything is done

The agenda remembers it was shown today (via localStorage) so it won't re-appear on page refresh. You can reopen it anytime via the **Agenda** button in the toolbar.

---

## Phase 8 Features

### Weekly Review
Click **Weekly** in the toolbar to open a 7-step guided review checklist: clear inbox, check calendar, close projects, distill 5 notes, pick top-3 priorities, review new notes, check areas. Progress bar shows completion status. Completed reviews are saved to IndexedDB history.

### Monthly Review
Click **Monthly** for a deep audit: review goals, audit projects, review areas, process someday/maybe, archive old items, check habit streaks, update Twelve Favorite Problems.

### Habit Nudges
Click **Nudges** to get smart suggestions for improving your second brain:
- **Better Titles** — flags notes with generic names
- **Re-categorization** — finds notes without PARA category
- **Merge Suggestions** — detects potentially duplicate notes
- **Stale Notes** — surfaces notes untouched for 30+ days
- **Undistilled Notes** — encourages distillation of raw captures

## Phase 9 Features

### Integration Settings
Click **Integrations** to configure external services:
- **Obsidian** — vault path and auto-sync toggle
- **Pocket** — consumer key and access token for read-later import
- **Readwise** — API token for highlight sync
- **GitHub** — personal access token and repository list

Each integration has an enable/disable toggle and persistent config storage in IndexedDB.

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| 3D Engine | Three.js + @react-three/fiber |
| 3D Helpers | @react-three/drei |
| Post-Processing | @react-three/postprocessing (UnrealBloomPass) |
| Layout Engine | Golden-angle sphere placement (deterministic, no d3) |
| Storage | Dexie.js (IndexedDB v8, 27 stores) |
| Bundler | Vite 6 |
| CSS | Custom properties, gradient layers, CSS keyframe animations (14 phase sets) |
| Testing | Vitest + jsdom (31 tests) |
| PWA | Service Worker + Web App Manifest |
| Font | Inter (Google Fonts) |
| Data Source | Obsidian vault `~/Documents/Second Brains/1.0/` |
| Voice | Web Speech API |
| OG Metadata | Microlink API |
| Server | Node.js (production static) |
| Service Mgr | systemd --user |
| WM Autostart | Hyprland |

## Navigation Hub

Aurora features a polished navigation hub with 7 sections (Dashboard, Second Brain, Agenda, Calendar, Trackers, NExo, Desmond) set against a dynamic gradient background with subtle ambient effects (floating particles, drifting glow orbs) for visual depth:

### NExo Integration
The **NExo** nav item opens a standalone book-summaries app (NExo 1.0) served in an iframe. NExo's theme patterns (card accent bar, shimmer-line, gradient buttons, section headers) have been adapted to Aurora's red/black palette for visual consistency across the hub.

### Dashboard
The landing page shows a time-of-day greeting with animated text glow, today's date, and 7 navigation cards (Second Brain, Daily Agenda, Calendar, Trackers, Quick Capture, NExo, Desmond). Cards have staggered fade-in animations, accent-colored top borders, and glow effects on hover. Live DB stats show today's task count, total notes, and active trackers.

### Left Nav Sidebar
A fixed 56px sidebar with 7 icon buttons (Dashboard, Second Brain, Agenda, Calendar, Trackers, NExo, Desmond). Each uses custom line-art SVG icons. Hover reveals a tooltip label. Active section gets a red accent indicator bar and pulsing glow. The version badge pulses subtly at the bottom.

### Calendar
Monthly grid with smooth hover scaling, pulsing event dots, and today-highlight border glow. Event CRUD with color picker. Chevron navigation uses SVG icons. Events animate in with staggered timing.

### Daily Agenda
Auto-opens once per day with a greeting, task count badge, gradient progress bar with shimmer animation, and staggered task list. Tasks have priority-colored check circles with bounce animation on completion. All-done celebration state with star icon. Form slides down smoothly. "Add Reminder" button has a shimmer sweep effect.

### Trackers
Habit tracker with category-colored left borders, daily check-in circles with scale bounce animation, streak counters, and staggered card entrance. Delete button appears on hover with a trash icon. Empty state shows a target icon. All form elements use CSS classes (zero inline styles).

---

## Data Source

Every markdown file in the Obsidian vault at `~/Documents/Second Brains/1.0/Second Brain version 1.0/` is represented as a 3D node:

- **55 category/index entries** — Maps of Content, subjects, genres
- **19 books** — English Knowledge, Sinhala Novels, Sinhala Poetry
- **90 movies** — 8 genres (Action, Animated, Comedy, Historical, Horror, Psychological Thriller, Racing, Romance)
- **66 TV series** — 4 watch-status categories
- **1 lesson index** — Economics

Each node's link opens the corresponding `.md` file via `file://` URI.
