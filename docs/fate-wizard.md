# FATE Story Wizard

Open **Story wizard → FATE** from the Narrative canvas or a framework reference. **Simple** and **Advanced** are views of one draft; switching views retains every answer. Setup, Focus, Authority, Tribe, Emotion and Review remain accessible from the top strip on desktop and mobile.

## Character profile and Communication / dialogue

Setup offers two main starting cards. Character records recurring attention, trust, belonging and emotional patterns. Communication records a particular speaker, listener, relationship and intended outcome. Other existing purposes remain under **Other uses**.

Each purpose keeps its own title, context, selected ideas, detail text and edited result. Switching an unfinished draft restores that purpose's answers. Simple and Advanced share the answers within the current purpose. A saved version keeps its type; copy it as a new draft before developing a different type.

### Specific details for selected ideas

Selected attention hooks, channels, authority sources and belonging choices reveal optional detail fields. For example, **Something worth gaining** asks what the listener could gain, **A secret** asks which secret gives the message weight, and **Silence** asks where the pause happens. Authority permits several sources at once. Unchecking an option retains its detail for later but leaves it out of current context and output.

Your main written description adds to these choices rather than replacing them. Selected ideas stay visible beside the preview. Names, concrete groups, relationships, resources and status can be written in the corresponding detail fields; custom category options remain available.

### Character

Character mode asks about repeated attention and overlooked details, trusted sources, actual groups and conflicting loyalties. Emotion supports several recurring feelings and several patterns: situation → mixture of feelings → usual response → exception. It does not infer a fixed emotional response from a threat or reward choice. The result is an editable character paragraph.

### Communication

Enter speaker/listener names directly or optionally link existing game entities. Context supplies background; it does not automatically identify speakers or interpret the situation. Each step includes optional **Words to say for this part**, and Emotion includes a possible listener reply. The spoken-words attention detail can supply the opening; an explicit opening line takes priority if both are written.

The main result is spoken dialogue assembled from those authored lines, with speaker labels. Descriptions, selected ideas and pause instructions stay in the conversation design notes rather than being presented as spoken words. You can edit the whole dialogue on Review. A conversation with no dialogue or selected alternative output is kept as a draft until there is text to save.

**Use an existing character profile** explicitly selects saved FATE character work as listener background. Each step shows the relevant recorded preferences and a follow-up writing question. It does not overwrite the conversation's choices or predict compliance. Changed or removed source profiles leave the saved background intact; updating or unlinking is explicit.

**Create a separate conversation** saves a new node on the current canvas. Choosing an act is optional; selecting an existing destination attaches the work to that item.

## Simple

Describe the situation and purpose, then develop attention, credibility, belonging and feeling. Brief choices support each description. Threat and reward can coexist, as can actual and perceived authority. No character traits or numeric intensity values are silently selected. Communication asks about possible resistance and response; Character instead emphasises recurring feelings and their patterns. Parts that do not help can be left empty.

Earlier descriptions appear in the context rail and the carried-forward banner. **Show all context** reveals complete answers and notes, including on narrow screens. Existing work on a selected character or scene remains available as background.

## Advanced

Advanced adds links to existing project entities, intended outcomes, intensity, order of emphasis, attention and authority details, group consequences, a group-position board, learned patterns, secondary feelings and optional curves. The board supports drag and drop plus a move selector. Curves support dragging and individual keyboard-operated point sliders. Options such as authority over time appear only for a matching story purpose.

**Review an existing situation** displays the selected source description alongside the writer's observations and produces a gap report from the recorded details. It does not automatically interpret the selected text. The four-axis diagram and progress strips show completion, not psychological strength, story quality or predicted player behaviour.

## Suggestions, changes and history

Suggestions explain their earlier source and apply only when accepted. Authored selections are preserved; multiple accepted trigger suggestions combine. A later change to a dependency marks the related answer for review. **Keep my answer** accepts the current wording; an available updated suggestion can be applied explicitly. Written pillar descriptions also track the earlier descriptions they depend on.

Locking a step disables its controls and excludes its fields from suggestions. Undo/redo retains up to 75 draft snapshots, grouping continuous typing into a single edit. Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z operate on this history; Ctrl/Cmd+Enter moves forward.

## Drafts, output and saving

Unfinished work is kept in the project as `fateWizardDrafts`, using the normal local API/storage pipeline. It does not become a canvas node until **Save to game** or **Save to library + game** is used. Autosave updates the project after 500 ms; the application's storage status indicates when the disk write has completed. Closing keeps the current draft. Reopening resumes its last step. Other unfinished drafts and copies of previous FATE work can be selected in Setup. Editing separate copies of a library template uses independent draft IDs.

Character results default to editable prose. Advanced provides story paragraphs, scene beats, speech outlines, player briefings, organizer notes and group profiles, plus tone and length settings. Player briefings omit hidden resistance and designer notes. An edited output remains intact when answers change; **Rebuild from answers** explicitly replaces that wording after confirmation.

Legacy FATE answers populate the corresponding pillar descriptions without truncation. Original text is retained in notes; choices are not invented from it. Continuing and saving replaces that wizard's previous summary while retaining custom questions, unrelated saved sessions, graph layout and nested content. The saved-wizard picker remains available when a node has several questionnaires.

Preferences in `fateWizardPreferences` retain the last purpose, mode depth, output format, custom vocabulary and recent choices. Setup can clear these without clearing drafts or finished nodes.

## Editing and extension

- `src/data/fateWizard.js`: purpose wording, control schema, labels, choices, output options and check messages.
- `src/data/fatePurposes.js`: starting types, purpose-specific controls, concrete follow-up questions and explanatory text.
- `src/components/FatePurposeControls.jsx`: starting cards, selected-option details, emotional patterns, listener guidance and selected-idea display.
- `src/lib/fateWizard.js`: versioned draft, context resolver, migration, suggestions and dependencies, output formatting, completion checks, references and vocabulary helpers.
- `src/components/FateWizardControls.jsx`: accessible choice, range, curve and group-board controls; SVG completion diagram.
- `src/components/FateWizard.jsx`: editor, draft history, debounced project persistence, session selection, linked entities and game/library insertion.
- `src/components/FateWizard.css`: scoped styling and responsive layouts.

Add a field to its pillar schema. Mark `simple: true` only for a core choice. Fields are initialized without selected values; any new initial state must remain compatible with older drafts. Add suggestion rules with explicit dependencies, and add checks as optional writing questions. The template resolver supports dot paths, list values, entity names and fallback tokens such as `{focus.anchor|the thing worth noticing}`. Truncation affects the banner only, never the stored answer.
