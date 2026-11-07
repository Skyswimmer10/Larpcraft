# Story Beat

## Wide Workshop

### Internal story canvas

Open **Internal story canvas** in the inspector, switch to **Structure** inside the workshop, or open a Story Beat's detail graph. All three display the same workshop content as an editable graph. The opener, complications and player involvement form a flow; each consequence possibility is a separate branch. Occasion and Stakes connect alongside the flow. Empty sections do not produce nodes merely by opening them. **+ Complication** and **+ Possibility** explicitly add further parts. A part's Develop action opens its exact workshop section/record; its detail inspector edits the canonical notes directly.

The graph is a projection from `storyBeat.workshop`, not a second persisted copy under `sub.nodes`. Extra complications are stored in `workshop.complications`; each has a stable ID and independent typed bindings. Manual geometry and colours are stored in `workshop.canvasLayout` by stable part ID, and survive pattern changes, CSV, local saves and template reuse. Moving cards changes layout only. Older authored internal nodes and annotations remain accessible through **Existing canvas**. Opening a nested beat edits its correctly scoped parent, without affecting another beat with the same ID. The generic framework/concept exploration button is removed from Story Beats; their own workshop supplies the detail editing.

### Typed sentence roles and guidance

Selecting an opener shows **Shape this opener** beneath its choices. The sentence is built from typed role tokens: agents, items, places, and contextual subjects. Click a role to activate the matching buttons in **In this beat**, then select an attached entity. Actor/recipient roles accept characters or groups; item and place roles accept their corresponding narrative types. Information subjects may also reference a character, group or location. Verbs and ordinary wording are never assignable.

The reverse order also works: select a participant first, then click a highlighted compatible sentence role. Replacement text is smaller and italic, in a recessed tinted sentence panel with dashed underlines. Ordinary story choices keep their standard icon/colour buttons. The same replacement panel works for Complication, Players and Consequences, plus optional location context on Occasion and affected people on Stakes. Only declared typed placeholders are replaced; verbs and arbitrary authored prose are not guessed.

Assignments are stored under `workshop.bindings[clauseKey][role]` with scoped references and name snapshots. Clause keys identify the section, selected pattern and (for consequences) possibility. Changing a complication's actor does not recast the opener or another possibility. Live names resolve from the current game; missing links retain their snapshots. Old `workshop.roles` values remain readable for compatibility. Template import detaches bindings and cast references while retaining names; CSV and local saves retain the complete data.

**Participants** is a compact cast browser with Characters, Groups, Items and Locations tabs, search, and name-only choices. Adding a participant stores it in `workshop.participants` without assigning a role or generating story text. Character-input/framework subtrees are excluded; genuine characters inside story concepts remain available. Each tab accepts only its corresponding narrative type, with an explicit empty state when there are none. It browses the current narrative collection, not physical inventory or mechanics. Duplicate names alone show node IDs; graph paths are not displayed. Other/custom offers matching existing content or a typed label; Clear role removes only that sentence assignment.

Each participant category shows its count and up to six quick choices. Click the active category again, or **Browse all**, to open an upward floating list with every matching entry. The list has a bounded scroll area and uses the same search field; selecting a row adds it and closes the list. Escape closes only the list and returns focus to its category button. Switching categories replaces the choices and closes the previous list. Already-included entries are marked and disabled, preventing duplicate additions.

Every opener has two optional contextual questions with concrete choices. Examples include why evidence is hidden and what could expose it, or a rumour's accuracy and method of transmission. Answers are stored by opener family/pattern under opener.guidance; switching patterns retains earlier answers and only the current pattern contributes to the preview. Existing free detail remains available. All 36 occasion choices now have distinct meaningful glyphs, while category rails retain their category symbols.

Category Rail is used for Occasion, Opener and Complication. Families are always visible in a narrow left rail, with compact icon/colour choices beside them. Search finds choices across every family and displays alphabetic results with their family labels. Browsing and searching do not change saved story choices; selecting a concrete option updates the existing workshop record and live preview.

Occasion pairing uses two compact slots above one shared catalogue. Click either slot to edit that occasion while retaining the other. The second slot enables pairing and offers the same full set of occasion families. Choose how they connect through the existing collision options. Use this pair collapses the catalogue to the pair summary; either slot reopens it. Remove second occasion clears the second choice and collision while retaining the first occasion and other writing. Existing pairs load without migration.

The Story Beat inspector opens a shared **Story workshop** through six compact buttons in two columns and three rows: Occasion / Opener under Context, Complication / Players under Action, and Consequences / Stakes under Outcomes. Buttons have four-pixel gaps. Each opens the same wide window at its corresponding tab; all six tabs remain visible.

The left side offers concrete, optional choices with meaningful symbols and restrained colour accents. The right side builds the story immediately and highlights the paragraph belonging to the selected tab. Clicking a paragraph opens its corresponding editor. Existing descriptions are never overwritten automatically; **Use as description** explicitly copies the current story. The canvas includes workshop writing alongside existing authored descriptions, without repeating identical text.

The preview now occupies about 28% of the wide window, two-thirds of its earlier share. Tabs follow Opener → Complication → Players → Consequences, followed by Stakes and Occasion. Consequence fields are visible on entering the tab without an Add possibility gate. Merely viewing them stores nothing. The first edit creates the first possibility; further possibilities are optional and can be selected directly.

Occasions include social happenings, undertakings, transitions, rules/exceptions and distribution, plus an optional second occasion and collision pattern. Openers cover eight families. Complications cover eight families: Resistance, Missing means, Uncertain information, Time pressure, Competing commitments, Exposure, Cost or tradeoff and Unexpected development. Each offers four concrete variations and an optional effect. Switching families retains earlier choices.

Player involvement separates entry, interaction and influence. Consequences support several conditional possibilities, optional timing/visibility and non-intervention. Stakes reuses Human Values definitions and named states, with optional Haidt moral tensions. Saved Human Values work can be linked and developed through its original wizard; an unavailable original retains its snapshot. Every section can stay empty.

A compact footer shows connected participants. Expand Participants to assign existing scoped character/group, item/subject and story-location records, or type names. Real players and teams are excluded. Game, nested and library Story Beats use the same saved workshop model under `storyBeat.workshop`. Library reuse clears game-specific participant/value-source references while preserving names, snapshots, choices and writing. CSV retains the complete workshop.

Earlier Story impact, threads, optional sections and their links remain under **Additional details & links**. Their original writing is preserved.

### Connected follow-ups

The workshop has two compact **Start from** choices above its six tabs:

- **General** starts with a happening, a difficulty and a player response. Earlier beats default to this approach. Consequence conditions can directly reuse selected player actions and their scoped targets, with separate result roles. A saved response snapshot keeps an existing branch readable if its player action is later deselected.
- **Character Interaction** starts with an intention (obtain, protect, reveal, conceal, prevent, persuade or fulfil a commitment). Resistance develops through a conflicting intention, duty, belief or demand. Players can help, oppose, mediate, investigate or offer another solution. A consequence uses one of those responses and describes success, failure, a changed intention, a cost or a compromise. Stakes name whose position is at risk and the responsibility, promise, public support or dependency behind it. Occasion choices connect the social context to opportunities, expectations, deadlines or an audience.

Both approaches retain Opener, Complication, Players, Consequences, Stakes and Occasion. Switching saves `workshop.approach` and changes the active guidance/prose; General choices and each part's `interaction` choices remain stored independently. It does not convert the beat, reset its branches, replace its authored description or discard linked people. Participants, occasion selections, notes, Human Values and canvas geometry remain shared. Specific character roles inherit the live opener assignments and can be overridden per clause. Internal canvas nodes use the active approach's writing and labels. CSV, local save/reopen and reusable templates retain both sets of choices.

**Shape this opener** has a distinct outer background that encloses its follow-up questions and the existing recessed word-replacement panel. This styling also applies to intention development in Character Interaction; the word-replacement panel keeps its own appearance inside the outer surface.

Selecting an opener makes optional **From this opener** suggestions available in the other workshop sections. All eight opener families have tailored difficulties, concrete player actions and possible outcomes. A distorted rumour also asks whether the distortion concerns identity, intention, responsibility or events. Occasions can explicitly introduce the information or action, including through the second occasion; stakes can name the character whose reputation, commitment, relationship or belonging is at risk.

Choices are stored by opener key under each part's `context` bank. Switching opener restores its earlier choices without applying another opener's answers. Extra complications and consequence branches have independent banks. Selecting a contextual complication/outcome uses that template; its earlier general choice stays saved and can be restored by deselecting the suggestion. Choosing a general alternative clears the contextual selection for that part. The general controls fold away when a specific suggestion is selected. Viewing any suggestions stores nothing.

Contextual character roles initially follow the opener's live bindings and can be overridden through the same italic role buttons. Each override belongs only to its sentence/branch. Generated outcome subjects no longer implicitly inherit the shared item role: reveal/conceal uses “the truth” until an explicit result is entered or assigned. A rumour concerning and reaching the same scoped character uses “hears a rumour about themselves”; separate characters with equal names remain separate.

The preview, internal canvas, CSV and reusable library templates use the same canonical choices. Nothing changes the independent description until **Use as description** is pressed. These authored templates provide direction; the author chooses the combination and can add their own detail.

## Existing details and compatibility

The base-node palette offers **Story Beat** in place of separate Event and Quest choices. Title and description are always visible together, followed by an image control with a half-size thumbnail. They are not hidden in Core Identity or Main Content disclosures. A title and description are enough. **Add section** adds a compact title button and opens a separate editing window for any combination of:

- **Situation / change:** what happens or changes, with optional consequences.
- **Objective:** what someone is trying to achieve, with optional completion criteria.
- **Dialogue / readout:** writing kept inside the beat, optionally linked to existing shared conversations.
- **Gameplay:** the actions and rules written inside the beat, optionally linked to existing mechanics.

Nothing needs to be extracted or created as a separate node. An objective and a situation can be part of the same beat. Close a section window to return to its compact title. Hiding a section retains its text and links; add it again to restore them. The canvas shows the description and the main writing from enabled sections. Closing an editing window with Escape commits the focused text field.

Story impact has its own window, opened by a compact button showing the selection count. Open threads provides one Add thread action and one form for title, status, notes and payoff. Earlier story threads and authoring issues remain stored and editable through this same form.

Team assignment is an optional **Team Lane** supporting subnode, available in the narrative palette or Add subnode disclosure. It can be shared by all teams or assigned to a game team. Attached cards determine the beat’s displayed team assignment. Older direct `teamId` assignments remain supported when no lane card is attached. Detaching a lane stops applying its assignment. The Story Beat inspector no longer contains the Team lane selector or Records facts controls, and the Story Beat canvas card no longer repeats the attached-subnode count. Existing fact data is preserved.

Value subnodes show populated Initial, Current and Max values on their canvas cards, including numeric zero. These summaries update from the same saved fields as the inspector.

Story Beats have no Base type conversion selector in the game or library inspectors. Their optional sections develop the beat without turning it into a different kind of node.

Existing Event and Quest records retain their kinds, IDs, prose, colors, relationships, nested content and saved concept answers. They display as Story Beats, opening the situation or objective section by default. The old kinds remain supported for loading and importing but are absent from new-node palettes. Existing specialized narrative types such as timed events are unchanged.

The same section editor works in root and nested game graphs, library builder drafts, saved node templates and story structures. Optional sections are saved under `node.storyBeat`; the existing `body` remains the independent description. Shared conversations and mechanics remain in their own stores. A game mechanic’s linked name opens an editable window on the original scoped mechanic, including nested mechanics. Closing it returns to the Gameplay window and preserves the selected Story Beat. Older library mechanic links also open their record. Missing references can be unlinked.

Library imports preserve section writing, including hidden sections, while clearing game-specific conversation/mechanic assignments. Assign those links for the destination game. Narrative CSV includes a `storyBeat` JSON column to round-trip the optional writing and links. Old CSVs without this column keep existing optional details when merged.
