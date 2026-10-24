# Larpcraft — continuation handoff for a new Codex chat

Prepared **21 October 2026**, Europe/Riga. This is context for continuing an existing project, not a request to redo the history or implement every idea below. Read the current code and the next user request before making changes.

## 1. Start here: use the existing checkout

**Actual repository folder:**

```text
C:\Users\Didzis\Documents\Codex\2026-07-06\github-app-connector-76869538009648d5b282a4bb21c3d157\work\Larpcraft
```

Some chat metadata names `C:\Users\Didzis\Gmy Documents\Larpcraft`; that path has failed as a working directory. Use the actual folder above. Do not start from a fresh clone or another worktree: the latest work is in this checkout as modified and untracked files.

- Git branch: `agent/expand-larpcraft-node-editor`.
- Local HEAD: `e8a84d5440ff4f3ee98a3c5eb55d90df60989303` — `Publish mechanics collections, narrative wizard and latest workspace`.
- A read-only `git ls-remote --heads origin` during handoff showed both remote `main` and `agent/expand-larpcraft-node-editor` at that same commit.
- The newer story-wizard work described below is **not committed or pushed**. The remote commit therefore does not contain all current local source changes.
- Local URL: `http://127.0.0.1:5173/`. Check whether the server is listening; old terminal/tool sessions are not durable. Do not assume an open browser tab means the server is running.
- This handoff task does not authorize committing, pushing, deploying or changing gameplay. The user will give the next instruction in the new chat.

## 2. What Larpcraft is for

Larpcraft is a visual authoring workspace for live-action role-playing games, adventure activities, outdoor/team games and narrative experiences. It combines a game's story with the practical mechanics, people, equipment, locations and organizer instructions needed to run it.

It is an authoring and planning tool. Sensors and actuators describe planned inputs and outputs; the app does not currently run an IoT control engine or automatically adjudicate a live game.

The user wants granular control: build or modify a mechanic from small nodes, inspect what is nested inside a larger activity, and make an activity easier or harder by changing those pieces. A saved board-game mechanism is a ready-made composition; smaller Goal/rule/input/output nodes remain useful for tinkering rather than competing with those saved compositions.

### Major work areas

- **Master Story:** the larger steps/acts and when and where they happen. It summarizes and schedules the game rather than replacing the detailed story creator.
- **Master Act contents:** double-click an act to open a canvas split horizontally. Story is above; mechanics below; slightly different backgrounds distinguish them. Each lane supports deeper nested nodes. The act's timeline remains independent of detailed mechanics edits.
- **Narrative Weaver:** detailed story and character nodes, concepts, structures and reference frameworks.
- **Mechanics Weaver:** practical gameplay and adjustments. Adjustments belong within Game Mechanics, not a separate top-level discipline.
- **Story Dynamics:** a separate emotional-journey graph.
- **Manage:** players, player-type references, teams and related game organization.
- **Library / Master Database:** reusable physical templates, game mechanics, concepts, structures, narrative templates, frameworks and GM rules.

## 3. Online connections and authentication

These are the project connections identified in code/configuration or checked during this handoff. Credentials are deliberately excluded.

| Connection | Address / identity | Purpose and current evidence |
| --- | --- | --- |
| GitHub repository | https://github.com/Skyswimmer10/Larpcraft | `origin` fetch and push URL: `https://github.com/Skyswimmer10/Larpcraft.git`. Read-only remote access succeeded during this handoff. |
| Working branch on GitHub | https://github.com/Skyswimmer10/Larpcraft/tree/agent/expand-larpcraft-node-editor | Existing development branch. Reuse the local working tree to keep uncommitted work. |
| GitHub main branch | https://github.com/Skyswimmer10/Larpcraft/tree/main | Same remote commit as the development branch when checked. Do not infer that local changes have been published. |
| Hosted Vercel app | https://larpcraft-piedzivojuma-gars-projects.vercel.app | Address documented in README. It may require Vercel sign-in. Its current deployed contents were not verified in this handoff. |
| Vercel project link | Project `larpcraft`; project ID `prj_86qIpi6YguYEwTfm9f6t1oI7OJXO`; org/team ID `team_T3nmcs1fLSphOLHIsRoGTmYT` | Verified from `.vercel/project.json`. IDs identify the project; they are not credentials. The URL's team name should not be substituted for a freshly verified CLI scope without checking. |
| Vercel connector | Installed Codex Vercel app/tools | A read-only project query returned **requires reauthentication** during this handoff. A previous chat's successful sign-in does not prove the new chat is authenticated. CLI and connector authentication can differ. |
| OpenStreetMap tiles | `https://tile.openstreetmap.org/{zoom}/{x}/{y}.png` | Used by `src/components/LocationStage.jsx`. Live background map images require network access; markers and arrows can remain usable when tiles fail. |
| Local save API | `http://127.0.0.1:5173/api/local-data/library`, `/project`, `/archive` | Vite development middleware writing local files, not a cloud database. Same-origin loopback access only. |

### Deployment configuration

`vercel.json` declares Vite, `npm run build`, and output directory `dist`. `.vercel/project.json` is a machine-local link and is ignored by Git. No GitHub Actions workflow was found under `.github/workflows` during inspection; do not invent a CI/deployment pipeline.

Neither `vercel` nor `gh` was resolved as a command on the current shell's PATH during handoff. Future publishing may use connected tools or an available CLI, following their skill instructions. Do not automatically install, log in, deploy or reuse expired device codes as part of reading this file.

`.env.local` exists and contains a variable named `VERCEL_OIDC_TOKEN`. Its value was not read into this handoff. It is deployment-related, not an application AI-provider key. Never print, copy into a handoff, commit or assume the validity of that value. Git credentials and Codex connector grants also stay in their own credential stores.

### Other URLs in reference data

These are source/reference links, not application APIs or integrations:

- Feminine archetype reference: https://www.miembrosadepac.org/wp-content/uploads/2015Copia/09/Wolff-Forms-Feminine-Psyche.pdf
- NLP Meta Model reference: https://www.inlpta.org/english/nlp-best-practice-theory/metamodel-of-language/
- NLP Meta Programs reference: https://www.coachcert.com/uploads/pdf/CMC-Reference-Guide-of-Meta-Programs.pdf

The inspected runtime source has no configured OpenAI/other LLM provider, Supabase/Firebase/Neon database, cloud user-account backend, payment service, email or messaging integration. Wizard suggestions and prose formatting are deterministic and local. Do not describe these features as an AI API integration.

User images may be data URLs, files embedded in saved state, or potentially user-supplied URLs. `MechanismPreviewImage.jsx` fetches the supplied image source to create a display preview; that is not a separate fixed image-host service. A URL-host inventory of the current canonical project/library found no strings beginning with HTTP(S).

## 4. Current data ownership: local files versus browser versus GitHub

**This section supersedes the older README/handoff statement that all live data is browser-only.**

There are two separate application stores:

1. **Library:** reusable master templates, independent of the open game.
2. **Active Project:** the current game and detached instances/copies of library content.

Editing a game instance should not silently edit its master template. Explicit save-to-library actions are available when appropriate.

### Local development

`src/state/storage.js` uses `import.meta.env.DEV` to enable local-file mode. `server/localData.js` supplies the Vite save API configured by `vite.config.js`.

Canonical authored files, relative to the actual repository:

```text
.larpcraft/library.json
.larpcraft/project.json
.larpcraft/library.previous.json
.larpcraft/project.previous.json
.larpcraft/browser-backups/
```

- The local API writes serialized state atomically, with revision hashes and conflict detection.
- Local clients, including Brave and the Codex browser, use the same disk files through the local server.
- Browser copies remain recovery data; startup archives an existing browser snapshot before selecting disk data.
- Revision conflicts preserve uncommitted drafts in the archive rather than silently overwriting another client's save. A green local save status matters; reloading is not a substitute for resolving a save error.
- `.larpcraft/` is ignored by Git. A clone, source ZIP, commit or deployment does **not** automatically carry these live authored files.

Inspection snapshot for migration context: active game **Operation Chimera**, prefix **CHM**; **44 concepts** in the canonical library; five master acts; two FATE drafts, one Kolb draft and one Human Values draft. The library file was about 28.5 MB. These are inspection counts, not targets to restore and not a guarantee of a later browser state.

### Deployed/static app

Vercel serves a static build. The development local-data middleware is not a hosted cloud save service. Deployed builds save to the current browser's IndexedDB, with a localStorage fallback.

- Library browser key: `larpcraft:library`.
- Project browser key: `larpcraft:activeProject`.
- `localhost`, `127.0.0.1`, different ports, Brave profiles and the Codex browser can have different browser storage.
- `src/data/deployedLibrary.json` and `deployedProject.json` are bundled release snapshots, not automatic live synchronization.
- `src/lib/bundledLibrary.js` and `bundledProject.js` handle startup merging; inspect their actual conflict behavior before preparing a release.
- **File → Save complete workspace** carries both stores and embedded images. A game-only export does not back up the complete library. See `src/lib/workspaceTransfer.js`.

For another chat on this machine, reuse the actual checkout and `.larpcraft` files. For another machine, preserve source including uncommitted/untracked files, canonical data/previous copies/backups and/or a complete workspace export. Never replace rich authored data with seeds just to get the app running.

## 5. Stack, commands and architecture map

React 18, JavaScript/JSX ES modules, Vite 5, plain CSS, Context/useReducer, `idb-keyval`, Vitest. This is not Next.js or TypeScript. Dependencies are installed in the actual repository.

Run commands from that repository:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
npm test -- --reporter=dot
npm run build
```

Check an existing port listener before starting another server. Use the same origin for continuity. There is no separate configured lint or TypeScript check.

Key code:

- `src/state/store.jsx`: library/project contexts, loading, migration and persistence.
- `src/state/reducer.js`: graph/entity actions, scoped nested operations, wizard draft/preference actions.
- `src/state/bridge.js`: detached library-to-game insertion.
- `src/state/storage.js`, `server/localData.js`: local disk save path and browser recovery storage.
- `src/data/seed.js`: schemas, factories, reference frameworks and migrations; inspected `LIB_REV = 38`, `SEED_REV = 11`.
- `src/components/FlowCanvas.jsx`, `GraphEditor.jsx`: canvas and scoped editor.
- `src/components/Inspector.jsx`: node-type-specific right panel; large and resizable/collapsible by user preference.
- `src/views/MasterAct.jsx`, `src/lib/masterAct.js`: two-lane act contents, represented by ordinary nested scoped nodes.
- `src/components/MechanicsToolbox.jsx`, `src/mechanics/`: mechanics work areas, category visibility and quick-add behavior.
- `src/components/MechanismBrowser.jsx`, `MechanismPreviewImage.jsx`: catalogue browsing/editing and queued/lazy image previews.
- `src/components/FrameworkPreview.jsx`, `FrameworkDetail.jsx`: framework diagrams and inspector details.
- `src/components/NarrativeWizard.jsx`: Story Wizard source/purpose entry, saved sessions and routing to specialized editors.
- `src/lib/narrativeWizard.js`: result creation, editable question graphs/cards, attachment, revision and library copying.
- `src/lib/narrativeMemory.js`: reads saved answers and inspector edits, supports multiple wizard sessions on the same node.
- `src/lib/narrativeLinks.js`: links to existing narrative work.
- `src/styles.css` plus component CSS: established visual language; preserve it.

Older `README.md`, `ARCHITECTURE.md` and `CODEX_HANDOFF.md` contain useful history but some stale claims: browser-only saving, an extra `larpcraft/` subdirectory, older test counts, old catalogue limits and obsolete UI labels. This dated handoff and inspected code take precedence for current status.

## 6. Mechanics and interface decisions to preserve

- BG Action was renamed **BG Mechanics**. Complete board-game mechanics and saved mechanic trees are compositions, separate from the granular building blocks used to create a new mechanic.
- The mechanics toolbox uses Build / Adjust / Equip / Prepare, category visibility/pinning, search/quick add and a guided start. Complete saved mechanisms use their own browser rather than becoming a fifth work-area tab.
- The shared full-screen mechanism browser integrates board-game records and saved work, categories and per-source favorites. The user meant **four to five columns**, not rows, with recognizable images.
- Do not reintroduce a long default palette listing every saved item/template. Do not automatically insert starter Goal/Mechanic nodes; the user wants to add them manually.
- Sensor is hidden as a top-level add choice, not deleted. Add input (Sensor) / output (Actuator) on an existing mechanic; small canvas representation. Intended order: goal → analog rule → optional I/O.
- Trigger/input requirements are one design question. Output behavior should be one prose field rather than separate intensity/rhythm/sequence controls. Fallback belongs in an attached note rather than repeated Sensor/Actuator fields.
- Site time belongs in Master Story, not Narrative/Mechanics viewers. Keep specific field layouts by node type rather than forcing every node through a uniform questionnaire.
- Nodes should keep their size on hover and use readable pop-ups. The user likes a large inspector that can collapse/resize, without padded controls wasting vertical space.
- Sidebar icons should remain simple and distinguishable by color. Mechanics uses a wrench; the master mechanics library uses multiple wrenches.

These are accepted product decisions, not an instruction to redo them during migration. Verify current implementation when a related change is requested.

## 7. Recent story-wizard work — implemented locally

### Shared foundations and generic wizards

- Purpose-aware questions distinguish character, communication, relationships, values, scene, story, learning and style uses.
- Framework sources can show/hide Best fit, Also useful and Another use groupings.
- Concept wizards adapt roles/entities while keeping the structure of a concept rather than requiring its original literal story.
- Saved answers, archetypes, earlier context, inspector edits and several wizard sessions on a node remain available on continuation.
- Results should read as story/character prose, with detailed questions retained separately. Do not put the entire technical questionnaire back into a character's visible description.
- Shared helpers: `src/lib/storyWizardCore.js`, `src/components/StoryWizardControls.jsx`, `useStoryWizardDraft.js`.
- Shared behavior includes separate unfinished project drafts, 500 ms autosave, undo/redo, locks, explicit accepted suggestions and changed-context review flags.

### NLP Meta Programs

Four-window preference workshop with sliders/choices used only where useful, saved answers/context and editable prose. Relevant files: `MetaProgramsWizard.jsx/.css`, `data/metaProgramWizard.js`, `lib/metaProgramNarrative.js` and tests. It is a writing tool; do not present preferences as a diagnosis.

Some older saved technical/Q&A nodes may still show their older body until explicitly continued/reviewed/saved. There was no mass rewrite of canonical user data.

### FATE — latest user-reviewed changes

Entry: **Story wizard → FATE**. The last coding request was to implement the suggestions from two rounds of user review. It has been completed and verified locally.

Two distinct starting cards:

1. **Character profile:** recurring attention/overlooked details, trusted authority sources, actual groups and conflicting loyalties, recurring feelings and multiple emotional patterns. Each pattern records situation → mixed feelings → usual response → exception. Output is editable character prose.
2. **Communication / dialogue:** explicit speaker, listener, relationship and intended outcome. Optional entity links and saved FATE character profiles provide listener background and relevant follow-up guidance. Output uses authored spoken lines, with a possible listener reply; planning descriptions are retained separately in design notes.

Details that matter:

- Character and Communication keep independent answers/titles/context/output in `purposeBanks` when switching an unfinished draft. Simple and Advanced share the current purpose's data.
- A saved version keeps its type to avoid silently converting an existing node; copy it as a new draft for another type.
- Selected hooks/channels/authority/belonging ideas reveal optional concrete detail fields. For example: what the gain is, what secret gives credibility, what the spoken words are, where the pause occurs, which group or status is involved.
- Authority allows multiple sources. Older single source/secondary source data is normalized without dropping it.
- Writing a main description no longer replaces selected ideas in context. Compact selected-idea chips remain visible. Deselecting an option keeps its detail for reuse but excludes it from current output.
- Communication's explicit spoken lines are kept separate from descriptions. A spoken-word channel detail can supply the opening; an explicit opening line takes priority. No LLM fabricates dialogue from the context.
- Imported listener-profile background is a saved snapshot. Changed or deleted source profiles do not silently alter it. Refresh and unlink are explicit; no compliance or fixed emotional response is assumed.
- Not all four categories must be filled. Character mode does not infer an automatic toward/away reaction from a threat/reward selection.
- A separate conversation becomes a node on the current canvas; selecting an act is optional.
- Manual output edits remain overrides. Use Review → Rebuild from answers to regenerate them intentionally. A communication without spoken text or another selected output stays an unfinished draft until it has text to save.

Core files: `components/FateWizard.jsx`, `FateWizardControls.jsx`, `FatePurposeControls.jsx`, `FateWizard.css`, `FatePurposes.css`; `data/fateWizard.js`, `data/fatePurposes.js`; `lib/fateWizard.js`, `lib/fateWizard.test.js`, `lib/fatePurposes.test.js`.

Project roots: `fateWizardDrafts`, `fateWizardPreferences`. Saved records contain `fateDraft`. Schema version remains 1 with normalization/revision additions; do not reject current drafts merely because new optional fields were added.

### Kolb

Simple: Experience → Reflection → Understanding → Test → What changed? Advanced adds evidence links, learners, optional habits, roles, pacing, alternative results, selective FATE imports and review mode. Up to four cycles; selectable entry point.

Possible outcomes remain conditional until explicitly recorded. Copying a possible result into another cycle does not make it an observed fact. A FATE threat is not automatically a Kolb failure. Before-belief → new understanding → different behavior summaries and editable prose are available.

Files: `components/KolbWizard*`, `data/kolbWizard.js`, `lib/kolbWizard.js` and tests. Project roots: `kolbWizardDrafts`, `kolbWizardPreferences`; saved record `kolbDraft`.

### Human Values

Simple: Situation → What matters → What changes → Your story. Choose up to three focus values, with others kept for later. Explain **what matters to whom, and why now**. Named states can be contextual rather than a numeric good/bad scale.

Advanced adds differing true/perceived viewpoints, implications, reveal timing, optional choices, alternate endings, scene/master-act arcs, optional writer estimates and review mode. No formula claims to measure emotion; no summed best choice, mandatory victim or mandatory dilemma. Protection, celebration, rescue and relief are valid.

Saved FATE/Kolb descriptions are imported only by explicit choice; no automatic inference of failure, skill or an ending. Legacy pole selections remain notes rather than being reinterpreted as chosen outcomes.

Files: `components/HumanValuesWizard*`, `HumanValuesControls.jsx`, `data/humanValuesWizard.js`, `lib/humanValuesWizard.js` and tests. Project roots: `valuesWizardDrafts`, `valuesWizardPreferences`, `humanValuesLibrary`; saved record `valuesDraft`.

## 8. Verification and artifacts

Latest complete checks after the FATE purpose rework:

- **407 tests passed across 57 files.**
- **Production build passed**, 165 modules transformed. An existing large-bundle warning remains; no new packages were added.
- `git diff --check` passed, with existing line-ending notices.
- New isolated FATE browser flow passed the exact gaining/spoken words/silence/secret/evidence example, independent purpose answers, profile guidance, actual dialogue, game/library save, saved revision, old content, custom groups, locks/history, mobile and keyboard behavior. No runtime errors.
- API/disk tests cover FATE, Kolb and Human Values using real local middleware and guarded temporary files.

Useful docs:

- `docs/fate-wizard.md`
- `docs/fate-purpose-rework-plan.md` and `fate-purpose-rework-verification.md`
- `docs/kolb-wizard.md` and `kolb-wizard-verification.md`
- `docs/human-values-wizard.md` and `human-values-wizard-verification.md`
- `docs/NARRATIVE_WIZARD_GUIDE.md`

Browser evidence/scripts are in ignored `.larpcraft/`:

- `fate-purposes.browser.mjs` — use this for the current FATE UI.
- `kolb-wizard.browser.mjs`, `values-wizard.browser.mjs`.
- Screenshots include `fate-purpose-communication.png`, `fate-purpose-character.png`, `fate-purpose-mobile.png`.
- Older `fate-wizard.browser.mjs` predates the purpose split and expects some controls in their old positions/types; it is historical evidence, not the current acceptance flow.

Those scripts use Playwright from the bundled Codex runtime and Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`. Paths may need adjustment in another environment. They intercept `/api/local-data/**` into in-memory copies: **do not test by overwriting canonical authored files**.

A prior PDF exists at `output/pdf/larpcraft-story-wizard-framework-questions.pdf`. It predates the latest specialized wizards and FATE rework; it is not a current specification. Prior raster mockups under `C:/Users/Didzis/.codex/visualizations/2026/09/15/01a0a283-bd82-7500-8221-ae77efbb62be` are design references, not a live app or an online backend.

## 9. How to work with this user

- Use plain, high-school-level language in the product and explanations.
- When the user says **review only / do not change**, inspect and give feedback; wait for implementation authorization.
- When they approve implementation, finish it rather than asking permission repeatedly for routine reversible choices.
- Keep UI intuitive without flattening all node types into identical fields or removing advanced editing.
- Preserve authored wording, images, nested graphs, unrelated questions, saved sessions, library/game separation and manual output overrides.
- Treat reference models as writing lenses, not measurements of psychology or guaranteed persuasion.
- Keep new suggestions optional and explain what recorded context supports them. Never silently manufacture a selected archetype, outcome or observed response.
- Push/deploy when requested, with current data and deployment verification. Do not claim local, GitHub and Vercel are synchronized just because a build passed.
- No unfinished implementation is awaiting completion at this handoff. The next step is whatever review or feature the user requests in the new chat.

## 10. Suggested first actions in the new chat

1. Read this file, inspect `git status`, and confirm the actual checkout.
2. Reuse all existing modified/untracked source and `.larpcraft` authored data.
3. If asked to run locally, check port 5173 and start Vite if needed; keep the same origin.
4. If asked to publish, read current Vercel/GitHub tooling instructions, verify authentication and the linked project, preserve live data, and assess what needs to be included before committing/pushing/deploying.
5. Follow the user's next request. Do not reimplement completed features or automatically publish this handoff.
