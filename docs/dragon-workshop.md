# Dragon & the City: Focused Workshop

Open Dragon & the City from Story Wizard to use the full-screen workshop.
City, Dragon, Responses, People & stakes, and Review are separate sections.
Responses shows Escape, Defend, and Attack side by side by default; the
comparison button switches to a single response editor. Extra details are
optional disclosures.

The live description and Concept at a glance remain alongside the editor on
desktop. Focusing an answer highlights its passage; clicking a passage opens
and focuses the corresponding answer. Every answered response remains visible
as a possible route. The application does not invent an outcome or resolve the
dilemma. Answer areas grow with their content within scrolling panes. Narrow
screens stack the panes and, on phones, the response columns.

Review by questions and review by nodes edit the same answer bank. Saving fills
the existing concept tree through stable node paths. Multiple fields can belong
to one node. IDs, types, edges, annotations, and moved nodes are preserved;
missing nodes are not recreated simply to hold answers. Unbound and additional
template answers remain in the saved wizard record and review.

Native node inspectors expose the bound answers directly, with other native
details behind a disclosure. These edits refresh the wizard record and its
generated description, including when the concept is attached to a character.
Existing protected character writing and manually edited node prose are retained.
Undo restores both views. A separately saved library version is an independent
copy and retains its workshop identity even under a custom name.

Legacy Dragon question answers are mapped into the grouped fields; other earlier
answers remain available under additional writing. The original concept graph
is the starting point. Changing its roles into richer Character, Story Location,
or Story Beat nodes is a separate future workflow.

Implementation: dragonWorkshop.js defines questions and prose;
wizardFields.js stores answers on native nodes; dragonSync.js reconciles direct
node edits with saved sessions. The persistence integration test writes only to
an isolated temporary local-data directory.
