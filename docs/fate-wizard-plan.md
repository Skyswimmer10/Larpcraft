# FATE wizard implementation

The app uses React, JavaScript, plain CSS, project/library reducers and a local disk API backed by the existing storage module. Frameworks are registered in `seed.js`; Story Wizard and saved-session helpers already handle framework references, scope, and game/library insertion. Vitest and isolated Playwright browser flows provide verification.

## Approach

- Introduce a FATE-specific editor within the existing Story Wizard entry point, using the existing dialog styling and save helpers.
- Share one versioned draft between Simple and Advanced modes. Preserve purpose keys, legacy `phase:F/A/T/E` answers, notes, and saved-session identity.
- Save unfinished drafts separately in the project. Add project preferences for mode, output, custom options and recent choices. Use the existing persistence pipeline rather than browser-only storage.
- Keep suggestions unconfirmed until accepted. Track their upstream context and offer Keep/Update when that context changes. Preserve authored values and locked steps.
- Simple: setup, four pillar screens, review; brief choices, optional notes, contextual reminders, resistance, and editable prose.
- Advanced: build/review mode, linked entities, group board, deeper controls, intensity and consequence ranges, optional curves, completion chart, checks, organizer notes and output variants. Scores describe completion, never measured influence or predicted player response.
- Add keyboard-accessible alternatives to drag controls and keyboard draft undo/redo. No new packages are needed; small diagrams use SVG.

## Files

Data/config in `src/data/fateWizard.js`; pure draft, memory, migration and output helpers in `src/lib/fateWizard.js`; editor and reusable FATE controls in `src/components/FateWizard*.jsx` and CSS; integration through NarrativeWizard, narrativeWizard, and the project reducer.

## Verification

Unit-test migration, suggestions and review flags, locked fields, editable output, old wizard continuation, scope-safe references and persistence. Exercise both UI modes, reload/resume, save to game/library, entity choices, curves, keyboard navigation, output editing and mobile layout against in-memory API data, then run the complete existing suite and build.
