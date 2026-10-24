# Verification: Human Values Simple and Advanced

**Story:** A designer opens Human Values in Story Wizard, records selected stakes and their human meaning, resumes that project draft and saves an editable story result to the game and optionally the library.

| Boundary | Evidence |
| --- | --- |
| UI entry and response | Isolated browser flow passed the four-step Simple path, named state tracks, paragraph editing and game/library save. |
| Advanced details | Browser passed viewpoints, optional writer estimates, consequences, choice effects, review flags, reveals, selective FATE import, custom value creation and scene arcs. |
| Draft data | Closing and reloading resumed the last stage and reveal text. Switching modes retained all Advanced answers and edited prose. |
| Client to API | Browser intercepted project POST payloads containing drafts, custom values and preferences. Autosave did not create a canvas node. |
| API to disk and back | `server/valuesDraftPersistence.test.js` passed an actual HTTP/file round-trip and startup migration in a guarded temporary directory. |
| Saved result | Edited prose matched game and library records. Continuing updated the same node. |
| Legacy content | Long original answers, unrelated character questions and nested notes survived conversion and saving. A legacy negative pole did not become a chosen ending. |
| Accessibility and responsive behavior | Native keyboard controls, Ctrl+Enter, undo/redo, locks, 390 px layout and visible footer actions passed. Desktop and mobile screenshots were inspected. No runtime errors. |

## Final checks

- Full Vitest suite: **394 tests passed across 56 files**.
- Production build: **passed**, 162 modules transformed.
- `git diff --check`: **passed**, with existing line-ending notices.
- Existing Kolb Simple/Advanced browser flows passed again, including legacy content, saved output, phone layout and keyboard actions.
- The existing large-bundle warning remains. No new dependencies.

Browser tests used in-memory copies of the project/library API data and did not write canonical files. Local persistence tests used guarded unique temporary directories. Prose generation is local and deterministic; ratings and checks are planning aids, not measurements of emotion or automatic interpretation of story text.
