# Human Values story workshop

Open **Story wizard → Human Values**. The Simple and Advanced switches reveal different amounts of detail in the same draft.

## Simple

1. **Situation:** name the version and describe what happens or could happen.
2. **What matters:** choose up to three values to focus on. Other values can be kept for later without losing their answers.
3. **What changes:** describe who cares and why, then choose the starting state and a possible ending. Protection, restoration and celebration are valid even when the starting and ending states match.
4. **Your story:** edit the generated paragraph and save it to the game, or to both the game and library.

The result is story prose. The questions and choices are saved separately for continued editing. Your edited paragraph stays unchanged until you explicitly rebuild it from the answers.

## Advanced

Advanced adds different viewpoints, optional importance/intensity estimates, alternate endings, consequences, information timing, optional choices and an arc across scenes or master acts. True circumstances and a person's beliefs have separate fields. Option consequences are written descriptions; there is no summed best-choice score.

FATE and Kolb imports use only the description you explicitly choose. They do not infer a value, emotional label or ending. If the saved source changes, the imported text stays and is flagged for review.

Review mode shows a linked description and checks the stakes you record; it does not automatically analyse the source. Intended intensity and observed playtest response stay separate.

## Saving, context and earlier work

The context rail retains earlier answers. Unfinished drafts and preferences follow the existing project save pipeline, which saves to local files when running the local app. Autosaving a draft does not insert a canvas node. Close and reopen to resume the last step. Undo/redo and step locks are available; Ctrl/Cmd+Enter advances and Ctrl/Cmd+Z undoes an edit.

Continue saved wizard updates the same version. Starting from saved work creates a separate copy. Game/library saves use the existing scope-aware insertion and revision logic and preserve unrelated questions and nested content.

Older Human Values answers remain as original notes. Their positive/negative selections are not assumed to describe the story's ending. If more than three older values contain answers, the remainder are kept for later.

## Custom values and maintenance

Add a custom value with a name and two to five distinct state names. It is saved in this project's value library for new drafts. State-name changes inside an existing story affect that draft only; earlier state text remains available.

Built-in values, purpose wording, labels, options and suggested values live in `src/data/humanValuesWizard.js`. Pure draft, migration, review and prose helpers live in `src/lib/humanValuesWizard.js`. The UI reuses the existing shared draft history and wizard controls/CSS. No new dependency or external AI service is required.
