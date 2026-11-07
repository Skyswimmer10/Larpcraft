# Single-character archetype workshops

Story Wizard opens Artist, Warrior, Ruler, Rebel, Magician, Lover, Jester,
Innocent, Explorer, Companion, Caregiver and Sage directly in Character Canvas.
The reference is the user-supplied Pip Decks Storyteller Tactics archetype PDF
(2023), pages 1–24. Descriptions are paraphrased; starter answers and practical
scene questions are LARPCraft writing adaptations.

Character Canvas puts purpose, behaviour, gift, voice, a specific pressure and
both shadow possibilities in one scrollable view. Each field explains its role
in this particular archetype and provides editable starter choices. Choices are
optional; unselected suggestions never become authored facts. Character name,
optional context and an optional existing-character destination are available
above the canvas. The unrelated purpose picker and dragon/castle substitution
screen are bypassed for these single-character workshops.

Archetype Mixer is a separate tab, present only when a reference supplies blend
information. It shows the source's ordered pair and combination name, explains
what the second archetype contributes, and offers starting influences and space
for the author's own interpretation. Artist + Ruler means Trendsetter, while
Ruler + Artist means Patron; pairs are never silently reversed or inferred.
The selection and explanatory writing are separate saved values. A blend does
not add a new node. A character can keep only the primary archetype.

Both tabs share one answer bank and live description. An author can edit the
description independently; subsequent answer edits retain that wording until
the author explicitly rebuilds it. Saving can create a game character, add a
contribution to an existing character, or also make a reusable library copy.

Reference definitions live in `src/data/storyArchetypes.js`. Question enrichment
and summary generation live in `src/lib/archetypeConcept.js`; the dedicated UI
is `src/components/ArchetypeWorkshop.jsx`. Existing question keys, nested node
bindings and custom questions are retained. Source library graphs and existing
authored answers are not batch-rewritten. Older saved single-character wizard
contributions reopen in the canvas with the improved reference guidance.
Hero & Guide and the multi-character/story-structure concepts keep their
existing flows; no duplicates are removed by this change.
