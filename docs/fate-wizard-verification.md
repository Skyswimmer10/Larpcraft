# Verification: FATE Simple and Advanced

**Story:** A designer opens FATE in Story Wizard, builds or reviews a situation, switches between Simple and Advanced without losing answers, resumes a project draft, and saves editable prose plus the full questionnaire to the game and optionally the library.

## Evidence

| Boundary | Result | Evidence |
| --- | --- | --- |
| UI entry and controls | Passed | Isolated browser flow completed both modes, suggestions, dependency review, locks, undo/redo, linked entities, group board and curve sliders. |
| Client → project persistence | Passed | Browser API interception observed `fateWizardDrafts` and preferences in project POST payloads; closing/reloading restored the last step and choices without creating a canvas node. |
| Local API → disk | Passed | `server/fateDraftPersistence.test.js` wrote a draft and preferences through the actual local API into an isolated temporary project file, then read and migrated them back intact. |
| Saved result → UI | Passed | Game/library outputs matched the edited paragraph; continuation updated the same node without duplicated questions. |
| Legacy and mixed sessions | Passed | Long legacy answers, custom questions and nested content survived; the saved-session picker switched between FATE and an archetype wizard. |
| Other wizard regression | Passed | Existing Meta Programs browser flow passed four steps, prose editing, save/reopen, prior King context, legacy choices and mobile layout. |
| Responsive layout | Passed | Browser checked 390 px and desktop layouts, visible footer actions, and no horizontal content overflow or runtime errors. Desktop/mobile screenshots were inspected. |

## Final checks

- Full Vitest suite: **350 tests passed across 52 files**.
- Production build: **passed**, 149 modules transformed.
- `git diff --check`: **passed**; existing line-ending notices remain.
- Existing large-bundle warning remains; no new packages were added.

The local Vite server is running at `http://127.0.0.1:5173/`. Browser tests used isolated in-memory copies of project/library API state. The disk-persistence test used a guarded, unique temporary directory rather than the user's canonical files.

All generation is deterministic and local. Completion checks describe recorded details, not measured psychological influence. Diagnose mode checks the writer's observations rather than automatically interpreting source text.
