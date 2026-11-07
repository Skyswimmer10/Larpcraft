# Story direction, impact and open threads

## Entry points

Master Story → **Story direction** opens a large planning window. Story Wizard → **Plot structure** opens the same window directly on its plot board. Act contents also provide Story direction. The three tabs are Themes & tone, Plot structure, and Open threads. Everything is optional and belongs to the current game.

## Themes and tone

Themes describe ideas or tensions to explore; tone describes atmosphere or setting flavor. Both have visible prompting tags and custom entries. Values live at `meta.storyPlanning.direction.themes` and `.tones`. Acts inherit each field unless they have an explicit `node.storyDirection` override. An empty array is an intentional blank override; an absent field means inherit. These tags do not automatically change dialogue, mechanics, schedules or written prose.

## Plot structures

The colored card board provides the 12-stage Hero’s Journey and two LARPCraft planning variants: Event arc (6 stages) and Pressure and change (5 stages). Each card displays two targeted questions together, with an optional link to an existing Act or Story Beat. The questions are original LARPCraft prompts, not copied from another application. All stages remain on one scrollable board. A separate live overview reflects answers as they are typed and highlights the active stage. The two shorter variants are adaptations for planning, not claims about canonical Hero’s Journey versions.

`meta.storyPlanning.activeStructure` selects the visible template; `plans[templateId].answers[stageId][questionId]` keeps its answers. Switching templates retains every bank. Stage links hold scoped `{ coll, parentPath, nodeId, title }` references so identical nested IDs remain distinct. Missing links retain their name and can be reassigned. Links do not move or duplicate nodes and stage answers do not overwrite the linked node’s writing. A plot board is a planning view, not an enforced sequence of player actions or a calendar.

`PATCH_STORY_PLANNING` merges individual fields against current state to avoid stale writes when switching cards or structures. Plot typing groups for Undo. Complete-workspace/game saves preserve the planning data through the existing local-file/IndexedDB pipeline. Plot boards are game-level data; they are not automatically published to the Master Library.

## Story Beat review

Story Beats, including saved event/quest nodes, offer a compact **Story impact** button and an **Open threads** disclosure. Impact choices open in their own window; the inspector shows only a selection count. Impacts (`storyBeat.impacts`) are multiple prompting tags plus custom entries. They describe narrative purpose, such as foreshadowing, a character’s motivation, a turning point, or a payoff; they do not change the node kind.

`storyBeat.threads` stores small records with `id`, `kind`, `title`, `status`, `notes`, and `resolution`. One Add thread action and one form handle title, Open / Revealed to players / Resolved status, notes and optional payoff. Older `inconsistency` records retain their kind and content but use this same editor. Threads are authoring records and are not automatically shown to players. Removing a record is undoable through the normal graph actions.

The Open threads tab gathers all threads across Narrative and Master Story, including nested graphs, in one list. Resolved records are hidden unless requested. Changes here edit the original beat. New fields survive Story Beat CSV round-trips and library copies. Existing prose, hidden sections, retired fields, and game links remain intact.
