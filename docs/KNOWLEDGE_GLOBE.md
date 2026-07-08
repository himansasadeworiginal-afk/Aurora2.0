# The Knowledge Graph — build spec

This document fully describes the 3D knowledge graph that renders inside the
**Brain** view (`src/components/Scene3D.jsx` + `src/components/globe/*`), and how
to rebuild it. It is modeled on a reference clip (`../example.mp4`, a
screen-recording of a 3D Obsidian-style graph) translated into Aurora's
**red / black** identity.

> Note: the `globe/` folder name is historical. The layout is **not** a sphere —
> it is a **force-directed cluster graph** (see §1). An earlier "knowledge globe"
> (sphere shell + equator rings) was discarded because every link arced across
> the surface and crossed everything, which read as messy.

---

## 1. What the reference shows (first ~5 seconds)

- **0.0–1.2s** — a loading/splash frame. No graph yet.
- **~1.3s** — the scene fades in: a 3D **force-directed graph** floating on
  near-black, gently auto-rotating.
- **1.3–5.0s** — slow orbit. Details up close:
  1. **Force-directed clusters.** Connected notes pull together; unrelated ones
     push apart. The result is several **separated clusters**, each with a
     highly-connected **hub** at its center surrounded by its satellites — NOT a
     uniform sphere.
  2. **Nodes are translucent "frosted glass" orbs** — see-through bodies with a
     **brighter rim** (fresnel), sizes varying a lot (big hubs, small leaves),
     mostly lavender/purple with red accents.
  3. **Starburst hubs.** A hub shows all its edges as a dense spray of short,
     **straight** radiating lines with tiny dots at the tips.
  4. **Thin straight links** connect everything into a web, much dimmer than the
     orbs (the orbs dominate).
  5. **Heavy bloom**, deep black background, slow rotation.
  6. Selecting a node re-centers it and blasts its connections out as bright rays.

### Translation to Aurora's theme
Keep the graph **colorful** (PARA category palette) but push the background to
deep red-black (`#070101`) and keep red `work` nodes first-class. No blue UI.

---

## 2. Architecture

`Scene3D.jsx` orchestrates everything under one `<Canvas>` (Bloom + Vignette).
Its prop contract is frozen so `BrainView` never changes:
`{ selected, onSelect, onNodeHover, paraFilter, onToggleParaFilter }`.

| Piece | File | Draw calls | Role |
|---|---|---|---|
| Layout | `globe/useGlobeLayout.js` | — | force-directed 3D positions + per-node meta |
| Nodes | `globe/GlobeNodes.jsx` | 3 instanced | frosted-glass orbs (core + body + halo) |
| Links | `globe/GlobeLinks.jsx` | 1 + 1 | straight gradient link-web + selection firework |
| Hub | `globe/GlobeCore.jsx` | few | the glowing central structure everything radiates from |
| Atmosphere | `globe/GlobeField.jsx` | 1 | faint red star-field with color accents |
| Orb shader | `globe/orbMaterial.js` | — | the fresnel glass material used by the orb body |

Everything is **instanced or batched** so the draw-call count stays constant as
the graph grows; only the one hovered/selected node animates per frame; `dpr`
is capped at `1.75` with MSAA off on the composer.

---

## 3. Build instructions, file by file

### 3.1 Layout — `useGlobeLayout.js` (the important change)
A deterministic **Fruchterman–Reingold** force simulation, run once in `useMemo`:
1. Seed initial positions in a small ball with a fixed PRNG (`mulberry32`) so the
   layout is reproducible.
2. Build unique undirected **edges** from the parent tree (`parentId`) +
   cross-links (`links[]`). Add a virtual **CORE** node pinned at the origin and
   link every top-level idea (no parent) to it, so the whole graph radiates out
   from one central hub (rendered by `GlobeCore.jsx`); `GlobeLinks` draws those
   root→core spokes to white.
3. Iterate (~280×):
   - **Repulsion** between every pair: `k²/dist` (k = ideal edge length ≈ 8.5).
   - **Attraction** along edges: `dist²/k`.
   - **Gravity** toward center (`-0.06 · pos`) so global repulsion can't blow the
     graph apart.
   - Apply, capped by a cooling **temperature**.
4. Recenter on the centroid; compute the **92nd→74th-percentile radius** of all
   nodes and **normalize** the whole layout to a fixed `TARGET_RADIUS = 22`. This
   decouples the unpredictable force-sim scale from rendering: the cloud always
   fills a known size, so orb radii stay proportionate and the camera framing is
   stable regardless of node count. (Lower percentile = tighter frame.)
- `nodeRadius(connections)` eases with `pow(f, 0.6)` over `0.28`–`1.4` so hubs
  swell and leaves stay small. `getConnectionCount` counts parent + children +
  in/out links.
- Returns `{ positions, meta, regions, radius: TARGET_RADIUS, count }`.

### 3.2 Frosted-glass orbs — `orbMaterial.js` + `GlobeNodes.jsx`
Unchanged from the glass-orb work: a `MeshBasicMaterial` + `onBeforeCompile`
fresnel injection (`alpha = mix(centerAlpha, rimAlpha, fres)`,
`rgb *= 0.55 + fres·rimBoost`; defaults `rimPower 1.9, centerAlpha 0.32,
rimAlpha 0.85`) gives a visible translucent body with a bright rim. Three
instanced layers: hot **core** (`r·0.6`, white-tinted), **body** (`r`, the glass
material, clickable), **halo** (`r·1.5`, additive `0.16`). Only the active node
renders `<ActiveNode>` (pulsing core + two rings + `<Text>` label).

### 3.3 Links + firework — `GlobeLinks.jsx`
- One batched `LineSegments` of **straight** segments (no arcs — straight lines
  keep the clusters legible). Per-vertex gradient from source-category color to
  target-category color (cross-links blend toward `CROSSLINK_COLOR`). One
  `useFrame` pulses opacity around `~0.22` (kept dim so orbs win).
- `SelectedLinks`: when `selected` is set, a second small `LineSegments` of
  straight white-hot rays from the node to every neighbor, pulsing — the
  firework. One extra draw call, only while selected.

### 3.4 Atmosphere — `GlobeField.jsx`
~1600-point faint red star-field (golden-spiral, rotating as one object) with
periodic violet/azure/amber accent stars.

### 3.5 Orchestration & grade — `Scene3D.jsx`
- `BG '#070101'`; clear color + `Fog(BG, r·1.5, r·5)`.
- Camera `position [0, r·0.15, r·1.7], fov 45`; `dpr [1, 1.75]`.
- `onPointerMissed={() => onSelect(null)}` — click empty space to deselect (there
  is no globe core to click anymore).
- A single cool rim `pointLight` from above (node materials are unlit
  `meshBasicMaterial`, so this only tints any lit extras).
- `EffectComposer multisampling={0}` → `Bloom(threshold 0.2, intensity 1.0,
  mipmapBlur)` + `Vignette(offset 0.2, darkness 0.9)`. Bloom is kept moderate so
  distinct orbs don't merge into blobs.
- `OrbitControls makeDefault`, `autoRotate={!selected}`, damped. `<Rig>` lerps
  the orbit target onto the selected node (focus-on-select).
- Subtle PARA region labels (`Billboard` + small dim `Text`) above each cluster
  centroid toggle the PARA filter.

---

## 4. How it's wired
`BrainView.jsx` renders `<Scene3D … />` with the five props (unchanged).
`Scene3D` passes `selected` to `GlobeLinks` (firework) and the selected position
to `<Rig>` (focus); `GlobeNodes` raises `onSelect`/`onHover`. `src/data/ideas.js`
is the single source of nodes/edges; nothing here writes to it.

---

## 5. Verify / iterate (real GPU required)
Headless/SwiftShader Chromium **cannot** paint an R3F scene — use the real GPU:
```bash
npm run build && node server.js                       # http://127.0.0.1:8080
chromium --no-sandbox --new-window --app="http://127.0.0.1:8080/#brain" \
  --user-data-dir="$(mktemp -d)" --window-size=1600,1000 &
# float + crop to the window, then: grim -g "<x,y wxh>" shot.png
```
Check: a **force-directed cluster graph** that fills the frame (not a sphere);
translucent glass orbs with bright rims; starburst hubs; **straight** dim links;
selecting a node fires the white ray-burst; click empty space deselects.

Tuning levers if it looks off:
- **too sparse / small in frame** → lower the framing percentile, pull camera in
  (`r·1.7`), or raise gravity.
- **orbs merge into blobs** → shrink `MIN/MAX_RADIUS`, raise Bloom threshold.
- **clusters fly apart** → raise gravity (`-0.06`) or lower `k`.

Rebuild + reinstall the desktop app:
```bash
npm run electron:build
cp "release/Aurora 5.0-5.0.0.AppImage" ~/Applications/Aurora-5.0.AppImage
```
> `public/sw.js` is **network-first for HTML**, so a fresh build is always picked
> up — no stale-cache trap.
