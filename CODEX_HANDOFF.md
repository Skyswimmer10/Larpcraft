# Larpcraft: Astra Conversation Handoff

Prepared 2026-09-15. This is a continuation brief, not a request to implement every historical idea again. Read current code before acting. Earlier chat completion claims sometimes exceeded the actual verification.

## 1. Start Here

- Active repository: `C:\Users\Didzis\Documents\Codex\2026-07-06\github-app-connector-76869538009648d5b282a4bb21c3d157\work\Larpcraft`
- Git remote: `https://github.com/Skyswimmer10/Larpcraft.git`
- Current branch: `agent/expand-larpcraft-node-editor`
- Last inspected commit: `e794a25 Restore deployed active game data`.
- There are substantial UNCOMMITTED changes and untracked source files. Continue in this existing checkout to retain them. A fresh clone or default-branch worktree will omit them.
- Local app URL: `http://127.0.0.1:5173/`. Last launched successfully with Vite, HTTP 200. Recheck availability; process IDs and tool sessions are not durable.
- Hosted URL documented by README: `https://larpcraft-piedzivojuma-gars-projects.vercel.app`. Current deployed state has not been verified in this handoff.
- Do not expose `.env.local` or credentials. Do not reset browser data, replace user data with seeds, revert changes, or redeploy as a side effect of reading this document.

## 2. Product and User Preferences

Larpcraft is a visual, local-first editor for designing live-action adventure games. It combines narrative planning, practical cooperative mechanics, people, props, locations, and reusable design libraries. The user prioritizes human-readable design-time planning and simple composition. Sensors and actuators describe planned gameplay; this is not a deployed runtime IoT control system.

The UI uses a dark workspace with collapsible navigation, a searchable node palette, canvas, and right-side inspector. Maintain current styling and shared behavior across Build and Library. Prefer incremental changes. Do not replace usable workflows with elaborate new abstractions or many extra subnodes. When the user asks for a summary before implementation, provide one and wait for their approval.

The user works primarily by describing UI changes in plain language. Their numbering often refers to book chapters or list positions, not labels to display. Mechanism card names must omit numbering. Preserve user-written text and uploaded images.

## 3. Architecture and Commands

React 18, JavaScript/JSX ES modules, Vite 5, plain CSS, React Context/useReducer, idb-keyval, Vitest. This is not currently a TypeScript/Next.js app. Inspect `package.json` for exact versions.

From the repository directory:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
npm test
npm run build
```

Dependencies are already installed locally. Preserve the same origin (`127.0.0.1`, port 5173) when accessing existing user data. `localhost` and other ports have different browser storage. Check an occupied port before starting another server.

Read `ARCHITECTURE.md`, `README.md`, and `src/mechanics/README.md` as supporting documentation, but some descriptions are older than the code. For example, README's opening 'single global store' description is stale: there are two stores.

### Main Source Map

- `src/state/store.jsx`: separate Library/Project contexts, startup loading and migration, undo history, dispatch routing, autosave.
- `src/state/reducer.js`: state transitions, graph scope operations, selectors, entity resolution.
- `src/state/bridge.js`: copying library templates into game instances.
- `src/state/storage.js`: IndexedDB persistence and localStorage fallback.
- `src/data/seed.js`: schemas, metadata, blank factories, initial data, migrations; currently LIB_REV 37 and SEED_REV 11.
- `src/components/Inspector.jsx`: large shared inspector with node-specific editors and mechanism browser entry points.
- `src/components/GraphEditor.jsx`, `FlowCanvas.jsx`: canvas interactions; inspect which serves the requested view.
- `src/components/NodePalette.jsx`: palette creation UI.
- `src/components/MechanismBrowser.jsx`: shared mechanism catalogue, filters, image editing and saved record editing.
- `src/components/MechanismNodePreview.jsx`: mechanism content rendered on canvas.
- `src/components/ProjectMenu.jsx`: game and complete-workspace file operations.
- `src/components/NarrativeLibraryBrowser.jsx`, `NarrativeLinkSourceModal.jsx`, `LinkingNodePreview.jsx`: narrative library browsing and linked source workflows.
- `src/components/FrameworkPreview.jsx`: framework diagrams.
- `src/views/Library.jsx`, `TasksView.jsx`, `ScenarioFlow.jsx`, `Weaver.jsx`, `StoryDynamics.jsx`: major design views. File names can retain old terminology; inspect routing before equating them with menu labels.
- `src/views/Players.jsx`, `Teams.jsx`, `Locations.jsx`, `ItemDatabase.jsx`, `GameMasterRules.jsx`: management/reference views.
- `src/styles.css`: shared styling, including mechanism grid and image editor.
- `src/lib/`: focused graph helpers for clipboard, placement, geometry, frame scaling/contents/appearance, selection, marker sizing, archetypes, linked nodes, and storage transfer.

## 4. Data Preservation: Critical

Live authored content is primarily BROWSER DATA, not source code. GitHub or a Vercel deployment does not automatically include current browser saves.

- Library key: `larpcraft:library`.
- Active game key: `larpcraft:activeProject`.
- `idb-keyval` uses its default IndexedDB store unless changed in current code. `storage.js` uses localStorage as a fallback and debounces writes by 400 ms.
- Different browser profiles, browser apps, origins, and workspaces can have distinct data. A new tab at the same origin/profile normally shares data; a different profile may not.
- Master library templates persist across games. Active-game instances can be edited independently and have template references. Saving a game alone is not a full library backup.
- File > Save complete workspace / Open complete workspace carries both stores and embedded images. Implementation: `src/lib/workspaceTransfer.js`; format `larpcraft-workspace`, version 1.
- `src/data/deployedLibrary.json` and `deployedProject.json` are captured baseline snapshots bundled with the app, not continuous synchronization.
- `src/lib/bundledLibrary.js` and `bundledProject.js` merge those snapshots at startup. Inspect version markers and conflict behavior before modifying.
- `src/lib/storageOwnership.js` defines master-only collections, routes misplaced writes, recovers misplaced records, and strips master data from project-only saves. Shared item/location/sensor collections intentionally exist in both stores.
- The recovery helper chooses the larger serialized record on a collision; this is a heuristic, not a timestamp-based conflict resolver.
- User previously reported 40+ combined story/structure/character/function concepts locally, including full internal graphs. Hosted versions were missing many concepts and mechanism images. No current full inventory proves that all content has reached Vercel. Do not state that it is synchronized without comparing actual contents and nested graphs.
- Before any future transfer, capture a complete backup, identify the populated browser/workspace, compare records by ID and internal contents, and preserve richer user data. Never infer completeness from titles or seed counts alone.

## 5. Major Workflows and Accepted Behavior

Historical requirements below explain intent; verify implementation before promising a behavior works.

### Narrative and Library

- Narrative Build and Library use corresponding node editors. Library contains reusable concepts, story structures, base nodes, and reference frameworks.
- Concepts are reusable containers, commonly based on PIP decks. Story structures can be larger, customizable compositions. Inserted structures should appear as a single container with the graph one level down.
- Library records can be edited without adding them to the current canvas. Build-created instances may optionally be saved to the library.
- Linking nodes choose existing nodes/concepts/structures. 'Go to source' should open an overlay; 'Insert here' should create an enterable container with full contents. Both actions require the app's yes/no confirmation.
- Reference frameworks are draggable visual aids, kept separate from game logic. Existing examples include FATE, human values, moral conflicts, Jungian adult/child archetypes, Kolb, story-building and story journey frameworks.
- Character archetype toggle has supporting text nodes/dark sides and a separate eight-row combinations card. Preserve author-entered data.

### Master Story and Story Dynamics

- Master Story is a short macro act track separate from detailed narrative and mechanics graphs. Tasks/travel on its timeline must not spontaneously change when mechanics graphs change.
- Timeline supports duration editing, resizing, estimates/margins, and zoom. Master acts have story and intended team-experience descriptions.
- Story Dynamics is an independent X/Y emotional-journey curve with editable handles/tags, not another node canvas.

### Canvas Interaction Intent

- Plain drag on background: box selection. Ctrl+drag: cut relationships with a temporary yellow line.
- Shift+click adds to selection. Selected objects should move/delete/copy/paste together.
- Ctrl+Z should undo graph edits, deletion, relationships, movement, resizing, and story dynamics changes. Ctrl+Delete clears the current graph.
- Wheel pans vertically; Shift+wheel horizontally; Alt+wheel zooms.
- Connections should work between all four sides, including titles. Splines/arrows have editable endpoints; spline endpoints may attach to elements.
- Support elements: frames, circles, numbers, letters, titles, arrows, splines. They are organizational aids.
- Frames have normal resize and red proportional-content resize handles, fill/border/opacity controls, and optional sticky contents, default off.
- Inspector can collapse and resize sideways. Title/description/box size remain readily available; narrative sections normally collapsed, mechanics sections expanded.
- New elements should be placed within the visible canvas. Framework content should scale without distortion.
- These interactions have had repeated regressions. Unit tests alone do not establish correct pointer behavior; verify the affected view interactively.

## 6. Mechanics Catalogue: Current Focus

The most recent development added mechanism categories and fixed browser card layout. Shared browser entry points are in `Inspector.jsx`. The right editor supports images, drag positioning, scale, description, repeatable effects/variations, and Save Changes. Action patterns also have advantages; Resolution has emotional spike.

Current filter order and seeded record counts:

| Filter | Catalogue / Count |
|---|---|
| Token Systems | actionPatternMechanisms, subset of 23 shared Action records |
| Order Systems | actionPatternMechanisms, subset of the same 23 |
| Special Systems | actionPatternMechanisms, subset of the same 23 |
| Resolution | actionProbabilityMechanisms, 26 |
| Victory Condition | victoryConditionMechanisms, 21 |
| Uncertainty | uncertaintyMechanisms, 14 |
| Economy | economyMechanisms, 20 |
| Auctions | auctionMechanisms, 18 |
| Worker Placement | workerPlacementMechanisms, 8 |
| Movement | movementMechanisms, 24 |
| Area Control | areaControlMechanisms, 8 |
| Set Collection | setCollectionMechanisms, 5 |
| Card Mechanisms | cardMechanisms, 9 |

There are 13 filters and 176 seeded records across the catalogues. User edits/custom records may change live totals. Exact names live in `src/data/*Mechanisms.js`, `actionMechanics.js`, `actionProbability.js`, and `victoryConditions.js`. Matching tests assert lists/counts.

Category additions touched catalogue modules, `seed.js` factories/migrations/revision, `MechanismBrowser.jsx` props/filter/record lists, all four Inspector browser calls and save routing, `storageOwnership.js`, and `bundledLibrary.js`.

### Important Outstanding Limitations

1. New categories are browsable/editable but NOT fully insertable as canvas nodes. `MechanismBrowser` enables Use Mechanism only when `draft.kind === allowedKind`. Existing Inspector callers pass only `pattern` or `probability`. No dedicated insertion path for victory/economy/auction/etc. was added. Earlier messages implying all categories had identical Use Mechanism behavior were too broad. If asked to use these on canvas, implement proper record-to-node conversion, rendering, inspector lookup, and preservation of fields/images.
2. Migrations spread seeds into every catalogue on reload. Deleted built-in records can return. Several migration fields use `saved || seeded`, so an intentionally empty description or removed image may also return. Address with field-presence checks or explicit deletion markers when relevant; preserve saved data.
3. Starter descriptions were authored in chat, not verified against the book. They are editable suggestions. The requested Movement title 'Manacla' was kept literally; do not silently rename user data.
4. `mechanismVisual.js` generates SVG placeholders with a single text line, which can clip long names inside the placeholder artwork. This is separate from uploaded image cropping.

## 7. Image/Card Layout Regression History

User uploaded screenshots showing cards overlapping heavily when multiple filters were selected. Several earlier CSS-only attempts were insufficient despite passing all unit tests.

Current CSS uses explicit `240px` columns and `240px` automatic rows, `align-content:start`, 240x240 tiles, a 160px image region, compact details, overflow clipping and `contain:paint`. The right image editor uses aspect-ratio 3/2. Both use contain-fit and the same percentage translation plus scale transform.

Do not reintroduce content-sized grid rows that compress when more filters are checked. Verify mixed filters, long titles, portrait/landscape images, saved crop parity, and narrow viewports. The 240px card has borders, so its inner width is slightly less than 240px; exact 3:2 crop parity has not been visually established. Last fixes were compiled/tested but not successfully browser-verified. Browser automation was blocked by a URL policy during an earlier attempt; respect restrictions and report verification limits honestly.

## 8. Current Working Tree and Verification

As inspected for this handoff, modified tracked files:

- `src/components/Inspector.jsx`
- `src/components/MechanismBrowser.jsx`
- `src/data/seed.js`
- `src/lib/bundledLibrary.js`
- `src/lib/workspaceTransfer.js`
- `src/state/store.jsx`
- `src/styles.css`

Untracked: the nine added catalogue modules and tests (Victory, Economy, Auctions, Worker Placement, Movement, Area Control, Set Collection, Card Mechanisms, Uncertainty), plus `storageOwnership.js` and its test. This document is also newly created. Run git status for the authoritative latest list.

Last full implementation verification: 206 tests passed across 37 files; production build passed with Vite's large-chunk warning. This is historical evidence, not a fresh test run in this documentation turn. No deployment or commit was performed for these latest catalogue changes. Startup was later checked with HTTP 200.

## 9. Recommended First Steps for the New Conversation

1. Work in the existing repository path above. Read this file, then inspect git status, routing, and relevant source.
2. Ask for the user's next requested change if none is provided; do not automatically implement this document's entire limitations list.
3. Keep current browser-origin data intact. For synchronization requests, distinguish code deployment from complete-workspace content transfer.
4. Trace every change through Library and Build, nested graph scopes, inspector, canvas rendering, serialization, migration, and undo where applicable.
5. Use targeted tests and a build. For visual/drag/drop issues, verify real interactions and screenshots where tool access permits. Be explicit if visual verification is unavailable.
6. Summarize actual results concisely. Do not claim deployment, synchronization, or UI verification from a build alone.

## 10. Starter Prompt

Continue Larpcraft using Astra in the existing local checkout:
`C:\Users\Didzis\Documents\Codex\2026-07-06\github-app-connector-76869538009648d5b282a4bb21c3d157\work\Larpcraft`.
Read `CODEX_HANDOFF.md` first, then inspect the current working tree. Preserve all uncommitted code and browser-saved library/game data. This is a React/Vite local-first node editor. The handoff explains the product, architecture, recent mechanism catalogues, storage boundaries, and known gaps. Continue from the current state and follow my next request.
