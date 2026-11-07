# Character relationships

Relationships belong to the current game in `project.relationships`. They are not automatically saved to the Master Library.

## Create and develop

In a character's **Relationships and loyalties**, choose **Add relationship**. The picker shows directional words grouped into Family, Connections, Origins and Influence, plus custom forward/reverse wording. Select an existing game entity (including characters inside nested concepts), keep a name only, or create a character beside the source. Creating and connecting is one undoable action.

The relationship word opens a shared detail window. The linked character name opens that character for editing. Details contain both directional labels, an editable relationship description, and options to link or create a profile later. For example, John **Father of** Carl and Carl **Son of** John are two views of one record, with one description.

The Narrative toolbar's **Relationships** button opens a game-wide connection canvas, including connections across nested graphs. Clicking a line label opens the shared record. Its character cards open the actual profiles. Dragging in this overview adjusts the temporary view, not the original narrative canvas positions. Same-canvas relationships also appear automatically as clickable lines on narrative and nested canvases. Multiple connections between a pair have separated curves. Removing a connection does not delete its participants; Undo restores it.

Older relationship rows remain intact and can be developed by clicking them. They become shared records when opened. Library character copies retain relationship names and descriptions without retaining live links to another game.

## Future relationship wizards

No relationship framework or questionnaire has been invented for this change. A future wizard should select an existing relationship ID, then call `applyRelationshipWizardResult(record, input)` and dispatch an `UPDATE_ENTITY` for that record. Inputs retain `sessionId`, `sourceId`, source label, questions, answers and generated summary. Multiple inputs keep their order. Questionnaire updates can regenerate the relationship description; manually changed prose is protected as a pending revision for explicit review. Participants and directional labels remain on the same record throughout.

References use `{ coll, parentPath, nodeId }` so equal node IDs in different nested graphs remain distinct. The profile's brief `characterFacts.relationships` rows are derived readouts for facts and export compatibility, not a second copy to edit. Rename updates follow the linked profile; deleted profiles leave their last known name and writing available for repair.
