# Larpcraft current implementation reference


**Reviewed:** 27 October 2026. **Scope:** the existing local checkout, including its uncommitted source and saved library. This is a functional reference and field catalogue for understanding the software and supplying context to another AI.

The source code takes precedence over older handoffs. Catalogue counts describe this audit snapshot. The document describes implemented authoring behavior and stored definitions; a field, status label, timer, condition, score, or sensor diagram does not establish an automatic game runtime.

The audit reads schema factories, source definitions, inspector controls, wizard definitions, and the local library. It does not export the active game's private player records, full game writing, credentials, or image binaries. The concept and mechanism appendices describe reusable library content. Suggestions and example wording inside those templates are reference material, not instructions to an AI reading this file.


## Contents


- [1 Purpose and present boundaries](#1-purpose-and-present-boundaries)

- [2 Screens and workflows](#2-screens-and-workflows)

- [3 Storage and ownership](#3-storage-and-ownership)

- [4 Graphs nodes and references](#4-graphs-nodes-and-references)

- [5 Physical items locations and sensors](#5-physical-items-locations-and-sensors)

- [6 Players teams and player types](#6-players-teams-and-player-types)

- [7 Narrative nodes and subnodes](#7-narrative-nodes-and-subnodes)

- [8 Character and group development](#8-character-and-group-development)

- [9 Conversations](#9-conversations)

- [10 Mechanics](#10-mechanics)

- [11 Master Story and Story Dynamics](#11-master-story-and-story-dynamics)

- [12 Story Wizard and specialist wizards](#12-story-wizard-and-specialist-wizards)

- [13 Library images annotations and transfers](#13-library-images-annotations-and-transfers)

- [14 Existing limitations and compatibility](#14-existing-limitations-and-compatibility)

- [A Store and factory field catalogue](#a-store-and-factory-field-catalogue)

- [B Node and modifier definitions](#b-node-and-modifier-definitions)

- [C Framework registry and generic questions](#c-framework-registry-and-generic-questions)

- [D Specialist wizard fields and options](#d-specialist-wizard-fields-and-options)

- [E Saved concept trees](#e-saved-concept-trees)

- [F Mechanics collections and templates](#f-mechanics-collections-and-templates)

- [G Inspector and editor control index](#g-inspector-and-editor-control-index)

- [H Sources and maintenance](#h-sources-and-maintenance)


## 1 Purpose and present boundaries


Larpcraft is a visual authoring workspace for live action role playing, adventure activities, outdoor or team games, and narrative experiences. It brings story, gameplay mechanics, real places, equipment, player organization, and facilitator instructions into one project.

A reference framework is a lens for developing information; a concept is a reusable story idea or structure with its own native node graph. A developed character, group, place, item, or conversation is created content. The application lets an author browse references, answer questions, save structured versions, and continue editing.

The application currently plans and records games. Its wizards use local deterministic formatting and suggestions. There is no configured external story-writing or portrait-generation model, live ESP32 event receiver, GPS tracker feed, automatic zone scoring, or server-authoritative multiplayer game engine. Existing player score fields are manually authored records.

| Term | Meaning in the current application |
| --- | --- |
| Library | Reusable master records, templates, concepts, structures, mechanisms, and reference metadata. |
| Active Project | The open game: its graphs, physical records, players, teams, drafts, and conversations. |
| Node | An object placed on a canvas, with identity, writing, links, layout, and sometimes an inner graph. |
| Inspector | The context-dependent editing panel for the selected object. |
| Subnode | A modifier, annotation, or precision element that may attach to another node; also used informally for a nested node. |
| Framework input | One saved use of a reference framework contributing to a profile, including its own answers and session. |
| Concept input | One adapted use of a saved concept, including answers and a native tree. |
| Linking Node | A reference to library narrative content with explicit navigation and copy insertion; distinct from an ordinary copied template. |
| Story Dynamics | The author's intended emotional journey, represented by hand-edited curves and tags. |
| Physical versus narrative | A real venue or prop is separate from its fictional meaning; IDs connect them when desired. |


## 2 Screens and workflows


| Area | Current role and main behavior |
| --- | --- |
| Master Story | Act-level structure plus a scheduling timeline. Double-click an act for its story and mechanics lanes. |
| Story Dynamics Graph | Whole-game emotional overview and shorter activity charts with optional source links. |
| Narrative Weaver or Viewer | Story Beats, characters, groups, story locations, story items, concepts, frameworks, nested graphs, Story Wizard, conversations, and library browsing. |
| Mechanics Weaver or Viewer | Task and mechanic canvases, the Build / Adjust / Equip / Prepare toolbox, saved mechanism collections, modifiers, and I/O design. |
| Locations | Real venue records with photographs, room schematics or street-map tiles, markers, and arrows. |
| Items and Gadgets | Real props and equipment: build readiness, availability, placement, issue to teams or players, linked mechanics, and hardware requirements. |
| Teams | Rosters, team identity and imagery, allocation of props and sensors. |
| Players | Profiles, manually recorded game outcomes and points, and assignable player-design types. |
| Library Physical | Master item, location, and sensor templates, with a collapsible left category sidebar, search, item-type filters and category-specific creation buttons. |
| Library Created Content | Saved developed story content grouped into categories including characters, groups, locations, items, story content, and conversations. Uses the same photo-card dimensions, blue-tinted backgrounds, collapsible category pane and library borders as Physical. |
| Library Research & References | Reusable source notes, credits, web/video links, embedded images/PDFs/files and editable table/stat panels. Characters can link these records from their Media & references window. |
| Library Game Mechanics | Primitive nodes, adjustment subnodes, saved trees, and board-game mechanism catalogues. |
| Library Story and Narrative | Reference concepts, story structures, reference frameworks, reusable narrative templates, and conversations. |
| Game Master Rules | Principles and facilitator instructions with editable tabs. |

Canvas operations include selecting and editing, adding and connecting objects, drag placement, nested navigation, zoom/fit controls, annotations, copy/paste, and undo. Available tools depend on the current canvas. The inspector can be resized or collapsed; appearance preferences and backdrops are separate from authored story content.


## 3 Storage and ownership


Two stores are maintained: Library and Active Project. Library insertion creates a detached game copy. Editing the copy normally leaves its master unchanged; saving back to the library is explicit. Clipboard and library transfer helpers remap internal IDs and detach external links where required.

| Context | Persistence and scope |
| --- | --- |
| Local Vite development | The local save middleware writes .larpcraft/library.json and .larpcraft/project.json. Previous copies and browser recovery archives are retained. |
| Browser recovery | IndexedDB with localStorage fallback retains browser snapshots. The local server archives existing browser data before selecting the canonical disk copy. |
| Conflicts | Revision hashes and atomic writes detect conflicting saves; failed drafts are archived rather than silently replacing another save. |
| Static deployed build | The development middleware is not present as a hosted save backend. Browser storage and bundled release snapshots are used; live local files do not automatically synchronize to the deployment. |
| Game JSON | Transfers the active game, not the complete master library. |
| Complete workspace JSON | Transfers both stores, schema versions, images in state, and export metadata. |
| CSV | Supported flat collections are items, locations, players, narrative nodes, and task nodes. CSV is not a complete backup of nested graphs and image assets. |

File actions include new/open/rename/close game, save game JSON, open/save complete workspace, and backdrop settings. Additive migrations supply missing structures and preserve older authored content. Code and deployment publication are separate from saving game data.


## 4 Graphs nodes and references


A graph typically stores nodes, edges, frames, numberMarkers, and titleMarkers. A node's sub field is another graph. Parent graph collection plus complete parent path plus node ID is the reliable address of a nested object; an ID alone is not globally unique.

| Field or structure | Meaning |
| --- | --- |
| id | Identity within its collection or graph. |
| kind / mechKind / subnodeKind | Base rendering category, mechanic specialization, or adjustment subtype. |
| title / name / body / description | Visible identity and authored writing. Some domains retain both body and description for compatibility. |
| x / y / w / h | Saved canvas position and dimensions; these are not real-world coordinates. |
| sub | Inner graph. Character inputs, concepts, tasks, acts, and saved compositions can use it. |
| edges[].from / to | Directed canvas connection between objects in the relevant graph. |
| edges[].label / color | Visible connection annotation and color. |
| Edge condition fields | Plain-language branch requirements and optional fact links. These are planning data. |
| parentRef / parentId / attachments | Ownership or attachment for supported modifiers. Detaching is distinct from deleting an entity. |
| locationId / itemId | Links to real venue or physical-item records in the active project. |
| mechanicIds / sensorIds | References to the relevant mechanics or project hardware records; collection context matters. |
| referenceFrameworkIds / frameworkId | Framework references identifying a lens or reference diagram. |
| templateId / primitiveId / conceptId | Provenance or template identity; these do not by themselves create live synchronization. |
| targetRef / characterRef / group reference | Typed references with collection and complete nested path. Their exact property names vary by subsystem. |
| frames / numberMarkers / titleMarkers | Visual organization and annotations rather than game logic. |

Story-flow edges, character relationships, group memberships, conversation participation, library links, and emotional-journey source links are different relationships. The application does not infer one merely because another exists.

Master Story now offers **Story direction** (also reached through Story Wizard → **Plot structure**). Optional theme/idea and tone/setting tags include prompting choices and custom entries. Acts inherit each field or override it, including an intentional blank. The plot board shows colored stage cards with two original questions per stage and a live overview: Hero’s Journey (12 stages), Event arc (6), or Pressure and change (5). Each template keeps its own answers, and stages can link to existing Acts or Story Beats without rewriting them. Planning lives in `meta.storyPlanning`; Act overrides live in `node.storyDirection`. These are authoring aids, not a forced player sequence or calendar. Complete workspace/game saves preserve the project-level plans; they are not automatically published as library templates.

Story Beats also offer optional **Story impact** tags (`storyBeat.impacts`, multiple + custom) and **Open threads** (`storyBeat.threads`). Player story threads track Open / Revealed / Resolved, discovery notes and payoff; separate authoring issues track To fix / Fixed. The Story direction window gathers open records across nested Narrative and Master Story graphs with category and resolved filters. Both views edit the same beat data. Impact/thread records survive CSV and beat template copying; Act template copying retains explicit direction overrides. See [story-planning.md](story-planning.md).


## 5 Physical items locations and sensors


### Physical items


| Field | Meaning |
| --- | --- |
| name / type | The real equipment name and its category. Default types include artifact, gadget, consumable, key, clue, status, tool, and wearable; the library can define types. |
| buildStatus | Preparation progression: concept, design, build, tested, packed. |
| availability | Ready, in-use, deployed, or missing. |
| description | Player-facing description associated with the physical record. |
| propNotes | Practical crew-only notes about the real object. |
| origin / loreNotes | Authored provenance and supporting story information. |
| persistsAcrossTasks | A design flag that the item persists between tasks. |
| locationId | Real placement. Deploying an item sets deployed status and clears issue assignment. |
| assignedTo.teamId / playerId | Current issue to a team and optionally a player. Issue sets in-use; return sets ready. |
| mechanicIds | Links to library mechanic records for intended use. |
| sensorReqs[].sensorId / note | Required project hardware and an explanatory note. |
| image | Uploaded visual reference metadata and data URL. |


### Physical locations


| Field | Meaning |
| --- | --- |
| name / zone / notes / safety | Real venue identity, zone or act label, practical notes, and crew-only safety notes. |
| image / schematic | Cover image and separately uploaded room schematic. |
| mapKind | Schematic or osm map base. |
| osm.lat / lon / zoom | Geographic center and map zoom for the OpenStreetMap tile layer. |
| markers[].id / kind / refId / x / y | Manually placed references to sensors, items, or narrative nodes. Their canvas positions are not live tracker readings. |
| arrows[].x1 / y1 / x2 / y2 | Authored directional lines on the location stage. |
| mapLabels[].id / text / x / y / color / audience | Optional movable, multiline map callouts. `audience` is `all` or `facilitator`. |
| mapZones[].id / name / x / y / w / h / color / audience | Optional named rectangular visual regions with a translucent fill. |
| mapZones[].storyLocationId | Optional link to an existing top-level Story Location in the active game's narrative graph. Missing links remain visible as unavailable references. |
| mapLabels[] / mapZones[].osmAnchor | New street-map annotations retain geographic start/end anchors for pan, zoom and viewport resizing. Schematic annotations use the shared canvas plane. |
| markers[] / arrows[].audience | Optional visibility flag; older rows remain visible in both views. |
| sensorIds | Hardware associated with the venue; placement updates the sensor record. |
| Stage coordinates | The authored marker plane is 160 by 90 units. Map tiles use geographic projection separately. |

A map can keep its authored markers when online tiles are unavailable. Room schematics are images with positioned overlays. No indoor positioning or GPS-to-player feed is currently connected.

The location toolbar includes Move, Add label, Draw zone, Movement arrow, Map notes, and Facilitator edit / Player preview. Place a label with a click or draw a rectangular zone by dragging. In Move mode, drag labels/zones/markers; a selected zone has a resize handle. Map notes lists all overlay types and provides text/name, color, visibility, position, zone dimensions and an optional Story Location link. Selecting an arrow now opens its settings; deletion uses the explicit Delete arrow button. Deleting a marker removes its stage marker without deleting the referenced item, sensor or narrative node.

Player preview removes facilitator-only annotations, markers, and arrows from the rendered map and hides editing controls. It is an authoring preview, not authentication or a separately shared player portal. Visibility does not delete saved data. New street-map labels/zones follow map coordinates; legacy markers/arrows retain their existing canvas positioning. Normal game JSON persistence retains all annotations, and annotation edits/deletions support Undo. Pointer drags commit once at the end rather than creating a history entry on every movement. Visual zones do not create sensor geofences or award points. Print layouts, compass, legend, grid, calibrated scale, and distance measurement remain future work.


### Sensors


Sensor instances identify hardware by id, templateId, kind, label, status, locationId, assignedTo, and battery. The seeded types include readers, buttons, motion/proximity sensors, and RF devices. These are inventory and planning values, not measurements obtained from an integration. ASSIGN_SENSOR associates a sensor with a player; location and item requirements reference the same project sensor record.


## 6 Players teams and player types


Players represent real participants; character nodes represent fictional people or roles. The current application does not automatically equate the two. Teams store name, color, focus, and optional image; players link through teamId. Team views derive their rosters and issued equipment from the project records.

| Player field group | Fields and meaning |
| --- | --- |
| Identity | id, name, nickname, initials, role, image, teamId, flags. |
| Design profile | personality, experience, strengths, weaknesses, motivation, communicationStyle, preferredRole. |
| Comfort and observation | comfortNotes, safetyNotes, observerNotes. |
| History | previousGames, stageHistory, achievements, accomplishments, performanceNotes. |
| Manual outcomes | totalPoints is numeric; stagePoints and gmRewards are authored notes. These are present fields, not an automatic scoring ledger. |
| Player design types | playerTypeIds selects any combination from the current reference cards. They are design motivations, not fixed diagnoses or rankings. |


### Bartle · four player motivations


A multiplayer design lens: acting or interacting, with the world or with other players. Motivations can overlap and change between games or during play.

| Type | Focus | Meaning | Design question | Game design guidance |
| --- | --- | --- | --- | --- |
| Achiever | Acting on the world | Enjoys pursuing goals, mastering challenges, and making visible progress. Achievement need not mean defeating another player. | Which mechanics help players complete the game’s goals? | Clear objectives, milestones, optional challenges, and recognition of progress. |
| Explorer | Interacting with the world | Enjoys discovery, experimentation, hidden places, and learning how the world works. Sharing a discovery can be part of the reward. | How much freedom for exploration do the mechanics provide? | Hidden clues, alternate routes, experiments, and discoveries worth sharing. |
| Socializer | Interacting with players | Values relationships and shared experiences. The game provides a setting for meaningful interaction, even when winning also matters. | Which forms of social interaction arise from the mechanics? | Negotiation, shared discoveries, cooperative roles, and time for conversation. |
| Killer / Dominance | Acting on players | Seeks influence over other players or visible competitive impact. This can involve rivalry, commanding, or managing; it should not automatically be equated with griefing. | How do the mechanics allow dominance, leadership, or player management? | Agreed competitive roles, leadership opportunities, and clear limits on interference. |


### Ten play styles


The second categorization supplied for this library. Its author was not identified in the supplied excerpt. Similar labels in different models remain separate.

| Type | Focus | Meaning | Design question | Game design guidance |
| --- | --- | --- | --- | --- |
| Competitor | Competition | Plays to outperform other players, across different games. | Where can players test themselves against others? | Fair contests, rival objectives, and visible results. |
| Explorer | Curiosity | Seeks adventure and pushes physical or mental boundaries. | What can players investigate beyond the obvious path? | Optional paths, unusual interactions, and open-ended discoveries. |
| Collector | Collection | Enjoys acquiring items, trophies, or knowledge and organising them into sets or histories. | What meaningful collection can players develop? | Artifact sets, clue collections, and records of discoveries. |
| Achiever | Progression | Pursues levels of accomplishment and responds to milestones, ladders, and advancement. | How will progress and mastery become visible? | Tiered challenges, milestones, and achievements. |
| Joker | Playfulness | Plays for amusement and spontaneity. Humour can make play more social, though it may clash with a serious tone. | Where is playful improvisation welcome? | Comic roles, optional playful tasks, and space for light-hearted expression. |
| Artist | Creativity | Enjoys creative expression, making, and design. | What can players create or personalise? | Design a symbol, decorate a prop, or invent a solution. |
| Director | Direction | Enjoys organising others and directing play. | Where can players coordinate meaningful decisions? | Rotating leadership, planning roles, and team coordination. |
| Storyteller | Imagination | Enjoys creating or inhabiting imagined worlds and stories. | How can player choices contribute to the fiction? | Character motivations, consequential choices, and collaborative scenes. |
| Performer | Expression | Enjoys presenting, acting, or putting on a show for others. | Where can players have an audience? | In-character speeches, demonstrations, and performance moments. |
| Craftsman | Construction | Enjoys building, crafting, engineering, and working things out. | What can players construct or solve through hands-on work? | Assemblies, repair challenges, mechanisms, and practical puzzles. |

Additional player-type models may be listed as references without assignable profiles. Their presence does not imply that the application scores a participant against them.


## 7 Narrative nodes and subnodes


| Base node | Meaning and current fields |
| --- | --- |
| Story Beat | An authored moment. Title/body can stand alone; optional Situation/change, Objective, Dialogue/readout, and Gameplay sections add detail. |
| Character | A fictional figure developed through compact facts, profile writing, frameworks/concepts, portrait, and linked conversations. |
| Group / Institution | A group profile with kind, approximate size, purpose, members, relationships, sources, and image. |
| Story Location | The fictional description of a place. Can link a real venue through locationId and accept a Location Archetype modifier. |
| Story Item | An object as it exists in the story. Can link a physical prop through itemId while keeping its own description. |
| Concept | A developed use of a reusable concept, with answers, roles, category, status, source identity, and an internal tree. |
| Linking Node | References a saved narrative node, concept, or story structure and can navigate to it or explicitly insert a copy. |
| Story structure container | A copied reusable story structure containing its graph. |


### Story Beat details


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| situation | What happens or changes? | text | [] | Situation / change |  |
| consequences | Consequences · optional | text | [] | Situation / change |  |
| objective | What are they trying to achieve? | text | [] | Objective |  |
| completion | How will you know it is complete? · optional | text | [] | Objective |  |
| dialogue | What is said or read to the players? | text | [] | Dialogue / readout |  |
| gameplay | What do players do, and how are outcomes decided? | text | [] | Gameplay |  |

storyBeat.sections selects visible sections; hiding one retains its text and links. conversationIds selects shared conversations. mechanicRefs links existing scoped mechanics. Event and Quest remain readable legacy kinds and open through the Story Beat behavior; they are not separate new base palette choices. Story Beats have no irreversible Base type conversion selector.


### Story Item detail


The current inspector keeps fictional writing separate from the linked real item. It includes item type and origin, image/appearance controls, and a physical-item selector with practical record preview and edit/unlink actions. Broader story-item redesign is a future task, not a finished concept.


### Narrative enrichment types


| Kind | Label | Current declared defaults |
| --- | --- | --- |
| outcomeBranches | Outcome Branches | {"kind": "outcomeBranches", "title": "Outcome Branches", "parentRef": null, "notes": "", "keywords": [], "mode": "choice", "selectionType": "single", "branches": [{"label": "Branch A", "outcome": "", "mechanicId": null}, {"label": "Branch B", "outcome": "", "mechanicId": null}]} |
| relChange | Relationship / Status Change | {"kind": "relChange", "title": "Relationship / Status Change", "parentRef": null, "notes": "", "keywords": [], "relType": "", "targets": "", "direction": "yes", "intensity": "", "trigger": "", "effects": "", "mechanicId": null} |
| internalState | Internal State | {"kind": "internalState", "title": "Internal State", "parentRef": null, "notes": "", "keywords": [], "stateType": "", "level": "", "trigger": "", "effects": "", "mechanicId": null} |
| locationArchetype | Location Archetype | {"kind": "locationArchetype", "title": "Location Archetype", "parentRef": null, "notes": "", "keywords": [], "archetype": "Dangerous Place", "influence": ""} |
| narrativeResponse | Narrative Response | {"kind": "narrativeResponse", "title": "Narrative Response", "parentRef": null, "notes": "", "keywords": [], "text": ""} |
| emotionalTone | Emotional Tone | {"kind": "emotionalTone", "title": "Emotional Tone", "parentRef": null, "notes": "", "keywords": [], "tags": []} |
| comment | Comment | {"kind": "comment", "title": "Comment", "parentRef": null, "notes": "", "keywords": []} |
| characterState | Character State | {"kind": "characterState", "title": "Character State", "parentRef": null, "notes": "", "keywords": [], "emotionalState": "Neutral", "behavioralNotes": "", "effects": ""} |
| value | Value | {"kind": "value", "title": "Value", "parentRef": null, "notes": "", "keywords": [], "purpose": "Defines numeric or tradable value of an item or resource.", "initialValue": "", "currentValue": "", "maxValue": ""} |
| lifespan | Lifespan | {"kind": "lifespan", "title": "Lifespan", "parentRef": null, "notes": "", "keywords": [], "purpose": "Defines how long this item or resource persists across tasks or sessions.", "lifespanType": "Task only", "description": ""} |
| spendUseRule | Spend / Use Rule | {"kind": "spendUseRule", "title": "Spend / Use Rule", "parentRef": null, "notes": "", "keywords": [], "purpose": "Defines how this item or resource can be spent, used, or consumed.", "usageRules": "", "limitations": ""} |

The table records the actual subtype defaults. Outcome branches express graduated alternatives; relationship/status and internal-state modifiers describe changes; location archetypes suggest the place's role; response and tone describe authored effects. Value, lifespan, and spending/use rules add parameters shared with mechanics. None executes itself.


### Supporting and legacy narrative kinds


| Kind | Label | Meaning |
| --- | --- | --- |
| beat | Beat | A scene — what happens at a place and time. |
| reveal | Reveal | Deliver information: a clue, an NPC line, a discovered prop. |
| branch | Branch | A decision point. Each outgoing link carries a plain-language condition a GM or sensor decides. |
| fact | Fact change | Records a real-world fact as now true — key held, door open, NPC hostile. |
| converge | Convergence | Where divergent paths rejoin — keeps the story resilient. |
| timed | Timed event | Fires at a clock time regardless of player action. |
| recovery | Recovery | A soft-fail nudge that puts a stalled team back in play — never a dead end. |

Older story, reveal, branch, fact, converge, timed, recovery, and mechanically related nodes remain supported. sets rows record intended fact changes; outgoing links can carry written conditions and fact references. A timed node's authored clock field is not a running scheduler.


## 8 Character and group development


### Compact character facts


The primary inspector shows the portrait above Name/title, then Story role, Gender, Race, Age, Goal/motivation, and compact relationships. **Add relationship** exposes directional vocabulary (family, connections, origins, influence, or custom), then links an existing game entity, saves a name only, or creates a character in the same scoped canvas. Existing entities include nested concept characters. The name/title label edits node title and name together; it is not a separate profession field. Goal and motivation currently share one brief field.

Shared game-owned `relationships` records have scoped participant references, forward/reverse words and one editable description. The character's relationship word and the canvas line label open that description. The Narrative **Relationships** button opens a game-wide connection canvas, including cross-nested connections. Each end reads its own label, such as Father of / Son of. Records reserve editable questionnaire snapshots and generated/pending prose for future relationship wizards; those frameworks have not been authored yet. Older rows can be opened to develop them without losing their notes. See [relationships.md](relationships.md).

| Data | Meaning |
| --- | --- |
| characterFacts.role / gender / race / age / goal | Brief facts. Older node fields, role selections, and saved goals supply compatibility fallbacks. |
| characterFacts.relationships[] | Rows with id, type, name, optional targetId and targetType. A row can name someone without creating a profile. |
| Relationship suggestions | ["Loyal to", "Enemies", "Friends", "Siblings", "Family", "Allies", "Rivals"] |
| Story role suggestions | ["Main character", "Antagonist", "Gatekeeper", "Minor character", "Guide", "Supporting character"] |
| Linked relationship targets | Characters/groups in the same graph plus project team/faction records when present. Names follow resolved targets; missing links retain names. |


### Optional quick character attributes

The compact **Quick attributes** button in the character inspector and editable profile opens a centered editing window. The inspector contains no explanatory paragraph, disclosure toggle or expanded field list. Attributes alone, frameworks alone, both, or neither can define a character. No fields or traits are selected by default.

**Manage attributes** opens a centered dialog with Selected, Personality, Appearance, Skills & interests, and Custom categories and a field search. Suggested optional fields are Personality, Strengths, Flaws, Enneagram-inspired roles, Virtues, Physical signature, Clothing & possessions, Appearance note, Mannerisms, Skills, and Interests. Most use tags: choose suggestions, type additional tags, or remove individual tags. Appearance note uses short text. Custom fields support either tags or short text. Existing identity and typed relationships remain separate.

`characterAttributes.version` is 1. `characterAttributes.fields[]` stores each selected field's `id`, `label`, `category`, `kind` (`tags` or `text`) and `values[]` or `value`. Only chosen fields clutter the editing view; empty fields are omitted from description/export text. Apply commits field selection; Cancel leaves the data intact. Unchecking a field removes its values on Apply, and normal graph Undo restores the change.

Populated attributes appear separately in the large description window and full/AI exports. Attributes supply the short-introduction fallback when no longer description exists. The character node previews three tag values and a remaining count. Attributes remain independent from wizard answers and protected paragraphs: neither writing path automatically overwrites the other or resolves conflicting labels. JSON persistence, migration, library templates and independent clipboard copies retain this optional data. This panel currently applies to characters, not groups.

### Optional character media and linked research

The compact **Media & references** button opens an ordered gallery in a large centered window. Images can be uploaded together, captioned, credited, reordered and deleted. `mediaGallery[]` stores each entry's `id`, `type` (`image`, `video`, or `external`), `title`, `caption`, `credit`, and embedded `file`, web `url`, or external `path`. The existing single portrait remains independent; Use as portrait explicitly replaces it. Direct supported video-file URLs can play with native controls. Other video URLs open externally; local file paths are stored references and are not automatically opened or included as binaries in backups. Gallery controls are also available from the editable character profile. The full-description viewer exposes a read-only gallery when media or research is present.

`researchIds[]` links a character to reusable library Research & References records. Opening a link from the editable gallery opens that same library reference. Missing references remain visible rather than silently deleting the link. Gallery metadata accompanies AI context exports, without binary image data. Research text is not automatically copied into character prose, and gallery changes do not rewrite wizard answers or protected passages.

### Research & References library and reusable tables

This separate library section collects source material across games without creating narrative nodes. `library.research` is a master-only collection, kept out of game-only data and included in complete workspace backups. Each record has `id`, `title`, `summary`, `credit`, `sourceUrl`, `createdAt`, and ordered `panels[]`. Panels support `note` (text), `link` (URL plus notes/timestamps), `image`/`file` (embedded file plus caption), and `table` (columns and rows). Records are searchable by title, summary, credit, source URL, attachment names, table headings and cell contents; filters select the types of panels present.

Table panels start with Name / Value / Unit columns. Authors may rename, add or remove columns, add/remove rows and edit plain-text cell values. Columns and rows have stable IDs; each row stores a `cells` object keyed by column ID. These are authoring tables rather than automatic gameplay statistics or a formula engine. Images/PDFs/other small files embed as metadata plus a data URL. PDFs have an optional browser preview and a download fallback. Uploads allow up to 8 MB per file; video binaries remain linked or externally referenced, and save-size checks leave room below the local API limit. Web links permit http/https only.

Research records/panels, gallery order, credits, embedded assets, tables and links travel through ordinary JSON persistence. Record/media deletion is undoable. Complete workspace backup carries both the master references and active game; a game-only backup includes its gallery and reference IDs but does not duplicate the master research collection. Existing records and portraits are not reset or bulk-converted.

### Sources and inner canvas


A profile may contain several uses of the same or different framework/concept. Each use retains its own session and answers. Compact cards contain an inclusion checkbox, Edit wizard, and red delete button. Exclusion keeps saved information; deletion removes that input's questions, owned text, generated tree, and matching draft without deleting the original linked source or other inputs.

Double-click opens the profile's inner canvas. Each saved input has its own card; opening it reveals filled native concept nodes or framework answer/reference cards. Direct bound-answer edits reconcile into the parent session and generated description. Explicitly accepted canvas inputs can contribute through visible links. These accepted links differ from arbitrary nearby canvas nodes.


### Protected writing


Untouched generated paragraphs follow changed answers. Author additions stay independent. Rewritten or deleted generated paragraphs are protected; affected passages offer Use this revision, Keep my wording, or editing. Editing prose does not infer new questionnaire answers. Ambiguous splits and merges preserve authored writing. Undo reconciles source and derived text together.

characterProfile is shared storage infrastructure for character and group writing. It carries source inputs, generated/personal passages, historical writing, details, and performance text. characterCanvas and child characterInput records organize editable session trees. These internal names do not make groups into characters.


### Profile windows and exports


Edit Character's Profile opens a centered large window. Character profile combines the editable full description with short introduction and AI dialogue/story-context output choices, copy, and text download. Voice and dialogue stores performance text and links shared conversations. Saved questions first groups by source symbol/name. Earlier writing preserves populated older native fields and selections. There is no external AI request.

The reading description uses a portrait/facts sidebar, populated basic details only, full prose, and source buttons that open the exact saved wizard. On the node face, the uncropped image sits above Description with source symbols alongside. Masculine-archetype dark-side controls are conditional on an included relevant input; they are not compulsory base personality fields.


### Groups and institutions


| Field | Meaning |
| --- | --- |
| groupFacts.kind / size / purpose | Kind of group, approximate size, and shared purpose. |
| groupFacts.members[] | Named people or subgroups; role and loyalty belong to this membership. Linked references or name-only entries are allowed. |
| groupFacts.relationships[] | Named typed relationships such as Allied with, Rival of, Part of, Contains, Owes duty to, or Trades with; custom text is allowed. |
| groupFacts.institution | Enables optional institutional lenses. |
| Group Foundations | A registered framework with identity/bonds, members/roles, power/rules, tensions/change, and optional institutional questions. |
| Members and relationships inner card | A view of canonical roster data with navigation to linked profiles; does not duplicate member profiles. |

Group profiles reuse imagery, source controls, questions by source, protected writing, and library-copy behavior. Character-only gender/race/age and Voice and dialogue controls are absent. Approximate group size is independent from the list of named members. External roster references detach to names in standalone library copies.


## 9 Conversations


A conversation exists once in project.conversations. Narrative Viewer and nested narrative canvases expose the Conversations browser; a character's Voice and dialogue view shows conversations involving that character. The same exchange is editable through any participant.

| Field | Meaning |
| --- | --- |
| id / title / context | Shared conversation identity, name, and optional setup. |
| status | planned or happened. A proposed script does not establish story history. |
| participants[].id / name | Speaker identity within the script and retained display name. |
| participants[].characterRef | Optional scoped project-character reference; name-only speakers are valid. |
| passages[].id / speakerId / text | Ordered speech or directions. speakerId narration is narration/stage directions. |
| library.conversationTemplates | Independent reusable snapshots with speaker names; new game copies start as planned and require explicit linking. |

Passages can be added, reordered, and removed. A used participant must have passages reassigned or removed before removal. Names track linked profile renames and survive deletion. Participation does not imply friendship or allegiance. AI context includes only explicitly selected conversations; scripts do not become enduring character-description paragraphs.


## 10 Mechanics


The mechanics layer describes what players do, the rule governing it, how outcomes are recognized, and supporting equipment/facilitation. Goal, rule, input, output, adjustment, and saved whole-mechanism records have distinct purposes.

| Work area | Meaning |
| --- | --- |
| Build | Build the backbone |
| Adjust | Change how it plays |
| Equip | Add equipment and places |
| Prepare | Get ready to run the activity |

The toolbox supports search, category visibility/pinning, quick add, and a guided start. Saved board-game mechanisms and saved author compositions have a separate full-screen browser with source/category selection, favorites, and image previews. No starter nodes are inserted merely because the canvas opens.


### Guided mechanics start


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| goal | What should the players achieve? | text | [] | Describe the result they are working towards. |  |
| actions | What do the players do? | text | [] | Describe what they move, solve, say, collect, or work out together. |  |
| rules | What rules must they follow? | text | [] | Describe the limits, allowed actions, or number of tries. |  |
| success | How do we know they succeeded? | text | [] | Describe what players or the facilitator can see or check. |  |

Finishing this guide appends answer nodes and connections without replacing an existing graph. It produces authoring content, not executable hardware rules.


### Game Type


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| players | Who plays? | choice | [["solo", "Solo"], ["individuals", "Individual players"], ["teams", "Teams"]] |  |  |
| relationship | How do they work together? | choice | [["cooperative", "Cooperatively"], ["competitive", "Competitively"], ["semiCooperative", "Shared goal with conflicting personal goals"]] |  |  |
| outcome | How does winning or losing work? | choice | [["shared", "Shared success or failure"], ["oneWinner", "One winner"], ["winningTeam", "Winning team"], ["oneLoser", "One loser"], ["custom", "Custom"]] |  |  |
| roles | Do players have different roles? | choice | [["same", "Same abilities"], ["different", "Different roles or abilities"]] |  |  |
| betweenTries | What happens between rounds or sessions? | choice | [["reset", "Everything resets"], ["carryForward", "Changes carry forward"], ["oneTry", "Intended to be played once"]] |  |  |

gameType.scope identifies its intended activity context. customOutcome, hiddenRoles, and traitor provide further authored detail. The summary renders selected meanings.


### Input and output


Add input (Sensor) and output (Actuator) attach compact I/O nodes to a mechanic. Sensor nodes use sensorType and firingCondition, combining older inputRequired/triggerCondition writing. Actuator nodes use actuatorType and outputBehaviour, combining older intensity/rhythm/sequence writing. A fallback/reset note is attached separately. These are designs; hardware is not controlled.


### Modifiers


Modifier definitions specify purpose, valid attachment targets, field controls, requiredness, options, and defaults. Examples include feedback, help when stuck, increasing pressure, cooperation, no-solo requirements, arbitration, discussion prompts, facilitator notes, timing/frequency, conditional activation, value, lifespan, spending, readiness, and player/team references. Appendix B contains every registered definition.


### Catalogues


Board-game catalogues cover action patterns, action probability, victory conditions, uncertainty, economy, auction, worker placement, movement, area control, set collection, and cards. Records carry their own description and category-specific fields, optional imagery, favorites, and variations. They can seed editable compositions. A mechanism description is not a programmed resolver.


## 11 Master Story and Story Dynamics


Master Story keeps the large act shape and a scheduling timeline. Master act nodes live in masterNodes; scheduled activity/travel records are represented in storyboardNodes. startMin, durationMin, marginBeforeMin, and marginAfterMin describe planned timing. The meta timeline defines the visible clock window and step size.

Opening an act prepares two internal lane containers, recorded in act.actLanes.story and act.actLanes.mechanics. Each uses ordinary nested graphs. Story and mechanics lanes can be resized/expanded and navigated independently. They do not introduce cross-lane edges or automatically alter the master schedule.

| Story Dynamics field | Meaning |
| --- | --- |
| curves[].id / label / color / points[] | Named drawn curves; points use normalized x/y from 0 to 100. |
| tags[].id / type / label / x / y / color | Memorable, problem, twist, victory, recovery, or note annotations. |
| durationMinutes | Whole-game elapsed duration; falls back to the Master Story timeline or four hours. |
| activities[].start / end | Proportional placement in the overview, displayed as elapsed minutes. |
| activities[].graph | Independent local curves/tags for the shorter activity. |
| activities[].sources[] | Contributors identified by coll, parentPath, nodeId, and retained title. |
| activities[].title / color / notes | Activity identity and authored context. |

Whole-game and activity curves do not sum or regenerate one another. Changing overall duration scales activity placement rather than curve shape. Sources can be multiple story or mechanic nodes, including nested ones; missing references stay visible for repair. Charts describe intended player experience, not measured emotional telemetry.


## 12 Story Wizard and specialist wizards


### Catalogue and generic setup


Story Wizard is the combined reference browser, replacing the separate Story Tools button. It browses green framework cards, brown concept cards, blue story structures and violet supporting templates. Framework/concept cards offer Start wizard, Add to canvas and Information; structures/templates offer insertion and information. Purposes are visible colored choices; source-type filters, optional search, and recommendation-fit filters help browsing. Framework information opens its explanatory reference; other information views show original descriptions, tree parts and questions without editing the source.

| Purpose | Intended result | Question focus |
| --- | --- | --- |
| character | Character | Motives, behaviour, strengths, limits, and change. |
| relationship | Relationship / group dynamic | Trust, conflict, roles, needs, and how people affect one another. |
| communication | Communication / dialogue plan | What is said, who hears it, what is understood, and what changes. |
| values | Values / dilemma | What matters, competing principles, and the cost of a choice. |
| scene | Scene / encounter plan | A playable situation, its decisions, and its consequences. |
| story | Story / act outline | Connected events, turning points, and change across an arc. |
| learning | Learning / discovery sequence | Experience, discovery, reflection, and trying a new approach. |
| style | Voice / presentation guide | Tone, viewpoint, imagery, and how the story reaches players. |

The generic setup puts Name this version first. Purpose choices are visible cards rather than a dropdown. Optional Situation/background and a compact result explanation sit alongside. Detailed fit/reference text is collapsed under About. A standalone version creates its own result; opening from an existing target retains that destination instead of presenting unrelated nodes. Saved versions retain their original purpose and target.

Concepts support role replacement and questions derived from their root questions, native question/choice/title nodes, and purpose-specific prompts. Framework fallback editors derive questions from phases and layouts. The generic flow offers source, setup, role adaptation where applicable, questions, review, and save. Saved sessions reopen their own answers and source snapshot; multiple uses stay distinct.


### FATE


The reference is organized around Focus, Authority, Tribe, and Emotion. The dedicated wizard has draft restoration, purpose-specific writing, simple/advanced detail, suggested choices, local suggestions, locks, and output review. Suggestions are deterministic, not an LLM call. Drafts and preferences are separate from saved profile sessions.

Character mode has its own workflow: Start, signal-based Focus, Authority, Tribe, Emotion, and description. Visual/audio/kinesthetic triggers have individual attention strengths and can describe ignored cues or custom triggers. Authority and Tribe can link existing character/group profiles or retain names without profiles. Tribe covers belonging, position, group stakes, loyalties, and behavior. Emotion includes recurring feelings and response patterns with strength and conditions. A live description and step navigation remain visible.

Communication mode concerns speaker/listener, intended outcome, credibility, audience belonging, emotion, and dialogue. Scene curves, message ordering, and communication output formats belong to that context. Shared stored FATE fields are not all shown in character mode.


### Kolb


The dedicated wizard uses Concrete Experience, Reflective Observation, Abstract Conceptualization, and Active Experimentation. It supports different entry points, repeated turns/cycles, purpose and detail settings, recorded observations/evidence, confirmation/partial/refutation possibilities, role/support choices, drafts, suggested additions, and output formatting. Mode labels adapt the process to the chosen writing task. Hypothetical experiment branches remain possible outcomes.


### Human Values


The dedicated wizard models what matters in an event and how its state changes. It includes setup, relevant values, participants/perspectives, causal chain, optional reveal/uncertainty, choices, arc, and review. Each value has context-dependent states rather than a compulsory good/bad judgment. Choice details include who decides and what each path changes. Draft, lock, suggestion, and provenance metadata preserve editing history.


### NLP Meta Programs


The specialist editor groups preferences and example behavior into steps. Character output can become connected local prose. Branch choices retain their own answers when switching preferences/archetypes in supported generic flows. Full-text rewrites stay protected from later answer edits.


### Dragon and the City


The Focused Workshop has City, Dragon, Responses, People and stakes, and Review. Escape, Defend, and Attack compare possible responses, not an already chosen outcome. Route buttons and columns have distinct colors and faint illustrations. Question fields expand within scrolling panels. The live description links back to exact fields. Review by questions and by nodes edits one answer bank.

Stable question/node bindings can store several answers on one existing native node. Wizard fields preserve layouts, types, edges, annotations, and custom prose. Missing nodes do not cause invented replacements. Legacy and additional writing remains available. The later idea of swapping a simple role node into a richer character/location/beat is not an implemented conversion workflow.


### Group Foundations


A dedicated group wizard stores its draft separately, supports optional institutional questions, linked or named members and relations, live description, and save/reopen of the same session. It is classified as a framework. Its source questions and data fields are listed in Appendix D.


### Outputs and provenance


narrativeWizard records sourceType/sourceId/sourceLabel, title, context, focus, roles, questions, answers, sessionId, resultId, and sourceSnapshot where relevant. questionIds maps answers to saved profile questions. attachedChildId locates an input tree. summaryFormat distinguishes specialized prose. History preserves multiple sessions. Formatters combine recorded information without asserting new story facts.


## 13 Library images annotations and transfers


Story Wizard browses reusable references and structures with guided and direct-insertion actions in one catalogue. Created Content browses developed products. Content classification uses explicit library role and record shape; characters, groups, story locations, items, story material, and conversations have separate categories. Templates remain in some narrative palette workflows; their further reorganization remains an open design task.

Image records commonly contain kind, name, and dataUrl. Some uploaded models retain metadata only. General uploads accept common raster formats, SVG, and selected 3D file types with an 8 MB input limit. Character/group portraits use their own upload control. Optional crop tools encode a WebP crop. Mechanism thumbnails use queued, lazy downscaled previews; generating a preview does not mean every stored original was compressed.

Frames and support anchors organize canvas content. Number/title markers, text, color, sizing, and alignment are visual editing features. Existing fields such as visibility, notes, or safety labels express authoring intent; they do not establish a separately authenticated player-facing portal.

Every editable narrative/mechanics node canvas now uses the same Annotate control and icon buttons in this order: Frame, Circle, Number, Letter, Title, Arrow, Spline. The expandable tray opens beneath the canvas toolbar and offers Close tools; Escape within the tray also closes it and returns focus to Annotate. This is shared across Narrative Weaver, Mechanics Weaver, nested character/concept/mechanic graphs, the Master Story graph, both Master Act lanes, library concept canvases, story/mechanic structure editors and both NodeStructureBuilder workspaces. The narrative-library builder's control is above the canvas rather than in its left palette. Both appearance modes use the same menu. Existing scope-specific annotation storage and undo remain in place; click events are not passed into optional canvas-position arguments.

Library copies retain content but repair/remap relationships as appropriate. Story Beat conversation/mechanic links are chosen anew in a different game. Conversation template speakers become names. Profile templates preserve saved inputs and frozen source trees. Full workspace backup is the durable transfer for both stores; release snapshots are separate export inputs.


## 14 Existing limitations and compatibility


| Present | Not established by its presence |
| --- | --- |
| Sensor status and battery fields | Live polling or connection to actual hardware. |
| Mechanic input/output nodes | ESP32 firmware, MQTT server, or automatic actuator commands. |
| Player totalPoints and outcome notes | Automatic scoring transactions, per-run score ledger, or duplicate-event protection. |
| Map locations and markers | A Trackimo feed, geofence task completion, or indoor positioning. |
| AI context exports and wizard suggestions | A connected model, provider API, portrait generation, or autonomous story assembly. |
| Timed nodes and written conditions | A background scheduler or automatic rule execution. |
| Relationship, member, and participant references | An inferred social relationship, fixed personality, or automatic player/character identity mapping. |
| Local save middleware | A production cloud database or synchronized multiuser game server. |

Current factories, saved records, and visible UI can differ because migrations retain older fields. Event/Quest map to Story Beat behavior. Original character templates may retain legacy questions/type groups. Filled older profile details remain under Earlier writing. Catalogues can contain deprecated or hidden mechanic nodes. The deep field appendices identify stored definitions; Appendix G is a static control index and includes conditional controls and explicitly hidden legacy branches.


## A Store and factory field catalogue


This appendix is generated from the inspected source factories and local-library metadata. Default values describe creation/compatibility behavior, not a statement that every property appears in the current inspector. Empty arrays do not specify the full row shape; the semantic sections and relevant editor controls provide those structures.


### Active project collections


| Field | Meaning | Current saved count or shape |
| --- | --- | --- |
| rev | Graph annotations or additional project data. | int |
| meta | Game identity, schedule, backdrop settings, GM rule selections, and character-card defaults. | 8 |
| items | Physical prop instances. | 8 |
| locations | Real venues and map overlays. | 4 |
| sensors | Hardware inventory instances. | 6 |
| mechanics | Legacy or linked game mechanic records. | 2 |
| facts | Authored knowledge/state/flag records. | 5 |
| nodes | Main narrative graph nodes. | 7 |
| edges | Main narrative graph connections. | 0 |
| subnodes | Narrative attachment records. | 10 |
| frameworks | Top-level reference diagram instances. | 0 |
| frames | Main graph group frames. | 0 |
| numberMarkers | Main graph numeric annotations. | 0 |
| titleMarkers | Main graph title annotations. | 0 |
| masterNodes | Master Story act graph nodes. | 5 |
| masterEdges | Act graph edges. | 4 |
| masterFrames | Act graph frames. | 0 |
| masterNumberMarkers | Graph annotations or additional project data. | 0 |
| masterTitleMarkers | Graph annotations or additional project data. | 0 |
| storyDynamicsGraph | Whole-game emotional chart and activities. | 6 |
| taskNodes | Mechanics graph nodes. | 3 |
| taskEdges | Mechanics graph edges. | 0 |
| taskFrames | Mechanics frames. | 0 |
| taskNumberMarkers | Graph annotations or additional project data. | 0 |
| taskTitleMarkers | Graph annotations or additional project data. | 0 |
| storyboardNodes | Scheduled activity/travel timeline records. | 6 |
| storyboardEdges | Storyboard connections. | 4 |
| storyboardFrames | Storyboard frames. | 0 |
| storyboardNumberMarkers | Graph annotations or additional project data. | 0 |
| storyboardTitleMarkers | Graph annotations or additional project data. | 0 |
| alignments | Cross-view authoring alignment references. | 0 |
| storyTrack | Legacy story track records. | 5 |
| teams | Game teams. | 3 |
| players | Real participants. | 8 |
| conversations | Shared scripted or established story exchanges. | 0 |

Specialized drafts and preferences are added by migrations/actions: fateWizardDrafts/preferences, kolbWizardDrafts/preferences, valuesWizardDrafts/preferences, and groupWizardDrafts as supported in the store. Their exact field keys are indexed below from the reducer and wizard defaults.


### Project metadata


| Path | Factory default |
| --- | --- |
| name | Example game |
| prefix | GAME |
| backdrops.header.image | null |
| backdrops.header.opacity | 0.34 |
| backdrops.content.image | null |
| backdrops.content.opacity | 0.25 |
| timeline.startMin | 540 |
| timeline.endMin | 1020 |
| timelineStep | 30 |
| gmRuleIds | [] |
| characterCardTemplate.questions | [{"id": "ccq-mvqyfsl7-ev8qto", "prompt": "What do they want, and why right now?", "answer": ""}, {"id": "ccq-mvqyfsl7-7r0k49", "prompt": "What would they never do?", "answer": ""}, {"id": "ccq-mvqyfsl7-2jwbsf", "prompt": "What do they give a team - object, information, or permission?", "answer": ""}, {"id": "ccq-mvqyfsl7-zuqnvt", "prompt": "One sentence only this character could say.", "answer": ""}, {"id": "ccq-mvqyfsl7-uf2bq7", "prompt": "What does a team see or hear in the first ten seconds?", "answer": ""}] |
| characterCardTemplate.typeGroups | [{"id": "ccg-mvqyfsl7-jmcrn8", "label": "Role", "options": [{"id": "cco-mvqyfsl7-2epy07", "label": "Guide"}, {"id": "cco-mvqyfsl7-cu4805", "label": "Antagonist"}, {"id": "cco-mvqyfsl7-6j3rxr", "label": "Gatekeeper"}, {"id": "cco-mvqyfsl7-1lkv9i", "label": "Ensemble"}, {"id": "cco-mvqyfsl7-8efdhn", "label": "Lore figure"}], "selectedId": null}, {"id": "ccg-mvqyfsl7-loxcrq", "label": "Archetype", "options": [{"id": "cco-mvqyfsl7-t5corn", "label": "Explorer"}, {"id": "cco-mvqyfsl7-6beja7", "label": "Sage"}, {"id": "cco-mvqyfsl7-fp04la", "label": "Muse"}, {"id": "cco-mvqyfsl7-ajut1w", "label": "Rebel"}, {"id": "cco-mvqyfsl7-l49w96", "label": "Defender"}, {"id": "cco-mvqyfsl7-crz5gt", "label": "Warrior"}], "selectedId": null}] |


### Library collections


| Collection | Saved records |
| --- | --- |
| mechanics | 6 |
| sensors | 5 |
| items | 9 |
| locations | 4 |
| narrative | 5 |
| mechPrimitives | 13 |
| mechSubnodes | 22 |
| itemTypes | 8 |
| narrativeCategories | 7 |
| mechanicRestrictionTypes | 5 |
| mechanicInteractionTypes | 7 |
| mechanicSensorTypes | 5 |
| mechanicActuatorTypes | 6 |
| mechanicCharacterEmotionTypes | 7 |
| gmRules | 3 |
| stories | 2 |
| mechStructures | 26 |
| concepts | 45 |
| mechanicSequenceModes | 1 |
| actionPatternMechanisms | 23 |
| actionProbabilityMechanisms | 26 |
| victoryConditionMechanisms | 21 |
| uncertaintyMechanisms | 14 |
| economyMechanisms | 20 |
| auctionMechanisms | 18 |
| workerPlacementMechanisms | 8 |
| movementMechanisms | 24 |
| areaControlMechanisms | 8 |
| setCollectionMechanisms | 5 |
| cardMechanisms | 9 |
| mechanicsSources | 0 |
| conversationTemplates | 0 |


### Project factory items


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| templateId | null |
| name | New item |
| type | gadget |
| buildStatus | concept |
| availability | ready |
| description |  |
| propNotes |  |
| origin |  |
| loreNotes |  |
| persistsAcrossTasks | False |
| locationId | null |
| mechanicIds | [] |
| sensorReqs | [] |
| image | null |
| assignedTo | null |

CSV headers: id, name, type, typeName, buildStatus, availability, assignedTo, description, propNotes, origin, loreNotes, persistsAcrossTasks, locationId, locationName, mechanicIds, mechanicNames, sensorReqs, sensorReqNames.


### Project factory locations


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| templateId | null |
| name | New location |
| zone |  |
| notes |  |
| safety |  |
| image | null |
| sensorIds | [] |
| schematic | null |
| mapKind | schematic |
| osm.lat | 56.9496 |
| osm.lon | 24.1052 |
| osm.zoom | 16 |
| markers | [] |
| arrows | [] |

CSV headers: id, name, zone, notes, safety, sensorIds, sensorNames.


### Project factory players


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| name | New player |
| nickname |  |
| initials | NP |
| role | Player |
| teamId | null |
| flags | [] |
| image | null |
| personality |  |
| experience |  |
| strengths |  |
| weaknesses |  |
| motivation |  |
| communicationStyle |  |
| preferredRole |  |
| comfortNotes |  |
| safetyNotes |  |
| observerNotes |  |
| previousGames |  |
| totalPoints | 0 |
| stagePoints |  |
| achievements |  |
| accomplishments |  |
| performanceNotes |  |
| stageHistory |  |
| gmRewards |  |
| playerTypeIds | [] |

CSV headers: id, name, nickname, initials, role, teamId, teamName, flags, personality, experience, strengths, weaknesses, motivation, communicationStyle, preferredRole, comfortNotes, safetyNotes, observerNotes, previousGames, totalPoints, stagePoints, achievements, accomplishments, performanceNotes, stageHistory, gmRewards, playerTypeIds.


### Project factory nodes


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| kind | story |
| title | New story beat |
| x | 80 |
| y | 80 |
| body |  |
| color | null |
| image | null |
| locationId | null |
| itemId | null |
| mechanicIds | [] |
| sensorIds | [] |

CSV headers: id, kind, kindName, title, teamId, teamName, x, y, color, body, storyBeat, itemId, itemName, locationId, locationName, mechanicIds, mechanicNames, sensorIds, sensorNames, connectsTo, connectsToTitles.


### Project factory taskNodes


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| kind | task |
| title | New mechanics task |
| x | 80 |
| y | 80 |
| body |  |
| color | null |
| primitiveId | null |
| sub.nodes | {} |
| sub.edges | [] |
| sub.frames | {} |
| sub.numberMarkers | {} |
| sub.titleMarkers | {} |

CSV headers: id, kind, kindName, title, x, y, color, description, primitiveId, mechKind, physicalKind, subnodeKind, estimatedMinutes, minPlayers, maxPlayers, connectsTo, connectsToTitles.


### Library factory items


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| name | New item template |
| type | gadget |
| description |  |
| propNotes |  |
| loreNotes |  |
| origin |  |
| persistsAcrossTasks | False |
| mechanicIds | [] |
| sensorReqs | [] |
| image | null |


### Library factory locations


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| name | New location template |
| notes |  |
| safety |  |
| image | null |


### Library factory mechanics


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| name | New mechanic |
| summary |  |
| params | [] |


### Library factory sensors


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| kind | New sensor type |
| label |  |


### Library factory narrative


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| nodeClass | base |
| nodeKind | event |
| name | New event template |
| category | event |
| color | #5CA8F5 |
| icon | zap |
| body |  |
| tags | [] |
| inputs | ["in"] |
| outputs | ["out"] |


### Library factory mechPrimitives


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| name | New mechanic node |
| mechKind | cooperation |
| baseKind | mechanic |
| color | #A87BF0 |
| icon | users |
| inputs | ["in"] |
| outputs | ["out"] |
| defaultBody |  |
| estMinutes | 5 |
| crew | 0 |
| refs | {} |
| collapseDepth | 0 |
| oldNode | False |


### Library factory mechSubnodes


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| kind | progressiveFeedback |
| name | Progressive Feedback Mod |
| purpose | Forces the designer to define how success in one part of the task makes the next part easier or more obvious. Creates a positive feedback loop so players feel progress. |
| description | Forces the designer to define how success in one part of the task makes the next part easier or more obvious. Creates a positive feedback loop so players feel progress. |
| color | #58C7A6 |
| icon | zap |
| category | gameplayModifiers |
| reusable | False |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["cooperation", "taskTemplate"] |
| collapseDepth | 0 |
| fields.feedbackType | [] |
| fields.triggerCondition |  |
| fields.effectDescription |  |
| fields.strengthIntensity | Subtle |
| fields.canStack | False |
| oldNode | False |


### Library factory mechanicRestrictionTypes


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| label | Custom restriction |
| custom | True |


### Library factory mechanicInteractionTypes


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| label | Custom interaction |
| custom | True |


### Library factory mechanicSensorTypes


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| label | Custom sensor |
| custom | True |


### Library factory mechanicActuatorTypes


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| label | Custom actuator |
| custom | True |


### Library factory mechanicCharacterEmotionTypes


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| label | Custom emotion |
| custom | True |


### Library factory mechanicSequenceModes


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| label | Custom |
| custom | True |


### Library factory actionPatternMechanisms


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| system | special |
| label | New mechanism |
| description |  |
| image | null |
| imageScale | 1 |
| imagePositionX | 0 |
| imagePositionY | 0 |
| advantages | [""] |
| effects | [""] |
| variations | [""] |
| custom | True |


### Library factory actionProbabilityMechanisms


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| kind | probability |
| label | New resolution |
| description |  |
| variations | [""] |
| emotionalSpike |  |
| effects | [""] |
| image | null |
| imageScale | 1 |
| imagePositionX | 0 |
| imagePositionY | 0 |
| custom | True |


### Library factory victoryConditionMechanisms


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| kind | victory |
| label | New victory condition |
| category | Victory Condition |
| description |  |
| variations | [""] |
| effects | [""] |
| image | null |
| imageScale | 1 |
| imagePositionX | 0 |
| imagePositionY | 0 |
| color | #43BF87 |
| custom | True |


### Library factory uncertaintyMechanisms


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| kind | uncertainty |
| label | New uncertainty mechanism |
| category | Uncertainty |
| description |  |
| variations | [""] |
| effects | [""] |
| image | null |
| imageScale | 1 |
| imagePositionX | 0 |
| imagePositionY | 0 |
| color | #A87BF0 |
| custom | True |


### Library factory economyMechanisms


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| kind | economy |
| label | New economy mechanism |
| category | Economy |
| description |  |
| variations | [""] |
| effects | [""] |
| image | null |
| imageScale | 1 |
| imagePositionX | 0 |
| imagePositionY | 0 |
| color | #E0A23C |
| custom | True |


### Library factory auctionMechanisms


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| kind | auction |
| label | New auction mechanism |
| category | Auctions |
| description |  |
| variations | [""] |
| effects | [""] |
| image | null |
| imageScale | 1 |
| imagePositionX | 0 |
| imagePositionY | 0 |
| color | #A87BF0 |
| custom | True |


### Library factory workerPlacementMechanisms


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| kind | workerPlacement |
| label | New worker placement mechanism |
| category | Worker Placement |
| description |  |
| variations | [""] |
| effects | [""] |
| image | null |
| imageScale | 1 |
| imagePositionX | 0 |
| imagePositionY | 0 |
| color | #5CA8F5 |
| custom | True |


### Library factory movementMechanisms


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| kind | movement |
| label | New movement mechanism |
| category | Movement |
| description |  |
| variations | [""] |
| effects | [""] |
| image | null |
| imageScale | 1 |
| imagePositionX | 0 |
| imagePositionY | 0 |
| color | #3EC6D6 |
| custom | True |


### Library factory areaControlMechanisms


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| kind | areaControl |
| label | New area control mechanism |
| category | Area Control |
| description |  |
| variations | [""] |
| effects | [""] |
| image | null |
| imageScale | 1 |
| imagePositionX | 0 |
| imagePositionY | 0 |
| color | #43BF87 |
| custom | True |


### Library factory setCollectionMechanisms


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| kind | setCollection |
| label | New set collection mechanism |
| category | Set Collection |
| description |  |
| variations | [""] |
| effects | [""] |
| image | null |
| imageScale | 1 |
| imagePositionX | 0 |
| imagePositionY | 0 |
| color | #E8D25C |
| custom | True |


### Library factory cardMechanisms


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| kind | cardMechanism |
| label | New card mechanism |
| category | Card Mechanisms |
| description |  |
| variations | [""] |
| effects | [""] |
| image | null |
| imageScale | 1 |
| imagePositionX | 0 |
| imagePositionY | 0 |
| color | #F08CB4 |
| custom | True |


### Library factory stories


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| name | New structure |
| description |  |
| estMinutes | 15 |
| usesBaseConcept | False |
| baseConceptId | null |
| nodes | {} |
| edges | [] |
| frameworks | {} |
| frames | {} |
| numberMarkers | {} |
| titleMarkers | {} |


### Library factory mechStructures


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| name | New mechanic structure |
| description |  |
| estMinutes | 10 |
| nodes | {} |
| edges | [] |
| numberMarkers | {} |
| titleMarkers | {} |


### Library factory gmRules


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| title | New game master rule |
| principle |  |
| implementation |  |
| rationale |  |
| aiRule |  |


### Library factory concepts


| Field path | Creation default |
| --- | --- |
| id | EXAMPLE |
| category | storyConcept |
| name | New concept |
| description |  |
| conceptType | unset |
| status | seed |
| onePromise |  |
| referenceFrameworkIds | [] |
| premade | False |
| questions | [] |
| example | {} |
| nodes | {} |
| edges | [] |
| frameworks | {} |
| frames | {} |
| numberMarkers | {} |
| titleMarkers | {} |


## B Node and modifier definitions


### Base narrative nodes


| Key | Definition |
| --- | --- |
| storyBeat | {"id": "storyBeat", "label": "Story Beat", "color": "#5CA8F5", "icon": "flag", "blurb": "A story moment with optional situation, objective, dialogue and gameplay sections."} |
| character | {"id": "character", "label": "Character", "color": "#E0A23C", "icon": "user", "blurb": "A person in the story — NPC, actor role, or figure."} |
| group | {"id": "group", "label": "Group / Institution", "color": "#73CCB2", "icon": "users", "blurb": "A family, band, guild, faction or institution with its own purpose and linked members."} |
| storyLocation | {"id": "storyLocation", "label": "Story Location", "color": "#43BF87", "icon": "pin", "blurb": "A place as the story sees it (link it to a real venue record)."} |
| item | {"id": "item", "label": "Story Item", "color": "#3EC6D6", "icon": "box", "blurb": "An object that matters to the story; optionally link it to a physical prop."} |


### Concept internal nodes


| Key | Definition |
| --- | --- |
| conceptTitle | {"id": "conceptTitle", "label": "Section Title", "color": "#E8D25C", "icon": "layers", "blurb": "A heading that visually groups concept questions."} |
| conceptQuestion | {"id": "conceptQuestion", "label": "Concept Question", "color": "#5CA8F5", "icon": "book", "blurb": "A design question inside a concept; connect it to choices."} |
| conceptChoice | {"id": "conceptChoice", "label": "Concept Choice", "color": "#A87BF0", "icon": "swap", "blurb": "A possible answer, angle, or path from a concept question."} |


### Narrative supporting kinds


| Key | Definition |
| --- | --- |
| beat | {"id": "beat", "label": "Beat", "color": "#5CA8F5", "icon": "flag", "blurb": "A scene — what happens at a place and time."} |
| reveal | {"id": "reveal", "label": "Reveal", "color": "#F08CB4", "icon": "zap", "blurb": "Deliver information: a clue, an NPC line, a discovered prop."} |
| branch | {"id": "branch", "label": "Branch", "color": "#E0A23C", "icon": "swap", "blurb": "A decision point. Each outgoing link carries a plain-language condition a GM or sensor decides."} |
| fact | {"id": "fact", "label": "Fact change", "color": "#3EC6D6", "icon": "cog", "blurb": "Records a real-world fact as now true — key held, door open, NPC hostile."} |
| converge | {"id": "converge", "label": "Convergence", "color": "#A87BF0", "icon": "pin", "blurb": "Where divergent paths rejoin — keeps the story resilient."} |
| timed | {"id": "timed", "label": "Timed event", "color": "#E8D25C", "icon": "clock", "blurb": "Fires at a clock time regardless of player action."} |
| recovery | {"id": "recovery", "label": "Recovery", "color": "#E86464", "icon": "cross", "blurb": "A soft-fail nudge that puts a stalled team back in play — never a dead end."} |


### Concept categories


| Key | Definition |
| --- | --- |
| storyConcept | {"id": "storyConcept", "label": "Story Concept", "color": "#E8D25C", "icon": "book"} |
| characterConcept | {"id": "characterConcept", "label": "Character Concept", "color": "#E5B94E", "icon": "user"} |
| functionConcept | {"id": "functionConcept", "label": "Function", "color": "#D9A23C", "icon": "cog"} |
| structureConcept | {"id": "structureConcept", "label": "Structure Concept", "color": "#C98F2E", "icon": "layers"} |
| styleConcept | {"id": "styleConcept", "label": "Style Concept", "color": "#E8C97E", "icon": "heart"} |


### Task detail types


| Key | Definition |
| --- | --- |
| placement | {"id": "placement", "label": "Placement", "color": "#43BF87", "icon": "pin", "blurb": "Where players and props stand or go."} |
| rule | {"id": "rule", "label": "Rule", "color": "#E0A23C", "icon": "cog", "blurb": "How it works — tries, sizes, timings, win / lose."} |
| prop | {"id": "prop", "label": "Prop / kit", "color": "#3EC6D6", "icon": "swap", "blurb": "The physical equipment this task needs."} |
| power | {"id": "power", "label": "Power", "color": "#A87BF0", "icon": "zap", "blurb": "A special ability a team may use here."} |
| effect | {"id": "effect", "label": "Effect", "color": "#F08CB4", "icon": "alert", "blurb": "Lights, sound, or staged special effects."} |


### Narrative enrichment defaults


#### outcomeBranches


| Field path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | outcomeBranches |
| title | Outcome Branches |
| x | 80 |
| y | 80 |
| parentRef | null |
| notes |  |
| keywords | [] |
| history | [] |
| mode | choice |
| selectionType | single |
| branches | [{"label": "Branch A", "outcome": "", "mechanicId": null}, {"label": "Branch B", "outcome": "", "mechanicId": null}] |

#### relChange


| Field path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | relChange |
| title | Relationship / Status Change |
| x | 80 |
| y | 80 |
| parentRef | null |
| notes |  |
| keywords | [] |
| history | [] |
| relType |  |
| targets |  |
| direction | yes |
| intensity |  |
| trigger |  |
| effects |  |
| mechanicId | null |

#### internalState


| Field path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | internalState |
| title | Internal State |
| x | 80 |
| y | 80 |
| parentRef | null |
| notes |  |
| keywords | [] |
| history | [] |
| stateType |  |
| level |  |
| trigger |  |
| effects |  |
| mechanicId | null |

#### locationArchetype


| Field path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | locationArchetype |
| title | Location Archetype |
| x | 80 |
| y | 80 |
| parentRef | null |
| notes |  |
| keywords | [] |
| history | [] |
| archetype | Dangerous Place |
| influence |  |

#### narrativeResponse


| Field path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | narrativeResponse |
| title | Narrative Response |
| x | 80 |
| y | 80 |
| parentRef | null |
| notes |  |
| keywords | [] |
| history | [] |
| text |  |

#### emotionalTone


| Field path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | emotionalTone |
| title | Emotional Tone |
| x | 80 |
| y | 80 |
| parentRef | null |
| notes |  |
| keywords | [] |
| history | [] |
| tags | [] |

#### comment


| Field path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | comment |
| title | Comment |
| x | 80 |
| y | 80 |
| parentRef | null |
| notes |  |
| keywords | [] |
| history | [] |

#### characterState


| Field path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | characterState |
| title | Character State |
| x | 80 |
| y | 80 |
| parentRef | null |
| notes |  |
| keywords | [] |
| history | [] |
| emotionalState | Neutral |
| behavioralNotes |  |
| effects |  |

#### value


| Field path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | value |
| title | Value |
| x | 80 |
| y | 80 |
| parentRef | null |
| notes |  |
| keywords | [] |
| history | [] |
| purpose | Defines numeric or tradable value of an item or resource. |
| initialValue |  |
| currentValue |  |
| maxValue |  |

#### lifespan


| Field path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | lifespan |
| title | Lifespan |
| x | 80 |
| y | 80 |
| parentRef | null |
| notes |  |
| keywords | [] |
| history | [] |
| purpose | Defines how long this item or resource persists across tasks or sessions. |
| lifespanType | Task only |
| description |  |

#### spendUseRule


| Field path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | spendUseRule |
| title | Spend / Use Rule |
| x | 80 |
| y | 80 |
| parentRef | null |
| notes |  |
| keywords | [] |
| history | [] |
| purpose | Defines how this item or resource can be spent, used, or consumed. |
| usageRules |  |
| limitations |  |


### Library mechanic primitives


#### Game Type


Identity: LIB-MPRIM-GAME-TYPE.

| Field path | Definition or default |
| --- | --- |
| id | LIB-MPRIM-GAME-TYPE |
| name | Game Type |
| mechKind | gameType |
| category | action |
| baseKind | mechanic |
| color | #65D6D0 |
| icon | users |
| defaultBody | Who plays, how they work together, and what happens between tries. |
| gameType.scope | activity |
| w | 290 |
| inputs | ["in"] |
| outputs | ["out"] |
| refs | {} |
| collapseDepth | 0 |
| oldNode | False |

#### Goal


Identity: LIB-MPRIM-GOAL.

| Field path | Definition or default |
| --- | --- |
| id | LIB-MPRIM-GOAL |
| name | Goal |
| mechKind | goal |
| category | action |
| baseKind | mechanic |
| color | #E8D25C |
| icon | target |
| defaultBody | Describe what the player is going to achieve. |
| inputs | ["in"] |
| outputs | ["achieved"] |
| refs | {} |
| collapseDepth | 0 |
| oldNode | False |

#### Task Template


Identity: LIB-MPRIM-TASK-TEMPLATE.

| Field path | Definition or default |
| --- | --- |
| id | LIB-MPRIM-TASK-TEMPLATE |
| name | Task Template |
| mechKind | taskTemplate |
| baseKind | mechanic |
| color | #8B7BF5 |
| icon | layers |
| inputs | ["start"] |
| outputs | ["complete", "branch"] |
| defaultBody | Reusable collapsed container for a complete task graph. Expand to edit the internal mechanics. |
| estMinutes | 20 |
| minPlayers | 3 |
| maxPlayers | 7 |
| crew | 0 |
| recommendedCrew |  |
| refs | {} |
| collapseDepth | 1 |
| difficultyPressure | Medium |
| reusableAsLibraryTemplate | True |
| oldNode | True |

#### Cooperation


Identity: LIB-MPRIM-COOPERATION.

| Field path | Definition or default |
| --- | --- |
| id | LIB-MPRIM-COOPERATION |
| name | Cooperation |
| mechKind | cooperation |
| baseKind | mechanic |
| category | mechanic |
| color | #A87BF0 |
| icon | users |
| inputs | ["in"] |
| outputs | ["out"] |
| defaultBody | Define how players coordinate, divide roles, or act together. |
| estMinutes | 5 |
| crew | 0 |
| refs | {} |
| collapseDepth | 0 |
| cooperationStyle | Parallel |
| attachedSubnodeIds | [] |
| oldNode | True |

#### Physical Restriction


Identity: LIB-MPRIM-PHYSICAL-RESTRICTION.

| Field path | Definition or default |
| --- | --- |
| id | LIB-MPRIM-PHYSICAL-RESTRICTION |
| name | Physical Restriction |
| mechKind | physicalRestriction |
| baseKind | state |
| color | #E86464 |
| icon | cross |
| inputs | ["apply"] |
| outputs | ["restricted", "released"] |
| defaultBody | Applies a body, movement, communication, or carrying limitation with explicit safety and stop rules. |
| estMinutes | 1 |
| crew | 1 |
| refs | {} |
| collapseDepth | 0 |
| restrictionType | Blindfold |
| connectTo.nodeIds | [] |
| safetyRule |  |
| stopCondition |  |
| noteColor | #E86464 |
| attachedSubnodeIds | [] |
| oldNode | True |

#### Prop Interaction


Identity: LIB-MPRIM-PROP-INTERACTION.

| Field path | Definition or default |
| --- | --- |
| id | LIB-MPRIM-PROP-INTERACTION |
| name | Prop Interaction |
| mechKind | propInteraction |
| baseKind | objective |
| color | #E0A23C |
| icon | swap |
| inputs | ["in"] |
| outputs | ["success", "fail", "reset"] |
| defaultBody | Defines how players manipulate existing physical item/artifact records: carry, balance, sort, throw, assemble, unlock, or trade. |
| estMinutes | 8 |
| crew | 0 |
| refs | {} |
| collapseDepth | 0 |
| interactionType | Balance |
| successCondition |  |
| failureCondition |  |
| resetProcedure |  |
| connectTo.itemIds | [] |
| connectTo.sensorIds | [] |
| connectTo.nodeIds | [] |
| connectTo.ideas | [] |
| noteColor | #E0A23C |
| attachedSubnodeIds | [] |
| oldNode | True |

#### Sensor Node


Identity: LIB-MPRIM-SENSOR-NODE.

| Field path | Definition or default |
| --- | --- |
| id | LIB-MPRIM-SENSOR-NODE |
| name | Sensor Node |
| mechKind | sensorNode |
| baseKind | sensor |
| color | #3EC6D6 |
| icon | zap |
| inputs | ["watch"] |
| outputs | ["triggered"] |
| defaultBody | Gameplay sensor: what it detects, what input activates it, and when it should trigger in the game. |
| estMinutes | 1 |
| crew | 0 |
| refs | {} |
| collapseDepth | 0 |
| sensorType | Pressure |
| zoneReference |  |
| inputRequired |  |
| triggerCondition |  |
| nodeColor | #3EC6D6 |
| manualOverrideFallback |  |
| reliability | 3 |
| frequencyLimitEnabled | False |
| frequencyTriggerCount | 1 |
| frequencyTimePeriod | 1 minute |
| cooldownEnabled | False |
| cooldownDuration | 30 seconds |
| oldNode | False |
| firingCondition |  |

#### Actuator Node


Identity: LIB-MPRIM-ACTUATOR-NODE.

| Field path | Definition or default |
| --- | --- |
| id | LIB-MPRIM-ACTUATOR-NODE |
| name | Actuator Node |
| mechKind | actuatorNode |
| baseKind | mechanic |
| color | #5CA8F5 |
| icon | flag |
| inputs | ["activate"] |
| outputs | ["effect"] |
| defaultBody | Gameplay output: what happens in the world when this actuator fires. |
| estMinutes | 1 |
| crew | 0 |
| refs | {} |
| collapseDepth | 0 |
| actuatorType | Light |
| audioFileRef |  |
| outputDuration |  |
| outputIntensity |  |
| outputRhythm |  |
| resetBehavior |  |
| nodeColor | #5CA8F5 |
| manualOverrideFallback |  |
| frequencyLimitEnabled | False |
| frequencyTriggerCount | 1 |
| frequencyTimePeriod | 1 minute |
| cooldownEnabled | False |
| cooldownDuration | 30 seconds |
| oldNode | False |
| outputBehaviour |  |

#### BG Mechanics


Identity: LIB-MPRIM-ACTION.

| Field path | Definition or default |
| --- | --- |
| id | LIB-MPRIM-ACTION |
| name | BG Mechanics |
| mechKind | action |
| category | action |
| baseKind | mechanic |
| color | #58C7A6 |
| icon | zap |
| inputs | ["available"] |
| outputs | ["complete"] |
| defaultBody | One atomic physical, cognitive, or social step performed by a player or team. |
| estMinutes | 1 |
| crew | 0 |
| refs | {} |
| collapseDepth | 0 |
| attachedSubnodeIds | [] |
| advantages | [""] |
| effects | [""] |
| variations | [""] |
| tokenMechanismId |  |
| orderMechanismId |  |
| specialMechanismId |  |
| oldNode | False |

#### Instructions for players


Identity: LIB-MPRIM-PLAYER-INSTRUCTION.

| Field path | Definition or default |
| --- | --- |
| id | LIB-MPRIM-PLAYER-INSTRUCTION |
| name | Instructions for players |
| mechKind | playerFacingInstruction |
| category | supporting |
| baseKind | mechanic |
| color | #E8D25C |
| icon | book |
| inputs | ["in"] |
| outputs | ["out"] |
| defaultBody |  |
| estMinutes | 1 |
| crew | 0 |
| refs | {} |
| collapseDepth | 0 |
| oldNode | False |

#### Character State


Identity: LIB-MPRIM-CHARACTER-STATE.

| Field path | Definition or default |
| --- | --- |
| id | LIB-MPRIM-CHARACTER-STATE |
| name | Character State |
| mechKind | characterState |
| baseKind | state |
| color | #F08CB4 |
| icon | user |
| inputs | ["observe"] |
| outputs | ["respond", "change"] |
| defaultBody | Pre-programmed character/NPC state for dialogue trees and AI agent behavior. |
| estMinutes | 1 |
| crew | 0 |
| refs | {} |
| collapseDepth | 0 |
| emotionalState | Neutral |
| behavioralNotes |  |
| nodeColor | #F08CB4 |
| attachedSubnodeIds | [] |
| deprecated | True |
| hiddenFromPalette | True |
| migrationHint | Character State has moved to Narrative Subnodes. Use the narrative Character State subnode for future story/dialogue behavior. |
| oldNode | True |

#### Sensor Trigger


Identity: LIB-MPRIM-SENSOR.

| Field path | Definition or default |
| --- | --- |
| id | LIB-MPRIM-SENSOR |
| name | Sensor Trigger |
| baseKind | sensor |
| color | #3EC6D6 |
| icon | zap |
| inputs | ["arm"] |
| outputs | ["fired"] |
| defaultBody | This node is deprecated. Its functionality has been merged into the Sensor node. |
| estMinutes | 1 |
| crew | 0 |
| deprecated | True |
| hiddenFromPalette | True |
| migrationHint | Use Sensor Node instead. This node is deprecated. Its functionality has been merged into the Sensor node. |
| oldNode | True |

#### Progress State


Identity: LIB-MPRIM-PROGRESS-STATE.

| Field path | Definition or default |
| --- | --- |
| id | LIB-MPRIM-PROGRESS-STATE |
| name | Progress State |
| baseKind | mechanic |
| color | #A87BF0 |
| icon | pin |
| inputs | ["advance"] |
| outputs | ["milestone"] |
| defaultBody | Tracks a game milestone or phase change that other mechanics can react to. |
| estMinutes | 1 |
| crew | 0 |
| mechKind | progressState |
| category | supporting |
| currentProgress | 1 |
| visualStyle | Segmented bar |
| oldNode | False |


### Mechanic field sections used by the inspector


#### taskTemplate


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| estMinutes | Estimated Duration | number | [] |  | {"required": true, "suffix": "minutes"} |
| playerCount | Player Count | range | [] |  | {"minKey": "minPlayers", "maxKey": "maxPlayers", "required": true} |
| recommendedCrew | Recommended Crew | text | [] |  |  |
| difficultyPressure | Difficulty / Pressure | select | ["Low", "Medium", "High", "Extreme"] |  |  |
| reusableAsLibraryTemplate | Reusable as Library Template | checkbox | [] |  |  |

#### cooperation


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| cooperationStyle | Cooperation Style | select | ["Solo", "Parallel", "Relay", "Synchronous", "Asymmetric"] |  | {"required": true} |
| attachedSubnodeIds | Cooperation Modifiers | container | [] | Attach role, no-solo, discussion, arbitration, or another relevant gameplay modifier. | {"candidate": "subnode"} |

#### physicalRestriction


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| restrictionType | Restriction Type | selectCustom | [] |  | {"required": true, "collection": "mechanicRestrictionTypes", "idPrefix": "RST-"} |
| connectTo | Connect To | references | [] |  | {"required": true} |
| safetyRule | Safety Rule | textarea | [] |  |  |
| stopCondition | Stop Condition | textarea | [] |  |  |
| attachedSubnodeIds | Attached Subnodes | container | [] | Assign modifier subnodes from this graph, such as Progressive Feedback, Fail-Safe, or Escalating Pressure. | {"candidate": "subnode"} |
| noteColor | Note Color | color | [] |  |  |

#### propInteraction


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| interactionType | Interaction Type | selectCustom | [] |  | {"required": true, "collection": "mechanicInteractionTypes", "idPrefix": "PIT-"} |
| successCondition | Success Condition | textarea | [] |  | {"required": true} |
| failureCondition | Failure Condition | textarea | [] |  |  |
| resetProcedure | Reset Procedure | textarea | [] |  |  |
| connectTo | Connect To | propReferences | [] |  |  |
| attachedSubnodeIds | Attached Subnodes | container | [] | Assign modifier subnodes from this graph, such as Progressive Feedback, Fail-Safe, or Escalating Pressure. | {"candidate": "subnode"} |
| noteColor | Note Color | color | [] |  |  |

#### sensorNode


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| sensorType | Sensor Type | selectCustom | [] |  | {"required": true, "collection": "mechanicSensorTypes", "idPrefix": "SNT-"} |
| zoneReference | Zone Reference | text | [] |  |  |
| firingCondition | What has to be true for this to fire? | textarea | [] |  | {"required": true} |
| frequencyLimitEnabled | Limit how often this happens | checkbox | [] |  |  |
| frequencyTriggerCount | Number of triggers | number | [] |  | {"showWhen": {"expression": "(node) => !!node?.frequencyLimitEnabled"}} |
| frequencyTimePeriod | Time period | select | ["5 seconds", "30 seconds", "1 minute", "2 minutes", "5 minutes", "10 minutes"] |  | {"showWhen": {"expression": "(node) => !!node?.frequencyLimitEnabled"}} |
| cooldownEnabled | Cooldown | checkbox | [] |  | {"showWhen": {"expression": "(node) => !!node?.frequencyLimitEnabled"}} |
| cooldownDuration | Cooldown duration | select | ["5 seconds", "30 seconds", "1 minute", "2 minutes", "5 minutes", "10 minutes"] |  | {"showWhen": {"expression": "(node) => !!node?.frequencyLimitEnabled && !!node?.cooldownEnabled"}} |
| reliability | Reliability | select | ["1", "2", "3", "4", "5"] |  | {"defaultValue": "3"} |
| nodeColor | Node Color | color | [] |  |  |

#### actuatorNode


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| actuatorType | Actuator Type | selectCustom | [] |  | {"required": true, "collection": "mechanicActuatorTypes", "idPrefix": "ACT-"} |
| audioFileRef | Audio File Reference | text | [] |  | {"showWhen": {"expression": "(node) => String(node?.actuatorType \|\| '').toLowerCase() === 'sound'"}} |
| frequencyLimitEnabled | Limit how often this happens | checkbox | [] |  |  |
| frequencyTriggerCount | Number of triggers | number | [] |  | {"showWhen": {"expression": "(node) => !!node?.frequencyLimitEnabled"}} |
| frequencyTimePeriod | Time period | select | ["5 seconds", "30 seconds", "1 minute", "2 minutes", "5 minutes", "10 minutes"] |  | {"showWhen": {"expression": "(node) => !!node?.frequencyLimitEnabled"}} |
| cooldownEnabled | Cooldown | checkbox | [] |  | {"showWhen": {"expression": "(node) => !!node?.frequencyLimitEnabled"}} |
| cooldownDuration | Cooldown duration | select | ["5 seconds", "30 seconds", "1 minute", "2 minutes", "5 minutes", "10 minutes"] |  | {"showWhen": {"expression": "(node) => !!node?.frequencyLimitEnabled && !!node?.cooldownEnabled"}} |
| outputBehaviour | How it plays | textarea | [] |  | {"placeholder": "Two short buzzes, then a rising tone, loud enough for the courtyard, then silence."} |
| outputDuration | Output Duration | text | [] |  |  |
| nodeColor | Node Color | color | [] |  |  |

#### action


#### playerFacingInstruction


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| body | Instructions for players | textarea | [] |  | {"required": true} |

#### actionSequence


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| sequenceMode | Sequence Mode | selectCustom | [] |  | {"required": true, "collection": "mechanicSequenceModes", "idPrefix": "SQM-"} |
| sequenceInstruction | Sequence Instruction | textarea | [] |  |  |
| attachedSubnodeIds | Sequence Modifiers | container | [] | Attach a modifier to control the economy, availability, order, prompt, or physical behavior of this sequence. | {"candidate": "subnode"} |

#### characterState


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| emotionalState | Emotional State | selectCustom | [] |  | {"collection": "mechanicCharacterEmotionTypes", "idPrefix": "CEM-"} |
| behavioralNotes | Behavioral Notes | textarea | [] |  |  |
| attachedSubnodeIds | Attached Subnodes | container | [] | Assign reusable modifier subnodes from this graph, such as Value, Lifespan, Spend / Use Rule, Comment, or Readiness Status. | {"candidate": "subnode"} |
| nodeColor | Node Color | color | [] |  |  |

#### progressState


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| currentProgress | Current Progress | progress10 | [] |  | {"required": true} |
| visualStyle | Visual Style | select | ["Segmented bar", "Percentage"] |  |  |


### Every registered mechanic modifier


#### Progressive Feedback Mod


Kind: progressiveFeedback. Forces the designer to define how success in one part of the task makes the next part easier or more obvious. Creates a positive feedback loop so players feel progress.

Attaches to: ["cooperation", "taskTemplate"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| feedbackType | Feedback Type | multiselect | ["Visual cue", "Audio cue", "Physical unlock", "Information reveal", "Reduced difficulty", "Time bonus"] |  | {"required": true} |
| triggerCondition | Trigger Condition | text | [] |  | {"required": true} |
| effectDescription | Effect Description | textarea | [] |  | {"required": true} |
| strengthIntensity | Strength / Intensity | select | ["Subtle", "Moderate", "Strong", "Dramatic"] |  |  |
| canStack | Can this happen more than once? | checkbox | [] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | progressiveFeedback |
| name | Progressive Feedback Mod |
| purpose | Forces the designer to define how success in one part of the task makes the next part easier or more obvious. Creates a positive feedback loop so players feel progress. |
| description | Forces the designer to define how success in one part of the task makes the next part easier or more obvious. Creates a positive feedback loop so players feel progress. |
| color | #58C7A6 |
| icon | zap |
| category | gameplayModifiers |
| reusable | False |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["cooperation", "taskTemplate"] |
| collapseDepth | 0 |
| fields.feedbackType | [] |
| fields.triggerCondition |  |
| fields.effectDescription |  |
| fields.strengthIntensity | Subtle |
| fields.canStack | False |

#### Help when players get stuck


Kind: failSafeScaffolding. Provides structured ways to recover from failure or near-failure. Prevents players from feeling like total failures when they were close to succeeding.

Attaches to: ["cooperation", "taskTemplate"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| hintLevelCount | Hint Levels | number | [] |  | {"required": true} |
| hintTrigger | Hint Trigger | select | ["Time passed", "Failed attempts", "Facilitator call", "Player request", "Custom"] |  | {"required": true} |
| easierAlternativeEnabled | Easier Alternative Path | checkbox | [] |  |  |
| easierAlternativePath | Alternative Path Notes | textarea | [] |  |  |
| partialCreditRule | Partial Credit Rule | text | [] |  |  |
| skipEnabled | Skip Option | checkbox | [] |  |  |
| skipCondition | Skip Condition / Consequence | textarea | [] |  |  |
| gracePeriodMinutes | Grace Period | number | [] |  | {"suffix": "minutes"} |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | failSafeScaffolding |
| name | Help when players get stuck |
| purpose | Provides structured ways to recover from failure or near-failure. Prevents players from feeling like total failures when they were close to succeeding. |
| description | Provides structured ways to recover from failure or near-failure. Prevents players from feeling like total failures when they were close to succeeding. |
| color | #E8D25C |
| icon | layers |
| category | gameplayModifiers |
| reusable | False |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["cooperation", "taskTemplate"] |
| collapseDepth | 0 |
| fields.hintLevelCount | 1 |
| fields.hintTrigger | Time passed |
| fields.easierAlternativeEnabled | False |
| fields.easierAlternativePath |  |
| fields.partialCreditRule |  |
| fields.skipEnabled | False |
| fields.skipCondition |  |
| fields.gracePeriodMinutes | 0 |

#### Increasing pressure


Kind: escalatingPressure. Creates growing urgency and difficulty during the task. Pressure can increase through time, physical demand, environmental changes, or other escalating factors.

Attaches to: ["cooperation", "taskTemplate"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| pressureType | Pressure Type | multiselect | ["Time", "Physical demand", "Environmental change", "Noise/light", "Resource drain", "NPC pressure"] |  | {"required": true} |
| baseDurationMinutes | Base Duration | number | [] |  | {"required": true, "suffix": "minutes"} |
| escalationTrigger | Escalation Trigger | text | [] |  | {"required": true} |
| escalationEffect | Escalation Effect | textarea | [] |  | {"required": true} |
| canBePaused | Can Be Paused | checkbox | [] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | escalatingPressure |
| name | Increasing pressure |
| purpose | Creates growing urgency and difficulty during the task. Pressure can increase through time, physical demand, environmental changes, or other escalating factors. |
| description | Creates growing urgency and difficulty during the task. Pressure can increase through time, physical demand, environmental changes, or other escalating factors. |
| color | #E86464 |
| icon | clock |
| category | gameplayModifiers |
| reusable | False |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["cooperation", "taskTemplate"] |
| collapseDepth | 0 |
| fields.pressureType | [] |
| fields.baseDurationMinutes | 1 |
| fields.escalationTrigger |  |
| fields.escalationEffect |  |
| fields.canBePaused | False |

#### Cooperative Ethos / Role Mod


Kind: cooperativeEthosRole. Defines how cooperation should emerge in the task, either through differentiated roles or synchronized team actions, and sets the expected social tone of play.

Attaches to: ["cooperation", "taskTemplate"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| cooperationStyle | Cooperation Style | select | ["Differentiated roles", "Synchronized action", "Relay", "Parallel tracks", "Shared planning"] |  | {"required": true} |
| roleSuggestions | Role Suggestions | textarea | [] |  |  |
| ethosTone | Ethos Tone | select | ["Calm trust", "Urgent coordination", "Playful chaos", "Mutual support", "Leadership rotation"] |  | {"required": true} |
| ethosToneGuidance | Ethos Tone Guidance | readonly | [] |  | {"required": true} |
| teamDiscussionPrompt | Team Discussion Prompt | text | [] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | cooperativeEthosRole |
| name | Cooperative Ethos / Role Mod |
| purpose | Defines how cooperation should emerge in the task, either through differentiated roles or synchronized team actions, and sets the expected social tone of play. |
| description | Defines how cooperation should emerge in the task, either through differentiated roles or synchronized team actions, and sets the expected social tone of play. |
| color | #A87BF0 |
| icon | user |
| category | gameplayModifiers |
| reusable | False |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["cooperation", "taskTemplate"] |
| collapseDepth | 0 |
| fields.cooperationStyle | Differentiated roles |
| fields.roleSuggestions |  |
| fields.ethosTone | Calm trust |
| fields.ethosToneGuidance |  |
| fields.teamDiscussionPrompt |  |

#### No-Solo Enforcer


Kind: noSoloEnforcer. Structurally prevents a single player from completing the task alone by enforcing physical, spatial, or timing requirements.

Attaches to: ["cooperation", "taskTemplate"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| enforcementType | Enforcement Type | multiselect | ["Simultaneous actions", "Physical distance", "Different information", "Multiple props", "Timing split", "Role lock"] |  | {"required": true} |
| minimumPlayers | Minimum Players | number | [] |  | {"required": true} |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | noSoloEnforcer |
| name | No-Solo Enforcer |
| purpose | Structurally prevents a single player from completing the task alone by enforcing physical, spatial, or timing requirements. |
| description | Structurally prevents a single player from completing the task alone by enforcing physical, spatial, or timing requirements. |
| color | #F08CB4 |
| icon | cross |
| category | gameplayModifiers |
| reusable | False |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["cooperation", "taskTemplate"] |
| collapseDepth | 0 |
| fields.enforcementType | [] |
| fields.minimumPlayers | 1 |

#### Arbitration Mod


Kind: arbitration. Handles situations where real-world conditions create uncertainty or variance. Provides tolerance and fallback rules.

Attaches to: ["cooperation", "taskTemplate", "*"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| varianceHandling | Variance Handling | select | ["Strict", "Small tolerance", "Generous tolerance", "Facilitator judgment"] |  | {"required": true} |
| toleranceDescription | Tolerance Description | text | [] |  |  |
| partialCreditRule | Partial Credit Rule | text | [] |  |  |
| facilitatorOverride | Facilitator Override | checkbox | [] |  |  |
| logging | Logging | checkbox | [] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | arbitration |
| name | Arbitration Mod |
| purpose | Handles situations where real-world conditions create uncertainty or variance. Provides tolerance and fallback rules. |
| description | Handles situations where real-world conditions create uncertainty or variance. Provides tolerance and fallback rules. |
| color | #5CA8F5 |
| icon | flag |
| category | gameplayModifiers |
| reusable | False |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["cooperation", "taskTemplate", "*"] |
| collapseDepth | 0 |
| fields.varianceHandling | Strict |
| fields.toleranceDescription |  |
| fields.partialCreditRule |  |
| fields.facilitatorOverride | False |
| fields.logging | False |

#### Team Discussion Prompt


Kind: teamDiscussionPrompt. Allows the designer to insert a specific question or prompt that the team should discuss before, during, or after a task. This subnode is reusable across many different tasks.

Attaches to: ["cooperation", "taskTemplate", "*"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| discussionPrompt | Discussion Prompt | textarea | [] |  | {"required": true} |
| whenToUse | When to Use | select | ["Before task", "During task", "After task", "Between attempts"] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | teamDiscussionPrompt |
| name | Team Discussion Prompt |
| purpose | Allows the designer to insert a specific question or prompt that the team should discuss before, during, or after a task. This subnode is reusable across many different tasks. |
| description | Allows the designer to insert a specific question or prompt that the team should discuss before, during, or after a task. This subnode is reusable across many different tasks. |
| color | #43BF87 |
| icon | book |
| category | gameplayModifiers |
| reusable | True |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["cooperation", "taskTemplate", "*"] |
| collapseDepth | 0 |
| fields.discussionPrompt |  |
| fields.whenToUse | Before task |

#### Facilitator Note


Kind: facilitatorNote. A simple, reusable note that can be attached to any task or subnode. It contains guidance for the person running the game.

Attaches to: ["cooperation", "taskTemplate", "*"]. Category: supporting.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| facilitatorGuidance | Facilitator Guidance | textarea | [] |  | {"required": true} |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | facilitatorNote |
| name | Facilitator Note |
| purpose | A simple, reusable note that can be attached to any task or subnode. It contains guidance for the person running the game. |
| description | A simple, reusable note that can be attached to any task or subnode. It contains guidance for the person running the game. |
| color | #8B92A6 |
| icon | pin |
| category | supporting |
| reusable | True |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["cooperation", "taskTemplate", "*"] |
| collapseDepth | 0 |
| fields.facilitatorGuidance |  |

#### Trigger Delay


Kind: triggerDelay. Adds a delay before the sensor or actuator activates after the trigger condition is met.

Attaches to: ["sensorNode", "actuatorNode", "*"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| purpose | Purpose | readonly | [] |  | {"required": true} |
| delayDuration | Delay Duration | text | [] |  | {"required": true} |
| delayType | Delay Type | select | ["Fixed", "Random", "Variable"] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | triggerDelay |
| name | Trigger Delay |
| purpose | Adds a delay before the sensor or actuator activates after the trigger condition is met. |
| description | Adds a delay before the sensor or actuator activates after the trigger condition is met. |
| color | #5CA8F5 |
| icon | clock |
| category | gameplayModifiers |
| reusable | True |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["sensorNode", "actuatorNode", "*"] |
| collapseDepth | 0 |
| fields.purpose | Adds a delay before the sensor or actuator activates after the trigger condition is met. |
| fields.delayDuration |  |
| fields.delayType | Fixed |

#### Frequency Control


Kind: frequencyControl. Deprecated. Limit how often this happens now lives inside Sensor and Actuator nodes.

Attaches to: ["sensorNode", "actuatorNode", "taskTemplate", "*"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| purpose | Purpose | readonly | [] |  | {"required": true} |
| maxTriggersPerSession | Max Triggers per Session | text | [] |  | {"required": true} |
| cooldown | Cooldown / Frequency Rule | text | [] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | frequencyControl |
| name | Frequency Control |
| purpose | Deprecated. Limit how often this happens now lives inside Sensor and Actuator nodes. |
| description | Deprecated. Limit how often this happens now lives inside Sensor and Actuator nodes. |
| color | #E8D25C |
| icon | clock |
| category | gameplayModifiers |
| reusable | True |
| deprecated | True |
| hiddenFromPalette | True |
| attachesTo | ["sensorNode", "actuatorNode", "taskTemplate", "*"] |
| collapseDepth | 0 |
| fields.purpose | Deprecated. Limit how often this happens now lives inside Sensor and Actuator nodes. |
| fields.maxTriggersPerSession |  |
| fields.cooldown |  |

#### Multi-Output Resolver


Kind: multipleOutputLogic. Defines different outputs based on different input conditions.

Attaches to: ["sensorNode", "actuatorNode", "*"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| purpose | Purpose | readonly | [] |  | {"required": true} |
| inputConditions | Input Conditions | textarea | [] |  | {"required": true} |
| correspondingOutputs | Corresponding Outputs | textarea | [] |  | {"required": true} |
| defaultOutput | Default Output | text | [] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | multipleOutputLogic |
| name | Multi-Output Resolver |
| purpose | Defines different outputs based on different input conditions. |
| description | Defines different outputs based on different input conditions. |
| color | #A87BF0 |
| icon | swap |
| category | gameplayModifiers |
| reusable | True |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["sensorNode", "actuatorNode", "*"] |
| collapseDepth | 0 |
| fields.purpose | Defines different outputs based on different input conditions. |
| fields.inputConditions |  |
| fields.correspondingOutputs |  |
| fields.defaultOutput |  |

#### Conditional Activation


Kind: conditionalActivation. Requires additional conditions to be met before the sensor or actuator can activate.

Attaches to: ["sensorNode", "actuatorNode", "*"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| purpose | Purpose | readonly | [] |  | {"required": true} |
| requiredConditions | Required Conditions | textarea | [] |  | {"required": true} |
| logicType | Logic Type | select | ["AND", "OR"] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | conditionalActivation |
| name | Conditional Activation |
| purpose | Requires additional conditions to be met before the sensor or actuator can activate. |
| description | Requires additional conditions to be met before the sensor or actuator can activate. |
| color | #E0A23C |
| icon | flag |
| category | gameplayModifiers |
| reusable | True |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["sensorNode", "actuatorNode", "*"] |
| collapseDepth | 0 |
| fields.purpose | Requires additional conditions to be met before the sensor or actuator can activate. |
| fields.requiredConditions |  |
| fields.logicType | AND |

#### Value


Kind: value. Defines numeric or tradable value of an item or resource.

Attaches to: ["*"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| purpose | Purpose | readonly | [] |  | {"required": true} |
| initialValue | Initial Value | text | [] |  |  |
| currentValue | Current Value | text | [] |  |  |
| maxValue | Max Value | text | [] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | value |
| name | Value |
| purpose | Defines numeric or tradable value of an item or resource. |
| description | Defines numeric or tradable value of an item or resource. |
| color | #E8D25C |
| icon | pin |
| category | gameplayModifiers |
| reusable | True |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["*"] |
| collapseDepth | 0 |
| fields.purpose | Defines numeric or tradable value of an item or resource. |
| fields.initialValue |  |
| fields.currentValue |  |
| fields.maxValue |  |

#### Lifespan


Kind: lifespan. Defines how long this item or resource persists.

Attaches to: ["*"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| purpose | Purpose | readonly | [] |  | {"required": true} |
| lifespanType | Lifespan Type | select | ["Task only", "Full session/game", "Permanent", "Custom"] |  | {"required": true} |
| description | Description | textarea | [] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | lifespan |
| name | Lifespan |
| purpose | Defines how long this item or resource persists. |
| description | Defines how long this item or resource persists. |
| color | #43BF87 |
| icon | clock |
| category | gameplayModifiers |
| reusable | True |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["*"] |
| collapseDepth | 0 |
| fields.purpose | Defines how long this item or resource persists. |
| fields.lifespanType | Task only |
| fields.description |  |

#### Spend / Use Rule


Kind: spendUseRule. Defines how this item or resource can be spent or used.

Attaches to: ["*"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| purpose | Purpose | readonly | [] |  | {"required": true} |
| usageRules | Usage Rules | textarea | [] |  | {"required": true} |
| limitations | Limitations | textarea | [] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | spendUseRule |
| name | Spend / Use Rule |
| purpose | Defines how this item or resource can be spent or used. |
| description | Defines how this item or resource can be spent or used. |
| color | #E0A23C |
| icon | swap |
| category | gameplayModifiers |
| reusable | True |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["*"] |
| collapseDepth | 0 |
| fields.purpose | Defines how this item or resource can be spent or used. |
| fields.usageRules |  |
| fields.limitations |  |

#### Spectrum of Yes Outcomes


Kind: spectrumOfYesOutcomes. Defines the graduated outcome levels for the task, from best to worst.

Attaches to: ["cooperation", "taskTemplate", "*"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| purpose | Purpose | readonly | [] |  | {"required": true} |
| outcomeLevels | Outcome Levels | textarea | [] |  | {"required": true} |
| yesAndDescription | Yes and | textarea | [] |  |  |
| yesDescription | Yes | textarea | [] |  |  |
| yesButDescription | Yes but | textarea | [] |  |  |
| noButDescription | No but | textarea | [] |  |  |
| noDescription | No | textarea | [] |  |  |
| noAndDescription | No and | textarea | [] |  |  |
| defaultSelection | Default Selection | multiselect | ["Yes and", "Yes", "Yes but", "No but", "No", "No and"] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | spectrumOfYesOutcomes |
| name | Spectrum of Yes Outcomes |
| purpose | Defines the graduated outcome levels for the task, from best to worst. |
| description | Defines the graduated outcome levels for the task, from best to worst. |
| color | #8B7BF5 |
| icon | layers |
| category | gameplayModifiers |
| reusable | True |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["cooperation", "taskTemplate", "*"] |
| collapseDepth | 0 |
| fields.purpose | Defines the graduated outcome levels for the task, from best to worst. |
| fields.outcomeLevels | Yes and<br>Yes<br>Yes but<br>No but<br>No<br>No and |
| fields.yesAndDescription |  |
| fields.yesDescription |  |
| fields.yesButDescription |  |
| fields.noButDescription |  |
| fields.noDescription |  |
| fields.noAndDescription |  |
| fields.defaultSelection | ["Yes and", "Yes", "Yes but", "No but", "No", "No and"] |

#### Readiness Status


Kind: readinessStatus. Shows the current development or readiness state of the attached element.

Attaches to: ["*"]. Category: supporting.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| purpose | Purpose | readonly | [] |  | {"required": true} |
| status | Status | select | ["Draft", "In Progress", "Ready for Testing", "Ready", "Retired"] |  | {"required": true} |
| notes | Notes | textarea | [] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | readinessStatus |
| name | Readiness Status |
| purpose | Shows the current development or readiness state of the attached element. |
| description | Shows the current development or readiness state of the attached element. |
| color | #6FD9A7 |
| icon | flag |
| category | supporting |
| reusable | True |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["*"] |
| collapseDepth | 0 |
| fields.purpose | Shows the current development or readiness state of the attached element. |
| fields.status | Draft |
| fields.notes |  |

#### Player


Kind: player. Selects one or more players from the game player database.

Attaches to: ["*"]. Category: supporting.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| playerIds | Players | playerRefs | [] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | player |
| name | Player |
| purpose | Selects one or more players from the game player database. |
| description | Selects one or more players from the game player database. |
| color | #5CA8F5 |
| icon | user |
| category | supporting |
| reusable | True |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["*"] |
| collapseDepth | 0 |
| fields.playerIds | [] |

#### Team


Kind: team. Selects one or more teams from the game team database.

Attaches to: ["*"]. Category: supporting.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| teamIds | Teams | teamRefs | [] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | team |
| name | Team |
| purpose | Selects one or more teams from the game team database. |
| description | Selects one or more teams from the game team database. |
| color | #E0A23C |
| icon | layers |
| category | supporting |
| reusable | True |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["*"] |
| collapseDepth | 0 |
| fields.teamIds | [] |

#### Comment


Kind: comment. Freeform comment or designer note attached to any element.

Attaches to: ["*"]. Category: supporting.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| purpose | Purpose | readonly | [] |  | {"required": true} |
| commentText | Comment Text | textarea | [] |  | {"required": true} |
| authorDate | Author / Date | text | [] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | comment |
| name | Comment |
| purpose | Freeform comment or designer note attached to any element. |
| description | Freeform comment or designer note attached to any element. |
| color | #E8D25C |
| icon | book |
| category | supporting |
| reusable | True |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["*"] |
| collapseDepth | 0 |
| fields.purpose | Freeform comment or designer note attached to any element. |
| fields.commentText |  |
| fields.authorDate |  |

#### Core Mechanic Modifier


Kind: coreMechanicModifier. Allows the designer to deliberately change one core aspect of the task to create a meaningfully different experience or difficulty level.

Attaches to: ["cooperation", "taskTemplate"]. Category: gameplayModifiers.

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| variationCategory | Variation Category | select | ["Timing", "Space", "Body limit", "Information", "Props", "Sensors", "Resources", "Difficulty"] |  | {"required": true} |
| variationDescription | Variation Description | textarea | [] |  | {"required": true} |
| canBeCombined | Can Be Combined | checkbox | [] |  |  |

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | coreMechanicModifier |
| name | Core Mechanic Modifier |
| purpose | Allows the designer to deliberately change one core aspect of the task to create a meaningfully different experience or difficulty level. |
| description | Allows the designer to deliberately change one core aspect of the task to create a meaningfully different experience or difficulty level. |
| color | #E0A23C |
| icon | cog |
| category | gameplayModifiers |
| reusable | False |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["cooperation", "taskTemplate"] |
| collapseDepth | 0 |
| fields.variationCategory | Timing |
| fields.variationDescription |  |
| fields.canBeCombined | False |

#### Action Type Pattern


Kind: actionTypePattern.

Attaches to: ["action", "actionSequence", "cooperation", "taskTemplate", "*"]. Category: gameplayModifiers.

Factory fields:

| Path | Default |
| --- | --- |
| id | EXAMPLE |
| kind | actionTypePattern |
| name | Action Type Pattern |
| description | Choose a human-readable action pattern, then define its advantages, effects, and variations. Saved values can be recalled whenever that mechanism is selected again. |
| color | #58C7A6 |
| icon | cog |
| category | gameplayModifiers |
| reusable | True |
| deprecated | False |
| hiddenFromPalette | False |
| attachesTo | ["action", "actionSequence", "cooperation", "taskTemplate", "*"] |
| collapseDepth | 0 |
| fields.tokenMechanismId |  |
| fields.orderMechanismId |  |
| fields.specialMechanismId |  |
| fields.activeMechanismId |  |


### Custom option collections


#### itemTypes


| Key | Current definition |
| --- | --- |
| artifact | {"id": "artifact", "label": "Artifact", "color": "#E0A23C"} |
| gadget | {"id": "gadget", "label": "Gadget", "color": "#3EC6D6"} |
| consumable | {"id": "consumable", "label": "Consumable", "color": "#E88F8F"} |
| key | {"id": "key", "label": "Key", "color": "#E8D25C"} |
| clue | {"id": "clue", "label": "Clue", "color": "#5CA8F5"} |
| status | {"id": "status", "label": "Status", "color": "#A87BF0"} |
| tool | {"id": "tool", "label": "Tool", "color": "#43BF87"} |
| wearable | {"id": "wearable", "label": "Wearable", "color": "#F08CB4"} |

#### narrativeCategories


| Key | Current definition |
| --- | --- |
| story-beat | {"id": "story-beat", "label": "Story beat", "color": "#5CA8F5", "icon": "flag"} |
| plot-hook | {"id": "plot-hook", "label": "Plot hook", "color": "#F08CB4", "icon": "alert"} |
| briefing-script | {"id": "briefing-script", "label": "Briefing script", "color": "#5CA8F5", "icon": "flag"} |
| npc-bio | {"id": "npc-bio", "label": "NPC bio", "color": "#E0A23C", "icon": "swap"} |
| rumor | {"id": "rumor", "label": "Rumor", "color": "#43BF87", "icon": "zap"} |
| lore | {"id": "lore", "label": "Lore fragment", "color": "#A87BF0", "icon": "cog"} |
| supporting-notes | {"id": "supporting-notes", "label": "Supporting Notes", "color": "#8B92A6", "icon": "book"} |

#### mechanicRestrictionTypes


| Key | Current definition |
| --- | --- |
| RST-BLINDFOLD | {"id": "RST-BLINDFOLD", "label": "Blindfold", "custom": false} |
| RST-BIND-ONE-HAND | {"id": "RST-BIND-ONE-HAND", "label": "Binding one hand", "custom": false} |
| RST-SILENCE | {"id": "RST-SILENCE", "label": "Silence", "custom": false} |
| RST-CARRY-LOAD | {"id": "RST-CARRY-LOAD", "label": "Carry load", "custom": false} |
| RST-MOBILITY-LIMIT | {"id": "RST-MOBILITY-LIMIT", "label": "Mobility limit", "custom": false} |

#### mechanicInteractionTypes


| Key | Current definition |
| --- | --- |
| PIT-BALANCE | {"id": "PIT-BALANCE", "label": "Balance", "custom": false} |
| PIT-CARRY | {"id": "PIT-CARRY", "label": "Carry", "custom": false} |
| PIT-SORT | {"id": "PIT-SORT", "label": "Sort", "custom": false} |
| PIT-THROW | {"id": "PIT-THROW", "label": "Throw", "custom": false} |
| PIT-ASSEMBLE | {"id": "PIT-ASSEMBLE", "label": "Assemble", "custom": false} |
| PIT-UNLOCK | {"id": "PIT-UNLOCK", "label": "Unlock", "custom": false} |
| PIT-TRADE | {"id": "PIT-TRADE", "label": "Trade", "custom": false} |

#### mechanicSensorTypes


| Key | Current definition |
| --- | --- |
| SNT-PRESSURE | {"id": "SNT-PRESSURE", "label": "Pressure", "custom": false} |
| SNT-NFC | {"id": "SNT-NFC", "label": "NFC", "custom": false} |
| SNT-MOTION | {"id": "SNT-MOTION", "label": "Motion", "custom": false} |
| SNT-GPS-ZONE | {"id": "SNT-GPS-ZONE", "label": "GPS Zone", "custom": false} |
| SNT-BUTTON | {"id": "SNT-BUTTON", "label": "Button", "custom": false} |

#### mechanicActuatorTypes


| Key | Current definition |
| --- | --- |
| ACT-LIGHT | {"id": "ACT-LIGHT", "label": "Light", "custom": false} |
| ACT-SOUND | {"id": "ACT-SOUND", "label": "Sound", "custom": false} |
| ACT-MOVEMENT | {"id": "ACT-MOVEMENT", "label": "Movement", "custom": false} |
| ACT-LOCK | {"id": "ACT-LOCK", "label": "Lock", "custom": false} |
| ACT-DISPLAY | {"id": "ACT-DISPLAY", "label": "Display", "custom": false} |
| ACT-MESSAGE | {"id": "ACT-MESSAGE", "label": "Message", "custom": false} |

#### mechanicCharacterEmotionTypes


| Key | Current definition |
| --- | --- |
| CEM-NEUTRAL | {"id": "CEM-NEUTRAL", "label": "Neutral", "custom": false} |
| CEM-SAD | {"id": "CEM-SAD", "label": "Sad", "custom": false} |
| CEM-ANGRY | {"id": "CEM-ANGRY", "label": "Angry", "custom": false} |
| CEM-JOYFUL | {"id": "CEM-JOYFUL", "label": "Joyful", "custom": false} |
| CEM-CONFUSED | {"id": "CEM-CONFUSED", "label": "Confused", "custom": false} |
| CEM-HOSTILE | {"id": "CEM-HOSTILE", "label": "Hostile", "custom": false} |
| CEM-ALLIED | {"id": "CEM-ALLIED", "label": "Allied", "custom": false} |

#### mechanicSequenceModes


| Key | Current definition |
| --- | --- |
| SQM-CUSTOM | {"id": "SQM-CUSTOM", "label": "Custom", "custom": false} |


### Game master rules


These are reusable facilitator guidance records. aiRule is authored instruction text; storing it does not connect an AI service.

#### Distributed Cooperation


| Field | Content |
| --- | --- |
| id | LIB-GMR-001 |
| title | Distributed Cooperation |
| principle | Core cooperative stages should distribute essential information, access, or timing across multiple players so success comes from combining actions, not from one player directing everyone else. |
| implementation | When generating a cooperative stage, give different players different pieces of the solution. One player might see a symbol, another might hear a sound cue, another might reach a physical sensor, and another might control timing. Start with information-splitting, then add physical separation or simultaneous triggers when the stage needs stronger cooperation. Use time pressure carefully, mainly for advanced or high-energy stages. The stage should still allow players to communicate, coordinate, and feel shared success rather than simply obeying one dominant player. |
| rationale | This prevents the alpha-player problem while supporting real group cohesion. Players are not just standing near each other; they each hold something the group needs. This creates participation, communication, trust, and replayable variation without requiring new hardware for every stage. |
| aiRule | Before finalizing a cooperative stage, check whether one player can complete it alone by holding all information, reaching all sensors, and controlling all timing. If yes, split one required element across players: information first, physical access second, timing pressure third. Ensure the split creates meaningful cooperation, not just artificial inconvenience. |

#### Fail Forward


| Field | Content |
| --- | --- |
| id | LIB-GMR-002 |
| title | Fail Forward |
| principle | A failed objective should redirect the story, never dead-end it. Every failure state must hand players a new, playable situation â€” a harder path, a consequence, or a lead â€” so momentum and morale survive setbacks. |
| implementation | For each stage, author the failure branch as deliberately as the success branch. A failed puzzle might trigger an alarm that reroutes enemies, spend a resource, or unlock a slower manual bypass. Avoid outcomes that force players to stand idle or leave the game. Prefer consequences that change the board (new enemy behaviour, a locked route, a time penalty) over consequences that simply say "no". |
| rationale | Real-life games cannot pause and retry cleanly; a hard dead-end strands players physically and kills a session. Fail-forward design keeps everyone in motion, turns mistakes into story, and lets weaker teams still reach an ending. |
| aiRule | For every stage with a fail state, verify a defined next action exists on failure. If failure leads to "nothing happens" or "wait and try again", replace it with a consequence that changes the game state or opens an alternate route before finalizing. |

#### Safety Breaks Fiction


| Field | Content |
| --- | --- |
| id | LIB-GMR-003 |
| title | Safety Breaks Fiction |
| principle | Player safety and consent always override the fiction. Any real-world hazard, medical need, or a player invoking a stop signal immediately pauses the in-game situation, no matter how dramatic the moment. |
| implementation | Every stage must define a safe-word / stop-signal response and a nearest out-of-game safe zone. Physical challenges declare their real limits (no grappling, no stairs, no blindfold near hazards) up front. Crew are briefed that enforcing safety is never "breaking immersion" â€” it is part of the job. Mark exits, hazards and med locations on the location map. |
| rationale | A single injury or ignored consent breach ends trust in the whole event. Encoding safety as a first-class rule keeps the game repeatable, insurable, and welcoming to new and vulnerable players. |
| aiRule | Before finalizing any stage involving physical action, restricted senses, or time pressure, confirm it names a stop-signal behaviour and a safe zone. If either is missing, add it and flag the stage for a crew safety review. |


## C Framework registry and generic questions


There are 13 registered frameworks. Specialist editors override the generic question interface for FATE, Kolb, Human Values, Meta Programs, and Group Foundations. For the other frameworks, the generated question index below covers available purposes and archetype-dependent variants. Repeated question keys can have different contextual wording.


### Group Foundations [larpcraftGroupFoundations]


A Larpcraft framework for creating groups and institutions. Explore identity and bonds, members and roles, power and rules, tensions and possible change, with optional institutional arrangements. These are optional writing lenses, not fixed stages or predicted outcomes.

Layout: groupFoundations.

Recommended purposes: ["relationship"]. Also useful: ["story", "character"]. Create a group, faction, band or institution through shared identity, membership, authority, bonds and possible tensions.

description: Larpcraft group authoring guide: identity, membership, authority, bonds, tensions and institutions. Inspired by Group Dynamics Atlas; no fixed stages or predicted outcomes.

| Phase | Reference definition |
| --- | --- |
| identity | {"key": "identity", "name": "Identity & bonds", "short": "What brings the group together?", "detail": "Explore origins, shared purpose, bonds and ways of belonging. A group can be small or large, informal or formal."} |
| members | {"key": "members", "name": "Members & roles", "short": "Who belongs, and what place do they have?", "detail": "Link existing character and group profiles, or record names without profiles. Roles and loyalties belong to this membership."} |
| power | {"key": "power", "name": "Power & rules", "short": "How do authority, decisions and expectations work?", "detail": "Describe authority, decisions, rules and disagreement. Do not assume every group has a formal leader or written rules."} |
| pressure | {"key": "pressure", "name": "Tensions & change", "short": "What supports or strains their unity?", "detail": "Explore current tensions and possible pressures or developments. Possibilities remain separate from established events."} |
| institution | {"key": "institution", "name": "Institution · optional", "short": "What outlasts individual members?", "detail": "Use when useful: mandate, succession, resources, territory, privileges and continuing obligations. Informal groups can skip these lenses."} |


### FATE [fate]


Focus attention, establish authority, activate tribe, and engage emotion.

Layout: reference.

Recommended purposes: ["communication", "scene"]. Also useful: ["relationship", "style", "character", "story"]. Shape an invitation, briefing, speech, or important reveal through attention, credibility, belonging, and feeling.

| Phase | Reference definition |
| --- | --- |
| F | {"key": "F", "name": "Focus", "short": "Draw attention to the specific behavior, choice, or moment that matters.", "detail": "Focus reduces noise. In a live game, this means making the meaningful action visible enough that players know where to put their attention."} |
| A | {"key": "A", "name": "Authority", "short": "Show why the action has weight, consequence, or legitimacy.", "detail": "Authority gives the moment credibility. It can come from an NPC, a rule, a visible result, a social signal, or the world responding clearly."} |
| T | {"key": "T", "name": "Tribe", "short": "Connect the action to group identity, status, and shared belonging.", "detail": "Tribe makes behavior socially meaningful. Players are more likely to change or commit when the group recognizes the action as part of who they are together."} |
| E | {"key": "E", "name": "Emotion", "short": "Attach feeling so the action is remembered and cared about.", "detail": "Emotion turns information into motivation. Fear, pride, relief, grief, wonder, or loyalty can make the choice matter beyond pure mechanics."} |


### Kolb's Learning Cycle [kolbLearningCycle]


Concrete experience leads to reflective observation, abstract conceptualization, and active experimentation.

Layout: cycle.

Recommended purposes: ["learning"]. Also useful: ["scene", "character", "story"]. Build an experience that leads to reflection, an idea, and a chance to try it. It is a learning cycle rather than a personality description.

| Phase | Reference definition |
| --- | --- |
| CE | {"key": "CE", "name": "Concrete Experience", "short": "Players do, encounter, attempt, fail, succeed, or feel something directly.", "detail": "Concrete experience is the lived moment. In a game, this is the task, scene, surprise, social interaction, physical action, or emotional beat players actually go through."} |
| RO | {"key": "RO", "name": "Reflective Observation", "short": "Players look back at what happened and notice patterns, surprises, mistakes, and feelings.", "detail": "Reflection turns activity into meaning. Build moments where players can compare perspectives, ask what changed, or notice why the outcome happened."} |
| AC | {"key": "AC", "name": "Abstract Conceptualization", "short": "Players form a principle, rule, theory, tactic, or lesson from the experience.", "detail": "Conceptualization gives the experience a portable idea. This can be an explicit debrief insight or an in-world realization that changes how players understand the problem."} |
| AE | {"key": "AE", "name": "Active Experimentation", "short": "Players test the new idea in the next situation and see whether it works.", "detail": "Experimentation closes the loop by turning learning into action. The next challenge should let players apply, revise, or stress-test what they believe they learned."} |


### Human Values [humanValues]


Value tensions such as belonging, safety, status, freedom, love, skill, wealth, health, and survival.

Layout: values.

Recommended purposes: ["values"]. Also useful: ["character", "relationship", "scene", "story"]. Find what someone stands to gain or lose, and make a choice emotionally meaningful.

| Phase | Reference definition |
| --- | --- |
| Together | {"key": "Together", "name": "Alone", "short": "Belonging, loyalty, exclusion, abandonment, and the need to not face the world alone.", "detail": "Together versus alone is one of the strongest social values. Use it when a scene is about being accepted, isolated, rescued, exiled, or choosing the group over the self."} |
| Safety | {"key": "Safety", "name": "Danger", "short": "Protection, threat, risk, fear, shelter, alarms, and exposed choices.", "detail": "Safety versus danger makes players care because the body reacts before the intellect does. It is useful for tension, relief, rescue, caution, and escalating stakes."} |
| Victory | {"key": "Victory", "name": "Defeat", "short": "Winning, failing, proving oneself, humiliation, comeback, and final outcome.", "detail": "Victory versus defeat gives a task emotional direction. It can be literal score, but it can also be pride, mission success, public failure, or a meaningful loss."} |
| High status | {"key": "High status", "name": "Low status", "short": "Respect, command, shame, rank, recognition, social power, and loss of face.", "detail": "Status shifts are emotionally hot. A player may care deeply when an NPC honors them, doubts them, promotes them, humiliates them, or treats them as invisible."} |
| Free | {"key": "Free", "name": "Slavery", "short": "Choice, escape, control, captivity, coercion, debt, and being owned by a system.", "detail": "Free versus slavery frames whether characters can choose their own path. It works for locked spaces, blackmail, contracts, mind control, debt, and rebellion."} |
| Wealthy | {"key": "Wealthy", "name": "Poor", "short": "Resources, scarcity, comfort, desperation, reward, greed, and survival pressure.", "detail": "Wealthy versus poor can mean money, supplies, influence, information, time, or equipment. It makes resources feel meaningful instead of abstract."} |
| Life | {"key": "Life", "name": "Death", "short": "Survival, sacrifice, grief, urgency, rescue, mortality, and irreversible stakes.", "detail": "Life versus death creates immediate gravity. Use carefully in live games, especially when the tone should stay adventurous rather than traumatic."} |
| Skilled | {"key": "Skilled", "name": "Unskilled", "short": "Mastery, competence, embarrassment, training, talent, and earning capability.", "detail": "Skilled versus unskilled lets players feel growth. It is useful when a task reveals who is capable, who needs help, and who becomes better through play."} |
| Healthy | {"key": "Healthy", "name": "Sick", "short": "Strength, weakness, contamination, injury, recovery, endurance, and vulnerability.", "detail": "Health versus sickness can be physical, emotional, or social. It adds feeling to fatigue, poison, healing, infection, breakdown, or restoration."} |
| Love | {"key": "Love", "name": "Ambivalence / Hatred", "short": "Attachment, indifference, rejection, rivalry, affection, betrayal, and emotional allegiance.", "detail": "Love through ambivalence to hatred gives relationship scenes their emotional temperature. It is useful for NPC bonds, faction attitudes, loyalty tests, and betrayals."} |
| Friend | {"key": "Friend", "name": "Stranger / Enemy", "short": "Trust, unfamiliarity, suspicion, hostility, alliance, recognition, and threat.", "detail": "Friend through stranger to enemy makes social meaning legible. It helps designers decide whether a person or faction should feel safe, unknown, or opposed."} |


### Haidt Moral Conflicts [haidtMoralConflicts]


Care, fairness, liberty, authority, loyalty, and purity conflicts as story-design pressure points.

Layout: values.

Recommended purposes: ["values", "relationship"]. Also useful: ["scene", "story", "character", "communication"]. Give opposing sides understandable principles and put those principles into conflict.

| Phase | Reference definition |
| --- | --- |
| Care | {"key": "Care", "name": "Harm", "short": "Compassion, protection, injury, cruelty, rescue, and the duty to prevent suffering.", "detail": "Care versus harm asks who is being hurt and who is responsible for protection. It is useful when a choice turns on mercy, neglect, sacrifice, or the cost of keeping someone safe."} |
| Fairness | {"key": "Fairness", "name": "Cheating", "short": "Justice, reciprocity, earned reward, exploitation, rigged rules, and broken bargains.", "detail": "Fairness versus cheating makes players notice whether the game world is treating people honestly. It works well for disputed rewards, corrupt systems, hidden advantages, and promises that may be broken."} |
| Liberty | {"key": "Liberty", "name": "Oppression", "short": "Freedom, coercion, control, resistance, domination, and the right to choose.", "detail": "Liberty versus oppression frames a conflict around agency. Use it when players must decide whether to obey, rebel, free someone, or accept limits for a larger purpose."} |
| Authority | {"key": "Authority", "name": "Subversion", "short": "Order, rank, tradition, leadership, rebellion, disrespect, and undermined command.", "detail": "Authority versus subversion asks whether hierarchy is legitimate or corrupt. It can make orders, rituals, chain of command, and acts of defiance feel morally charged."} |
| Loyalty | {"key": "Loyalty", "name": "Betrayal", "short": "Alliance, belonging, duty to the group, treason, abandonment, and divided allegiance.", "detail": "Loyalty versus betrayal turns relationships into stakes. It is strongest when players must choose between factions, teams, promises, personal bonds, or the mission."} |
| Purity | {"key": "Purity", "name": "Filth", "short": "Sanctity, contamination, taboo, corruption, disgust, cleansing, and protected boundaries.", "detail": "Purity versus filth is about what a culture treats as sacred or polluted. Use it carefully for taboos, cursed objects, forbidden places, moral corruption, or ritual cleansing."} |

Generic questions and their declared choices:

| Key | Question | Purposes | Archetype variants | Choices |
| --- | --- | --- | --- | --- |
| focus:subject | Who is this character, and what do they want right now? | ["character"] | [] | [] |
| focus:change | What choice or pressure could reveal or change them? | ["character"] | [] | [] |
| phase:Care | What does “Care / Harm” mean to this character, and what choice puts it at risk? | ["character"] | [] | ["Care", "Harm", "Both / in conflict"] |
| phase:Fairness | What does “Fairness / Cheating” mean to this character, and what choice puts it at risk? | ["character"] | [] | ["Fairness", "Cheating", "Both / in conflict"] |
| phase:Liberty | What does “Liberty / Oppression” mean to this character, and what choice puts it at risk? | ["character"] | [] | ["Liberty", "Oppression", "Both / in conflict"] |
| phase:Authority | What does “Authority / Subversion” mean to this character, and what choice puts it at risk? | ["character"] | [] | ["Authority", "Subversion", "Both / in conflict"] |
| phase:Loyalty | What does “Loyalty / Betrayal” mean to this character, and what choice puts it at risk? | ["character"] | [] | ["Loyalty", "Betrayal", "Both / in conflict"] |
| phase:Purity | What does “Purity / Filth” mean to this character, and what choice puts it at risk? | ["character"] | [] | ["Purity", "Filth", "Both / in conflict"] |
| focus:sides | Who are the people or groups in this relationship? | ["relationship"] | [] | [] |
| focus:needs | What does each side want from the other? | ["relationship"] | [] | [] |
| focus:change | What could change their trust, closeness, or power? | ["relationship"] | [] | [] |
| phase:Care | Where do the sides differ about “Care / Harm”, and how does that affect trust, obligation, or power? | ["relationship"] | [] | ["Care", "Harm", "Both / in conflict"] |
| phase:Fairness | Where do the sides differ about “Fairness / Cheating”, and how does that affect trust, obligation, or power? | ["relationship"] | [] | ["Fairness", "Cheating", "Both / in conflict"] |
| phase:Liberty | Where do the sides differ about “Liberty / Oppression”, and how does that affect trust, obligation, or power? | ["relationship"] | [] | ["Liberty", "Oppression", "Both / in conflict"] |
| phase:Authority | Where do the sides differ about “Authority / Subversion”, and how does that affect trust, obligation, or power? | ["relationship"] | [] | ["Authority", "Subversion", "Both / in conflict"] |
| phase:Loyalty | Where do the sides differ about “Loyalty / Betrayal”, and how does that affect trust, obligation, or power? | ["relationship"] | [] | ["Loyalty", "Betrayal", "Both / in conflict"] |
| phase:Purity | Where do the sides differ about “Purity / Filth”, and how does that affect trust, obligation, or power? | ["relationship"] | [] | ["Purity", "Filth", "Both / in conflict"] |
| focus:message | Who is speaking to whom, and what needs to get across? | ["communication"] | [] | [] |
| focus:change | What should the listener understand, feel, or do afterward? | ["communication"] | [] | [] |
| phase:Care | How does “Care / Harm” change what a speaker says and what a listener hears? | ["communication"] | [] | ["Care", "Harm", "Both / in conflict"] |
| phase:Fairness | How does “Fairness / Cheating” change what a speaker says and what a listener hears? | ["communication"] | [] | ["Fairness", "Cheating", "Both / in conflict"] |
| phase:Liberty | How does “Liberty / Oppression” change what a speaker says and what a listener hears? | ["communication"] | [] | ["Liberty", "Oppression", "Both / in conflict"] |
| phase:Authority | How does “Authority / Subversion” change what a speaker says and what a listener hears? | ["communication"] | [] | ["Authority", "Subversion", "Both / in conflict"] |
| phase:Loyalty | How does “Loyalty / Betrayal” change what a speaker says and what a listener hears? | ["communication"] | [] | ["Loyalty", "Betrayal", "Both / in conflict"] |
| phase:Purity | How does “Purity / Filth” change what a speaker says and what a listener hears? | ["communication"] | [] | ["Purity", "Filth", "Both / in conflict"] |
| focus:stake | What matters here, and to whom? | ["values"] | [] | [] |
| focus:choice | Which values pull the choice in different directions? | ["values"] | [] | [] |
| focus:cost | What is gained and given up on each path? | ["values"] | [] | [] |
| phase:Care | How does “Care / Harm” shape the dilemma? Who benefits or suffers, and what other value competes with it? | ["values"] | [] | ["Care", "Harm", "Both / in conflict"] |
| phase:Fairness | How does “Fairness / Cheating” shape the dilemma? Who benefits or suffers, and what other value competes with it? | ["values"] | [] | ["Fairness", "Cheating", "Both / in conflict"] |
| phase:Liberty | How does “Liberty / Oppression” shape the dilemma? Who benefits or suffers, and what other value competes with it? | ["values"] | [] | ["Liberty", "Oppression", "Both / in conflict"] |
| phase:Authority | How does “Authority / Subversion” shape the dilemma? Who benefits or suffers, and what other value competes with it? | ["values"] | [] | ["Authority", "Subversion", "Both / in conflict"] |
| phase:Loyalty | How does “Loyalty / Betrayal” shape the dilemma? Who benefits or suffers, and what other value competes with it? | ["values"] | [] | ["Loyalty", "Betrayal", "Both / in conflict"] |
| phase:Purity | How does “Purity / Filth” shape the dilemma? Who benefits or suffers, and what other value competes with it? | ["values"] | [] | ["Purity", "Filth", "Both / in conflict"] |
| focus:situation | What is happening when players enter this scene? | ["scene"] | [] | [] |
| focus:choice | What can players decide or do? | ["scene"] | [] | [] |
| focus:change | What changes because of that choice? | ["scene"] | [] | [] |
| phase:Care | What playable choice in this encounter puts “Care / Harm” at stake? | ["scene"] | [] | ["Care", "Harm", "Both / in conflict"] |
| phase:Fairness | What playable choice in this encounter puts “Fairness / Cheating” at stake? | ["scene"] | [] | ["Fairness", "Cheating", "Both / in conflict"] |
| phase:Liberty | What playable choice in this encounter puts “Liberty / Oppression” at stake? | ["scene"] | [] | ["Liberty", "Oppression", "Both / in conflict"] |
| phase:Authority | What playable choice in this encounter puts “Authority / Subversion” at stake? | ["scene"] | [] | ["Authority", "Subversion", "Both / in conflict"] |
| phase:Loyalty | What playable choice in this encounter puts “Loyalty / Betrayal” at stake? | ["scene"] | [] | ["Loyalty", "Betrayal", "Both / in conflict"] |
| phase:Purity | What playable choice in this encounter puts “Purity / Filth” at stake? | ["scene"] | [] | ["Purity", "Filth", "Both / in conflict"] |
| focus:subject | Whose situation changes across this story or act? | ["story"] | [] | [] |
| focus:change | Where does it begin, and what should be different by the end? | ["story"] | [] | [] |
| phase:Care | How does “Care / Harm” change across the story, and which event turns it? | ["story"] | [] | ["Care", "Harm", "Both / in conflict"] |
| phase:Fairness | How does “Fairness / Cheating” change across the story, and which event turns it? | ["story"] | [] | ["Fairness", "Cheating", "Both / in conflict"] |
| phase:Liberty | How does “Liberty / Oppression” change across the story, and which event turns it? | ["story"] | [] | ["Liberty", "Oppression", "Both / in conflict"] |
| phase:Authority | How does “Authority / Subversion” change across the story, and which event turns it? | ["story"] | [] | ["Authority", "Subversion", "Both / in conflict"] |
| phase:Loyalty | How does “Loyalty / Betrayal” change across the story, and which event turns it? | ["story"] | [] | ["Loyalty", "Betrayal", "Both / in conflict"] |
| phase:Purity | How does “Purity / Filth” change across the story, and which event turns it? | ["story"] | [] | ["Purity", "Filth", "Both / in conflict"] |
| focus:discovery | What could players discover or learn through this experience? | ["learning"] | [] | [] |
| focus:change | Where can they try what they have learned? | ["learning"] | [] | [] |
| phase:Care | What experience could reveal different views about “Care / Harm” without prescribing the answer? | ["learning"] | [] | ["Care", "Harm", "Both / in conflict"] |
| phase:Fairness | What experience could reveal different views about “Fairness / Cheating” without prescribing the answer? | ["learning"] | [] | ["Fairness", "Cheating", "Both / in conflict"] |
| phase:Liberty | What experience could reveal different views about “Liberty / Oppression” without prescribing the answer? | ["learning"] | [] | ["Liberty", "Oppression", "Both / in conflict"] |
| phase:Authority | What experience could reveal different views about “Authority / Subversion” without prescribing the answer? | ["learning"] | [] | ["Authority", "Subversion", "Both / in conflict"] |
| phase:Loyalty | What experience could reveal different views about “Loyalty / Betrayal” without prescribing the answer? | ["learning"] | [] | ["Loyalty", "Betrayal", "Both / in conflict"] |
| phase:Purity | What experience could reveal different views about “Purity / Filth” without prescribing the answer? | ["learning"] | [] | ["Purity", "Filth", "Both / in conflict"] |
| focus:audience | Who experiences this story, and through which voice or medium? | ["style"] | [] | [] |
| focus:feeling | What tone or feeling should the presentation create? | ["style"] | [] | [] |
| phase:Care | How could the voice, imagery, or viewpoint make “Care / Harm” felt by the audience? | ["style"] | [] | ["Care", "Harm", "Both / in conflict"] |
| phase:Fairness | How could the voice, imagery, or viewpoint make “Fairness / Cheating” felt by the audience? | ["style"] | [] | ["Fairness", "Cheating", "Both / in conflict"] |
| phase:Liberty | How could the voice, imagery, or viewpoint make “Liberty / Oppression” felt by the audience? | ["style"] | [] | ["Liberty", "Oppression", "Both / in conflict"] |
| phase:Authority | How could the voice, imagery, or viewpoint make “Authority / Subversion” felt by the audience? | ["style"] | [] | ["Authority", "Subversion", "Both / in conflict"] |
| phase:Loyalty | How could the voice, imagery, or viewpoint make “Loyalty / Betrayal” felt by the audience? | ["style"] | [] | ["Loyalty", "Betrayal", "Both / in conflict"] |
| phase:Purity | How could the voice, imagery, or viewpoint make “Purity / Filth” felt by the audience? | ["style"] | [] | ["Purity", "Filth", "Both / in conflict"] |


### Descent and Recovery Arc [descentAndRecovery]


Move from unrealized potential through a trigger and crisis, then climb toward recovery and a wiser new normal.

Layout: storyArc.

Recommended purposes: ["story"]. Also useful: ["character", "relationship", "scene", "learning"]. Shape a setback, crisis, recovery, and changed situation across several beats.

| Phase | Reference definition |
| --- | --- |
| 1 | {"key": "1", "name": "Comfort Zone", "short": "Life is not bad, but something is missing and some potential remains unused.", "detail": "Establish a stable starting point that feels incomplete rather than disastrous. The character or group has room to grow, even if they do not yet recognize it."} |
| 2 | {"key": "2", "name": "Trigger", "short": "A setback knocks the character down through misfortune, inattention, or an avoidable mistake.", "detail": "Introduce the disruption that breaks the old balance. The trigger should create a problem that cannot be solved simply by returning to the comfort zone."} |
| 3 | {"key": "3", "name": "Crisis", "short": "At the lowest point, the character discovers or learns something valuable in the dark.", "detail": "The crisis is both danger and opportunity. Place the insight, resource, relationship, or truth needed for change inside the difficult experience itself."} |
| 4 | {"key": "4", "name": "Recovery", "short": "The character applies what was learned and begins climbing back toward stability.", "detail": "Make growth visible through action. Recovery should test whether the new knowledge can be used effectively rather than merely understood in theory."} |
| 5 | {"key": "5", "name": "Better Place", "short": "The character reaches a wiser and more resilient new normal.", "detail": "End with meaningful improvement rather than a simple reset. The character is better prepared and less likely to be defeated by the same kind of challenge again."} |

Generic questions and their declared choices:

| Key | Question | Purposes | Archetype variants | Choices |
| --- | --- | --- | --- | --- |
| focus:subject | Who is this character, and what do they want right now? | ["character"] | [] | [] |
| focus:change | What choice or pressure could reveal or change them? | ["character"] | [] | [] |
| phase:1 | What is their normal life, and what is missing? | ["character"] | [] | [] |
| phase:2 | What knocks their life off course? | ["character"] | [] | [] |
| phase:3 | At their lowest point, what do they discover? | ["character"] | [] | [] |
| phase:4 | What do they do with what they learned? | ["character"] | [] | [] |
| phase:5 | How are they different after recovering? | ["character"] | [] | [] |
| focus:sides | Who are the people or groups in this relationship? | ["relationship"] | [] | [] |
| focus:needs | What does each side want from the other? | ["relationship"] | [] | [] |
| focus:change | What could change their trust, closeness, or power? | ["relationship"] | [] | [] |
| phase:1 | What is stable or missing in the relationship at the start? | ["relationship"] | [] | [] |
| phase:2 | What damages trust or cooperation? | ["relationship"] | [] | [] |
| phase:3 | At the lowest point, what do the sides realise? | ["relationship"] | [] | [] |
| phase:4 | What action starts to repair or change the relationship? | ["relationship"] | [] | [] |
| phase:5 | What new relationship becomes possible afterward? | ["relationship"] | [] | [] |
| focus:message | Who is speaking to whom, and what needs to get across? | ["communication"] | [] | [] |
| focus:change | What should the listener understand, feel, or do afterward? | ["communication"] | [] | [] |
| phase:1 | What is stable at the beginning, and what potential is unused? | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:2 | What event disrupts that situation? | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:3 | What is the crisis, and what becomes clear within it? | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:4 | What choices move the story toward recovery? | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:5 | What is different in the new situation at the end? | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| focus:stake | What matters here, and to whom? | ["values"] | [] | [] |
| focus:choice | Which values pull the choice in different directions? | ["values"] | [] | [] |
| focus:cost | What is gained and given up on each path? | ["values"] | [] | [] |
| focus:situation | What is happening when players enter this scene? | ["scene"] | [] | [] |
| focus:choice | What can players decide or do? | ["scene"] | [] | [] |
| focus:change | What changes because of that choice? | ["scene"] | [] | [] |
| focus:subject | Whose situation changes across this story or act? | ["story"] | [] | [] |
| focus:change | Where does it begin, and what should be different by the end? | ["story"] | [] | [] |
| focus:discovery | What could players discover or learn through this experience? | ["learning"] | [] | [] |
| focus:change | Where can they try what they have learned? | ["learning"] | [] | [] |
| focus:audience | Who experiences this story, and through which voice or medium? | ["style"] | [] | [] |
| focus:feeling | What tone or feeling should the presentation create? | ["style"] | [] | [] |


### Home, Voyage, Return [homeVoyageReturn]


Begin in safe but limited order, cross into an unfamiliar voyage, pay for what is gained, and return able to improve home.

Layout: storyCircle8.

Recommended purposes: ["story"]. Also useful: ["character", "learning", "relationship", "scene"]. Structure a journey into unfamiliar conditions, its cost, and what returns changed.

| Phase | Reference definition |
| --- | --- |
| 1 | {"key": "1", "name": "Comfort Zone", "short": "Home is safe and familiar, but it is dull, incomplete, or wasting potential.", "detail": "Ask how Home is less than it could be, why the hero feels anxious for adventure, what they want, and what unfamiliar world waits beyond their present life."} |
| 2 | {"key": "2", "name": "Need or Desire", "short": "The hero recognizes a want, lack, problem, or possibility that makes remaining at Home insufficient.", "detail": "Give the hero a concrete pull toward change. The need may be practical, social, emotional, or psychological, but it should make the familiar world feel too small."} |
| 3 | {"key": "3", "name": "Unfamiliar Situation", "short": "The hero enters a strange new world through a deliberate choice, force, or accident.", "detail": "Clarify how the journey begins, what dangers and opportunities define the new environment, and how strongly the hero still feels the pull of Home."} |
| 4 | {"key": "4", "name": "Adaptation", "short": "The hero learns the rules, skills, relationships, and perspective needed to function in the new world.", "detail": "The voyage should teach something Home could not. Let attempts, mistakes, allies, opposition, and discovery reshape how the hero approaches the central problem."} |
| 5 | {"key": "5", "name": "Get What They Want", "short": "The hero reaches the apparent goal or obtains the thing that originally motivated the voyage.", "detail": "Deliver meaningful success, but do not treat acquisition as the end. What the hero gains should expose a deeper cost, responsibility, or truth."} |
| 6 | {"key": "6", "name": "Pay a Price", "short": "The desired gain carries a sacrifice, consequence, reversal, or difficult recognition.", "detail": "Make the price proportionate to the value of the goal. It can be material, relational, moral, physical, social, or a surrender of the hero's former identity."} |
| 7 | {"key": "7", "name": "Return to Comfort", "short": "The hero returns to the old world, bringing the voyage and its consequences back into familiar life.", "detail": "Ask how the hero changed during the voyage and how Home now looks different. The return should test whether the transformation survives outside the strange world."} |
| 8 | {"key": "8", "name": "Having Changed", "short": "The hero completes the circle wiser, altered, and capable of making Home better.", "detail": "Show the difference through action. The final state should answer how the hero will improve Home and why they can no longer live exactly as they did before."} |

Generic questions and their declared choices:

| Key | Question | Purposes | Archetype variants | Choices |
| --- | --- | --- | --- | --- |
| focus:subject | Who is this character, and what do they want right now? | ["character"] | [] | [] |
| focus:change | What choice or pressure could reveal or change them? | ["character"] | [] | [] |
| phase:1 | What makes home familiar, and what is missing? | ["character"] | [] | [] |
| phase:2 | What do they want enough to leave home? | ["character"] | [] | [] |
| phase:3 | What unfamiliar situation do they enter? | ["character"] | [] | [] |
| phase:4 | What must they learn or change to cope? | ["character"] | [] | [] |
| phase:5 | What do they finally obtain? | ["character"] | [] | [] |
| phase:6 | What does getting it cost them? | ["character"] | [] | [] |
| phase:7 | What happens when they return? | ["character"] | [] | [] |
| phase:8 | What has changed in them, and how does it affect home? | ["character"] | [] | [] |
| focus:sides | Who are the people or groups in this relationship? | ["relationship"] | [] | [] |
| focus:needs | What does each side want from the other? | ["relationship"] | [] | [] |
| focus:change | What could change their trust, closeness, or power? | ["relationship"] | [] | [] |
| phase:1 | What familiar relationship do the sides begin with? | ["relationship"] | [] | [] |
| phase:2 | What need draws them beyond their usual roles? | ["relationship"] | [] | [] |
| phase:3 | What unfamiliar situation tests their relationship? | ["relationship"] | [] | [] |
| phase:4 | How do they learn to work with each other? | ["relationship"] | [] | [] |
| phase:5 | What do they achieve together or separately? | ["relationship"] | [] | [] |
| phase:6 | What does that achievement cost their relationship? | ["relationship"] | [] | [] |
| phase:7 | What happens when they return to familiar circumstances? | ["relationship"] | [] | [] |
| phase:8 | How have trust, roles, or closeness changed? | ["relationship"] | [] | [] |
| focus:message | Who is speaking to whom, and what needs to get across? | ["communication"] | [] | [] |
| focus:change | What should the listener understand, feel, or do afterward? | ["communication"] | [] | [] |
| phase:1 | What is home or the familiar starting situation? | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:2 | What need starts the journey? | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:3 | What unfamiliar world or problem is entered? | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:4 | How do the participants adapt? | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:5 | What desired thing do they obtain? | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:6 | What price or difficult consequence comes with it? | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:7 | How does the journey return to the starting world? | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:8 | What has changed, and how does it affect that world? | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| focus:stake | What matters here, and to whom? | ["values"] | [] | [] |
| focus:choice | Which values pull the choice in different directions? | ["values"] | [] | [] |
| focus:cost | What is gained and given up on each path? | ["values"] | [] | [] |
| focus:situation | What is happening when players enter this scene? | ["scene"] | [] | [] |
| focus:choice | What can players decide or do? | ["scene"] | [] | [] |
| focus:change | What changes because of that choice? | ["scene"] | [] | [] |
| focus:subject | Whose situation changes across this story or act? | ["story"] | [] | [] |
| focus:change | Where does it begin, and what should be different by the end? | ["story"] | [] | [] |
| focus:discovery | What could players discover or learn through this experience? | ["learning"] | [] | [] |
| focus:change | Where can they try what they have learned? | ["learning"] | [] | [] |
| focus:audience | Who experiences this story, and through which voice or medium? | ["style"] | [] | [] |
| focus:feeling | What tone or feeling should the presentation create? | ["style"] | [] | [] |


### Story Building System [storyBuildingSystem]


Ask seven practical questions to identify the missing story-building discipline, then combine the useful answers into a working recipe.

Layout: decisionPath.

Recommended purposes: ["story"]. Also useful: ["communication", "scene", "style", "character", "learning"]. Check the purpose, material, people, structure, delivery, and practical use of a story before polishing it.

| Phase | Reference definition |
| --- | --- |
| 1 | {"key": "1", "name": "Concept", "question": "Do you know why you need a story?", "short": "Define the central idea and the change in perspective the story should create.", "detail": "Stories shape how people understand themselves and the world around them. Frame the work as an adventure with a clear reason for being told."} |
| 2 | {"key": "2", "name": "Explore", "question": "Do you know where to find your story?", "short": "Map the unfamiliar situation, uncertainty, and discoveries that give the story movement.", "detail": "Stories help people navigate confusing and changing situations. Explore the territory ahead and identify the route, obstacles, and discoveries worth following."} |
| 3 | {"key": "3", "name": "Character", "question": "Do you know your role in the story?", "short": "Choose whose experience carries the story and why the audience should trust or care about them.", "detail": "Stories connect people through recognizable motives and relationships. Clarify who acts, what role they play, and why others should place trust in them."} |
| 4 | {"key": "4", "name": "Function", "question": "Do you know what your story needs to do?", "short": "State the practical effect the story should have on understanding, feeling, or action.", "detail": "A story should perform a useful job rather than merely present information. Decide whether it must persuade, teach, warn, unite, motivate, or help people choose."} |
| 5 | {"key": "5", "name": "Structure", "question": "Do you know how to plan your story?", "short": "Select a pattern that gives events a clear sequence, rhythm, and direction.", "detail": "A few durable patterns can carry an audience through complex material. Arrange the important moments so ideas build naturally and the progression feels story-shaped."} |
| 6 | {"key": "6", "name": "Style", "question": "Do you know how to tell your story?", "short": "Choose the voice, imagery, tone, and emphasis that will make the story memorable.", "detail": "Style helps useful information stay with the audience. Match the telling to the people, setting, and emotion without allowing decoration to obscure the central idea."} |
| 7 | {"key": "7", "name": "Organise", "question": "Do you know how to share your story?", "short": "Plan where, when, and how the story will reach people and support its intended use.", "detail": "Even a strong story needs deliberate delivery. Decide who should encounter it, in what form, at which moment, and how it fits the larger experience."} |
| 8 | {"key": "8", "name": "Recipe", "question": "Which story tactics solve this problem together?", "short": "Combine the most useful decisions from the earlier stages into one reusable approach.", "detail": "Stories can change how people understand and act. Assemble the concept, exploration, character, function, structure, style, and organisation choices that best serve this specific problem."} |

Generic questions and their declared choices:

| Key | Question | Purposes | Archetype variants | Choices |
| --- | --- | --- | --- | --- |
| focus:subject | Who is this character, and what do they want right now? | ["character"] | [] | [] |
| focus:change | What choice or pressure could reveal or change them? | ["character"] | [] | [] |
| phase:1 | Why is this character needed, and what is its central idea? | ["character"] | [] | [] |
| phase:2 | Which experiences, details, or unanswered questions could supply its material? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:3 | Whose perspective carries it, and what does each person contribute? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:4 | What should players or listeners understand, feel, or do because of it? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:5 | What sequence of events or ideas makes it easy to follow? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:6 | Which voice, tone, imagery, and emphasis suit it? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:7 | Where, when, and through which people or medium will it reach its audience? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:8 | Which choices from these answers form a useful working approach? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| focus:sides | Who are the people or groups in this relationship? | ["relationship"] | [] | [] |
| focus:needs | What does each side want from the other? | ["relationship"] | [] | [] |
| focus:change | What could change their trust, closeness, or power? | ["relationship"] | [] | [] |
| phase:1 | Why is this relationship / group dynamic needed, and what is its central idea? | ["relationship"] | [] | [] |
| focus:message | Who is speaking to whom, and what needs to get across? | ["communication"] | [] | [] |
| focus:change | What should the listener understand, feel, or do afterward? | ["communication"] | [] | [] |
| phase:1 | Why is this communication / dialogue plan needed, and what is its central idea? | ["communication"] | [] | [] |
| focus:stake | What matters here, and to whom? | ["values"] | [] | [] |
| focus:choice | Which values pull the choice in different directions? | ["values"] | [] | [] |
| focus:cost | What is gained and given up on each path? | ["values"] | [] | [] |
| phase:1 | Why is this values / dilemma needed, and what is its central idea? | ["values"] | [] | [] |
| focus:situation | What is happening when players enter this scene? | ["scene"] | [] | [] |
| focus:choice | What can players decide or do? | ["scene"] | [] | [] |
| focus:change | What changes because of that choice? | ["scene"] | [] | [] |
| phase:1 | Why is this scene / encounter plan needed, and what is its central idea? | ["scene"] | [] | [] |
| focus:subject | Whose situation changes across this story or act? | ["story"] | [] | [] |
| focus:change | Where does it begin, and what should be different by the end? | ["story"] | [] | [] |
| phase:1 | Why is this story / act outline needed, and what is its central idea? | ["story"] | [] | [] |
| focus:discovery | What could players discover or learn through this experience? | ["learning"] | [] | [] |
| focus:change | Where can they try what they have learned? | ["learning"] | [] | [] |
| phase:1 | Why is this learning / discovery sequence needed, and what is its central idea? | ["learning"] | [] | [] |
| focus:audience | Who experiences this story, and through which voice or medium? | ["style"] | [] | [] |
| focus:feeling | What tone or feeling should the presentation create? | ["style"] | [] | [] |
| phase:1 | Why is this voice / presentation guide needed, and what is its central idea? | ["style"] | [] | [] |


### NLP Meta Programs — Preference Spectra [nlpMetaPrograms]


NLP Meta Programs as character-writing prompts: explore how a character approaches a situation across six independent paired preferences.

Layout: preferenceSpectra.

Recommended purposes: ["character", "communication"]. Also useful: ["relationship", "scene", "learning"]. Explore contrasting preferences in motivation, decisions, information, and methods, then show their effect in a situation.

usage: A selected set of common NLP pairs, not an exhaustive taxonomy or a validated personality test. Either end can be useful. Preferences may blend or change with context; no position has been assigned to a character.

sourceUrl: https://www.coachcert.com/uploads/pdf/CMC-Reference-Guide-of-Meta-Programs.pdf

| Phase | Reference definition |
| --- | --- |
| 1 | {"key": "1", "name": "Motivation direction", "left": "Toward", "right": "Away From", "leftCue": "Desired outcome", "rightCue": "Problem to prevent", "leftDescription": "Attends to what could be gained.", "rightDescription": "Attends to what could be avoided.", "leftExample": "Winning an audience with the queen draws the envoy forward.", "rightExample": "Preventing a border war gives the envoy a reason to act.", "question": "What attracts the character, and what are they trying to prevent?", "detail": "The same mission can offer a prize and avert a loss. Let the scene reveal which matters now.", "short": "Toward ↔ Away From"} |
| 2 | {"key": "2", "name": "Evaluation reference", "left": "Internal", "right": "External", "leftCue": "Own criteria", "rightCue": "Outside feedback", "leftDescription": "Relies on personal standards when judging results.", "rightDescription": "Looks to feedback or external evidence when judging results.", "leftExample": "The smith knows the blade meets her chosen standard.", "rightExample": "The smith waits for field reports before judging the blade.", "question": "How does the character decide that the work is good enough?", "detail": "A character can hold an internal standard and still revise a decision when evidence arrives.", "short": "Internal ↔ External"} |
| 3 | {"key": "3", "name": "Action initiation", "left": "Proactive", "right": "Reactive", "leftCue": "Initiate", "rightCue": "Respond / reflect", "leftDescription": "Moves to initiate action.", "rightDescription": "Waits, observes, or responds to circumstances.", "leftExample": "The scout volunteers a route before anyone requests one.", "rightExample": "The scout studies the patrol change before proposing a route.", "question": "Do they initiate now, or wait for information or a trigger?", "detail": "Initiative can get a stalled party moving; reflection can reveal a trap. Give either approach consequences.", "short": "Proactive ↔ Reactive"} |
| 4 | {"key": "4", "name": "Information scope", "left": "Global", "right": "Detail", "leftCue": "Whole picture", "rightCue": "Specific parts", "leftDescription": "Starts with an overview.", "rightDescription": "Starts with particular facts or steps.", "leftExample": "The planner asks what the expedition must accomplish.", "rightExample": "The planner asks how many ropes each climber will carry.", "question": "What level of information helps the character understand the plan?", "detail": "A briefing can begin with the purpose, then supply the details needed to act.", "short": "Global ↔ Detail"} |
| 5 | {"key": "5", "name": "Relationship sorting", "left": "Sameness", "right": "Difference", "leftCue": "What matches", "rightCue": "What differs", "leftDescription": "Notices similarities and continuity.", "rightDescription": "Notices contrasts and change.", "leftExample": "The archivist recognizes a familiar pattern in the new seal.", "rightExample": "The archivist spots the one stroke that differs from the old seal.", "question": "What seems familiar here, and what breaks the pattern?", "detail": "A character may recognize a stable pattern with exceptions; the middle need not mean indecision.", "short": "Sameness ↔ Difference"} |
| 6 | {"key": "6", "name": "Method preference", "left": "Options", "right": "Procedures", "leftCue": "Explore alternatives", "rightCue": "Follow a sequence", "leftDescription": "Prefers alternative approaches and flexibility.", "rightDescription": "Prefers an established sequence.", "leftExample": "The infiltrator offers three ways through the gate.", "rightExample": "The infiltrator rehearses the agreed entry sequence.", "question": "Does the character want alternatives or a clear method to follow?", "detail": "Discovery can call for options; executing a fragile plan can call for a reliable sequence.", "short": "Options ↔ Procedures"} |


### NLP Meta Model — Language Spectrum [nlpMetaModel]


A dialogue-writing reference based on the Neuro-Linguistic Programming Meta Model. Use deletion, distortion, and generalization as prompts to explore what a character means.

Layout: languageSpectrum.

Recommended purposes: ["communication"]. Also useful: ["relationship", "scene", "character", "style"]. Write or unpack a statement: what is missing, assumed, or treated as an absolute, and what a question might reveal.

usage: The spectrum shows increasing explicitness, not a measured scale or a ranking of people. The right-hand statements are illustrative possible answers, not conclusions that a question proves. Ask with curiosity; one sentence can contain several patterns.

sourceUrl: https://www.inlpta.org/english/nlp-best-practice-theory/metamodel-of-language/

| Phase | Reference definition |
| --- | --- |
| 1 | {"key": "1", "group": "Deletion", "name": "Simple deletion", "short": "Missing detail", "example": "The mission failed.", "question": "Which part failed?", "clarified": "The courier missed the northern rendezvous.", "detail": "A statement omits information needed to understand the event. Recover the missing part before inventing an explanation."} |
| 2 | {"key": "2", "group": "Deletion", "name": "Unspecified referent", "short": "Unnamed people or things", "example": "They rejected the plan.", "question": "Who specifically rejected it?", "clarified": "The quartermaster rejected the plan.", "detail": "A pronoun or broad noun conceals who or what is involved. Identify the referent without assuming that a whole group shares a view."} |
| 3 | {"key": "3", "group": "Deletion", "name": "Unspecified verb", "short": "Unclear action", "example": "The captain undermined me.", "question": "What did the captain do?", "clarified": "The captain reassigned my scouts without consulting me.", "detail": "An action word compresses the actual behavior. Ask for observable actions so characters can discuss the same event."} |
| 4 | {"key": "4", "group": "Deletion", "name": "Comparative deletion", "short": "Missing comparison", "example": "This route is safer.", "question": "Safer than which route, and in what way?", "clarified": "The ridge has fewer patrols than the river crossing.", "detail": "A comparison leaves its baseline or criterion unstated. Recover both the alternative and the quality being compared."} |
| 5 | {"key": "5", "group": "Distortion", "name": "Nominalization", "short": "Process treated as a thing", "example": "Our cooperation is broken.", "question": "Who needs to cooperate, and how?", "clarified": "The scouts and guards need to share their nightly reports.", "detail": "A process is described as an abstract noun. Return to people doing something, so a possible change becomes easier to describe."} |
| 6 | {"key": "6", "group": "Distortion", "name": "Mind reading", "short": "Assumed inner state", "example": "The envoy despises me.", "question": "What have you observed that suggests that?", "clarified": "The envoy declined two invitations; I do not know why.", "detail": "A speaker claims access to another person’s thoughts or feelings. Separate the observed behavior from the interpretation."} |
| 7 | {"key": "7", "group": "Distortion", "name": "Cause and effect", "short": "Assumed causal link", "example": "Your questions make me lose command.", "question": "How do the questions affect your command?", "clarified": "I lose my place when questions interrupt my briefing.", "detail": "One event is presented as producing another. Explore the proposed connection and circumstances without denying real external constraints."} |
| 8 | {"key": "8", "group": "Distortion", "name": "Complex equivalence", "short": "One event equals a meaning", "example": "She left the meeting, so she betrayed us.", "question": "How does leaving establish betrayal?", "clarified": "She left before the vote; her reason is still unknown.", "detail": "A behavior is equated with a larger conclusion. Ask what connects them and what other interpretations could fit."} |
| 9 | {"key": "9", "group": "Distortion", "name": "Presupposition", "short": "Embedded assumption", "example": "When will you admit the theft?", "question": "Has the theft been established?", "clarified": "An item is missing; we need to establish what happened.", "detail": "A question embeds an unconfirmed premise. Make the premise explicit before accepting the question’s framing."} |
| 10 | {"key": "10", "group": "Distortion", "name": "Lost performative", "short": "Unattributed judgment", "example": "It is dishonorable to negotiate.", "question": "Whose standard defines that as dishonorable?", "clarified": "Our commander considers negotiating with this faction dishonorable.", "detail": "A value judgment appears without its speaker or standard. Locate the perspective rather than treating the judgment as universal fact."} |
| 11 | {"key": "11", "group": "Generalization", "name": "Universal quantifier", "short": "Absolute rule", "example": "No ally ever keeps a promise.", "question": "Has any ally kept a promise, even once?", "clarified": "Two allies broke recent promises; the healer kept hers.", "detail": "Words such as all, never, or everyone can expand an experience into a universal rule. Look for scope and exceptions without dismissing the experience."} |
| 12 | {"key": "12", "group": "Generalization", "name": "Modal operator", "short": "Necessity or impossibility", "example": "I must obey; I cannot refuse.", "question": "What requires obedience, and what would happen if you refused?", "clarified": "Refusal risks my rank; I could still request a different assignment.", "detail": "Must and should express necessity; cannot and impossible express limits. Explore the source, consequences, and available choices, including genuine constraints."} |

Generic questions and their declared choices:

| Key | Question | Purposes | Archetype variants | Choices |
| --- | --- | --- | --- | --- |
| focus:subject | Who is this character, and what do they want right now? | ["character"] | [] | [] |
| focus:change | What choice or pressure could reveal or change them? | ["character"] | [] | [] |
| phase:1 | How might this character use simple deletion in dialogue? Write their line, a clarifying question, and what the reply reveals. | ["character"] | [] | [] |
| phase:2 | How might this character use unspecified referent in dialogue? Write their line, a clarifying question, and what the reply reveals. | ["character"] | [] | [] |
| phase:3 | How might this character use unspecified verb in dialogue? Write their line, a clarifying question, and what the reply reveals. | ["character"] | [] | [] |
| phase:4 | How might this character use comparative deletion in dialogue? Write their line, a clarifying question, and what the reply reveals. | ["character"] | [] | [] |
| phase:5 | How might this character use nominalization in dialogue? Write their line, a clarifying question, and what the reply reveals. | ["character"] | [] | [] |
| phase:6 | How might this character use mind reading in dialogue? Write their line, a clarifying question, and what the reply reveals. | ["character"] | [] | [] |
| phase:7 | How might this character use cause and effect in dialogue? Write their line, a clarifying question, and what the reply reveals. | ["character"] | [] | [] |
| phase:8 | How might this character use complex equivalence in dialogue? Write their line, a clarifying question, and what the reply reveals. | ["character"] | [] | [] |
| phase:9 | How might this character use presupposition in dialogue? Write their line, a clarifying question, and what the reply reveals. | ["character"] | [] | [] |
| phase:10 | How might this character use lost performative in dialogue? Write their line, a clarifying question, and what the reply reveals. | ["character"] | [] | [] |
| phase:11 | How might this character use universal quantifier in dialogue? Write their line, a clarifying question, and what the reply reveals. | ["character"] | [] | [] |
| phase:12 | How might this character use modal operator in dialogue? Write their line, a clarifying question, and what the reply reveals. | ["character"] | [] | [] |
| focus:sides | Who are the people or groups in this relationship? | ["relationship"] | [] | [] |
| focus:needs | What does each side want from the other? | ["relationship"] | [] | [] |
| focus:change | What could change their trust, closeness, or power? | ["relationship"] | [] | [] |
| phase:1 | Write something one side assumes about the other using simple deletion. What clarifying question and answer could change their understanding? | ["relationship"] | [] | [] |
| phase:2 | Write something one side assumes about the other using unspecified referent. What clarifying question and answer could change their understanding? | ["relationship"] | [] | [] |
| phase:3 | Write something one side assumes about the other using unspecified verb. What clarifying question and answer could change their understanding? | ["relationship"] | [] | [] |
| phase:4 | Write something one side assumes about the other using comparative deletion. What clarifying question and answer could change their understanding? | ["relationship"] | [] | [] |
| phase:5 | Write something one side assumes about the other using nominalization. What clarifying question and answer could change their understanding? | ["relationship"] | [] | [] |
| phase:6 | Write something one side assumes about the other using mind reading. What clarifying question and answer could change their understanding? | ["relationship"] | [] | [] |
| phase:7 | Write something one side assumes about the other using cause and effect. What clarifying question and answer could change their understanding? | ["relationship"] | [] | [] |
| phase:8 | Write something one side assumes about the other using complex equivalence. What clarifying question and answer could change their understanding? | ["relationship"] | [] | [] |
| phase:9 | Write something one side assumes about the other using presupposition. What clarifying question and answer could change their understanding? | ["relationship"] | [] | [] |
| phase:10 | Write something one side assumes about the other using lost performative. What clarifying question and answer could change their understanding? | ["relationship"] | [] | [] |
| phase:11 | Write something one side assumes about the other using universal quantifier. What clarifying question and answer could change their understanding? | ["relationship"] | [] | [] |
| phase:12 | Write something one side assumes about the other using modal operator. What clarifying question and answer could change their understanding? | ["relationship"] | [] | [] |
| focus:message | Who is speaking to whom, and what needs to get across? | ["communication"] | [] | [] |
| focus:change | What should the listener understand, feel, or do afterward? | ["communication"] | [] | [] |
| phase:1 | Write a line using simple deletion, the question that uncovers what it means, and a possible more specific reply. | ["communication", "values", "scene", "story", "learning"] | [] | [] |
| phase:2 | Write a line using unspecified referent, the question that uncovers what it means, and a possible more specific reply. | ["communication", "values", "scene", "story", "learning"] | [] | [] |
| phase:3 | Write a line using unspecified verb, the question that uncovers what it means, and a possible more specific reply. | ["communication", "values", "scene", "story", "learning"] | [] | [] |
| phase:4 | Write a line using comparative deletion, the question that uncovers what it means, and a possible more specific reply. | ["communication", "values", "scene", "story", "learning"] | [] | [] |
| phase:5 | Write a line using nominalization, the question that uncovers what it means, and a possible more specific reply. | ["communication", "values", "scene", "story", "learning"] | [] | [] |
| phase:6 | Write a line using mind reading, the question that uncovers what it means, and a possible more specific reply. | ["communication", "values", "scene", "story", "learning"] | [] | [] |
| phase:7 | Write a line using cause and effect, the question that uncovers what it means, and a possible more specific reply. | ["communication", "values", "scene", "story", "learning"] | [] | [] |
| phase:8 | Write a line using complex equivalence, the question that uncovers what it means, and a possible more specific reply. | ["communication", "values", "scene", "story", "learning"] | [] | [] |
| phase:9 | Write a line using presupposition, the question that uncovers what it means, and a possible more specific reply. | ["communication", "values", "scene", "story", "learning"] | [] | [] |
| phase:10 | Write a line using lost performative, the question that uncovers what it means, and a possible more specific reply. | ["communication", "values", "scene", "story", "learning"] | [] | [] |
| phase:11 | Write a line using universal quantifier, the question that uncovers what it means, and a possible more specific reply. | ["communication", "values", "scene", "story", "learning"] | [] | [] |
| phase:12 | Write a line using modal operator, the question that uncovers what it means, and a possible more specific reply. | ["communication", "values", "scene", "story", "learning"] | [] | [] |
| focus:stake | What matters here, and to whom? | ["values"] | [] | [] |
| focus:choice | Which values pull the choice in different directions? | ["values"] | [] | [] |
| focus:cost | What is gained and given up on each path? | ["values"] | [] | [] |
| focus:situation | What is happening when players enter this scene? | ["scene"] | [] | [] |
| focus:choice | What can players decide or do? | ["scene"] | [] | [] |
| focus:change | What changes because of that choice? | ["scene"] | [] | [] |
| focus:subject | Whose situation changes across this story or act? | ["story"] | [] | [] |
| focus:change | Where does it begin, and what should be different by the end? | ["story"] | [] | [] |
| focus:discovery | What could players discover or learn through this experience? | ["learning"] | [] | [] |
| focus:change | Where can they try what they have learned? | ["learning"] | [] | [] |
| focus:audience | Who experiences this story, and through which voice or medium? | ["style"] | [] | [] |
| focus:feeling | What tone or feeling should the presentation create? | ["style"] | [] | [] |
| phase:1 | How could simple deletion shape a narrator’s wording? Write the compressed version, a question about it, and a clearer version. | ["style"] | [] | [] |
| phase:2 | How could unspecified referent shape a narrator’s wording? Write the compressed version, a question about it, and a clearer version. | ["style"] | [] | [] |
| phase:3 | How could unspecified verb shape a narrator’s wording? Write the compressed version, a question about it, and a clearer version. | ["style"] | [] | [] |
| phase:4 | How could comparative deletion shape a narrator’s wording? Write the compressed version, a question about it, and a clearer version. | ["style"] | [] | [] |
| phase:5 | How could nominalization shape a narrator’s wording? Write the compressed version, a question about it, and a clearer version. | ["style"] | [] | [] |
| phase:6 | How could mind reading shape a narrator’s wording? Write the compressed version, a question about it, and a clearer version. | ["style"] | [] | [] |
| phase:7 | How could cause and effect shape a narrator’s wording? Write the compressed version, a question about it, and a clearer version. | ["style"] | [] | [] |
| phase:8 | How could complex equivalence shape a narrator’s wording? Write the compressed version, a question about it, and a clearer version. | ["style"] | [] | [] |
| phase:9 | How could presupposition shape a narrator’s wording? Write the compressed version, a question about it, and a clearer version. | ["style"] | [] | [] |
| phase:10 | How could lost performative shape a narrator’s wording? Write the compressed version, a question about it, and a clearer version. | ["style"] | [] | [] |
| phase:11 | How could universal quantifier shape a narrator’s wording? Write the compressed version, a question about it, and a clearer version. | ["style"] | [] | [] |
| phase:12 | How could modal operator shape a narrator’s wording? Write the compressed version, a question about it, and a clearer version. | ["style"] | [] | [] |


### MMPI-2 — Character Profile [mmpi2CharacterProfile]


A simplified MMPI-2-inspired writing framework from the supplied text. Describe multiple dimensions together rather than assigning one personality type.

Layout: profileDomains.

Recommended purposes: ["character"]. Also useful: ["relationship", "scene"]. Describe several dimensions of one fictional character and how those traits affect behaviour. It is not an assessment of players.

usage: Character-writing reference, not the official MMPI-2 assessment or a diagnostic scoring tool. The five levels are descriptive writing prompts, not clinical scores or cutoffs. Rate each lowest-level characteristic separately: higher is not automatically worse, and the subdomains can point in different directions.

| Phase | Reference definition |
| --- | --- |
| 1 | {"key": "1", "name": "Response Reliability & Self-Presentation", "short": "How consistent is the account, and how is the character presenting themselves?", "detail": "This asks first whether the psychological profile can actually be trusted. It looks for inconsistent responding, unusual responding, exaggeration of problems, minimizing problems, or presenting oneself in an unrealistically positive way. In forensic evaluations this is especially important because people may have reasons to look either healthier or more impaired than they actually are. MMPI-2 validity indicators include VRIN, TRIN, F, Fp, FBS, L, K and S.", "children": ["Consistency", "Exaggeration", "Minimization / positive presentation"]} |
| 2 | {"key": "2", "name": "Emotional Distress & Negative Emotionality", "short": "How strongly does the character experience negative emotion?", "detail": "This domain represents how strongly someone experiences depression, anxiety, worry, guilt, emotional discomfort and general psychological distress. At the low end, a person may be emotionally stable and relatively resilient; at the high end, negative emotions may become persistent and interfere with everyday functioning. Relevant MMPI-2 measures include Depression, Psychasthenia, Anxiety, Depression content scales, RCd, RC2, RC7 and PSY-5 Negative Emotionality/Neuroticism.", "children": ["Negative emotionality", "Depression / low positive emotion", "Anxiety / worry", "Fear"]} |
| 3 | {"key": "3", "name": "Somatic & Health Focus", "short": "How prominent are bodily symptoms and health concerns?", "detail": "This describes the extent to which physical symptoms, bodily sensations and health concerns form part of someone's psychological experience. An elevation does not by itself mean symptoms are fabricated; psychological distress and genuine medical problems can coexist. The MMPI-2 examines this through scales such as Hypochondriasis, Hysteria-related somatic complaints, RC1 Somatic Complaints and the Health Concerns content scale.", "children": ["Physical complaints", "Health concern"]} |
| 4 | {"key": "4", "name": "Thought & Perceptual Functioning", "short": "How does the character experience and interpret reality?", "detail": "This domain concerns how conventionally or unusually someone experiences and interprets reality. It ranges from ordinary, organized thinking through increasingly unusual perceptions, beliefs, cognitive experiences or feelings of disconnection from oneself and others. Relevant MMPI-2 scales include RC8 Aberrant Experiences, parts of the traditional Schizophrenia scale, Bizarre Mentation and PSY-5 Psychoticism. Importantly, elevation on these scales is not the same thing as diagnosing schizophrenia or another psychotic disorder.", "children": ["Conventional ↔ unusual thinking", "Unusual experiences", "Reality interpretation"]} |
| 5 | {"key": "5", "name": "Trust, Suspicion & Cynicism", "short": "How does the character interpret other people’s motives?", "detail": "This measures how someone interprets other people's motives. At one end is interpersonal trust and a generally benign view of others; moving upward you see skepticism, cynicism and guardedness, and at more extreme levels there may be strong beliefs that other people intend harm or exploitation. MMPI-2 scales relevant here include Paranoia, RC3 Cynicism, RC6 Ideas of Persecution, Cynicism and Interpersonal Suspiciousness.", "children": ["Trust", "Cynicism", "Persecutory interpretation"]} |
| 6 | {"key": "6", "name": "Behavioral Control & Disconstraint", "short": "How does the character manage impulses, rules, and consequences?", "detail": "This domain asks how strongly behavior is regulated by rules, planning and consideration of consequences. Lower disconstraint generally corresponds to greater inhibition and self-control, while higher levels can involve impulsiveness, risk-taking, rule-breaking or difficulty accepting restrictions. Relevant MMPI-2 measures include RC4 Antisocial Behavior, Antisocial Practices and PSY-5 Disconstraint. These scores describe tendencies rather than establishing that someone has committed particular acts.", "children": ["Self-control", "Impulsivity", "Rule conformity"]} |
| 7 | {"key": "7", "name": "Aggression, Anger & Activation", "short": "Consider conflict intensity and energy separately.", "detail": "This domain combines the intensity with which someone approaches conflict with their general level of psychological activation. A person may range from restrained and conflict-avoidant through assertive and energetic to highly irritable, aggressive, restless or excessively activated. Relevant measures include Anger, Hostility, PSY-5 Aggressiveness, Hypomania and RC9 Hypomanic Activation. Because aggression and activation are different phenomena, a detailed assessment would eventually separate these into two subdomains.", "children": ["Anger", "Aggressiveness", "Activation / energy"]} |
| 8 | {"key": "8", "name": "Social & Interpersonal Style", "short": "How does the character relate to others across situations?", "detail": "This describes how a person functions around other people rather than simply asking whether they are “introverted or extroverted.” It can capture social withdrawal, shyness, discomfort, alienation, dominance, interpersonal confidence and problems within close relationships or families. Relevant MMPI-2 measures include Social Introversion, Social Discomfort, Family Problems, Dominance and PSY-5 Introversion/Low Positive Emotionality.", "children": ["Introversion", "Social confidence", "Dominance / passivity", "Relationship functioning"]} |
| 9 | {"key": "9", "name": "Adjustment, Coping & Psychological Resources", "short": "What helps the character cope, function, and seek support?", "detail": "This final area asks how effectively someone manages demands placed on them. It includes self-esteem, psychological resilience, ability to function at work or school, willingness to discuss difficulties and openness to treatment or evaluation. Relevant MMPI-2 scales include Ego Strength, Low Self-Esteem, Work Interference and Negative Treatment Indicators. This can be particularly important because two people with similar symptoms may differ dramatically in their ability to cope with them.", "children": ["Self-esteem", "Resilience", "Functional capacity", "Openness to help"]} |

Generic questions and their declared choices:

| Key | Question | Purposes | Archetype variants | Choices |
| --- | --- | --- | --- | --- |
| focus:subject | Who is this character, and what do they want right now? | ["character"] | [] | [] |
| focus:change | What choice or pressure could reveal or change them? | ["character"] | [] | [] |
| phase:1 | How consistent is the account, and how is the character presenting themselves? Show this through a scene or behaviour. | ["character"] | [] | [] |
| phase:2 | How strongly does the character experience negative emotion? Show this through a scene or behaviour. | ["character"] | [] | [] |
| phase:3 | How prominent are bodily symptoms and health concerns? Show this through a scene or behaviour. | ["character"] | [] | [] |
| phase:4 | How does the character experience and interpret reality? Show this through a scene or behaviour. | ["character"] | [] | [] |
| phase:5 | How does the character interpret other people’s motives? Show this through a scene or behaviour. | ["character"] | [] | [] |
| phase:6 | How does the character manage impulses, rules, and consequences? Show this through a scene or behaviour. | ["character"] | [] | [] |
| phase:7 | Consider conflict intensity and energy separately. Show this through a scene or behaviour. | ["character"] | [] | [] |
| phase:8 | How does the character relate to others across situations? Show this through a scene or behaviour. | ["character"] | [] | [] |
| phase:9 | What helps the character cope, function, and seek support? Show this through a scene or behaviour. | ["character"] | [] | [] |
| focus:sides | Who are the people or groups in this relationship? | ["relationship"] | [] | [] |
| focus:needs | What does each side want from the other? | ["relationship"] | [] | [] |
| focus:change | What could change their trust, closeness, or power? | ["relationship"] | [] | [] |
| phase:1 | How might “Response Reliability & Self-Presentation” in one fictional person affect this relationship? Describe the other side’s response as well. | ["relationship"] | [] | [] |
| phase:2 | How might “Emotional Distress & Negative Emotionality” in one fictional person affect this relationship? Describe the other side’s response as well. | ["relationship"] | [] | [] |
| phase:3 | How might “Somatic & Health Focus” in one fictional person affect this relationship? Describe the other side’s response as well. | ["relationship"] | [] | [] |
| phase:4 | How might “Thought & Perceptual Functioning” in one fictional person affect this relationship? Describe the other side’s response as well. | ["relationship"] | [] | [] |
| phase:5 | How might “Trust, Suspicion & Cynicism” in one fictional person affect this relationship? Describe the other side’s response as well. | ["relationship"] | [] | [] |
| phase:6 | How might “Behavioral Control & Disconstraint” in one fictional person affect this relationship? Describe the other side’s response as well. | ["relationship"] | [] | [] |
| phase:7 | How might “Aggression, Anger & Activation” in one fictional person affect this relationship? Describe the other side’s response as well. | ["relationship"] | [] | [] |
| phase:8 | How might “Social & Interpersonal Style” in one fictional person affect this relationship? Describe the other side’s response as well. | ["relationship"] | [] | [] |
| phase:9 | How might “Adjustment, Coping & Psychological Resources” in one fictional person affect this relationship? Describe the other side’s response as well. | ["relationship"] | [] | [] |
| focus:message | Who is speaking to whom, and what needs to get across? | ["communication"] | [] | [] |
| focus:change | What should the listener understand, feel, or do afterward? | ["communication"] | [] | [] |
| phase:1 | How might “Response Reliability & Self-Presentation” in one fictional participant affect this situation? Show behaviour and consequences rather than labelling the whole group. | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:2 | How might “Emotional Distress & Negative Emotionality” in one fictional participant affect this situation? Show behaviour and consequences rather than labelling the whole group. | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:3 | How might “Somatic & Health Focus” in one fictional participant affect this situation? Show behaviour and consequences rather than labelling the whole group. | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:4 | How might “Thought & Perceptual Functioning” in one fictional participant affect this situation? Show behaviour and consequences rather than labelling the whole group. | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:5 | How might “Trust, Suspicion & Cynicism” in one fictional participant affect this situation? Show behaviour and consequences rather than labelling the whole group. | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:6 | How might “Behavioral Control & Disconstraint” in one fictional participant affect this situation? Show behaviour and consequences rather than labelling the whole group. | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:7 | How might “Aggression, Anger & Activation” in one fictional participant affect this situation? Show behaviour and consequences rather than labelling the whole group. | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:8 | How might “Social & Interpersonal Style” in one fictional participant affect this situation? Show behaviour and consequences rather than labelling the whole group. | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| phase:9 | How might “Adjustment, Coping & Psychological Resources” in one fictional participant affect this situation? Show behaviour and consequences rather than labelling the whole group. | ["communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| focus:stake | What matters here, and to whom? | ["values"] | [] | [] |
| focus:choice | Which values pull the choice in different directions? | ["values"] | [] | [] |
| focus:cost | What is gained and given up on each path? | ["values"] | [] | [] |
| focus:situation | What is happening when players enter this scene? | ["scene"] | [] | [] |
| focus:choice | What can players decide or do? | ["scene"] | [] | [] |
| focus:change | What changes because of that choice? | ["scene"] | [] | [] |
| focus:subject | Whose situation changes across this story or act? | ["story"] | [] | [] |
| focus:change | Where does it begin, and what should be different by the end? | ["story"] | [] | [] |
| focus:discovery | What could players discover or learn through this experience? | ["learning"] | [] | [] |
| focus:change | Where can they try what they have learned? | ["learning"] | [] | [] |
| focus:audience | Who experiences this story, and through which voice or medium? | ["style"] | [] | [] |
| focus:feeling | What tone or feeling should the presentation create? | ["style"] | [] | [] |


### Jungian Feminine Archetypes [jungianFeminineArchetypes]


Based on Toni Wolff’s four structural forms of the feminine psyche. These are character-building lenses; any character can express several forms.

Layout: archetypes.

Recommended purposes: ["character", "relationship"]. Also useful: ["scene", "values", "story"]. Explore care, connection, independence, and meaning, including how those roles support or limit relationships.

attribution: Toni Wolff, Structural Forms of the Feminine Psyche (1956 translation). The active/passive shadow names and story examples below are Larpcraft adaptations, not a canonical child/adult system from Wolff.

sourceUrl: https://www.miembrosadepac.org/wp-content/uploads/2015Copia/09/Wolff-Forms-Feminine-Psyche.pdf

| Phase | Reference definition |
| --- | --- |
| Mother | {"key": "Mother", "name": "Nurture & growth", "short": "Care that helps another person become capable and independent.", "detail": "Creates conditions for others to grow. In a story, the crucial choice is when to shelter someone and when to trust their ability to leave.", "adultActiveShadow": "Controlling Caregiver", "adultPassiveShadow": "Self-erasing Caregiver", "descriptions": {"adult": "Creates conditions for others to grow. In a story, the crucial choice is when to shelter someone and when to trust their ability to leave.", "adultActiveShadow": "Makes help conditional on obedience and treats independence as rejection. A mentor may sabotage a pupil’s departure while insisting it is for their protection.", "adultPassiveShadow": "Gives beyond personal limits until needs and identity disappear. A caretaker might accept every demand, then become exhausted or silently resentful."}} |
| Companion | {"key": "Companion", "name": "Hetaira · relationship", "short": "Attends to the particular person and the possibilities within a relationship.", "detail": "Builds meaningful connection through attention and honest exchange. A story tests whether intimacy can support two distinct people rather than require them to become one.", "adultActiveShadow": "Possessive Companion", "adultPassiveShadow": "Dependent Companion", "descriptions": {"adult": "Builds meaningful connection through attention and honest exchange. A story tests whether intimacy can support two distinct people rather than require them to become one.", "adultActiveShadow": "Uses closeness, jealousy, or privileged confidences to monopolize another person. A trusted ally may undermine every competing friendship.", "adultPassiveShadow": "Lets belonging replace personal judgment and direction. A character agrees to betray a value rather than risk losing a treasured bond."}} |
| Amazon | {"key": "Amazon", "name": "Autonomy & achievement", "short": "Acts independently and pursues work, causes, and competence.", "detail": "Chooses a direction and develops the skills to follow it. A story tests the balance between self-reliance and accepting help or shared responsibility.", "adultActiveShadow": "Ruthless Competitor", "adultPassiveShadow": "Isolated Defender", "descriptions": {"adult": "Chooses a direction and develops the skills to follow it. A story tests the balance between self-reliance and accepting help or shared responsibility.", "adultActiveShadow": "Makes achievement the measure of human worth and treats cooperation as weakness. A commander might sacrifice allies to preserve a record of winning.", "adultPassiveShadow": "Protects autonomy by refusing involvement, vulnerability, or assistance. A capable loner may abandon a worthy shared task rather than risk needing anyone."}} |
| Medial Woman | {"key": "Medial Woman", "name": "Meaning & intuition", "short": "Responds to emerging meanings, images, and the atmosphere of a group.", "detail": "Gives form to intuitions through reflection, art, or symbolic language. A story tests whether an evocative insight can be grounded in responsible action.", "adultActiveShadow": "Inflated Oracle", "adultPassiveShadow": "Overwhelmed Vessel", "descriptions": {"adult": "Gives form to intuitions through reflection, art, or symbolic language. A story tests whether an evocative insight can be grounded in responsible action.", "adultActiveShadow": "Treats an interpretation as unquestionable truth and claims special authority. An oracle might demand obedience instead of allowing others to question a vision.", "adultPassiveShadow": "Absorbs impressions without enough distance to choose a response. A sensitive character becomes carried by the group’s fears and needs time to distinguish them from personal judgment."}} |

Generic questions and their declared choices:

| Key | Question | Purposes | Archetype variants | Choices |
| --- | --- | --- | --- | --- |
| focus:subject | Who is this character, and what do they want right now? | ["character"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| focus:change | What choice or pressure could reveal or change them? | ["character"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| archetype | Which archetype would you like to explore? | ["character"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | ["Mother", "Companion", "Amazon", "Medial Woman"] |
| strength | How does this character show the healthy side of this archetype? | ["character"] | [] | [] |
| activeShadow | Under pressure, how might this character misuse their strength? | ["character"] | [] | [] |
| passiveShadow | When this character withdraws or gives up, what does that look like? | ["character"] | [] | [] |
| shadowScene | What situation brings out a shadow, and what could help that role recover? | ["character", "communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| strength | How does this character, as the Mother, care for others while helping them become independent? | ["character"] | ["Mother"] | [] |
| activeShadow | What could push this Mother toward the Controlling Caregiver? Who would feel the effects? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Mother"] | [] |
| passiveShadow | When this Mother gives up or withdraws, how does the Self-erasing Caregiver appear? What responsibility or connection is lost? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Mother"] | [] |
| shadowScene | What scene could test this Mother between its healthy side, the Controlling Caregiver, and the Self-erasing Caregiver? What choice could change the pattern? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Mother"] | [] |
| strength | How does this character, as the Companion, build closeness while leaving room for two distinct people? | ["character"] | ["Companion"] | [] |
| activeShadow | What could push this Companion toward the Possessive Companion? Who would feel the effects? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Companion"] | [] |
| passiveShadow | When this Companion gives up or withdraws, how does the Dependent Companion appear? What responsibility or connection is lost? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Companion"] | [] |
| shadowScene | What scene could test this Companion between its healthy side, the Possessive Companion, and the Dependent Companion? What choice could change the pattern? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Companion"] | [] |
| strength | How does this character, as the Amazon, pursue a purpose independently while accepting useful help? | ["character"] | ["Amazon"] | [] |
| activeShadow | What could push this Amazon toward the Ruthless Competitor? Who would feel the effects? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Amazon"] | [] |
| passiveShadow | When this Amazon gives up or withdraws, how does the Isolated Defender appear? What responsibility or connection is lost? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Amazon"] | [] |
| shadowScene | What scene could test this Amazon between its healthy side, the Ruthless Competitor, and the Isolated Defender? What choice could change the pattern? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Amazon"] | [] |
| strength | How does this character, as the Medial Woman, give meaning to intuitions and turn them into responsible action? | ["character"] | ["Medial Woman"] | [] |
| activeShadow | What could push this Medial Woman toward the Inflated Oracle? Who would feel the effects? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Medial Woman"] | [] |
| passiveShadow | When this Medial Woman gives up or withdraws, how does the Overwhelmed Vessel appear? What responsibility or connection is lost? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Medial Woman"] | [] |
| shadowScene | What scene could test this Medial Woman between its healthy side, the Inflated Oracle, and the Overwhelmed Vessel? What choice could change the pattern? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Medial Woman"] | [] |
| focus:sides | Who are the people or groups in this relationship? | ["relationship"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| focus:needs | What does each side want from the other? | ["relationship"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| focus:change | What could change their trust, closeness, or power? | ["relationship"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| archetype | Which archetype shapes one side of this relationship? | ["relationship"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | ["Mother", "Companion", "Amazon", "Medial Woman"] |
| otherRole | What role does the other side take, and what do they need from this side? | ["relationship"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | ["Mother", "Companion", "Amazon", "Medial Woman"] |
| strength | How do these roles support each other, and where do their needs clash? | ["relationship"] | [] | [] |
| activeShadow | How does this role become controlling, excessive, or harmful to the other side? | ["relationship"] | [] | [] |
| passiveShadow | What happens between the sides when this role withdraws or gives up? | ["relationship"] | [] | [] |
| shadowScene | What could bring out the shadow, and what boundary or action could change the pattern? | ["relationship"] | [] | [] |
| strength | How does the Mother support or clash with the other side? What does each side need? | ["relationship"] | ["Mother"] | [] |
| strength | How does the Companion support or clash with the other side? What does each side need? | ["relationship"] | ["Companion"] | [] |
| strength | How does the Amazon support or clash with the other side? What does each side need? | ["relationship"] | ["Amazon"] | [] |
| strength | How does the Medial Woman support or clash with the other side? What does each side need? | ["relationship"] | ["Medial Woman"] | [] |
| focus:message | Who is speaking to whom, and what needs to get across? | ["communication"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| focus:change | What should the listener understand, feel, or do afterward? | ["communication"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| archetype | Which archetype could help you understand a role in this situation? | ["communication", "values", "scene", "story", "learning", "style"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | ["Mother", "Companion", "Amazon", "Medial Woman"] |
| strength | How does a person or role involved in this communication & dialogue show the healthy side of this archetype? | ["communication"] | [] | [] |
| activeShadow | Under pressure, how might a person or role involved in this communication & dialogue misuse their strength? | ["communication"] | [] | [] |
| passiveShadow | When a person or role involved in this communication & dialogue withdraws or gives up, what does that look like? | ["communication"] | [] | [] |
| strength | How does a person or role involved in this communication & dialogue, as the Mother, care for others while helping them become independent? | ["communication"] | ["Mother"] | [] |
| strength | How does a person or role involved in this communication & dialogue, as the Companion, build closeness while leaving room for two distinct people? | ["communication"] | ["Companion"] | [] |
| strength | How does a person or role involved in this communication & dialogue, as the Amazon, pursue a purpose independently while accepting useful help? | ["communication"] | ["Amazon"] | [] |
| strength | How does a person or role involved in this communication & dialogue, as the Medial Woman, give meaning to intuitions and turn them into responsible action? | ["communication"] | ["Medial Woman"] | [] |
| focus:stake | What matters here, and to whom? | ["values"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| focus:choice | Which values pull the choice in different directions? | ["values"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| focus:cost | What is gained and given up on each path? | ["values"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| strength | How does a person or role involved in this values & moral choices show the healthy side of this archetype? | ["values"] | [] | [] |
| activeShadow | Under pressure, how might a person or role involved in this values & moral choices misuse their strength? | ["values"] | [] | [] |
| passiveShadow | When a person or role involved in this values & moral choices withdraws or gives up, what does that look like? | ["values"] | [] | [] |
| strength | How does a person or role involved in this values & moral choices, as the Mother, care for others while helping them become independent? | ["values"] | ["Mother"] | [] |
| strength | How does a person or role involved in this values & moral choices, as the Companion, build closeness while leaving room for two distinct people? | ["values"] | ["Companion"] | [] |
| strength | How does a person or role involved in this values & moral choices, as the Amazon, pursue a purpose independently while accepting useful help? | ["values"] | ["Amazon"] | [] |
| strength | How does a person or role involved in this values & moral choices, as the Medial Woman, give meaning to intuitions and turn them into responsible action? | ["values"] | ["Medial Woman"] | [] |
| focus:situation | What is happening when players enter this scene? | ["scene"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| focus:choice | What can players decide or do? | ["scene"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| focus:change | What changes because of that choice? | ["scene"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| strength | How does a person or role involved in this scene / encounter show the healthy side of this archetype? | ["scene"] | [] | [] |
| activeShadow | Under pressure, how might a person or role involved in this scene / encounter misuse their strength? | ["scene"] | [] | [] |
| passiveShadow | When a person or role involved in this scene / encounter withdraws or gives up, what does that look like? | ["scene"] | [] | [] |
| strength | How does a person or role involved in this scene / encounter, as the Mother, care for others while helping them become independent? | ["scene"] | ["Mother"] | [] |
| strength | How does a person or role involved in this scene / encounter, as the Companion, build closeness while leaving room for two distinct people? | ["scene"] | ["Companion"] | [] |
| strength | How does a person or role involved in this scene / encounter, as the Amazon, pursue a purpose independently while accepting useful help? | ["scene"] | ["Amazon"] | [] |
| strength | How does a person or role involved in this scene / encounter, as the Medial Woman, give meaning to intuitions and turn them into responsible action? | ["scene"] | ["Medial Woman"] | [] |
| focus:subject | Whose situation changes across this story or act? | ["story"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| focus:change | Where does it begin, and what should be different by the end? | ["story"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| strength | How does a person or role involved in this story / act arc show the healthy side of this archetype? | ["story"] | [] | [] |
| activeShadow | Under pressure, how might a person or role involved in this story / act arc misuse their strength? | ["story"] | [] | [] |
| passiveShadow | When a person or role involved in this story / act arc withdraws or gives up, what does that look like? | ["story"] | [] | [] |
| strength | How does a person or role involved in this story / act arc, as the Mother, care for others while helping them become independent? | ["story"] | ["Mother"] | [] |
| strength | How does a person or role involved in this story / act arc, as the Companion, build closeness while leaving room for two distinct people? | ["story"] | ["Companion"] | [] |
| strength | How does a person or role involved in this story / act arc, as the Amazon, pursue a purpose independently while accepting useful help? | ["story"] | ["Amazon"] | [] |
| strength | How does a person or role involved in this story / act arc, as the Medial Woman, give meaning to intuitions and turn them into responsible action? | ["story"] | ["Medial Woman"] | [] |
| focus:discovery | What could players discover or learn through this experience? | ["learning"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| focus:change | Where can they try what they have learned? | ["learning"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| strength | How does a person or role involved in this learning & discovery show the healthy side of this archetype? | ["learning"] | [] | [] |
| activeShadow | Under pressure, how might a person or role involved in this learning & discovery misuse their strength? | ["learning"] | [] | [] |
| passiveShadow | When a person or role involved in this learning & discovery withdraws or gives up, what does that look like? | ["learning"] | [] | [] |
| strength | How does a person or role involved in this learning & discovery, as the Mother, care for others while helping them become independent? | ["learning"] | ["Mother"] | [] |
| strength | How does a person or role involved in this learning & discovery, as the Companion, build closeness while leaving room for two distinct people? | ["learning"] | ["Companion"] | [] |
| strength | How does a person or role involved in this learning & discovery, as the Amazon, pursue a purpose independently while accepting useful help? | ["learning"] | ["Amazon"] | [] |
| strength | How does a person or role involved in this learning & discovery, as the Medial Woman, give meaning to intuitions and turn them into responsible action? | ["learning"] | ["Medial Woman"] | [] |
| focus:audience | Who experiences this story, and through which voice or medium? | ["style"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| focus:feeling | What tone or feeling should the presentation create? | ["style"] | ["Mother", "Companion", "Amazon", "Medial Woman"] | [] |
| strength | How does a person or role involved in this voice & presentation show the healthy side of this archetype? | ["style"] | [] | [] |
| activeShadow | Under pressure, how might a person or role involved in this voice & presentation misuse their strength? | ["style"] | [] | [] |
| passiveShadow | When a person or role involved in this voice & presentation withdraws or gives up, what does that look like? | ["style"] | [] | [] |
| strength | How does a person or role involved in this voice & presentation, as the Mother, care for others while helping them become independent? | ["style"] | ["Mother"] | [] |
| strength | How does a person or role involved in this voice & presentation, as the Companion, build closeness while leaving room for two distinct people? | ["style"] | ["Companion"] | [] |
| strength | How does a person or role involved in this voice & presentation, as the Amazon, pursue a purpose independently while accepting useful help? | ["style"] | ["Amazon"] | [] |
| strength | How does a person or role involved in this voice & presentation, as the Medial Woman, give meaning to intuitions and turn them into responsible action? | ["style"] | ["Medial Woman"] | [] |


### Jungian Masculine Archetypes [jungianMasculineArchetypes]


Four mature masculine archetypes mapped between fullness and immature/shadow expressions: King, Warrior, Magician, and Lover.

Layout: archetypes.

Recommended purposes: ["character"]. Also useful: ["relationship", "scene", "values", "story"]. Explore responsibility, action, knowledge, and connection through strengths, developing forms, and shadows.

attribution: Robert Moore and Douglas Gillette’s King, Warrior, Magician, Lover model. Descriptions and story examples are Larpcraft interpretations of its named forms.

| Phase | Reference definition |
| --- | --- |
| King | {"key": "King", "descriptions": {"adult": "Leads by creating fair order, recognizing others, and accepting responsibility. In a story, tests of succession reveal whether the ruler serves the community or demands its service.", "child": "The Divine Child carries possibility, wonder, and a sense of precious potential. Growth means accepting limits while retaining hope and creativity.", "adultActiveShadow": "The Tyrant treats disagreement as disloyalty and controls others to protect a fragile position. A threatened ruler might punish the adviser who brings bad news.", "adultPassiveShadow": "The Weakling abandons responsibility and depends on others to provide direction. A leader might let a powerful courtier make every difficult decision.", "childActiveShadow": "The High Chair Tyrant expects every need to take priority and erupts when frustrated. Others become servants instead of people with needs of their own.", "childPassiveShadow": "The Weakling Prince waits to be rescued and doubts the ability to act. A promised heir might refuse a small responsibility for fear of failing."}, "name": "Divine Child", "adultActiveShadow": "Tyrant", "adultPassiveShadow": "Weakling", "childActiveShadow": "High Chair Tyrant", "childPassiveShadow": "Weakling Prince", "short": "Fullness: generative order, blessing, steadiness, and rightful responsibility.", "detail": "The King in fullness creates order and gives life to the group. Its mature active shadow is the Tyrant; its mature passive shadow is the Weakling. Its immature root is the Divine Child, split between the High Chair Tyrant and the Weakling Prince."} |
| Warrior | {"key": "Warrior", "descriptions": {"adult": "Uses courage, discipline, and boundaries in service of a chosen purpose. The dramatic test is whether strength can remain proportionate when anger or loyalty demands excess.", "child": "The Hero seeks independence through challenge and achievement. Growth means exchanging the need to prove invincibility for realistic courage and cooperation.", "adultActiveShadow": "The Sadist turns discipline into cruelty, enjoying domination or treating vulnerability as something to punish. Victory becomes an excuse to humiliate the defeated.", "adultPassiveShadow": "The Masochist endures needless harm and cannot defend personal limits. A loyal guard might accept exploitation because suffering feels like proof of worth.", "childActiveShadow": "The Grandstander Bully needs an audience for superiority and attacks those perceived as weaker. Boasting conceals fear of being ordinary or defeated.", "childPassiveShadow": "The Coward avoids necessary confrontation and gives away agency to escape fear. The story can offer a small, achievable act of courage as a turning point."}, "name": "Hero", "adultActiveShadow": "Sadist", "adultPassiveShadow": "Masochist", "childActiveShadow": "Grandstander Bully", "childPassiveShadow": "Coward", "short": "Fullness: discipline, courage, endurance, boundaries, and clean decisive action.", "detail": "The Warrior in fullness acts with purpose and restraint. Its mature active shadow is the Sadist; its mature passive shadow is the Masochist. Its immature root is the Hero, split between the Grandstander Bully and the Coward."} |
| Magician | {"key": "Magician", "descriptions": {"adult": "Develops knowledge and craft, sees hidden patterns, and helps others understand change. The test is whether expertise will be shared responsibly when secrecy offers power.", "child": "The Precocious Child is curious, inventive, and eager to understand. Growth requires humility: knowing an answer does not remove the need to learn or care.", "adultActiveShadow": "The Detached Manipulator withholds knowledge to control outcomes and treats people as pieces in an experiment. An expert may engineer dependence by never explaining the solution.", "adultPassiveShadow": "The Denying Innocent One avoids accountability by pretending not to know or not to be involved. Useful knowledge is withheld behind claims of helplessness.", "childActiveShadow": "The Know-it-all Trickster uses cleverness to embarrass, deceive, or escape limits. Winning the argument becomes more important than discovering what is true.", "childPassiveShadow": "The Dummy hides curiosity and ability to avoid expectations or exposure. A capable apprentice may act confused so that nobody can judge an honest attempt."}, "name": "Precocious Child", "adultActiveShadow": "Detached Manipulator", "adultPassiveShadow": "Denying Innocent One", "childActiveShadow": "Know-it-all Trickster", "childPassiveShadow": "Dummy", "short": "Fullness: insight, craft, hidden knowledge, initiation, and careful transformation.", "detail": "The Magician in fullness understands systems and reveals what others cannot yet see. Its mature active shadow is the Detached Manipulator; its mature passive shadow is the Denying Innocent One. Its immature root is the Precocious Child, split between the Know-it-all Trickster and the Dummy."} |
| Lover | {"key": "Lover", "descriptions": {"adult": "Meets life with feeling, connection, imagination, and appreciation of beauty. The test is remaining open to experience while respecting boundaries and commitments.", "child": "The Oedipal Child seeks closeness, comfort, and an ideal source of love. Growth means allowing loved people to be separate and imperfect, while building wider relationships.", "adultActiveShadow": "The Addicted Lover chases intensity without limits, moving from one consuming experience to the next. Desire displaces commitments and never delivers lasting satisfaction.", "adultPassiveShadow": "The Impotent Lover loses contact with feeling and pleasure. This symbolic label describes emotional disengagement: the character watches life without participating.", "childActiveShadow": "Momma's Boy remains bound to an ideal caregiver and resists independent attachment. New relationships are compared with an impossible promise of perfect care.", "childPassiveShadow": "The Dreamer retreats into imagined love or adventure instead of risking real contact. A turning point asks for an imperfect relationship or action in the present."}, "name": "Oedipal Child", "adultActiveShadow": "Addicted Lover", "adultPassiveShadow": "Impotent Lover", "childActiveShadow": "Momma's Boy", "childPassiveShadow": "Dreamer", "short": "Fullness: aliveness, empathy, sensuality, connection, beauty, and deep attachment.", "detail": "The Lover in fullness feels, bonds, values, and responds to the world with vivid presence. Its mature active shadow is the Addicted Lover; its mature passive shadow is the Impotent Lover. Its immature root is the Oedipal Child, split between Momma's Boy and the Dreamer."} |

Generic questions and their declared choices:

| Key | Question | Purposes | Archetype variants | Choices |
| --- | --- | --- | --- | --- |
| focus:subject | Who is this character, and what do they want right now? | ["character"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| focus:change | What choice or pressure could reveal or change them? | ["character"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| archetype | Which archetype would you like to explore? | ["character"] | ["King", "Warrior", "Magician", "Lover"] | ["King", "Warrior", "Magician", "Lover"] |
| strength | How does this character show the healthy side of this archetype? | ["character"] | [] | [] |
| root | What younger or less experienced side of this character still shows through? | ["character"] | [] | [] |
| activeShadow | Under pressure, how might this character misuse their strength? | ["character"] | [] | [] |
| passiveShadow | When this character withdraws or gives up, what does that look like? | ["character"] | [] | [] |
| shadowScene | What situation brings out a shadow, and what could help that role recover? | ["character", "communication", "values", "scene", "story", "learning", "style"] | [] | [] |
| strength | How does this character, as the King, create fair order, recognise others, and take responsibility? | ["character"] | ["King"] | [] |
| root | What remains of the Divine Child in this King, and where do they still need to grow? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["King"] | [] |
| activeShadow | What could push this King toward the Tyrant? Who would feel the effects? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["King"] | [] |
| passiveShadow | When this King gives up or withdraws, how does the Weakling appear? What responsibility or connection is lost? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["King"] | [] |
| shadowScene | What scene could test this King between its healthy side, the Tyrant, and the Weakling? What choice could change the pattern? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["King"] | [] |
| strength | How does this character, as the Warrior, use courage, discipline, and boundaries with restraint? | ["character"] | ["Warrior"] | [] |
| root | What remains of the Hero in this Warrior, and where do they still need to grow? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Warrior"] | [] |
| activeShadow | What could push this Warrior toward the Sadist? Who would feel the effects? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Warrior"] | [] |
| passiveShadow | When this Warrior gives up or withdraws, how does the Masochist appear? What responsibility or connection is lost? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Warrior"] | [] |
| shadowScene | What scene could test this Warrior between its healthy side, the Sadist, and the Masochist? What choice could change the pattern? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Warrior"] | [] |
| strength | How does this character, as the Magician, use knowledge and craft, and share understanding responsibly? | ["character"] | ["Magician"] | [] |
| root | What remains of the Precocious Child in this Magician, and where do they still need to grow? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Magician"] | [] |
| activeShadow | What could push this Magician toward the Detached Manipulator? Who would feel the effects? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Magician"] | [] |
| passiveShadow | When this Magician gives up or withdraws, how does the Denying Innocent One appear? What responsibility or connection is lost? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Magician"] | [] |
| shadowScene | What scene could test this Magician between its healthy side, the Detached Manipulator, and the Denying Innocent One? What choice could change the pattern? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Magician"] | [] |
| strength | How does this character, as the Lover, bring feeling, imagination, and connection while respecting boundaries? | ["character"] | ["Lover"] | [] |
| root | What remains of the Oedipal Child in this Lover, and where do they still need to grow? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Lover"] | [] |
| activeShadow | What could push this Lover toward the Addicted Lover? Who would feel the effects? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Lover"] | [] |
| passiveShadow | When this Lover gives up or withdraws, how does the Impotent Lover appear? What responsibility or connection is lost? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Lover"] | [] |
| shadowScene | What scene could test this Lover between its healthy side, the Addicted Lover, and the Impotent Lover? What choice could change the pattern? | ["character", "relationship", "communication", "values", "scene", "story", "learning", "style"] | ["Lover"] | [] |
| focus:sides | Who are the people or groups in this relationship? | ["relationship"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| focus:needs | What does each side want from the other? | ["relationship"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| focus:change | What could change their trust, closeness, or power? | ["relationship"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| archetype | Which archetype shapes one side of this relationship? | ["relationship"] | ["King", "Warrior", "Magician", "Lover"] | ["King", "Warrior", "Magician", "Lover"] |
| otherRole | What role does the other side take, and what do they need from this side? | ["relationship"] | ["King", "Warrior", "Magician", "Lover"] | ["King", "Warrior", "Magician", "Lover"] |
| strength | How do these roles support each other, and where do their needs clash? | ["relationship"] | [] | [] |
| root | What younger or less experienced side of the person or group on this side still shows through? | ["relationship"] | [] | [] |
| activeShadow | How does this role become controlling, excessive, or harmful to the other side? | ["relationship"] | [] | [] |
| passiveShadow | What happens between the sides when this role withdraws or gives up? | ["relationship"] | [] | [] |
| shadowScene | What could bring out the shadow, and what boundary or action could change the pattern? | ["relationship"] | [] | [] |
| strength | How does the King support or clash with the other side? What does each side need? | ["relationship"] | ["King"] | [] |
| strength | How does the Warrior support or clash with the other side? What does each side need? | ["relationship"] | ["Warrior"] | [] |
| strength | How does the Magician support or clash with the other side? What does each side need? | ["relationship"] | ["Magician"] | [] |
| strength | How does the Lover support or clash with the other side? What does each side need? | ["relationship"] | ["Lover"] | [] |
| focus:message | Who is speaking to whom, and what needs to get across? | ["communication"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| focus:change | What should the listener understand, feel, or do afterward? | ["communication"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| archetype | Which archetype could help you understand a role in this situation? | ["communication", "values", "scene", "story", "learning", "style"] | ["King", "Warrior", "Magician", "Lover"] | ["King", "Warrior", "Magician", "Lover"] |
| strength | How does a person or role involved in this communication & dialogue show the healthy side of this archetype? | ["communication"] | [] | [] |
| root | What younger or less experienced side of a person or role involved in this communication & dialogue still shows through? | ["communication"] | [] | [] |
| activeShadow | Under pressure, how might a person or role involved in this communication & dialogue misuse their strength? | ["communication"] | [] | [] |
| passiveShadow | When a person or role involved in this communication & dialogue withdraws or gives up, what does that look like? | ["communication"] | [] | [] |
| strength | How does a person or role involved in this communication & dialogue, as the King, create fair order, recognise others, and take responsibility? | ["communication"] | ["King"] | [] |
| strength | How does a person or role involved in this communication & dialogue, as the Warrior, use courage, discipline, and boundaries with restraint? | ["communication"] | ["Warrior"] | [] |
| strength | How does a person or role involved in this communication & dialogue, as the Magician, use knowledge and craft, and share understanding responsibly? | ["communication"] | ["Magician"] | [] |
| strength | How does a person or role involved in this communication & dialogue, as the Lover, bring feeling, imagination, and connection while respecting boundaries? | ["communication"] | ["Lover"] | [] |
| focus:stake | What matters here, and to whom? | ["values"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| focus:choice | Which values pull the choice in different directions? | ["values"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| focus:cost | What is gained and given up on each path? | ["values"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| strength | How does a person or role involved in this values & moral choices show the healthy side of this archetype? | ["values"] | [] | [] |
| root | What younger or less experienced side of a person or role involved in this values & moral choices still shows through? | ["values"] | [] | [] |
| activeShadow | Under pressure, how might a person or role involved in this values & moral choices misuse their strength? | ["values"] | [] | [] |
| passiveShadow | When a person or role involved in this values & moral choices withdraws or gives up, what does that look like? | ["values"] | [] | [] |
| strength | How does a person or role involved in this values & moral choices, as the King, create fair order, recognise others, and take responsibility? | ["values"] | ["King"] | [] |
| strength | How does a person or role involved in this values & moral choices, as the Warrior, use courage, discipline, and boundaries with restraint? | ["values"] | ["Warrior"] | [] |
| strength | How does a person or role involved in this values & moral choices, as the Magician, use knowledge and craft, and share understanding responsibly? | ["values"] | ["Magician"] | [] |
| strength | How does a person or role involved in this values & moral choices, as the Lover, bring feeling, imagination, and connection while respecting boundaries? | ["values"] | ["Lover"] | [] |
| focus:situation | What is happening when players enter this scene? | ["scene"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| focus:choice | What can players decide or do? | ["scene"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| focus:change | What changes because of that choice? | ["scene"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| strength | How does a person or role involved in this scene / encounter show the healthy side of this archetype? | ["scene"] | [] | [] |
| root | What younger or less experienced side of a person or role involved in this scene / encounter still shows through? | ["scene"] | [] | [] |
| activeShadow | Under pressure, how might a person or role involved in this scene / encounter misuse their strength? | ["scene"] | [] | [] |
| passiveShadow | When a person or role involved in this scene / encounter withdraws or gives up, what does that look like? | ["scene"] | [] | [] |
| strength | How does a person or role involved in this scene / encounter, as the King, create fair order, recognise others, and take responsibility? | ["scene"] | ["King"] | [] |
| strength | How does a person or role involved in this scene / encounter, as the Warrior, use courage, discipline, and boundaries with restraint? | ["scene"] | ["Warrior"] | [] |
| strength | How does a person or role involved in this scene / encounter, as the Magician, use knowledge and craft, and share understanding responsibly? | ["scene"] | ["Magician"] | [] |
| strength | How does a person or role involved in this scene / encounter, as the Lover, bring feeling, imagination, and connection while respecting boundaries? | ["scene"] | ["Lover"] | [] |
| focus:subject | Whose situation changes across this story or act? | ["story"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| focus:change | Where does it begin, and what should be different by the end? | ["story"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| strength | How does a person or role involved in this story / act arc show the healthy side of this archetype? | ["story"] | [] | [] |
| root | What younger or less experienced side of a person or role involved in this story / act arc still shows through? | ["story"] | [] | [] |
| activeShadow | Under pressure, how might a person or role involved in this story / act arc misuse their strength? | ["story"] | [] | [] |
| passiveShadow | When a person or role involved in this story / act arc withdraws or gives up, what does that look like? | ["story"] | [] | [] |
| strength | How does a person or role involved in this story / act arc, as the King, create fair order, recognise others, and take responsibility? | ["story"] | ["King"] | [] |
| strength | How does a person or role involved in this story / act arc, as the Warrior, use courage, discipline, and boundaries with restraint? | ["story"] | ["Warrior"] | [] |
| strength | How does a person or role involved in this story / act arc, as the Magician, use knowledge and craft, and share understanding responsibly? | ["story"] | ["Magician"] | [] |
| strength | How does a person or role involved in this story / act arc, as the Lover, bring feeling, imagination, and connection while respecting boundaries? | ["story"] | ["Lover"] | [] |
| focus:discovery | What could players discover or learn through this experience? | ["learning"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| focus:change | Where can they try what they have learned? | ["learning"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| strength | How does a person or role involved in this learning & discovery show the healthy side of this archetype? | ["learning"] | [] | [] |
| root | What younger or less experienced side of a person or role involved in this learning & discovery still shows through? | ["learning"] | [] | [] |
| activeShadow | Under pressure, how might a person or role involved in this learning & discovery misuse their strength? | ["learning"] | [] | [] |
| passiveShadow | When a person or role involved in this learning & discovery withdraws or gives up, what does that look like? | ["learning"] | [] | [] |
| strength | How does a person or role involved in this learning & discovery, as the King, create fair order, recognise others, and take responsibility? | ["learning"] | ["King"] | [] |
| strength | How does a person or role involved in this learning & discovery, as the Warrior, use courage, discipline, and boundaries with restraint? | ["learning"] | ["Warrior"] | [] |
| strength | How does a person or role involved in this learning & discovery, as the Magician, use knowledge and craft, and share understanding responsibly? | ["learning"] | ["Magician"] | [] |
| strength | How does a person or role involved in this learning & discovery, as the Lover, bring feeling, imagination, and connection while respecting boundaries? | ["learning"] | ["Lover"] | [] |
| focus:audience | Who experiences this story, and through which voice or medium? | ["style"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| focus:feeling | What tone or feeling should the presentation create? | ["style"] | ["King", "Warrior", "Magician", "Lover"] | [] |
| strength | How does a person or role involved in this voice & presentation show the healthy side of this archetype? | ["style"] | [] | [] |
| root | What younger or less experienced side of a person or role involved in this voice & presentation still shows through? | ["style"] | [] | [] |
| activeShadow | Under pressure, how might a person or role involved in this voice & presentation misuse their strength? | ["style"] | [] | [] |
| passiveShadow | When a person or role involved in this voice & presentation withdraws or gives up, what does that look like? | ["style"] | [] | [] |
| strength | How does a person or role involved in this voice & presentation, as the King, create fair order, recognise others, and take responsibility? | ["style"] | ["King"] | [] |
| strength | How does a person or role involved in this voice & presentation, as the Warrior, use courage, discipline, and boundaries with restraint? | ["style"] | ["Warrior"] | [] |
| strength | How does a person or role involved in this voice & presentation, as the Magician, use knowledge and craft, and share understanding responsibly? | ["style"] | ["Magician"] | [] |
| strength | How does a person or role involved in this voice & presentation, as the Lover, bring feeling, imagination, and connection while respecting boundaries? | ["style"] | ["Lover"] | [] |


## D Specialist wizard fields and options


Defaults and option registries are supplied below to make this file useful without the source checkout. Stored shared schemas can contain fields hidden in a particular purpose/depth. Conditional visibility, wording changes, and user-created choices are resolved by the editor, not by the existence of a default key alone.


### Story Wizard purposes and setup questions


| Purpose | Definition |
| --- | --- |
| character | {"label": "Character", "result": "Character", "category": "characterConcept", "hint": "Motives, behaviour, strengths, limits, and change."} |
| relationship | {"label": "Relationships & groups", "result": "Relationship / group dynamic", "category": "storyConcept", "hint": "Trust, conflict, roles, needs, and how people affect one another."} |
| communication | {"label": "Communication & dialogue", "result": "Communication / dialogue plan", "category": "functionConcept", "hint": "What is said, who hears it, what is understood, and what changes."} |
| values | {"label": "Values & moral choices", "result": "Values / dilemma", "category": "storyConcept", "hint": "What matters, competing principles, and the cost of a choice."} |
| scene | {"label": "Scene / encounter", "result": "Scene / encounter plan", "category": "storyConcept", "hint": "A playable situation, its decisions, and its consequences."} |
| story | {"label": "Story / act arc", "result": "Story / act outline", "category": "structureConcept", "hint": "Connected events, turning points, and change across an arc."} |
| learning | {"label": "Learning & discovery", "result": "Learning / discovery sequence", "category": "functionConcept", "hint": "Experience, discovery, reflection, and trying a new approach."} |
| style | {"label": "Voice & presentation", "result": "Voice / presentation guide", "category": "styleConcept", "hint": "Tone, viewpoint, imagery, and how the story reaches players."} |

| Purpose | Opening questions |
| --- | --- |
| character | [["focus:subject", "Who is this character, and what do they want right now?"], ["focus:change", "What choice or pressure could reveal or change them?"]] |
| relationship | [["focus:sides", "Who are the people or groups in this relationship?"], ["focus:needs", "What does each side want from the other?"], ["focus:change", "What could change their trust, closeness, or power?"]] |
| communication | [["focus:message", "Who is speaking to whom, and what needs to get across?"], ["focus:change", "What should the listener understand, feel, or do afterward?"]] |
| values | [["focus:stake", "What matters here, and to whom?"], ["focus:choice", "Which values pull the choice in different directions?"], ["focus:cost", "What is gained and given up on each path?"]] |
| scene | [["focus:situation", "What is happening when players enter this scene?"], ["focus:choice", "What can players decide or do?"], ["focus:change", "What changes because of that choice?"]] |
| story | [["focus:subject", "Whose situation changes across this story or act?"], ["focus:change", "Where does it begin, and what should be different by the end?"]] |
| learning | [["focus:discovery", "What could players discover or learn through this experience?"], ["focus:change", "Where can they try what they have learned?"]] |
| style | [["focus:audience", "Who experiences this story, and through which voice or medium?"], ["focus:feeling", "What tone or feeling should the presentation create?"]] |


### FATE character signals and scales


**FATE_SIGNAL_GROUPS**: {"Visual": ["Bright light", "Distinctive colours", "Movement", "Gestures or facial expressions", "Written words", "Noticeable objects", "Something visually unfamiliar"], "Audio": ["Loud or sudden sounds", "Raised voices or shouting", "Spoken words", "Silence or a pause", "A familiar voice"], "Kinesthetic": ["Touch or physical contact", "Vibration", "Temperature", "Pressure or discomfort", "Body position or balance", "Physical effort"]}


**FATE_ATTENTION**: ["Usually ignored", "Passing glance", "Brief pause", "Clear attention", "Strong attention", "Full concentration"]


**FATE_FEELING_STRENGTH**: ["Faint", "Mild", "Clear", "Strong", "Overwhelming"]


**FATE_RESPONSES**: ["Move toward it", "Pull away", "Both impulses conflict", "It depends"]


### FATE shared field registry


#### F


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| focus.hooks | What draws their attention? | multi | ["A possible threat", "Something worth gaining", "An uncertain signal"] |  | {"simple": true} |
| focus.channels | How do they notice it? | multi | ["Sound", "Motion", "Light or colour", "An object", "Spoken words", "Body language", "Written words", "Silence"] |  | {"simple": true} |
| focus.threatTypes | What could be lost? | multi | ["Injury", "Loss", "Exposure", "Exclusion", "Scarcity", "Punishment", "Time running out"] |  |  |
| focus.valueTypes | What could be gained? | multi | ["Resources", "Status", "Access", "Knowledge", "Safety", "An ally", "Power"] |  |  |
| focus.patternBreak | Interrupt an expected routine | toggle | [] |  |  |
| focus.routine | What routine is expected? | text | [] |  | {"when": ["focus.patternBreak", true]} |
| focus.breakType | How is it interrupted? | single | ["A sudden event", "A wrong detail", "Something missing", "A reversal"] |  | {"when": ["focus.patternBreak", true]} |
| focus.capture | How much attention should it draw? | scale | ["A passing glance", "A brief pause", "Clear attention", "Strong attention", "Full concentration"] |  |  |
| focus.hold | How does attention continue? | single | ["One sharp moment", "A sustained presence", "A recurring detail"] |  |  |
| focus.placement | Where does this happen? | scale | ["Opening", "Build-up", "Peak", "Aftermath"] |  |  |
| focus.noise | What competes for attention? | multi | ["Other conversations", "Busy surroundings", "Another task", "Unclear instructions"] |  |  |
| focus.overlooked | What does one side notice that the other misses? | text | [] |  | {"purposes": ["relationship"]} |

#### A


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| authority.source | Where does the authority come from? | multi | ["Rank or title", "Expertise", "Control of resources", "Force", "Moral or sacred standing", "Tradition", "An institution", "A secret", "Evidence"] |  | {"simple": true} |
| authority.challengeable | Someone can question or challenge it | toggle | [] |  | {"simple": true} |
| authority.crack | What could make someone doubt or resist it? | text | [] |  | {"simple": true, "when": ["authority.challengeable", true]} |
| authority.secondary | Other sources of authority | multi | ["Expertise", "Resources", "Tradition", "Evidence", "Support from others"] |  |  |
| authority.basis | What makes it work here? | multi | ["Actual power or ability", "Belief that they have power", "Trust earned through actions"] |  |  |
| authority.markers | What makes it visible? | multi | ["Uniform or insignia", "Position in the room", "Posture", "Voice", "An entourage", "Documents or seals", "Ritual", "Unexpected knowledge"] |  |  |
| authority.cost | What could defiance cost? | scale | ["Nothing", "Resources", "Social standing", "Freedom", "Life"] |  |  |
| authority.compliance | What response is being asked for? | single | ["Notice", "Believe", "Act", "Obey without questioning"] |  |  |
| authority.legitimacy | How is the authority held? | single | ["Accepted as rightful", "Disputed", "Taken without permission", "Unclear"] |  |  |
| authority.curve | Authority across the story | curve | [] |  | {"purposes": ["story"]} |

#### T


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| tribe.pull | How does belonging enter the situation? | single | ["Inclusion is offered", "Exclusion is threatened", "Both", "Neither is central"] |  | {"simple": true} |
| tribe.statusStakes | What does belonging give or risk? | multi | ["Reputation", "Protection", "Resources", "A voice in decisions", "Rank", "Close relationships"] |  | {"simple": true} |
| tribe.position | Where does the target stand? | single | ["Outside", "On the edge", "A member", "At the centre", "An elder or leader"] |  |  |
| tribe.scriptElements | What group behaviour appears? | multi | ["Watching the group", "Fitting in", "Putting group expectations first", "Enforcing the norm", "Pressuring people to conform", "Checking their own behaviour"] |  |  |
| tribe.enforcement | Range of group consequences | range | ["Teasing", "Social discomfort", "Cutting contact", "Punishment", "Lethal consequences"] |  |  |
| tribe.witnesses | How many people witness it? | number | [] |  |  |
| tribe.symbol | What symbol expresses belonging? | text | [] |  |  |
| tribe.board | Where do people stand? | board | [] |  |  |

#### E


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| emotion.primary | What feeling is at the centre? | single | ["Curiosity", "Fear", "Hope", "Pride", "Anger", "Sadness", "Relief", "Affection", "Wonder", "Shame"] |  | {"simple": true} |
| emotion.direction | What might they do with that feeling? | single | ["Move toward it", "Pull away", "Both impulses conflict", "It depends"] |  | {"simple": true} |
| emotion.resistance | What could make them resist or react differently? | text | [] |  | {"simple": true} |
| emotion.response | What action or line of dialogue could show their response? | text | [] |  | {"simple": true} |
| emotion.scriptType | Where does this reaction come from in your story? | single | ["A basic protective response", "A learned experience", "Both", "Unclear"] |  |  |
| emotion.triggers | What brings that response out? | multi | ["Danger", "Being excluded", "Defying authority", "Scarcity", "Disgust", "Attraction", "Protecting someone", "The unknown"] |  |  |
| emotion.pattern | What learned pattern repeats? | text | [] |  |  |
| emotion.origin | What experience shaped it? | text | [] |  |  |
| emotion.secondary | Other feelings present | multi | ["Curiosity", "Fear", "Hope", "Pride", "Anger", "Sadness", "Relief", "Affection", "Wonder", "Shame"] |  | {"max": 2} |
| emotion.intensity | How strong is the feeling? | scale | ["Faint", "Mild", "Clear", "Strong", "Overwhelming"] |  |  |
| emotion.action | What happens to the familiar reaction? | single | ["It is triggered", "A past experience echoes", "It grows stronger", "It is interrupted", "Someone names it openly"] |  |  |
| emotion.curve | Feeling across the scene | curve | [] |  |  |

#### FATE_TYPES


~~~json
{
  "character": {
    "label": "Character profile",
    "help": "What repeatedly catches their attention, earns their trust, gives them belonging and brings out their feelings."
  },
  "communication": {
    "label": "Communication / dialogue",
    "help": "Words for a particular speaker and listener, grounded in what matters to the listener."
  }
}
~~~


#### FATE_PURPOSE_COPY


~~~json
{
  "type": "Choose a starting point",
  "otherUses": "Other uses",
  "separate": "Each purpose keeps its own answers. Switching back restores your earlier work.",
  "savedType": "This saved version keeps its type. Copy it as a new draft to develop another type.",
  "speaker": "Who is speaking?",
  "listener": "Who is listening?",
  "speakerLink": "Link the speaker to your game",
  "listenerLink": "Link the listener to your game",
  "relation": "What is their relationship?",
  "goal": "What does the speaker want the listener to understand, feel or do?",
  "contextHelp": "Describe where they are, what has happened and why they are talking. Names and roles are entered separately; this text is not automatically analysed.",
  "profileContext": "Describe their life or present circumstances. The profile records tendencies, not fixed reactions in every situation.",
  "destination": "Where should this be saved?",
  "separateConversation": "Create a separate conversation",
  "separateProfile": "Create a separate character profile",
  "destinationHelp": "A separate result becomes a node on the current canvas. You do not need to choose an act. Choose an existing item only to attach this work to it.",
  "summaryHelp": "Explain how the selected details work together. Your writing adds to the selections; it does not replace them.",
  "details": "Add a specific detail (optional)",
  "detailHelp": "The category is the starting idea. Explain what it means here, or leave it open for later.",
  "genericDetail": "What does this mean here?",
  "selected": "Selected ideas",
  "selectedEmpty": "Selected ideas will stay visible here as you write.",
  "retained": "Details for unchecked options are kept for later.",
  "words": "Words to say for this part (optional)",
  "wordsHelp": "Write actual spoken words here. Descriptions and selected ideas remain in the design notes.",
  "listenerReply": "A possible listener reply (optional)",
  "replyHelp": "This is a possible response, not a guaranteed result.",
  "dialogue": "Spoken dialogue",
  "dialogueEmpty": "Add spoken words in a step or write the conversation on the review screen. Your selected ideas and explanations are kept below.",
  "dialogueFormat": "Spoken dialogue",
  "design": "Conversation design notes",
  "context": "Situation",
  "blankSpeaker": "Speaker",
  "blankListener": "Listener",
  "profile": "Use an existing character profile",
  "profilePick": "Choose a saved FATE character profile",
  "useProfile": "Use as listener background",
  "profileHelp": "This uses your saved description as background. It does not assume the listener will comply or react in one fixed way.",
  "known": "Known about the listener",
  "refreshProfile": "Use the updated profile",
  "changedProfile": "The source profile has changed. Your previous background is still being used.",
  "missingProfile": "The source profile is no longer available. The saved background has been kept.",
  "unlinkProfile": "Stop using this background",
  "profileQuestions": {
    "F": "Which of these interests could this opening connect with?",
    "A": "What could this speaker say or show that this listener would find credible?",
    "T": "Does a shared group or relationship matter in this conversation? It can be left out.",
    "E": "How could these feelings shape their response here? What might lead to a different response?"
  },
  "patterns": "Recurring emotional patterns",
  "addPattern": "Add an emotional pattern",
  "situation": "What brings this pattern out?",
  "feelings": "Which feelings mix here?",
  "response": "What do they usually do?",
  "exception": "When might they react differently?",
  "removePattern": "Remove pattern",
  "patternHelp": "Describe one situation, its mixture of feelings and the usual response. You can add several patterns without making them fixed rules.",
  "groupNames": "Which groups or relationships matter to them?",
  "loyalties": "Where do these loyalties support or conflict with each other?",
  "emotions": [
    "Curiosity",
    "Fear",
    "Hope",
    "Pride",
    "Anger",
    "Sadness",
    "Relief",
    "Affection",
    "Wonder",
    "Shame"
  ],
  "optional": "You do not need all four categories. Leave a part empty when it does not help this profile or conversation."
}
~~~


#### FATE_DETAIL_QUESTIONS


~~~json
{
  "focus.hooks": {
    "A possible threat": "What could they lose, and why would it matter?",
    "Something worth gaining": "What exactly could they gain, and why would they want it?",
    "An uncertain signal": "What is uncertain, and what makes them curious?"
  },
  "focus.channels": {
    "Spoken words": "What exact words would the speaker say?",
    "Silence": "Where is the pause, and what does it allow the listener to notice?",
    "Sound": "What sound would they hear?",
    "Motion": "What movement catches their eye?",
    "Light or colour": "What light or colour stands out?",
    "An object": "What object, and what makes it matter?",
    "Body language": "What gesture or expression would they notice?",
    "Written words": "What do the written words say?"
  },
  "authority.source": {
    "A secret": "What secret, and why would the listener take it seriously?",
    "Expertise": "What relevant experience or knowledge makes them believable?",
    "Evidence": "What evidence could the listener check?",
    "Rank or title": "What rank or title, and why would the listener respect it?",
    "Control of resources": "Which resources do they control?",
    "Force": "What power do they have, and how might the listener resist?",
    "Moral or sacred standing": "What belief or principle gives their words weight?",
    "Tradition": "Which tradition, and why does it matter to the listener?",
    "An institution": "Which institution, and why would the listener trust it?"
  },
  "tribe.pull": {
    "Inclusion is offered": "Which group or relationship welcomes them, and how?",
    "Exclusion is threatened": "Which group might exclude them, and what would that mean?",
    "Both": "Where do welcome and exclusion pull in different directions?"
  },
  "tribe.statusStakes": {
    "Reputation": "Whose opinion matters, and what could change?",
    "Protection": "Who protects whom, and from what?",
    "Resources": "Which shared resources are involved?",
    "A voice in decisions": "Which decisions could they influence?",
    "Rank": "What role or status could change?",
    "Close relationships": "Which relationships could become closer or strained?"
  }
}
~~~


### Kolb fields


#### CE


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| ce.types | What kind of experience is it? | multi | ["An attempt", "An encounter", "Witnessing something", "A loss", "A surprise", "A consequence"] |  | {"simple": true} |
| ce.outcome | Is the outcome already known? | single | ["Success", "Mixed", "Failure", "Still unknown"] |  | {"simple": true} |
| ce.agency | How do they enter it? | single | ["They choose it", "It happens unexpectedly", "Some choice, some pressure"] |  |  |
| ce.immersion | How directly do they experience it? | scale | ["Hear about it", "Observe nearby", "Take a small part", "Take an active part", "Fully involved"] |  |  |
| ce.channels | How do they experience it? | multi | ["Sight", "Sound", "Touch", "Smell or taste", "Movement", "Social interaction"] |  |  |
| ce.emotion | What feeling is present? | single | ["Curiosity", "Fear", "Hope", "Pride", "Anger", "Sadness", "Relief", "Affection", "Wonder", "Shame"] |  |  |
| ce.emotionIntensity | How strong is that feeling? | scale | ["Faint", "Mild", "Clear", "Strong", "Overwhelming"] |  |  |
| ce.expected | What did they expect instead? | text | [] |  |  |
| ce.relevance | Why does it matter to them? | single | ["Personally distant", "An interesting idea", "Connected to their goals", "Central to who they are"] |  |  |
| ce.priorExperience | What earlier experience do they bring? | text | [] |  |  |
| ce.challenge | How demanding is the experience? | scale | ["Very gentle", "Gentle", "Moderate", "Demanding", "Very demanding"] |  |  |
| ce.support | How much support is available? | scale | ["Very little", "A little", "Some", "Strong support", "Close guidance"] |  |  |
| ce.role | Who supports the experience? | single | ["Facilitator", "Subject expert", "Evaluator", "Coach", "No helper"] |  |  |

#### RO


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| ro.trigger | What makes them pause and reflect? | single | ["A conversation", "Someone asks a question", "A journal or letter", "Evidence", "A quiet pause", "Retelling the event", "Another side’s account"] |  | {"simple": true} |
| ro.notice | What might stand out? | multi | ["Patterns", "Surprises", "Mistakes", "Feelings", "Causes", "Other people’s reactions", "What did not happen"] |  | {"simple": true} |
| ro.perspectives | How many viewpoints do you want to include? | number | [] |  | {"max": 5} |
| ro.sources | Whose perspectives are considered? | multi | ["Their own", "Peers", "An expert or elder", "The opposing side", "A document", "Their future self"] |  |  |
| ro.privacy | How do they reflect? | single | ["Privately", "With others", "Both"] |  |  |
| ro.conversation | How is the conversation arranged? | single | ["A circle", "Pairs", "A panel", "A confrontation"] |  |  |
| ro.otherReading | What different explanation could someone offer? | text | [] |  |  |
| ro.pause | When can they reflect? | single | ["In the moment", "A short break", "A scene break", "Between sessions"] |  |  |
| ro.support | How much help is available for reflection? | scale | ["Very little", "A little", "Some", "Strong support", "Close guidance"] |  |  |
| ro.role | Who helps them reflect? | single | ["Facilitator", "Subject expert", "Evaluator", "Coach", "No helper"] |  |  |

#### AC


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| ac.ideaType | What kind of idea is it? | single | ["A rule", "An explanation", "A tactic", "A value", "A prediction", "A name for something"] |  | {"simple": true} |
| ac.prediction | If this idea is true, what should happen? | text | [] |  | {"simple": true} |
| ac.integration | How do they hold the idea? | single | ["A simple working rule", "It depends on the situation", "Several explanations are compared", "It opens new connections"] |  |  |
| ac.source | Where does the idea come from? | single | ["They discover it", "Someone teaches it", "Both"] |  |  |
| ac.supplier | Who or what supplies the idea? | text | [] |  |  |
| ac.confidence | How certain are they? | scale | ["A guess", "Some doubt", "Reasonably sure", "Very sure", "No doubt"] |  |  |
| ac.correctness | Designer note: how accurate is this belief? | single | ["Accurate", "Partly accurate", "Mistaken", "Still undecided"] |  |  |
| ac.vocabulary | Words or names they use for the idea | multi | [] |  |  |
| ac.role | Who helps them understand? | single | ["Facilitator", "Subject expert", "Evaluator", "Coach", "No helper"] |  |  |

#### AE


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| ae.situation | What is different in the new situation? | text | [] |  |  |
| ae.transfer | How different is the test? | scale | ["Same situation", "A small variation", "A related situation", "A different setting", "A very different context"] |  |  |
| ae.stakes | What could the test cost? | scale | ["Safe practice", "Low stakes", "Moderate stakes", "High stakes", "Lasting consequences"] |  |  |
| ae.feedback | What should they reconsider afterward? | single | ["Did it work?", "Change the approach or goal", "Reconsider what matters"] |  |  |
| ae.sources | Where does feedback come from? | multi | ["The world or mechanics", "An NPC or mentor", "Other participants", "Their own reflection"] |  |  |
| ae.role | Who supports the test? | single | ["Facilitator", "Subject expert", "Evaluator", "Coach", "No helper"] |  |  |

**KOLB_MODES**: [{"key": "CE", "section": "ce", "name": "Experience", "full": "Concrete experience", "color": "#EF9B8C"}, {"key": "RO", "section": "ro", "name": "Reflection", "full": "Reflective observation", "color": "#E8D25C"}, {"key": "AC", "section": "ac", "name": "Understanding", "full": "Abstract conceptualization", "color": "#72B7EF"}, {"key": "AE", "section": "ae", "name": "Test", "full": "Active experimentation", "color": "#7BCBB0"}]


**KOLB_BRANCHES**: [{"key": "confirm", "name": "Supports the idea"}, {"key": "partial", "name": "Partly supports it"}, {"key": "refute", "name": "Challenges the idea"}]


**KOLB_FORMATS**: ["Story paragraph", "Scene sequence", "Encounter beats", "Character growth arc", "Debrief outline", "Mentor profile", "Learning objectives", "Organizer notes"]


**KOLB_TARGETS**: ["A skill", "A game rule", "World lore", "Social insight", "A value or moral choice", "Self-knowledge", "A tactic", "A relationship"]


**KOLB_SPACE**: ["Physical setting", "Culture", "Institutions and rules", "Social relationships", "Personal confidence and comfort"]


### Human Values vocabulary and control options


#### VALUES_STEPS


~~~json
[
  {
    "key": "setup",
    "name": "Situation",
    "simple": true
  },
  {
    "key": "values",
    "name": "What matters",
    "simple": true
  },
  {
    "key": "shifts",
    "name": "What changes",
    "simple": true
  },
  {
    "key": "chain",
    "name": "Why it matters"
  },
  {
    "key": "reveal",
    "name": "What they know"
  },
  {
    "key": "choices",
    "name": "Choices"
  },
  {
    "key": "review",
    "name": "Your story",
    "simple": true
  }
]
~~~


#### VALUES_LIBRARY


~~~json
[
  {
    "id": "belonging",
    "label": "Belonging",
    "states": [
      "Together",
      "Unsure of belonging",
      "Alone"
    ],
    "description": "Being welcomed, supported, excluded or left alone.",
    "legacy": "Together"
  },
  {
    "id": "safety",
    "label": "Safety",
    "states": [
      "Safe",
      "Threatened",
      "In danger"
    ],
    "description": "Protection, risk, shelter and relief.",
    "legacy": "Safety"
  },
  {
    "id": "victory",
    "label": "Success",
    "states": [
      "Succeeded",
      "Still undecided",
      "Failed"
    ],
    "description": "What achieving or missing a goal means to someone.",
    "legacy": "Victory"
  },
  {
    "id": "status",
    "label": "Status",
    "states": [
      "Respected",
      "Unnoticed",
      "Disrespected"
    ],
    "description": "Recognition, respect, shame and influence.",
    "legacy": "High status"
  },
  {
    "id": "freedom",
    "label": "Freedom",
    "states": [
      "Free to choose",
      "Choices limited",
      "Controlled"
    ],
    "description": "Choice, coercion, debt and escape.",
    "legacy": "Free"
  },
  {
    "id": "wealth",
    "label": "Resources",
    "states": [
      "Enough to spare",
      "Just enough",
      "Not enough"
    ],
    "description": "Money, supplies or another resource that matters.",
    "legacy": "Wealthy"
  },
  {
    "id": "life",
    "label": "Survival",
    "states": [
      "Alive",
      "Life threatened",
      "Dead"
    ],
    "description": "Survival, rescue, sacrifice and grief.",
    "legacy": "Life"
  },
  {
    "id": "skill",
    "label": "Skill",
    "states": [
      "Capable",
      "Still learning",
      "Unable yet"
    ],
    "description": "Mastery, practice, confidence and needing help.",
    "legacy": "Skilled"
  },
  {
    "id": "health",
    "label": "Health",
    "states": [
      "Healthy",
      "Recovering",
      "Sick or injured"
    ],
    "description": "Wellbeing, illness, care and recovery.",
    "legacy": "Healthy"
  },
  {
    "id": "love",
    "label": "Love",
    "states": [
      "Love",
      "Mixed feelings",
      "Hatred"
    ],
    "description": "Affection, attachment, distance and resentment.",
    "legacy": "Love"
  },
  {
    "id": "friendship",
    "label": "Friendship",
    "states": [
      "Friend",
      "Stranger",
      "Enemy"
    ],
    "description": "Trust, alliances, rivalry and betrayal.",
    "legacy": "Friend"
  },
  {
    "id": "knowledge",
    "label": "Knowledge",
    "states": [
      "Knows",
      "Unsure",
      "Does not know",
      "Misled"
    ],
    "description": "What is known, hidden, suspected or misunderstood."
  },
  {
    "id": "leadership",
    "label": "Role in the group",
    "states": [
      "Leading",
      "Sharing responsibility",
      "Following",
      "Excluded"
    ],
    "description": "Roles have different meanings in different situations; leading is not always better."
  }
]
~~~


#### VALUES_PURPOSES


~~~json
{
  "values": [
    "What matters in this situation?",
    "What could be protected, gained or lost?"
  ],
  "character": [
    "What matters most to this character?",
    "What could change for this character?"
  ],
  "relationship": [
    "What matters between these people?",
    "How could trust, closeness or roles change?"
  ],
  "scene": [
    "What is at stake in this encounter?",
    "What could change during this encounter?"
  ],
  "story": [
    "Which values carry this story?",
    "How could these values change across the story?"
  ],
  "communication": [
    "What matters to the listener?",
    "What could the message promise, threaten or reveal?"
  ],
  "style": [
    "What should the audience care about?",
    "What could the telling reveal or put at risk?"
  ],
  "learning": [
    "Why does this learning matter?",
    "What could learning make possible?"
  ]
}
~~~


#### VALUES_OPTIONS


~~~json
{
  "eventType": [
    "Something happens",
    "Something becomes known",
    "Someone chooses",
    "A series of small changes"
  ],
  "role": [
    "Person affected",
    "Chooser",
    "Beneficiary",
    "Witness",
    "Audience"
  ],
  "intent": [
    "Could change",
    "Is threatened",
    "Is protected",
    "Is restored",
    "Is celebrated"
  ],
  "interaction": [
    "Reinforces the other values",
    "Pulls against the other values",
    "Separate from the other values"
  ],
  "uncertainty": [
    "Already decided",
    "Mostly settled",
    "Could go either way",
    "Very unclear"
  ],
  "knowledge": [
    "Players know",
    "Characters know",
    "Organizers only"
  ],
  "revealLevel": [
    "Hint",
    "Partial reveal",
    "Full reveal"
  ],
  "reversibility": [
    "Can be undone",
    "Hard to undo",
    "Cannot be undone"
  ],
  "visibility": [
    "Private",
    "Witnessed",
    "Public"
  ],
  "reality": [
    "In the fiction",
    "Includes real time, status or props",
    "Includes other real consequences"
  ],
  "importance": [
    "A little",
    "Somewhat",
    "Important",
    "Very important",
    "Central to them"
  ],
  "intensity": [
    "Quiet",
    "Noticeable",
    "Strong",
    "Very strong",
    "A peak moment"
  ],
  "formats": [
    "Story paragraph",
    "Scene outline",
    "Character stakes",
    "Relationship notes",
    "Act map",
    "Organizer notes"
  ]
}
~~~


### Meta Programs steps and controls


#### META_PROGRAM_STEPS


~~~json
[
  {
    "title": "What drives them?",
    "short": "Drives",
    "hint": "Choose what draws their attention and how they get started."
  },
  {
    "title": "How do they work with others?",
    "short": "Working together",
    "hint": "Explore decisions, differences, and ways of getting things done."
  },
  {
    "title": "How do they communicate?",
    "short": "Communication",
    "hint": "Choose useful ways to explain something and try a line of dialogue."
  },
  {
    "title": "What tests or changes them?",
    "short": "Scene test",
    "hint": "Put these choices into a situation. Decide what stays steady and what changes."
  }
]
~~~


#### MOTIVATION_OPTIONS


~~~json
[
  {
    "value": "Strongly toward",
    "label": "Strongly toward opportunities",
    "help": ""
  },
  {
    "value": "Mostly toward",
    "label": "Mostly toward opportunities",
    "help": ""
  },
  {
    "value": "Mixed",
    "label": "A mix of opportunities and risks",
    "help": ""
  },
  {
    "value": "Mostly away",
    "label": "Mostly avoiding risks",
    "help": ""
  },
  {
    "value": "Strongly away",
    "label": "Strongly avoiding risks",
    "help": ""
  }
]
~~~


#### SCOPE_OPTIONS


~~~json
[
  {
    "value": "Strongly big picture",
    "label": "Strongly prefers the big picture",
    "help": ""
  },
  {
    "value": "Mostly big picture",
    "label": "Mostly prefers the big picture",
    "help": ""
  },
  {
    "value": "Mixed",
    "label": "Moves between overview and detail",
    "help": ""
  },
  {
    "value": "Mostly detail",
    "label": "Mostly prefers details",
    "help": ""
  },
  {
    "value": "Strongly detail",
    "label": "Strongly prefers details",
    "help": ""
  }
]
~~~


### Group Foundations


| Step | Definition |
| --- | --- |
| start | {"key": "start", "label": "Start", "color": "#b8a4f4"} |
| identity | {"key": "identity", "label": "Identity & bonds", "color": "#e8d25c"} |
| members | {"key": "members", "label": "Members & roles", "color": "#73ccb2"} |
| power | {"key": "power", "label": "Power & rules", "color": "#68b5f0"} |
| pressure | {"key": "pressure", "label": "Tensions & change", "color": "#ef91b7"} |
| institution | {"key": "institution", "label": "Institution", "color": "#d8af79"} |
| review | {"key": "review", "label": "Description", "color": "#b7c7d8"} |

| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| origin | What brought them together? | multi | ["A shared task", "Kinship", "A shared belief", "Mutual protection", "A shared place", "Assignment", "A common interest", "A shared ordeal"] |  | {"step": "identity", "lead": "They came together through", "nodePath": ["origin"], "choiceAnswerKey": "origin:choice", "textAnswerKey": "origin"} |
| bonds | What keeps them together? | multi | ["Trust", "Shared history", "Mutual need", "Oaths", "Shared resources", "Reputation", "Affection"] |  | {"step": "identity", "lead": "Their bonds rest on", "nodePath": ["bonds"], "choiceAnswerKey": "bonds:choice", "textAnswerKey": "bonds"} |
| decisions | How is authority held and how are decisions made? | multi | ["Elected leadership", "Inherited office", "Appointment", "Expertise", "Control of resources", "Informal influence", "Shared decisions", "Coercion"] |  | {"step": "power", "lead": "Their arrangements for authority include", "nodePath": ["decisions"], "choiceAnswerKey": "decisions:choice", "textAnswerKey": "decisions"} |
| rules | What rules or expectations guide them? | multi | ["Written rules", "Unwritten customs", "Personal agreements", "Religious duties", "Flexible arrangements", "Strict enforcement"] |  | {"step": "power", "lead": "Their conduct is shaped by", "nodePath": ["rules"], "choiceAnswerKey": "rules:choice", "textAnswerKey": "rules"} |
| dissent | How do they handle disagreement? | multi | ["Open debate", "Deference to leaders", "Compromise", "Intermediaries", "Private dissent", "Punishment", "Splitting into sides"] |  | {"step": "power", "lead": "They handle disagreement through", "nodePath": ["dissent"], "choiceAnswerKey": "dissent:choice", "textAnswerKey": "dissent"} |
| tensions | What tensions exist within the group? | multi | ["Unequal influence", "Competing goals", "Old grievances", "Newcomers and veterans", "Unequal resources", "Divided loyalties"] |  | {"step": "pressure", "lead": "Their current tensions include", "nodePath": ["tensions"], "choiceAnswerKey": "tensions:choice", "textAnswerKey": "tensions"} |
| pressures | What could put their unity under pressure? | multi | ["Resource shortages", "A leadership change", "A newcomer", "An outside threat", "A failed task", "A disputed rule", "A member leaving"] |  | {"step": "pressure", "lead": "Possible pressures include", "nodePath": ["pressures"], "choiceAnswerKey": "pressures:choice", "textAnswerKey": "pressures"} |
| possibilities | Possible future developments · optional | text | null |  | {"step": "pressure", "lead": null, "nodePath": ["possibilities"]} |
| mandate | What is their mandate or claimed purpose? | text | null |  | {"step": "institution", "lead": "Their mandate", "nodePath": ["mandate"]} |
| succession | How are leaders appointed or replaced? | text | null |  | {"step": "institution", "lead": "Leadership and succession", "nodePath": ["succession"]} |
| assets | What resources, territory or privileges do they control? | text | null |  | {"step": "institution", "lead": "Resources and privileges", "nodePath": ["assets"]} |
| obligations | What obligations remain when members change? | text | null |  | {"step": "institution", "lead": "Continuing obligations", "nodePath": ["obligations"]} |

Group kind suggestions: ["Family", "Friends", "Adventuring party", "Band", "Guild", "Faction", "Community", "Institution", "Order", "Court", "Council", "Company"].


### Dragon and the City fields and native bindings


| Question key | Section or route | Question | Native node ID | Optional detail |
| --- | --- | --- | --- | --- |
| dragon:city | city | What is the city in your version? | S008 | False |
| dragon:valuable | city | What is good and valuable here? | S009 | False |
| dragon:flaw | city | What is unfair, broken or wasteful? | S010 | False |
| dragon:authority | city | Who decides, and who needs persuading? | S019 | True |
| dragon:dragon | dragon | What is the dragon in your version? | S007 | False |
| dragon:origin | dragon | Where does the threat come from? | S011 | False |
| dragon:wants | dragon | What drives the threat, and why does it matter now? | S007 | False |
| dragon:weakness | dragon | What limits it, or what price might it accept? | S007 | False |
| dragon:allowed | dragon | How was it allowed to get this bad? | S012 | True |
| dragon:opportunity | dragon | Could this threat reveal an opportunity? | S015 | True |
| dragon:escapePlan | escape | Where could they go? | S014 | False |
| dragon:escapeCost | escape | What is the cost of abandoning the city? | S013 | False |
| dragon:escapeTake | escape | What should they take with them? | S018 | True |
| dragon:escapeNotes | escape | Other details about escaping | S002 | True |
| dragon:defendPlan | defend | How could they strengthen their defences? | S022 | False |
| dragon:defendCost | defend | What does staying put protect and restrict? | S017 | False |
| dragon:defendKeep | defend | What is worth defending? | S020 | True |
| dragon:defendNotes | defend | Other details about defending | S003 | True |
| dragon:attackPlan | attack | What is the best line of attack? | S021 | False |
| dragon:attackCost | attack | What is the reward, and is it worth the risk? | S016 | False |
| dragon:attackChance | attack | What makes success plausible or doubtful? | S023 | True |
| dragon:attackNotes | attack | Other details about attacking | S005 | True |
| dragon:defenders | stakes | Who stands for the city, and what might they give up? | S008 | False |
| dragon:stakes | stakes | What is lost if the threat wins? | S008 | False |
| dragon:choice | stakes | Who chooses the response, and what could change their mind? | S006 | True |

Bindings are resolved to stable paths in the actual source graph. Several keys can share one node. Node-local wizardFields map each key to prompt, field, answer, and generatedAnswer. wizardFieldReferenceBody and wizardFieldGeneratedBody separate reference, generated, and manually edited writing.


### Specialist draft storage defaults


#### src/lib/fateWizard.js


~~~json
{
  "schemaVersion": 1,
  "characterRevision": 1,
  "id": "generated draft identity",
  "createdAt": "created timestamp",
  "lastStep": "setup",
  "title": "",
  "context": "",
  "meta": {
    "purpose": "communication",
    "depth": "simple",
    "mode": "build",
    "influencers": [],
    "targets": [],
    "source": "",
    "otherEntities": "",
    "outcome": "",
    "outcomeText": "",
    "intensity": null,
    "weighting": [
      "F",
      "A",
      "T",
      "E"
    ],
    "locks": {}
  },
  "focus": {
    "anchor": "",
    "hooks": [],
    "channels": [],
    "threatTypes": [],
    "valueTypes": [],
    "patternBreak": null,
    "routine": null,
    "breakType": null,
    "capture": null,
    "hold": null,
    "placement": null,
    "noise": [],
    "overlooked": null,
    "details": {},
    "signals": []
  },
  "authority": {
    "anchor": "",
    "source": [],
    "challengeable": null,
    "crack": null,
    "secondary": [],
    "basis": [],
    "markers": [],
    "cost": null,
    "compliance": null,
    "legitimacy": null,
    "curve": [],
    "details": {},
    "people": []
  },
  "tribe": {
    "anchor": "",
    "pull": null,
    "statusStakes": [],
    "position": null,
    "scriptElements": [],
    "enforcement": null,
    "witnesses": null,
    "symbol": null,
    "board": {},
    "details": {},
    "groups": [],
    "loyalties": "",
    "people": []
  },
  "emotion": {
    "anchor": "",
    "primary": null,
    "direction": null,
    "resistance": null,
    "response": null,
    "scriptType": null,
    "triggers": [],
    "pattern": null,
    "origin": null,
    "secondary": [],
    "intensity": null,
    "action": null,
    "curve": [],
    "details": {},
    "recurring": [],
    "patterns": []
  },
  "notes": {},
  "safety": {
    "cap": 4,
    "optIn": false,
    "note": "",
    "debrief": false,
    "debriefNote": ""
  },
  "output": {
    "format": "Spoken dialogue",
    "tone": "Plain",
    "length": "Short paragraph"
  },
  "fieldMeta": {},
  "dismissedWarnings": [],
  "workspace": {
    "targetId": "",
    "scopeKey": "{\"coll\":\"nodes\",\"path\":[]}",
    "sessionId": null
  },
  "purposeBanks": {},
  "communication": {
    "speaker": "",
    "listener": "",
    "speakerRef": "",
    "listenerRef": "",
    "relationship": "",
    "goal": "",
    "lines": {},
    "listenerReply": "",
    "profile": null
  },
  "revision": 2
}
~~~


#### src/lib/kolbWizard.js


~~~json
{
  "schemaVersion": 1,
  "id": "generated draft identity",
  "createdAt": "created timestamp",
  "title": "",
  "context": "",
  "meta": {
    "purpose": "learning",
    "depth": "simple",
    "mode": "build",
    "entry": "CE",
    "learners": [],
    "source": "",
    "otherLearners": "",
    "target": "",
    "targetText": "",
    "scope": null,
    "habit": null,
    "identity": null,
    "intent": null,
    "audience": [],
    "presentation": []
  },
  "lastStep": {
    "turn": 0,
    "step": "setup"
  },
  "turns": [
    {
      "ce": {
        "anchor": "",
        "types": [],
        "outcome": null,
        "agency": null,
        "immersion": null,
        "channels": [],
        "emotion": null,
        "emotionIntensity": null,
        "expected": null,
        "relevance": null,
        "priorExperience": null,
        "challenge": null,
        "support": null,
        "role": null
      },
      "ro": {
        "anchor": "",
        "observations": [],
        "trigger": null,
        "notice": [],
        "perspectives": null,
        "sources": [],
        "privacy": null,
        "conversation": null,
        "otherReading": null,
        "pause": null,
        "support": null,
        "role": null
      },
      "ac": {
        "anchor": "",
        "groundedIn": [],
        "ideaType": null,
        "prediction": null,
        "integration": null,
        "source": null,
        "supplier": null,
        "confidence": null,
        "correctness": null,
        "vocabulary": [],
        "role": null
      },
      "ae": {
        "anchor": "",
        "branches": {
          "confirm": {
            "enabled": false,
            "text": "",
            "consequence": ""
          },
          "partial": {
            "enabled": false,
            "text": "",
            "consequence": ""
          },
          "refute": {
            "enabled": false,
            "text": "",
            "consequence": ""
          }
        },
        "observed": null,
        "seed": null,
        "situation": null,
        "transfer": null,
        "stakes": null,
        "feedback": null,
        "sources": [],
        "role": null
      },
      "change": {
        "before": "",
        "after": "",
        "behaviour": ""
      },
      "durations": {},
      "act": "",
      "extras": {}
    }
  ],
  "notes": {},
  "locks": {},
  "fieldMeta": {},
  "dismissed": [],
  "safety": {
    "cap": 4,
    "failureFraming": false,
    "debrief": false,
    "note": ""
  },
  "output": {
    "format": "Story paragraph",
    "tone": "Plain",
    "length": "Short paragraph"
  },
  "workspace": {
    "targetId": "",
    "scopeKey": "{\"coll\":\"nodes\",\"path\":[]}",
    "sessionId": null
  }
}
~~~


#### src/lib/humanValuesWizard.js


~~~json
{
  "schemaVersion": 1,
  "id": "generated draft identity",
  "createdAt": "created timestamp",
  "title": "",
  "context": "",
  "meta": {
    "purpose": "values",
    "depth": "simple",
    "mode": "build",
    "source": ""
  },
  "lastStep": "setup",
  "setup": {
    "event": "",
    "eventType": null,
    "stakeholders": [],
    "others": "",
    "reality": null
  },
  "values": [
    {
      "id": "belonging",
      "label": "Belonging",
      "states": [
        "Together",
        "Unsure of belonging",
        "Alone"
      ],
      "description": "Being welcomed, supported, excluded or left alone.",
      "legacy": "Together",
      "column": "irrelevant",
      "from": "",
      "to": "",
      "alternate": "",
      "who": "",
      "why": "",
      "intent": null,
      "triggered": "",
      "interaction": null,
      "importance": null,
      "intensity": null,
      "views": [],
      "note": ""
    },
    {
      "id": "safety",
      "label": "Safety",
      "states": [
        "Safe",
        "Threatened",
        "In danger"
      ],
      "description": "Protection, risk, shelter and relief.",
      "legacy": "Safety",
      "column": "irrelevant",
      "from": "",
      "to": "",
      "alternate": "",
      "who": "",
      "why": "",
      "intent": null,
      "triggered": "",
      "interaction": null,
      "importance": null,
      "intensity": null,
      "views": [],
      "note": ""
    },
    {
      "id": "victory",
      "label": "Success",
      "states": [
        "Succeeded",
        "Still undecided",
        "Failed"
      ],
      "description": "What achieving or missing a goal means to someone.",
      "legacy": "Victory",
      "column": "irrelevant",
      "from": "",
      "to": "",
      "alternate": "",
      "who": "",
      "why": "",
      "intent": null,
      "triggered": "",
      "interaction": null,
      "importance": null,
      "intensity": null,
      "views": [],
      "note": ""
    },
    {
      "id": "status",
      "label": "Status",
      "states": [
        "Respected",
        "Unnoticed",
        "Disrespected"
      ],
      "description": "Recognition, respect, shame and influence.",
      "legacy": "High status",
      "column": "irrelevant",
      "from": "",
      "to": "",
      "alternate": "",
      "who": "",
      "why": "",
      "intent": null,
      "triggered": "",
      "interaction": null,
      "importance": null,
      "intensity": null,
      "views": [],
      "note": ""
    },
    {
      "id": "freedom",
      "label": "Freedom",
      "states": [
        "Free to choose",
        "Choices limited",
        "Controlled"
      ],
      "description": "Choice, coercion, debt and escape.",
      "legacy": "Free",
      "column": "irrelevant",
      "from": "",
      "to": "",
      "alternate": "",
      "who": "",
      "why": "",
      "intent": null,
      "triggered": "",
      "interaction": null,
      "importance": null,
      "intensity": null,
      "views": [],
      "note": ""
    },
    {
      "id": "wealth",
      "label": "Resources",
      "states": [
        "Enough to spare",
        "Just enough",
        "Not enough"
      ],
      "description": "Money, supplies or another resource that matters.",
      "legacy": "Wealthy",
      "column": "irrelevant",
      "from": "",
      "to": "",
      "alternate": "",
      "who": "",
      "why": "",
      "intent": null,
      "triggered": "",
      "interaction": null,
      "importance": null,
      "intensity": null,
      "views": [],
      "note": ""
    },
    {
      "id": "life",
      "label": "Survival",
      "states": [
        "Alive",
        "Life threatened",
        "Dead"
      ],
      "description": "Survival, rescue, sacrifice and grief.",
      "legacy": "Life",
      "column": "irrelevant",
      "from": "",
      "to": "",
      "alternate": "",
      "who": "",
      "why": "",
      "intent": null,
      "triggered": "",
      "interaction": null,
      "importance": null,
      "intensity": null,
      "views": [],
      "note": ""
    },
    {
      "id": "skill",
      "label": "Skill",
      "states": [
        "Capable",
        "Still learning",
        "Unable yet"
      ],
      "description": "Mastery, practice, confidence and needing help.",
      "legacy": "Skilled",
      "column": "irrelevant",
      "from": "",
      "to": "",
      "alternate": "",
      "who": "",
      "why": "",
      "intent": null,
      "triggered": "",
      "interaction": null,
      "importance": null,
      "intensity": null,
      "views": [],
      "note": ""
    },
    {
      "id": "health",
      "label": "Health",
      "states": [
        "Healthy",
        "Recovering",
        "Sick or injured"
      ],
      "description": "Wellbeing, illness, care and recovery.",
      "legacy": "Healthy",
      "column": "irrelevant",
      "from": "",
      "to": "",
      "alternate": "",
      "who": "",
      "why": "",
      "intent": null,
      "triggered": "",
      "interaction": null,
      "importance": null,
      "intensity": null,
      "views": [],
      "note": ""
    },
    {
      "id": "love",
      "label": "Love",
      "states": [
        "Love",
        "Mixed feelings",
        "Hatred"
      ],
      "description": "Affection, attachment, distance and resentment.",
      "legacy": "Love",
      "column": "irrelevant",
      "from": "",
      "to": "",
      "alternate": "",
      "who": "",
      "why": "",
      "intent": null,
      "triggered": "",
      "interaction": null,
      "importance": null,
      "intensity": null,
      "views": [],
      "note": ""
    },
    {
      "id": "friendship",
      "label": "Friendship",
      "states": [
        "Friend",
        "Stranger",
        "Enemy"
      ],
      "description": "Trust, alliances, rivalry and betrayal.",
      "legacy": "Friend",
      "column": "irrelevant",
      "from": "",
      "to": "",
      "alternate": "",
      "who": "",
      "why": "",
      "intent": null,
      "triggered": "",
      "interaction": null,
      "importance": null,
      "intensity": null,
      "views": [],
      "note": ""
    },
    {
      "id": "knowledge",
      "label": "Knowledge",
      "states": [
        "Knows",
        "Unsure",
        "Does not know",
        "Misled"
      ],
      "description": "What is known, hidden, suspected or misunderstood.",
      "column": "irrelevant",
      "from": "",
      "to": "",
      "alternate": "",
      "who": "",
      "why": "",
      "intent": null,
      "triggered": "",
      "interaction": null,
      "importance": null,
      "intensity": null,
      "views": [],
      "note": ""
    },
    {
      "id": "leadership",
      "label": "Role in the group",
      "states": [
        "Leading",
        "Sharing responsibility",
        "Following",
        "Excluded"
      ],
      "description": "Roles have different meanings in different situations; leading is not always better.",
      "column": "irrelevant",
      "from": "",
      "to": "",
      "alternate": "",
      "who": "",
      "why": "",
      "intent": null,
      "triggered": "",
      "interaction": null,
      "importance": null,
      "intensity": null,
      "views": [],
      "note": ""
    }
  ],
  "chain": {
    "anchor": "",
    "decisive": "",
    "smallEvent": "",
    "rows": []
  },
  "reveal": {
    "enabled": false,
    "uncertainty": null,
    "omens": "",
    "information": "",
    "irony": false,
    "rows": []
  },
  "choices": {
    "enabled": false,
    "anchor": "",
    "chooser": "",
    "visibility": null,
    "options": []
  },
  "arc": [],
  "notes": {},
  "locks": {},
  "fieldMeta": {},
  "legacy": {},
  "feedback": "",
  "organizer": "",
  "dismissed": [],
  "output": {
    "format": "Story paragraph"
  },
  "workspace": {
    "targetId": "",
    "scopeKey": "{\"coll\":\"nodes\",\"path\":[]}",
    "sessionId": null
  }
}
~~~


### Retained character detail keys


| Key | Meaning |
| --- | --- |
| background | Background and identity |
| goals | Goals and motivations |
| relationships | Relationships and loyalties |
| voice | Voice and speech |
| knowledge | What they know |
| secrets | Secrets |
| conditions | Situations and exceptions |
| possibilities | Possible changes |
| openQuestions | Unanswered questions |
| tensions | Tensions to review between inputs |

These are historical/detail storage slots. They are not all present as small native inspector fields; populated legacy content is retained in the writing workspace.


### Player editor PROFILE_FIELDS


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| personality | Personality / social style | text | [] |  | {"placeholder": "Calm organizer, high-energy explorer, quiet observer, comic relief..."} |
| experience | Adventure / LARP experience | text | [] |  | {"placeholder": "First-timer, escape room veteran, scout background, experienced roleplayer..."} |
| strengths | Strong sides | text | [] |  | {"placeholder": "Fast thinker, map reader, physically confident, cooperative, good under pressure..."} |
| weaknesses | Weak sides / support needs | text | [] |  | {"placeholder": "Gets overwhelmed by time pressure, dislikes darkness, slower runner, needs clearer instructions..."} |
| motivation | Motivation hooks | text | [] |  | {"placeholder": "Likes mystery, competition, teamwork, acting, tactical puzzles, physical challenges..."} |
| communicationStyle | Communication style | text | [] |  | {"placeholder": "Direct leader, asks questions, needs space to think, translates chaos into plans..."} |
| preferredRole | Likely team role | text | [] |  | {"placeholder": "Navigator, negotiator, decoder, scout, safety-aware anchor, morale keeper..."} |
| comfortNotes | Comfort and boundaries | text | [] |  | {"placeholder": "Outdoor comfort, darkness, noise, crawling, close contact, solo moments..."} |
| safetyNotes | Safety / accessibility notes | text | [] |  | {"placeholder": "Medical notes, mobility limits, allergies, emergency contact context, crew reminders..."} |
| observerNotes | Crew observation notes | text | [] |  | {"placeholder": "What to watch during the game: leadership emergence, stress response, group fit..."} |


### Player editor GAME_RECORD_FIELDS


| Key or path | Meaning or question | Control | Options | Guidance | Conditions or metadata |
| --- | --- | --- | --- | --- | --- |
| previousGames | Previous games / events | text | [] |  | {"placeholder": "List past games, dates, characters, team roles, or formats they have played."} |
| totalPoints | Total points | text | [] |  | {"textarea": false, "inputType": "number", "placeholder": "0"} |
| stagePoints | Stage-by-stage points | text | [] |  | {"placeholder": "Stage 1: 12 points; Stage 2: 18 points; finale bonus: 5..."} |
| achievements | Achievements / badges | text | [] |  | {"placeholder": "First decode, perfect stealth route, team rescue, best roleplay moment..."} |
| accomplishments | Notable accomplishments | text | [] |  | {"placeholder": "Solved key puzzle, kept team calm, found hidden route, negotiated with NPC..."} |
| performanceNotes | Game performance notes | text | [] |  | {"placeholder": "How they performed across pressure, puzzles, movement, communication, and leadership."} |
| stageHistory | Multi-stage history | text | [] |  | {"placeholder": "Track how they changed across stages: early caution, mid-game leadership, finale confidence..."} |
| gmRewards | GM awards / rewards owed | text | [] |  | {"placeholder": "Bonus clue earned, title granted, in-game item reward, public recognition..."} |


## E Saved concept trees


This is the current local reusable concept catalogue, not the private game instance tree. Root questions, concept questions, native nodes, and directed connections are listed. A template can use named choices and native questions in different ways; the generic wizard adapts them to its chosen purpose. Node bodies can include examples and reference prompts.


### Dragon & the City [LIB-CPT-DRAGON]


Category: storyConcept. Explain your project as if it is an epic adventure get people excited about your plan of action there is a dragon outside of city walls your world is no longer safe what should you do escape find a safer place to live and defend strengthen the walls of the city attack take on dragon before he gets stronger each options has risks and rewards just like your project

| Root question | Definition |
| --- | --- |
| dragon | {"key": "dragon", "label": "Who or what is the Dragon â€” the looming threat?"} |
| city | {"key": "city", "label": "What is the City â€” the thing worth protecting?"} |
| wants | {"key": "wants", "label": "What does the Dragon want, and why now?"} |
| weakness | {"key": "weakness", "label": "What is the Dragonâ€™s weakness â€” or its price?"} |
| defenders | {"key": "defenders", "label": "Who stands for the City, and what must they give up?"} |
| stakes | {"key": "stakes", "label": "What happens to the City if the Dragon wins?"} |

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S002 | conceptTitle | Escape |  |
| S003 | conceptTitle | Defend |  |
| S005 | conceptTitle | Attack |  |
| S006 | conceptChoice | What to do |  |
| S007 | character | What is your dragon |  |
| S008 | character | What is your city |  |
| S009 | conceptQuestion | What is good and valuable in the status quo |  |
| S010 | conceptQuestion | What is wrong unfair or wasteful |  |
| S011 | conceptQuestion | Where is the threat coming from |  |
| S012 | conceptQuestion | How has it been allowed to get this bad |  |
| S013 | conceptQuestion | What's the cost of abandoning the city |  |
| S014 | conceptQuestion | Where would you go |  |
| S015 | conceptQuestion | Is there an opportunity here |  |
| S016 | conceptQuestion | What's the reward and if it's worth the risk |  |
| S017 | conceptQuestion | Walls protect but do they also restrict what is the cost of staying put |  |
| S018 | conceptQuestion | What should you take with you |  |
| S019 | conceptQuestion | Who is in charge who do you need to persuade to act |  |
| S020 | conceptQuestion | What is worth defending in the Old City |  |
| S021 | conceptQuestion | What's your best line of attack |  |
| S022 | conceptQuestion | How can you strengthen your walls |  |
| S023 | conceptQuestion | What are your chances of winning |  |

| From | To | Label or condition |
| --- | --- | --- |
| S006 | S002 |  |
| S006 | S003 |  |
| S006 | S005 |  |
| S008 | S009 |  |
| S008 | S010 |  |
| S008 | S019 |  |
| S002 | S014 |  |
| S002 | S018 |  |
| S002 | S013 |  |
| S003 | S020 |  |
| S003 | S022 |  |
| S003 | S017 |  |
| S005 | S021 |  |
| S005 | S023 |  |
| S005 | S016 |  |
| S007 | S011 |  |
| S007 | S015 |  |
| S007 | S012 |  |

Additional visual records: {"frames": 2, "numberMarkers": 3, "titleMarkers": 0}.


### Hero & Guide [LIB-CPT-HERO]


Category: characterConcept. A protagonist paired with a mentor figure who gives a gift â€” at a cost. Bind a player (or team) to the Hero role and an NPC actor to the Guide.

| Root question | Definition |
| --- | --- |
| hero | {"key": "hero", "label": "Who is the Hero â€” whose story is this?"} |
| guide | {"key": "guide", "label": "Who is the Guide, and why do they help?"} |
| gift | {"key": "gift", "label": "What gift, lesson or tool does the Guide give?"} |
| cost | {"key": "cost", "label": "What does the Guide withhold â€” or what does their help cost?"} |

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S1 | character | The Hero | Whose story is this? Bind to a player team. |
| S2 | character | The Guide | The mentor. Cast an NPC actor; author intent + key lines, not scripts. |
| S3 | event | The Gift | The Guide hands over the tool, lesson or map â€” and names no price. |
| S4 | event | The Price Revealed | What the help really cost. Attach a Relationship / Status Change. |

| From | To | Label or condition |
| --- | --- | --- |
| S2 | S3 | offers |
| S1 | S3 | accepts |
| S3 | S4 | later |


### Universal stories [LIB-CPT-N003]


Category: storyConcept. build your story on solid foundations use elements that everyone will recognize humans are wonderfully diverse but if you have more in common than sets us apart every society anywhere in the world and at any point in history share certain basic habits and ways of thinking these universal traits come up time and time again in stories we tell they are reliable building blocks for your story too

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptChoice | Free will we see ourselves and other people as free willed individuals making deliberate choices |  |
| S002 | conceptChoice | Conflict and cooperation everyone is capable of both we can choose either |  |
| S003 | conceptChoice | Inconsistencies we all have gaps between what we do say and think |  |
| S004 | conceptChoice | Fear and bravery we all understand that fears can be overcome |  |
| S005 | conceptChoice | Right and wrong we all understand the difference we expect fairness and judgment from our peers |  |
| S006 | conceptChoice | Rites of passage all cultures have childhood adolescent and adult phases of life perhaps you are in helping your user or customer grow up in some way |  |
| S007 | conceptQuestion |  Types of Universal stories |  |

| From | To | Label or condition |
| --- | --- | --- |
| S007 | S001 |  |
| S007 | S002 |  |
| S007 | S003 |  |
| S007 | S004 |  |
| S007 | S005 |  |
| S007 | S006 |  |


### Curious tales [LIB-CPT-N004]


Category: storyConcept. Tell me what grabs your attention and you're halfway grabbing my attention too you have no control over your own curiosity some things fascinate you others don't what's intriguing for you to might seem weird to me but I am interested in what makes you tick so curious tales are a great way to tell to give me insight into what drives you forward

| Root question | Definition |
| --- | --- |
| cq-mrrkqvex-vcxyi3 | {"id": "cq-mrrkqvex-vcxyi3", "prompt": "What's new unusual and potentially useful", "choices": []} |
| cq-mrrksnyw-d1ka9q | {"id": "cq-mrrksnyw-d1ka9q", "prompt": "Curiosity equals anomaly plus potential benefit", "choices": [{"id": "cc-mrrkszwy-mgj9v0", "label": "Interesting"}]} |


### Three great conflicts [LIB-CPT-N005]


Category: storyConcept. Show how your work helps people with life's great battles conflict drives your story forward because we want to know how it resolves

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S002 | conceptQuestion | Where are the points of conflict between Dream and nightmare?<br> |  |
| S005 | character | SELF | We are our own worst enemy struggling to do what we know is right |
| S009 | conceptQuestion | What would the dream version of your project look like |  |
| S010 | conceptQuestion | What's the nightmare version? |  |
| S011 | conceptQuestion | How could this conflict resolve |  |
| S012 | conceptQuestion | Which is the greatest conflict that you or your user must fight this should be at the heart of your story |  |
| CHM-S-013 | character | Society | Fighting other people over resources goals or values |
| CHM-S-014 | character | Nature | Fighting monstrous animals disease weather accidents acts of God |
| CHM-S-015 | character | Hero |  |
| CHM-S-011 | conceptQuestion | People are hostile competitive and unkind<br> | Others will be nice |
| CHM-S-012 | conceptQuestion | Life is cruel random and heartless | Life will be fair |
| CHM-S-016 | conceptQuestion | I am proud lazy selfish and flawed | I will be perfect |

| From | To | Label or condition |
| --- | --- | --- |
| CHM-S-015 | CHM-S-011 |  |
| CHM-S-011 | CHM-S-013 |  |
| CHM-S-015 | CHM-S-016 |  |
| CHM-S-016 | S005 |  |
| CHM-S-015 | CHM-S-012 |  |
| CHM-S-012 | CHM-S-014 |  |

Additional visual records: {"frames": 1, "numberMarkers": 0, "titleMarkers": 0}.


### Good and evil [LIB-CPT-N006]


Category: storyConcept. tap into strong feeling of right and wrong in your audience bring a moral conflict into your story in a simple story you set a battle between right and versus wrong with you on the side of the angels but you can also show tough choices when two rides collide or we must choose of the lesser of evils we love this kind of complex storytelling which is why breaking bad wants so many awards

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptQuestion | Which side does your project take in any of those battles |  |
| S002 | conceptQuestion | Does your project try to balance one competing good against another or help us choose the lesser of two evils |  |
| S003 | character | Lesser evil |  |
| S004 | character | Good |  |
| S005 | character | Evil |  |
| S006 | character | Evil |  |

| frameworks | Definition |
| --- | --- |
| FW-001 | {"id": "FW-001", "kind": "framework", "frameworkId": "haidtMoralConflicts", "title": "Haidt Moral Conflicts"} |

| From | To | Label or condition |
| --- | --- | --- |
| S005 | S003 | VS |
| S004 | S006 | VS |

Additional visual records: {"frames": 0, "numberMarkers": 0, "titleMarkers": 2}.


### Shock of the old [LIB-CPT-N007]


Category: storyConcept. We can get so hooked on imagining the future that we forget to look for inspiration in stories from the past never forget just how hard it is to make anything truly innovative history has some harsh lessons for us most new things fail objects or actions which survive for generations must be good at serving some hidden purpose they correspond with something deep in our nature

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptQuestion | What obvious purpose did this have |  |
| S002 | conceptQuestion | What hidden purpose could it have |  |
| S004 | conceptQuestion | Does it have a symbolic or ritualistic power |  |
| S005 | conceptQuestion | Does it correspond to something deep in our nature |  |
| S007 | conceptQuestion | Who owns it who uses it who adapts it |  |
| S006 | conceptTitle | Dogs have been with us for a very long time |  |
| S009 | conceptTitle | Symbolic power obedience |  |
| S010 | conceptTitle | Who in the family owns a dog does a dog own us |  |
| S011 | conceptTitle | Hidden purpose contact us to nature take us for walks |  |
| S012 | conceptTitle | Obvious purpose guarding hunting companionship |  |
| S013 | conceptTitle | Deep in our nature we are still animals at heart |  |
| S014 | conceptQuestion | How does it make us feel? |  |
| S015 | conceptTitle | Feel responsible loved and trusted |  |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S012 |  |
| S002 | S011 |  |
| S004 | S009 |  |
| S005 | S013 |  |
| S007 | S010 |  |
| S014 | S015 |  |
| S005 | S006 |  |

Additional visual records: {"frames": 0, "numberMarkers": 2, "titleMarkers": 3}.


### Secrets and puzzles [LIB-CPT-N008]


Category: storyConcept. Make your story stick in the mind Promise secret waiting to be revealed or a puzzle waiting to be solved we are social creatures always wondering what other people are thinking and doing we are curious creatures always wondering why things work put these elements together and you have powerful attention hooks that can keep your audience with you until the very end of your story

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptQuestion | What new information do you discover |  |
| S002 | conceptQuestion | How was it kept secret |  |
| S003 | conceptQuestion |  How did you discover your puzzle |  |
| S004 | conceptQuestion | What price did you pay to find this new information |  |
| S005 | conceptQuestion | What will your audience gain by acquiring this new information |  |
| S006 | conceptTitle | Are a powerful form of information gap if you point out something I don't know you are highlighting an information gap which I naturally want to close if you own the missing information if it's your secret then I must pay attention to you |  |
| S007 | conceptTitle | Work because we like to think the world makes sense when you point out any kind of anomaly irony or inconsistency it becomes a glaring information gap that we want to close |  |
| S008 | conceptQuestion | Can you find a moment in your story where you discovered an |  |
| S009 | conceptQuestion | How did you make sense of it |  |
| S010 | conceptQuestion | What will your audience gain by acquiring this new information |  |
| S011 | conceptTitle | Anomaly this is not normal  |  |
| S012 | conceptTitle | irony this is not what you expect |  |
| S013 | conceptTitle |  inconsistency this doesn't fit with what went before |  |

| From | To | Label or condition |
| --- | --- | --- |
| S006 | S004 |  |
| S006 | S005 |  |
| S006 | S001 |  |
| S006 | S002 |  |
| S008 | S011 |  |
| S008 | S012 |  |
| S008 | S013 |  |

Additional visual records: {"frames": 2, "numberMarkers": 0, "titleMarkers": 2}.


### Rules cheats and rebels [LIB-CPT-N009]


Category: storyConcept. Tell us a rule then show us someone breaking it now you got our attention they'll be punished or vindicated What do Eve Pandora and Peter Rabbit have in common they were all given rules and broke them eve eats apple pandora opens a box Peter Rabbit goes into Mcgregor's garden and that's when things get interesting we all live by rules so we pray very close attention to stories about anyone who breaks them

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptQuestion | Who is the rule breaker in your story |  |
| S002 | conceptTitle | Set out all the possible rules the hero of your story could break remember that most of the rules we live by are not written down |  |
| S003 | character | hero |  |
| S004 | conceptChoice | Rebel |  |
| S005 | conceptChoice | Cheat |  |
| S006 | conceptTitle | Act selflessly at cost to themselves |  |
| S007 | conceptTitle | break society's rules in order to obey a higher rule |  |
| S008 | conceptTitle | Don't hide their actions |  |
| S009 | conceptTitle | Act selfishly to avoid cost to themselves |  |
| S010 | conceptTitle | Hide their actions |  |
| S011 | conceptTitle | Break rules the rest of us have to follow  |  |
| S012 | conceptQuestion | What happens next | We want rebels to be vindicated the moral of a rebel story is the rule no longer holds |
| S013 | conceptQuestion | What happens next | We want cheats to be punished the moral of a cheat story is the rule still applies |

| From | To | Label or condition |
| --- | --- | --- |
| S003 | S005 |  |
| S004 | S006 |  |
| S004 | S008 |  |
| S003 | S004 |  |
| S005 | S011 |  |
| S005 | S009 |  |
| S005 | S010 |  |
| S005 | S013 |  |
| S004 | S012 |  |
| S004 | S007 |  |

Additional visual records: {"frames": 1, "numberMarkers": 4, "titleMarkers": 0}.


### Order and chaos [LIB-CPT-N010]


Category: storyConcept. Show how your project can improve order on a chaotic mess or disrupt system that is too rigid every story contains three elements the known the Unknown and the Hero the Known is a world orderly safe but restricted the Unknown world is chaotic risky but full of potential the hero must explore both worlds and find the right balance between chaos and order

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptQuestion | What is positive about this world |  |
| S002 | conceptQuestion | What is negative |  |
| S003 | conceptTitle | Safety |  |
| S004 | conceptTitle | Predictability |  |
| S005 | conceptTitle | Imperfect |  |
| S006 | conceptTitle | Utility |  |
| S007 | conceptTitle | Incomplete |  |
| S008 | conceptTitle | Boring |  |
| S009 | conceptQuestion | What is negative about chaos |  |
| S010 | conceptQuestion | What is positive |  |
| S011 | conceptTitle | Opportunity |  |
| S012 | conceptTitle | Potential for renewal |  |
| S015 | conceptTitle | Unpredictability |  |
| S016 | conceptTitle | Threats |  |
| S017 | conceptQuestion | How does the unknown world create sudden change in the known world |  |
| S018 | conceptQuestion | What info becomes available |  |
| S019 | conceptTitle | Example: Natural disaster |  |
| S020 | conceptTitle | Anomallies, new patterns |  |
| S021 | conceptQuestion | Are you helping your client impose order into situation that is too chaotic and threatening |  |
| S022 | conceptQuestion | Are you injecting some much needed new life in a situation that is too stale and rigid |  |

| From | To | Label or condition |
| --- | --- | --- |
| S006 | S001 |  |
| S004 | S001 |  |
| S003 | S001 |  |
| S008 | S002 |  |
| S007 | S002 |  |
| S005 | S002 |  |
| S012 | S010 |  |
| S011 | S010 |  |
| S009 | S016 |  |
| S009 | S015 |  |
| S018 | S017 |  |
| S019 | S017 |  |
| S020 | S018 |  |

Additional visual records: {"frames": 4, "numberMarkers": 4, "titleMarkers": 4}.


### Circle of life [LIB-CPT-N011]


Category: storyConcept. help us recognize the characters conflicts and changes in your story relate them in a universal life stages we are born we grow up we live home we find our way in the world we create a home of our own we all share stages in life journey so we all recognize the same basic characteristics roles we adopt or people we meet along the way use these architects to tell a relatable story about your work or your

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | character | Parent |  |
| S002 | character | Adult |  |
| S003 | character | Child |  |
| S004 | storyLocation | Home |  |
| S005 | storyLocation | The wide world |  |
| S006 | conceptTitle | Innocent playful also weak knave |  |
| S007 | conceptTitle | Adventurous clever also rebellious cynical |  |
| S008 | conceptTitle | Wise supportive also dominant judgmental |  |
| S009 | conceptTitle | Conflict are you helping them with conflict between people at different life stages are you helping them navigate good and bad elements within their archetype |  |
| S010 | conceptTitle | Change are you helping your user to deal with crucial rites of passage from one archetype to another do help him her to grow up in some way |  |
| S011 | conceptTitle | Character Are you helping your user to fit into circle of life or fight against it for example children can be dominant parents can be adventurous |  |

| From | To | Label or condition |
| --- | --- | --- |
| S005 | S002 |  |
| S003 | S006 |  |
| S002 | S007 |  |
| S001 | S008 |  |
| S011 | S010 |  |
| S010 | S009 |  |

Additional visual records: {"frames": 3, "numberMarkers": 3, "titleMarkers": 2}.


### Curious tales [LIB-CPT-N012]


Category: storyConcept. Grabs your attention and you are halfway to grabbing my attention too you have no control over your own curiosity somethings fascinate you others don't what's intriguing for you might seem weird to me but I am interested in what makes you tick so your curious tales are a great way to give me insights into what drives you forward

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S002 | conceptQuestion | What makes you uneasy about a certain situation |  |
| S003 | conceptQuestion | What's new unusual and potentially useful? |  |
| S004 | conceptQuestion | But what do you keep noticing about certain situation? |  |
| S005 | conceptQuestion | What's new unusual and potentially harmful |  |
| S007 | event | New event |  |
| S009 | conceptChoice | Envy | You realize someone else is doing what you want to do if this is healthy motivating envy not the same as envying someone's luxury lifestyle |
| S010 | conceptChoice | Sacrifice | When have you given up on something valuable to follow a particular path |
| S011 | conceptChoice | Flow | Time just flies when you're practicing your skills and learning something new IT is deeply satisfying |
| S012 | conceptChoice | Caution | = anomaly+ Potential Threat |
| S013 | conceptChoice | Curiosity | = anomaly+ Potential Benefit |
| S014 | conceptQuestion | Were are you, what are you doing, what you are you with? |  |
| S015 | conceptQuestion | What is it tell us about your goals and motivation? |  |
| S016 | conceptQuestion | What does this tell us about your goals and motivation |  |
| S017 | conceptQuestion | Who do you envy and what are they doing? |  |
| S018 | conceptQuestion | What do you choose and what did it cost |  |
| S019 | conceptQuestion | What does it tell us about your goals and motivation |  |

| From | To | Label or condition |
| --- | --- | --- |
| S011 | S015 |  |
| S011 | S014 |  |
| S012 | S002 |  |
| S012 | S005 |  |
| S007 | S013 |  |
| S007 | S012 |  |
| S007 | S011 |  |
| S007 | S009 |  |
| S013 | S003 |  |
| S013 | S004 |  |
| S009 | S017 |  |
| S009 | S016 |  |
| S010 | S018 |  |
| S010 | S019 |  |
| S007 | S010 |  |


### Man in a hole [LIB-CPT-N013]


Category: structureConcept. This is the story of your first day at school or your first job it is every fear you face and every lesson you have learned you're doing OK minding your own business suddenly something takes you out a pandemic strikes you lose your job or get divorced you pick up yourself and carry on little older and wiser anyone can fall into a hole but you can't fall out you got to climb this is where you show your strength

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S002 | conceptQuestion | What is your version as innovators? |  |
| S004 | conceptQuestion | What is the version you could tell about your user? |  |

| frameworks | Definition |
| --- | --- |
| FW-001 | {"id": "FW-001", "kind": "framework", "frameworkId": "descentAndRecovery", "title": "Descent and Recovery Arc"} |

Additional visual records: {"frames": 4, "numberMarkers": 0, "titleMarkers": 6}.


### Happy ever after [LIB-CPT-N014]


Category: structureConcept. We're suckers for a happy ending life is no fairy tale but you can always give your story a satisfying end show stories show us what it means to grow up and find our place in the world how to fit in with others and how to do the right thing does your hero achieve these things by the end of the story if not can you at least hold out the hope of a happy ending to lift our spirits

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | Finding home love or respect |  |
| S002 | conceptTitle | Growing up |  |
| S004 | conceptQuestion | How has your hero grown |  |
| S005 | conceptQuestion | How have you helped? |  |
| S006 | conceptQuestion | How are they older and wiser? |  |
| S007 | conceptQuestion | What life stage transition have they achieved? |  |
| S008 | conceptQuestion | How does your hero find a place in the world has home changed after a journey has been on |  |
| S009 | conceptQuestion | How have they earned the respect to those who matter |  |
| S010 | conceptQuestion | How have you helped? |  |
| S011 | conceptQuestion | How is your hero more worthy of love |  |
| S012 | conceptTitle | Doing the right thing |  |
| S013 | conceptQuestion | How did they put the bad thing right |  |
| S014 | conceptQuestion | How do you help |  |
| S015 | conceptQuestion | What did it cost them |  |
| S016 | conceptQuestion | What is the bad thing your hero faced |  |

| From | To | Label or condition |
| --- | --- | --- |
| S002 | S005 |  |
| S002 | S006 |  |
| S002 | S004 |  |
| S002 | S007 |  |
| S001 | S011 |  |
| S001 | S009 |  |
| S001 | S010 |  |
| S001 | S008 |  |
| S012 | S016 |  |
| S012 | S013 |  |
| S012 | S015 |  |
| S012 | S014 |  |

Additional visual records: {"frames": 3, "numberMarkers": 7, "titleMarkers": 0}.


### Voyage and return [LIB-CPT-N015]


Category: structureConcept. Put adventure and the ties of home at the heart of the story this will keep us hooked till the end from Homer's RSA to Alice in Wonderland we love a voyage into the unknown our hero stumbles or leaps into strange new world they will learn a lot before they see the home again their voyage changes everything the hero is different when they return and it is so to his home

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | Home |  |
| S002 | conceptTitle | Vojage |  |
| S003 | conceptQuestion | How is home less than it could be? |  |
| S004 | conceptQuestion | Why is your hero anxious for adventure what do they want? |  |
| S005 | conceptQuestion | What kind of new world is out there? |  |
| S006 | conceptChoice | Physical |  |
| S007 | conceptChoice | social<br> |  |
| S008 | conceptChoice | Psycological |  |
| S009 | conceptQuestion | What are dangers here? what are opportunities? |  |
| S010 | conceptQuestion | How does the journey begin? |  |
| S011 | conceptQuestion | How does your hero feel the pool of home |  |
| S012 | conceptQuestion | What lessons does your hero learn here? |  |
| S013 | conceptChoice | Accidental |  |
| S014 | conceptChoice | Deliberate |  |
| S015 | conceptChoice | Forced |  |
| S016 | conceptTitle | Reurn |  |
| S018 | conceptQuestion | How has the hero changed on the Voyage |  |
| S019 | conceptQuestion | How does the home look different on Heroes Return |  |
| S020 | conceptQuestion | How will the hero make home better |  |

| frameworks | Definition |
| --- | --- |
| FW-001 | {"id": "FW-001", "kind": "framework", "frameworkId": "homeVoyageReturn", "title": "Home, Voyage, Return Story Circle"} |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S003 |  |
| S001 | S004 |  |
| S001 | S005 |  |
| S005 | S006 |  |
| S005 | S007 |  |
| S005 | S008 |  |
| S002 | S011 |  |
| S002 | S009 |  |
| S002 | S012 |  |
| S002 | S010 |  |
| S011 | S014 |  |
| S011 | S015 |  |
| S011 | S013 |  |
| S016 | S018 |  |
| S016 | S019 |  |
| S016 | S020 |  |

Additional visual records: {"frames": 5, "numberMarkers": 0, "titleMarkers": 3}.


### Pride and fall [LIB-CPT-N016]


Category: structureConcept. This is one of the oldest stories we know icarus Frankenstein and Titanic all follow its arc pride and Fall is the favorite story for our inner skeptic it's moral this sounds too good to be true it's a story your clients or users might be hearing even though you're telling them rigs to rag rags to riches use the story arc to get ahead of their skepticism and win them around

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptQuestion | Which warnings might you be ignoring |  |
| S002 | conceptQuestion | What is there a bad place to problem tray are trying to solve |  |
| S003 | conceptQuestion | What might sound proud like you're trying to fly too high |  |
| S004 | conceptQuestion | How could this leave your user client worse off than they started |  |

| From | To | Label or condition |
| --- | --- | --- |
| TTL-002 | S003 |  |
| TTL-003 | S002 |  |
| TTL-001 | S001 |  |
| TTL-004 | S004 |  |

Additional visual records: {"frames": 0, "numberMarkers": 0, "titleMarkers": 5}.


### Downfall [LIB-CPT-N017]


Category: structureConcept. Macbeth Harvey Weinstein and Nokia they all had a hidden flaw at that brought them down how might they have fallen we love a good downfall story almost as much as rags to riches this is partly schadenfreude taking joy in another's misfortune but downfall stories are also instructive let's knit make let's not make the same mistake they did

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | Exploit |  |
| S002 | conceptTitle | Defend |  |
| S003 | conceptQuestion | What are your flaws and weaknesses how might they be exposed |  |
| S004 | conceptQuestion | What can you learn from this criticism how might you change |  |
| S005 | conceptQuestion | If you do some crashing down what benefits might there be to others what kind of story would you tell |  |
| S006 | conceptQuestion | What are your rival's flaws how can you expose them |  |
| S007 | conceptQuestion | How can you show your target customers that they deserve better |  |
| S008 | conceptQuestion | How can you show your values in a positive light by comparison |  |
| S009 | conceptQuestion | How would the world be better place to fall re arrival flaws were exposed |  |

| From | To | Label or condition |
| --- | --- | --- |
| TTL-001 | TTL-003 |  |
| TTL-003 | TTL-002 |  |
| S002 | S003 |  |
| S002 | S004 |  |
| S002 | S005 |  |
| S001 | S008 |  |
| S001 | S007 |  |
| S001 | S006 |  |
| S001 | S009 |  |

Additional visual records: {"frames": 2, "numberMarkers": 2, "titleMarkers": 3}.


### Rags to riches [LIB-CPT-N018]


Category: structureConcept. The hero of the story is a in a bad place physically emotionally or socially but there is something inside him or a situation which is valuable even though nobody else can see it think of Cinderella a loving child treated badly or Rocky a small time boxer in slums of Philadelphia

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | Beginning | The hero of the story is a in a bad place physically emotionally or socially but there is something inside of him or their situation which is valuable even though nobody else can see it think of Cinderella a loving child pretty badly or Rocky a small time boxer in slums of Philadelphia |
| S002 | conceptTitle | Trigger and struggle | Something happens it makes a hero want to change cinderella here is about the bell ball rocky gets a shot in the championship they get outside help at first but ultimately they're on their own |
| S003 | conceptTitle | END:: Deserved recognition | Cinderella wants to find love not just live in a fancy palace rocky actually loses his championship fight but now everyone can see their hidden value cinderella is kind and loving rocky is a fighter |
| S004 | conceptQuestion | What's the hidden value that drives onward? |  |
| S005 | conceptQuestion | What role do you play? |  |

| From | To | Label or condition |
| --- | --- | --- |
| TTL-003 | TTL-002 |  |
| TTL-004 | TTL-003 |  |
| TTL-002 | TTL-005 |  |
| S003 | S004 |  |
| S003 | S005 |  |

Additional visual records: {"frames": 3, "numberMarkers": 3, "titleMarkers": 5}.


### Five T's [LIB-CPT-N019]


Category: structureConcept. Keep these tea in your back pocket in case something puts you on the spot I need to tell your story right now

1) Timeline beginning middle end

2) turning points realization decision and change

3)Tensions anxious moments and coughing

4)Temptations is a way out or do the right thing

5) Teachable moment the moral of your story

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | Tensions |  |
| S002 | conceptTitle | Timeline |  |
| S003 | conceptTitle | Temptations |  |
| S004 | conceptTitle | Turning points | Key moments in the timeline |
| S005 | conceptTitle | Teachable moment |  |
| S006 | conceptChoice | At first | Create the problem<br> |
| S007 | conceptChoice | Then we tried | Describe an action being tried for the problem |
| S008 | conceptChoice | And now we | Describe the result |
| S009 | conceptChoice | We used to do or think | the status quo |
| S010 | conceptChoice | But now | New order |
| S011 | conceptChoice | We realized we had a big problem when |  |
| S012 | conceptChoice | We knew we had to act when |  |
| S013 | conceptChoice | Everything changed when |  |
| S014 | conceptChoice | We made a breakthrough when |  |
| S015 | conceptChoice | Maximum comfort |  |
| S016 | conceptChoice | Maximum anxiety |  |
| S017 | conceptQuestion | Was there a moment when you could have been lazy told a lie and taken an easy way out |  |
| S018 | conceptQuestion | But instead you did the right thing |  |
| S019 | conceptQuestion | I will never forget |  |
| S020 | conceptQuestion | the point of it is |  |
| S021 | conceptQuestion | What distort me is |  |

| From | To | Label or condition |
| --- | --- | --- |
| S002 | S006 |  |
| S006 | S007 |  |
| S007 | S008 |  |
| S002 | S009 |  |
| S009 | S010 |  |
| S004 | S011 |  |
| S004 | S014 |  |
| S004 | S012 |  |
| S004 | S013 |  |
| S001 | S015 |  |
| S001 | S016 |  |
| S003 | S017 |  |
| S017 | S018 |  |
| S005 | S020 |  |
| S005 | S019 |  |
| S005 | S021 |  |

Additional visual records: {"frames": 5, "numberMarkers": 7, "titleMarkers": 5}.


### No easy way [LIB-CPT-N020]


Category: structureConcept. Nothing good is ever easy if something was good and easy we'd be doing it already think of all of the miracle diets and fitness fads that promises a 6 pack in six weeks or a beach body by the summer do you believe a word of it well the part that longs for a quick fix might be taken in but you're not trying to call into your audience they deserve a more realistic story they need to hear about setbacks as well as successes

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | Set back | Things take a turn for the worse |
| S002 | conceptTitle | Problem |  |
| S003 | conceptTitle | crisis | Gets so bad that it would be better not to change anything |
| S004 | conceptTitle | Early success | Hero takes opportunity and picks start a change |
| S005 | conceptChoice | Place where danger looks |  |
| S006 | conceptChoice | Place where potential is unrealized |  |
| S007 | conceptChoice | Hero's weakness |  |
| S008 | conceptChoice | Hostile reactions of others |  |
| S009 | conceptTitle | Better place | Danger is a worded potential is realized |
| S010 | conceptTitle | Recovery | Hero learns where true strength lies |

| From | To | Label or condition |
| --- | --- | --- |
| TTL-005 | TTL-004 |  |
| TTL-004 | TTL-003 |  |
| TTL-003 | TTL-002 |  |
| TTL-002 | TTL-001 |  |
| TTL-001 | TTL-006 |  |
| S002 | S004 |  |
| S004 | S001 |  |
| S001 | S003 |  |
| S003 | S010 |  |
| S010 | S009 |  |
| S002 | S006 |  |
| S002 | S005 |  |
| S001 | S007 |  |
| S001 | S008 |  |

Additional visual records: {"frames": 2, "numberMarkers": 0, "titleMarkers": 7}.


### Epic fail [LIB-CPT-N021]


Category: structureConcept. When your plan goes wrong you can play the blame game or you can make sense of the failure with the story a study Failed or Failed startups found people told different types of stories to explain what had gone wrong some people blame themselves some found a willing to blame and others blamed external factors when you're working with a risky project understanding epic fail stories can help you deal with inevitable setbacks

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | Mechanistic in personal or organizational failure | Our system let us down |
| S002 | conceptTitle | Catharsis: suffering and rebirth | That was my fault and I have learned from it |
| S003 | conceptTitle | Nemesis someone deliberately brought you down |  They had it in for us |
| S004 | conceptTitle | Hubris collective overconfidence | We tried to run before we could walk |
| S005 | conceptTitle | Zeitgeist the spirit of the age | Everyone was doing the same |
| S006 | conceptTitle | Betrayal blame someone close | He or she let me down  Or wasn't up to it |
| S008 | conceptChoice | Pros | Shows humility and open mind |
| S015 | conceptChoice | Cons | Have you learned the right lesson? |
| S009 | conceptChoice | Pros | Puts the focus on theme feelings |
| S010 | conceptChoice | Pros | Put focus on complex causes |
| S011 | conceptChoice | Pros | Puts failure into wider context |
| S012 | conceptChoice | Pros | Show skill gaps in the team |
| S013 | conceptChoice | Pros | Identifies bad relationships |
| S014 | conceptChoice | Cons | Minimizes personal failings |
| S016 | conceptChoice | Cons | Other people's actions are no excuse |
| S017 | conceptChoice | Cons | Assumes bad intentions |
| S018 | conceptChoice | Cons | Less emphasis on personal responsibility |
| S019 | conceptChoice | Cons | It gets very personal and accusatory |

| From | To | Label or condition |
| --- | --- | --- |
| S002 | S008 |  |
| S002 | S015 |  |
| S004 | S009 |  |
| S004 | S018 |  |
| S006 | S012 |  |
| S006 | S019 |  |
| S001 | S010 |  |
| S001 | S014 |  |
| S003 | S013 |  |
| S003 | S017 |  |
| S005 | S016 |  |
| S005 | S011 |  |

Additional visual records: {"frames": 1, "numberMarkers": 6, "titleMarkers": 1}.


### Innovation curve [LIB-CPT-N022]


Category: structureConcept. Make your bold new ideas seem less risky people will say no to your new ideas if they feel the risk is too high for them but each person you meet has different setting on their risk thermostat you can try slightly different stories about your project depending on whether you're talking to a pioneer mainstream or traditional audience

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | Early mainstream | open to new ideas but aware of the pi.... be great influencers on later buyers |
| S002 | conceptTitle | Pioneers |  They are adventurous with high tolerance for risk they may better test your idea with you |
| S003 | conceptTitle | Late Main Street | Want to buy a fully developed product off the shelf |
| S004 | conceptTitle | Innovators |  |
| S005 | conceptTitle | Traditional | Regard all innovation as high risk th....ther mainstream adapters to feel safe |
| S006 | conceptChoice |  Hopes | This is new and exciting |
| S007 | conceptChoice | Tell | Stories about team culture |
| S008 | conceptChoice | Fears | Costs of being the first |
| S009 | conceptChoice |  Hopes | Don't want to miss out |
| S010 | conceptChoice |  Hopes | This is ready and recommended by others |
| S011 | conceptChoice |  Hopes | This is new and has been tested |
| S012 | conceptChoice | Fears | There are costs to being left behind |
| S013 | conceptChoice | Fears | Cost to Disruption to business as usual |
| S014 | conceptChoice | Fears | Reputation damage if I endorse a flop |
| S015 | conceptChoice | Tell | It works in a niche market now is ready for mass market |
| S016 | conceptChoice | Tell | Everyone is doing it we have made it easy |
| S017 | conceptChoice | Tell | You can grab a lead in a niche market |
| S018 | conceptChoice | Tell | Stories about your process breakthroughs and prototypes |

| From | To | Label or condition |
| --- | --- | --- |
| S004 | S007 |  |
| S002 | S006 |  |
| S002 | S008 |  |
| S002 | S018 |  |
| S001 | S011 |  |
| S001 | S014 |  |
| S001 | S017 |  |
| S003 | S010 |  |
| S003 | S013 |  |
| S003 | S015 |  |
| S005 | S009 |  |
| S005 | S012 |  |
| S005 | S016 |  |

Additional visual records: {"frames": 4, "numberMarkers": 0, "titleMarkers": 5}.


### Simple sales stories [LIB-CPT-N023]


Category: functionConcept. Convince new customers to buy into your idea by telling stories about existing customers or users Someone Like You buys this product or someone you like buys this product the simple stories work because we are constantly monitoring other people looking for wisdom in the crowd plus other people are acting as beta testers of new products lowering the risk for us

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | Old regular and tricky people customers | Moral of the story these guys like us we must be doing something right |
| S002 | conceptTitle | Someone you like does or buys something | The moral of the story we have solved their problem we can solve yours too  |
| S003 | conceptTitle | Someone like you Does or buys something | Moral of the story you value this person's opinion if they trust us maybe you should too |
| S004 | conceptQuestion | Who have you already helped who is like them if not similar customer what about similar sector or market maybe we have solved a similar problem |  |
| S005 | conceptQuestion | Which previous customers can we ask for a testimonial |  |
| S006 | conceptQuestion | Who are we trying to sell to? |  |
| S007 | conceptQuestion | Who are we trying to sell to |  |
| S008 | conceptQuestion | Who are they influenced by? |  |
| S009 | conceptQuestion | Why do people trust us? |  |
| S011 | conceptChoice | Old customer | We sold one to this guy 10 years ago and it still works |
| S012 | conceptChoice | Regular customer | She bought one then came back for more |
| S013 | conceptChoice | Tricky customer | They complained but we put it right |

| From | To | Label or condition |
| --- | --- | --- |
| S002 | S006 |  |
| S002 | S004 |  |
| S002 | S005 |  |
| S007 | S003 |  |
| S008 | S003 |  |
| S009 | S003 |  |
| S011 | S001 |  |
| S012 | S001 |  |
| S013 | S001 |  |

Additional visual records: {"frames": 0, "numberMarkers": 3, "titleMarkers": 0}.


### Icebreaker stories [LIB-CPT-N024]


Category: functionConcept. Stories et yeah inn qingdao story story visual motif and magic of your story masulis by wen qing fantasy tÄ“vs bacon RN damage karaliste furore magazin to download from free online image bank

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | Photo story | Rangel achental to rangiem into a simple story structure |
| S002 | conceptChoice | During | This changed suddenly |
| S003 | conceptChoice | Before | Things you tube |
| S004 | conceptChoice | After | This happened as a result |
| S005 | conceptTitle | Love and hate | Split your team into two groups give each group the same photo of an object for example a stone |
| S006 | conceptChoice | first | Tell the first group you love this stone it makes your life complete Fill the second group you hate this stone it is ruining your life |
| S007 | conceptChoice | Second | Ask how each group to invent a story explaining why they feel over here about their stone |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S003 |  |
| S001 | S002 |  |
| S001 | S004 |  |
| S005 | S006 |  |
| S006 | S007 |  |


### Pitch perfect [LIB-CPT-N025]


Category: functionConcept. Convince me to back your idea show me what have you got that I need and why I should trust you to deliver maybe you are an entrepreneur pitching for investment maybe you are asking your boss to back a project but maybe you are the 10th pitch you've heard that day you need at least one maybe two stories to bring your pitch to life and make it stick in their minds

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptQuestion | How do you solve it |  |
| S002 | conceptQuestion | What's the problem you're solving for me |  |
| S003 | conceptQuestion | Why should I trust you |  |
| S004 | conceptChoice | Opportunity also available to us now | Positive |
| S005 | conceptChoice | Promise but if we get it right it will be great | Positive |
| S006 | conceptChoice | Practical steps if we do this it won't be easy | negative |
| S007 | conceptChoice | problem that needs fixing right now | Negative |

| From | To | Label or condition |
| --- | --- | --- |
| TTL-001 | S002 |  |
| TTL-001 | S001 |  |
| TTL-001 | S003 |  |
| S006 | TTL-002 |  |
| S007 | TTL-002 |  |
| S004 | TTL-002 |  |
| S005 | TTL-002 |  |

Additional visual records: {"frames": 5, "numberMarkers": 2, "titleMarkers": 6}.


### Story ish conversations  [LIB-CPT-N026]


Category: functionConcept. Beneath every conversations with your colleagues customers or users you don't need to captivate audience or Powerpoint slides to tell A story make a story as part of your daily conversation next time you feel a discussion or meeting is going nowhere try to make a more story ish by teasing out new information about people and change what happens when you are the most storage person in the room

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | Vivid visual story | Find vivid moments you need to create a visual story |
| S002 | conceptQuestion | That's an interesting idea what might it look like in action?<br> |  |
| S003 | conceptQuestion | Is there an example of how it this has worked in the past |  |
| S004 | conceptTitle | Who what where when | if the conversation is still too vagu....down into The Who what where and when |
| S005 | conceptQuestion | Where were you when this happened Who else was there/ |  |
| S006 | conceptQuestion | What happened next and then? |  |
| S007 | conceptTitle | Emotion within the story |  |
| S008 | conceptQuestion | What is the strongest feeling you remember from that time? |  |
| S009 | conceptQuestion | How did you feel in the beginning and by the end? |  |
| S010 | conceptTitle | Inevitable conflicts for the story | find the inevitable conflicts that make the story tick |
| S011 | conceptQuestion | Who did you need to win over or work around? |  |
| S012 | conceptQuestion | How did you resolve this conflict? |  |
| S013 | conceptTitle | The change | All stories are about change and new information |
| S014 | conceptQuestion | What happened that forced you to change |  |
| S015 | conceptQuestion | When did you realize you have found something new |  |

| From | To | Label or condition |
| --- | --- | --- |
| S002 | S001 |  |
| S003 | S001 |  |
| S005 | S004 |  |
| S006 | S004 |  |
| S008 | S007 |  |
| S009 | S007 |  |
| S011 | S010 |  |
| S012 | S010 |  |
| S014 | S013 |  |
| S015 | S013 |  |

Additional visual records: {"frames": 1, "numberMarkers": 5, "titleMarkers": 0}.


### The caregiver [LIB-CPT-N027]


Category: characterConcept. Protect and nourish be the supportive and arm around our shoulder allow others to thrive your focus on others even to the point of sacrificing yourself a good listener keeper of wisdom from the past you create comfort zones and put safety first you delight in the young and respect the old

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | character | The caregiver |  |
| S001--shadow-up | characterShadow | Exessive dark side | â†‘ the nanny smothering infantilizing risk averse |
| S001--shadow-back | characterShadow | â†© Withdrawing dark side | The archetype pulled back: avoidant, passive, or diminished. |
| S001--shadow-facet-when | characterArchetypeFacet | This is you when | You listen and pay close attention to feelings you give with no strings attached you are a safe harbor at the beginning and end of adventures |
| S001--shadow-facet-say | characterArchetypeFacet | You say | How do you feel i'm listening how can....st when you are ready I feel might we |
| S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | Protection and nurturing a wholesome meal prepared with love unconditional support space to grow |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S001--shadow-facet-when | This is you when |
| S001 | S001--shadow-facet-say | You say |
| S001 | S001--shadow-facet-gift | Your gift to others |
| S001 | S001--shadow-back |  |
| S001 | S001--shadow-up |  |


### The innocent [LIB-CPT-N028]


Category: characterConcept. Born anew see the world with fresh eyes vulnerable but wondrous full of potential you value what is pure good and right in the entire old world eyes wide with wonder you are a fresh start the green shots of recovery mighty oaks grow from a tiny acorn if only they are given the chance

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | character | The innocent |  |
| S001--shadow-up | characterShadow | â†‘ Excessive, Pushed Too Far, Dark Side | the cynic jaded pessimistic distrustful |
| S001--shadow-back | characterShadow | â†© Withdrawing dark side | The victim vulnerable needy dependent |
| S001--shadow-facet-when | characterArchetypeFacet | This is you when |  Everything seems fresh and new you feel a childlike wonder in the world you value purity and simplicity above shiny sophistication you seek safe haven you are gathering your strength ready to grow |
| S001--shadow-facet-say | characterArchetypeFacet | You say | Keep it simple so much to learn is this safe can you help how does this work back to basics let's start again |
| S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | a chance to see without cynicism innocence regained aa fresh start something to watch over permission to care |
| S001--archetype-combinations | characterArchetypeCombinations | The innocent |  |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S001--shadow-up | â†‘ dark side |
| S001 | S001--shadow-back | â†© dark side |
| S001 | S001--shadow-facet-when | This is you when |
| S001 | S001--shadow-facet-say | You say |
| S001 | S001--shadow-facet-gift | Your gift to others |

Additional visual records: {"frames": 1, "numberMarkers": 0, "titleMarkers": 0}.


### The Jester [LIB-CPT-N029]


Category: characterConcept. let's the games begin roll the dice a....here's many true words spoken in jest

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | character | The Jester |  |
| S001--shadow-up | characterShadow | â†‘ Excessive, Pushed Too Far, Dark Side | the fool prankster trickster gambler show off |
| S001--shadow-back | characterShadow | â†© Withdrawing dark side | The boar solemn self important dull |
| S001--shadow-facet-when | characterArchetypeFacet | This is you when |  You play fair you are lost in the joy of a game you laugh out loud as you realize something new and unexpected you see the upside the funny side the flip side |
| S001--shadow-facet-say | characterArchetypeFacet | You say | Come play your turn next ha ha have you heard about Only kidding cheer up give them a chance |
| S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | playground fun and fair play boundles....ne truth in jest forget your troubles |
| S001--archetype-combinations | characterArchetypeCombinations | The Jester |  |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S001--shadow-up | â†‘ dark side |
| S001 | S001--shadow-back | â†© dark side |
| S001 | S001--shadow-facet-when | This is you when |
| S001 | S001--shadow-facet-say | You say |
| S001 | S001--shadow-facet-gift | Your gift to others |

Additional visual records: {"frames": 1, "numberMarkers": 0, "titleMarkers": 0}.


### The explorer [LIB-CPT-N030]


Category: characterConcept. Discover by doing Keep on moving imagine what you'll find over the next horizon your travel light you pore over maps but they're no substitute for being there curious and resourceful you push the way for others here be monsters but there's gold in the hills too

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | character | The explorer |  |
| S001--shadow-up | characterShadow | â†‘ Excessive, Pushed Too Far, Dark Side | The Wanderer ruthless homeless lost eternal tourist |
| S001--shadow-back | characterShadow | â†© Withdrawing dark side | The homebody in curious dwells in the comfort zone |
| S001--shadow-facet-when | characterArchetypeFacet | This is you when | you are staring out of the window wis....nd something other people want to see |
| S001--shadow-facet-say | characterArchetypeFacet | You say |  keep moving what's over there come s....nture we got to get out of this place |
| S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | map and compass boots in backpack tru....its limits permission to hit the road |
| S001--archetype-combinations | characterArchetypeCombinations | The explorer |  |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S001--shadow-up | â†‘ dark side |
| S001 | S001--shadow-back | â†© dark side |
| S001 | S001--shadow-facet-when | This is you when |
| S001 | S001--shadow-facet-say | You say |
| S001 | S001--shadow-facet-gift | Your gift to others |

Additional visual records: {"frames": 1, "numberMarkers": 0, "titleMarkers": 0}.


### The lover [LIB-CPT-N031]


Category: characterConcept. Seek beauty and pleasure we are here for a good time and not a long time live in the moment you bring harmony and intimacy you thrive in the realm of the senses what matters right here right now not long planned future seek pleasure and share it with others you hold our hearts in your hand

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | character | The lover |  |
| S001--shadow-up | characterShadow | â†‘ Excessive, Pushed Too Far, Dark Side | the hedonist shallow easily tempted over indulged |
| S001--shadow-back | characterShadow | â†© Withdrawing dark side | The utilitarian called calculating unfeeling  |
| S001--shadow-facet-when | characterArchetypeFacet | This is you when |  You have a song in your heart and th....reveal vulnerabilities build intimacy |
| S001--shadow-facet-say | characterArchetypeFacet | You say |  How does it feel find your passion do what you love you're worth it you and me against the world I feel so alive |
| S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | Indulgence luxury a well deserved tre....st for life permission to be intimate |
| S001--archetype-combinations | characterArchetypeCombinations | New character |  |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S001--shadow-up | â†‘ dark side |
| S001 | S001--shadow-back | â†© dark side |
| S001 | S001--shadow-facet-when | This is you when |
| S001 | S001--shadow-facet-say | You say |
| S001 | S001--shadow-facet-gift | Your gift to others |

Additional visual records: {"frames": 1, "numberMarkers": 0, "titleMarkers": 0}.


### The Warrior [LIB-CPT-N032]


Category: characterConcept. Fight the good fight actions speak louder than words rally others to your 'cause you stand in harm's way if it's the right thing to do disciplined determined you train hard and lead by example you pick your target then strike defend those who cannot defend themselves

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | character | The Warrior |  |
| S001--shadow-up | characterShadow | â†‘ Excessive, Pushed Too Far, Dark Side | The bully mercenary thug brown over brains |
| S001--shadow-back | characterShadow | â†© Withdrawing dark side | The pushover unassertive avoids conflict |
| S001--shadow-facet-when | characterArchetypeFacet | This is you when | You're aiming high you're sparring enjoying healthy competition you feel strong head down grit at teeth get on with it doesn't it feel good when you then that training pay off |
| S001--shadow-facet-say | characterArchetypeFacet | You say | where is there's a will there's a way....st do it I need ammunition not a ride |
| S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | a banner to follow a cause worth figh....training boot camp a spirit de corpse |
| S001--archetype-combinations | characterArchetypeCombinations | The Warrior |  |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S001--shadow-up | â†‘ dark side |
| S001 | S001--shadow-back | â†© dark side |
| S001 | S001--shadow-facet-when | This is you when |
| S001 | S001--shadow-facet-say | You say |
| S001 | S001--shadow-facet-gift | Your gift to others |

Additional visual records: {"frames": 1, "numberMarkers": 0, "titleMarkers": 0}.


### Artist [LIB-CPT-N033]


Category: characterConcept. Find patterns in the chaos free your mind and the rest will follow show in a new way you delight in seeing a world in a grain of sand or heaven in a wildflower the most important ideas can be hardest to express but you teach us signs symbols and metaphors

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | character | The artist |  |
| S001--shadow-up | characterShadow | â†‘ Excessive, Pushed Too Far, Dark Side | The pauser style over a substance irrational impractical |
| S001--shadow-back | characterShadow | â†© Withdrawing dark side | The pedant  logical literal tin eared |
| S001--shadow-facet-when | characterArchetypeFacet | This is you when | you can't wait to put a pen to paper ....beat join the dots for the rest of us |
| S001--shadow-facet-say | characterArchetypeFacet | You say |  It's like picture this look closer Don't you see what I mean Umm it's really hard to put into words but |
| S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | A new way of seeing new light perspective abstraction and choreography Signs symbols and metaphors blank canvas and a palette of colors space to develop talent |
| S001--archetype-combinations | characterArchetypeCombinations | The artist |  |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S001--shadow-up | â†‘ dark side |
| S001 | S001--shadow-back | â†© dark side |
| S001 | S001--shadow-facet-when | This is you when |
| S001 | S001--shadow-facet-say | You say |
| S001 | S001--shadow-facet-gift | Your gift to others |

Additional visual records: {"frames": 1, "numberMarkers": 0, "titleMarkers": 0}.


### The ruler [LIB-CPT-N034]


Category: characterConcept. take the lead be the commanding prese.... quo you thrive in your realm thrives

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | character | The ruler |  |
| S001--shadow-up | characterShadow | â†‘ Excessive, Pushed Too Far, Dark Side | The tyrant power crazed dictator the selfish giant |
| S001--shadow-back | characterShadow | â†© Withdrawing dark side | The abdicator shrinks responsibilities |
| S001--shadow-facet-when | characterArchetypeFacet | This is you when |  You know you got this you are on top of your brief you understand the tradition you're part of and why it's right to take and try it and tested approach you gleave clear instructions and have high expectations |
| S001--shadow-facet-say | characterArchetypeFacet | You say | Follow me umm this is how we do things umm don't be hasty umm stick to what works umm I need you too umm do your best |
| S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | order security structure a goal to fo....o a body of law permission to developOrder security structure a goal to follow a chance to serve tradition to belong to a body of law permission to develop |
| S001--archetype-combinations | characterArchetypeCombinations | The ruler |  |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S001--shadow-up | â†‘ dark side |
| S001 | S001--shadow-back | â†© dark side |
| S001 | S001--shadow-facet-when | This is you when |
| S001 | S001--shadow-facet-say | You say |
| S001 | S001--shadow-facet-gift | Your gift to others |


### The Magician [LIB-CPT-N035]


Category: characterConcept. Attempt the impossible dream up things that don't exist transform the mundane world you make your own jaws drop you imagine new worlds hiding in plain sight you show us that change will come anything is possible you meet everyday challenge with what if and not why not

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | character | The Magician |  |
| S001--shadow-up | characterShadow | â†‘ Excessive, Pushed Too Far, Dark Side | the illusionist snake hole sleight of hand Unicorn chaser |
| S001--shadow-back | characterShadow | â†© Withdrawing dark side | The skeptic unimaginative rationalist in denial |
| S001--shadow-facet-when | characterArchetypeFacet | This is you when |  Dreaming your mind wandering free you have spotted something new you're granted somebody'd wish your work makes people say wow how did you do that |
| S001--shadow-facet-say | characterArchetypeFacet | You say | Imagine. what if. Why not   let go of that try this  It's a long shot   What might this mean   do you realize      |
| S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | wish fulfillment transformation from ....rld a break from relentless certainty |
| S001--archetype-combinations | characterArchetypeCombinations | The Magician |  |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S001--shadow-up | â†‘ dark side |
| S001 | S001--shadow-back | â†© dark side |
| S001 | S001--shadow-facet-when | This is you when |
| S001 | S001--shadow-facet-say | You say |
| S001 | S001--shadow-facet-gift | Your gift to others |


### Sage [LIB-CPT-N036]


Category: characterConcept. The truth will set you free see it first tell it straight gain wisdom and understanding you study hard to discover how things really are you feel grounded and certain when you know your stuff people regard you as an expert truth is a path to wisdom every day is a school day

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | character | The Sage |  |
| S001--shadow-up | characterShadow | â†‘ Excessive, Pushed Too Far, Dark Side | The ideologue dogmatic and flexible blind to nuance |
| S001--shadow-back | characterShadow | â†© Withdrawing dark side | To idiot ignorant blinkered unwilling to learn |
| S001--shadow-facet-when | characterArchetypeFacet | This is you when | You know your stuff inside and out you trust your method you just had a light bulb moment if you're proud when others recognize your expertise you're aware of your own biases your dishonesty detector is finally tuned |
| S001--shadow-facet-say | characterArchetypeFacet | You say | Know thyself- Follow the science-  Trust the technique-- we have been here before- see for yourself-  You can't argue with facts- There is no mystery |
| S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | the whole truth data the tools to und....crystal ball magic mirror x-ray specs |
| S001--archetype-combinations | characterArchetypeCombinations | The Sage |  |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S001--shadow-up | â†‘ dark side |
| S001 | S001--shadow-back | â†© dark side |
| S001 | S001--shadow-facet-when | This is you when |
| S001 | S001--shadow-facet-say | You say |
| S001 | S001--shadow-facet-gift | Your gift to others |


### The Rebel [LIB-CPT-N037]


Category: characterConcept. Demand more the status quo is not good enough some rules are meant to be broken you are an agent of chaos raging against a machine you defied old order to usher in the new you are impatient an early adopter a firestider an icon breaker you bring giants to their knees

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | character | Rebel |  |
| S001--shadow-up | characterShadow | â†‘ Excessive, Pushed Too Far, Dark Side | The cheat liar fraudster breaks rules for selfish gain |
| S001--shadow-back | characterShadow | â†© Withdrawing dark side | The stickler rule bound always by the book |
| S001--shadow-facet-when | characterArchetypeFacet | This is you when | You're itching to get started but you're being held back you know the rules are stopping you from doing the right thing you've spotted a gap in your opponent's armor |
| S001--shadow-facet-say | characterArchetypeFacet | You say | Some rules are meant to be broken revolution not evolution something's gotta give are you gonna take that |
| S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | crowbar a lock pick a place card a pr....rmission to experiment and take risks |
| S001--archetype-combinations | characterArchetypeCombinations | Rebel |  |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S001--shadow-up | â†‘ dark side |
| S001 | S001--shadow-back | â†© dark side |
| S001 | S001--shadow-facet-when | This is you when |
| S001 | S001--shadow-facet-say | You say |
| S001 | S001--shadow-facet-gift | Your gift to others |


### The companion [LIB-CPT-N038]


Category: structureConcept. It's good to belong we stand together equals in a circle of friends you were of one of us you are the happiest among friends you are the one of the gang down to earth authentic and humble stay real keep our feet firmly on the ground

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | character | The companion |  |
| S001--shadow-up | characterShadow | â†‘ Excessive, Pushed Too Far, Dark Side | The slob lazy and ambitious small town attitude |
| S001--shadow-back | characterShadow | â†© Withdrawing dark side | The snob aloof elitist reserved standoffish |
| S001--shadow-facet-when | characterArchetypeFacet | This is you when | You are old we're with old friends no nonsense no errors and graces the real you it's more important to get along to get attached you feel loyal to the group they've got your back you always do your share |
| S001--shadow-facet-say | characterArchetypeFacet | You say | Keep it real no frills one of us can't we just get along too big for your boots fine words don't put food on a table |
| S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | A place to belong folks to hang out with humility fallibility reminds us that nobody's perfect space to be authentic |
| S001--archetype-combinations | characterArchetypeCombinations | The companion |  |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S001--shadow-up | â†‘ dark side |
| S001 | S001--shadow-back | â†© dark side |
| S001 | S001--shadow-facet-when | This is you when |
| S001 | S001--shadow-facet-say | You say |
| S001 | S001--shadow-facet-gift | Your gift to others |


### Drive stories [LIB-CPT-N039]


Category: characterConcept. Why do the work for money yes but what really drives you these stories build a better team culture if you want innovation you need inner motivation let's face it change means a lot of hard work for an uncertain reward money by itself won't motivate you or your team if you feel frustrated bored or uninspired so find stories that show a different way of working with autonomy mastery and purpose

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | Autonomy | A sense that you have control over the way you work the time and place you work the tool....give you how we work together stories |
| S002 | conceptChoice | Positive |  |
| S003 | conceptChoice | <br> negative |  |
| S004 | conceptChoice | <br> negative |  |
| S005 | conceptChoice | <br> negative |  |
| S006 | conceptChoice | Positive |  |
| S007 | conceptChoice | Positive |  |
| S008 | conceptChoice | Here is a moment when I felt I had enough autonomy |  |
| S009 | conceptChoice | Here is what happened |  |
| S010 | conceptChoice | Here is how I felt |  |
| S011 | conceptChoice | Here is how I felt |  |
| S012 | conceptChoice | Here is what happened |  |
| S013 | conceptChoice | Here is a moment when I felt I didnt had enough autonomy |  |
| S014 | conceptTitle | Mastery | A sense that your skills are steadily....this can give you how we grow stories |
| S015 | conceptChoice | Here is a moment when I felt I'd mastered the skills I need |  |
| S016 | conceptChoice | Here is a moment when I couldn't see a bigger picture |  |
| S017 | conceptChoice | Here is a moment when I didn't have the skills I needed |  |
| S018 | conceptTitle | Purpose | a sense that you are doing worthwhile....his can give you why we do it stories |
| S019 | conceptChoice | Carries a moment when I could see my work contributed to greater good |  |
| S020 | conceptChoice | Here is what happened |  |
| S021 | conceptChoice | Here is what happened |  |
| S022 | conceptChoice | Here is what happened |  |
| S023 | conceptChoice | Here is what happened |  |
| S024 | conceptChoice | Here is how I felt |  |
| S025 | conceptChoice | Here is how I felt |  |
| S026 | conceptChoice | Here is how I felt |  |
| S027 | conceptChoice | Here is how I felt |  |

| From | To | Label or condition |
| --- | --- | --- |
| TTL-001 | S001 |  |
| S002 | S008 |  |
| S008 | S009 |  |
| S009 | S010 |  |
| S011 | S012 |  |
| S003 | S013 |  |
| S013 | S012 |  |
| S002 | S001 |  |
| S003 | S001 |  |
| S014 | S007 |  |
| S014 | S005 |  |
| S007 | S015 |  |
| S005 | S017 |  |
| S006 | S018 |  |
| S004 | S018 |  |
| S019 | S006 |  |
| S016 | S004 |  |
| S015 | S021 |  |
| S021 | S024 |  |
| S017 | S020 |  |
| S020 | S025 |  |
| S019 | S022 |  |
| S022 | S026 |  |
| S016 | S023 |  |
| S023 | S027 |  |
| S018 | TTL-003 |  |
| TTL-002 | S014 |  |
| TTL-003 | S018 |  |

Additional visual records: {"frames": 0, "numberMarkers": 3, "titleMarkers": 3}.


### Trust me an expert [LIB-CPT-N040]


Category: characterConcept. Un michelle story beach house in action imaging eksperti minogi style of the facts howdy un veci nations goodyear tharon kids weekend iv house the fact hanged harrachov yovelive top head expect from the of the expert

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptQuestion | Even though it costs you time money or reputation |  |
| S002 | conceptQuestion | What matters more than money |  |
| S004 | conceptQuestion | Which parts of your project would you work on even if you weren't getting paid |  |
| S005 | conceptQuestion | When have you actually done something not just posted like on Facebook that they would admire |  |
| S006 | conceptQuestion | What kind of projects would you never work on no matter how much you were paid |  |
| S007 | conceptQuestion | What values do you share with your client or user |  |
| S008 | conceptQuestion | What kind of work would you be embarrassed to share with people you respect |  |
| S009 | conceptQuestion | What have you sacrificed for the greater good |  |
| S010 | conceptQuestion | Imagine your project files write an arbitrary that includes the line at least V for example the boss of Kodak might say our company failed but at least we gave people millions of memories |  |

| From | To | Label or condition |
| --- | --- | --- |
| TTL-002 | S002 |  |
| TTL-002 | S006 |  |
| TTL-002 | S001 |  |
| TTL-002 | S010 |  |
| TTL-002 | S009 |  |
| TTL-002 | S007 |  |
| S006 | S008 |  |
| S002 | S004 |  |
| S007 | S005 |  |

Additional visual records: {"frames": 0, "numberMarkers": 0, "titleMarkers": 2}.


### What's my motivation [LIB-CPT-N041]


Category: characterConcept. How will your user or customer respond to your idea it helps you if you know what's driving them when we want to achieve anything we need other people's help so we are constantly trying to figure out what people want and as a result how they might respond to us this is why actors ask what's my motivation when they take on a character in a story understanding your user's motivation will help you too

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | A list of key actors | Make a list of key actors in your project this could include a client a range of users or stakeholders |
| S002 | conceptTitle | Method acting approach | Now apply the method acting approach pioneered by Constantin Stanislavski to each character separately |
| S003 | conceptQuestion | What do I want |  |
| S004 | conceptQuestion | How will I get it |  |
| S005 | conceptQuestion | Who am I |  |
| S006 | conceptQuestion | What must I overcome to get it |  |
| S007 | conceptQuestion | Where am I |  |
| S009 | conceptQuestion | When is it |  |
| S010 | conceptQuestion | Why do I want it |  |
| S011 | conceptTitle | Key actor relationships | As a final stage draw connections between your key actors with two headings for each connection |
| S013 | conceptChoice | Conflict |  |
| S014 | conceptChoice | Cooperation |  |
| S015 | conceptQuestion | Why my twin actor hinder another |  |
| S016 | conceptQuestion | Why might one actor help another reach their goal |  |

| From | To | Label or condition |
| --- | --- | --- |
| S002 | S007 |  |
| S002 | S009 |  |
| S002 | S003 |  |
| S003 | S010 |  |
| S010 | S004 |  |
| S004 | S006 |  |
| S011 | S014 |  |
| S011 | S013 |  |
| S016 | S014 |  |
| S015 | S013 |  |

Additional visual records: {"frames": 2, "numberMarkers": 3, "titleMarkers": 0}.


### Cut to the chase [LIB-CPT-N042]


Category: characterConcept. Oh no you're losing your audience their minds are wandering quick get their attention back to you thou Shall Not Be Dull is the golden rules of story telling you know when you're losing people they start to look restless or uncomfortable let's be honest it is annoying to listen to a boring story so it's time to quit the back story and cut the chase give them action emotion or meaning

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | Cut to action | Take us to the moment that story hinges on especially if it's an abrupt change and or crisis |
| S002 | conceptTitle | Cut to meaning |  |
| S003 | conceptTitle | Cut to emotion |  |
| S004 | conceptChoice | The worst moment was |  |
| S005 | conceptChoice | Suddenly |  |
| S006 | conceptChoice | So basically what happened was |  |
| S007 | conceptChoice | We were so relieved elated |  |
| S008 | conceptChoice | That's when I realized |  |
| S009 | conceptChoice | I'd always thought |  |
| S010 | conceptChoice | I'd never forget |  |
| S011 | conceptChoice | I was amazed shocked surprised |  |
| S012 | conceptChoice | I was so disappointed stressed |  |

| From | To | Label or condition |
| --- | --- | --- |
| TTL-001 | S001 |  |
| TTL-001 | S003 |  |
| TTL-001 | S002 |  |
| S001 | S004 |  |
| S001 | S005 |  |
| S001 | S006 |  |
| S002 | S009 |  |
| S002 | S008 |  |
| S002 | S010 |  |
| S003 | S007 |  |
| S003 | S011 |  |
| S003 | S012 |  |

Additional visual records: {"frames": 0, "numberMarkers": 3, "titleMarkers": 1}.


### Which about [LIB-CPT-N043]


Category: characterConcept. Me So what are you working on you umm well EHR how can it be so hard to answer this simple question sometimes you are so absorbed in your idea you don't know where to start explaining it to someone new IT is called the curse of Knowledge and some experts get it really bad but don't worry you escape the curse with a well told story

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | New information |  We are knowledge seekers alert to new things in case they benefit or harm us |
| S002 | conceptTitle | Change | we don't pay attention to things that stay the same |
| S003 | conceptTitle | Personal benefit | No matter how abstract or technical your work is somewhere down the line there's a person in real world who benefits |
| S004 | conceptChoice | Do you have realized something new |  |
| S005 | conceptChoice | Initiating a change opportunity |  |
| S006 | conceptChoice | New You have spotted something that isn't right choice |  |
| S007 | conceptChoice | Ultimately I'm trying to help X achieve Y |  |
| S008 | conceptChoice | Responding to external change threat |  |
| S009 | conceptChoice | This is part of the wider problem I'm solving for you |  |

| From | To | Label or condition |
| --- | --- | --- |
| S008 | S002 |  |
| S005 | S002 |  |
| S004 | S001 |  |
| S006 | S001 |  |

Additional visual records: {"frames": 0, "numberMarkers": 0, "titleMarkers": 1}.


### Hero and the Guide [LIB-CPT-N044]


Category: characterConcept. Stop talking about yourself make your user the hero of your story you play a supporting role the expert guide for every look there's Yoda and there's a little green fellow might say hero of every story not you are tell us what your hero is trying to achieve then show us how your guide them on their journey and what special gift you offer them along the way

| Native path | Kind | Title or question | Reference writing |
| --- | --- | --- | --- |
| S001 | conceptTitle | User's journey | Map your user journey |
| S002 | conceptQuestion | Where they are now |  |
| S003 | conceptQuestion | What is their problem |  |
| S004 | conceptQuestion | Where do they want to be |  |
| S005 | conceptTitle | Expert guide | where do you come into their journey? |
| INS-1 | concept | The explorer | Discover by doing Keep on moving imagine what you'll find over the next horizon your travel light you pore over maps but they're no substitute for being there curious and resourceful you push the way for others here be monsters but there's gold in the hills too |
| INS-1/S001 | character | The explorer |  |
| INS-1/S001--shadow-up | characterShadow | â†‘ Excessive, Pushed Too Far, Dark Side | The Wanderer ruthless homeless lost eternal tourist |
| INS-1/S001--shadow-back | characterShadow | â†© Withdrawing dark side | The homebody in curious dwells in the comfort zone |
| INS-1/S001--shadow-facet-when | characterArchetypeFacet | This is you when | you are staring out of the window wis....nd something other people want to see |
| INS-1/S001--shadow-facet-say | characterArchetypeFacet | You say |  keep moving what's over there come s....nture we got to get out of this place |
| INS-1/S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | map and compass boots in backpack tru....its limits permission to hit the road |
| INS-1/S001--archetype-combinations | characterArchetypeCombinations | The explorer |  |
| INS-2 | concept | Sage | The truth will set you free see it first tell it straight gain wisdom and understanding you study hard to discover how things really are you feel grounded and certain when you know your stuff people regard you as an expert truth is a path to wisdom every day is a school day |
| INS-2/S001 | character | The Sage |  |
| INS-2/S001--shadow-up | characterShadow | â†‘ Excessive, Pushed Too Far, Dark Side | The ideologue dogmatic and flexible blind to nuance |
| INS-2/S001--shadow-back | characterShadow | â†© Withdrawing dark side | To idiot ignorant blinkered unwilling to learn |
| INS-2/S001--shadow-facet-when | characterArchetypeFacet | This is you when | You know your stuff inside and out you trust your method you just had a light bulb moment if you're proud when others recognize your expertise you're aware of your own biases your dishonesty detector is finally tuned |
| INS-2/S001--shadow-facet-say | characterArchetypeFacet | You say | Know thyself- Follow the science-  Trust the technique-- we have been here before- see for yourself-  You can't argue with facts- There is no mystery |
| INS-2/S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | the whole truth data the tools to und....crystal ball magic mirror x-ray specs |
| INS-2/S001--archetype-combinations | characterArchetypeCombinations | The Sage |  |
| INS-3 | concept | The Warrior | Fight the good fight actions speak louder than words rally others to your 'cause you stand in harm's way if it's the right thing to do disciplined determined you train hard and lead by example you pick your target then strike defend those who cannot defend themselves |
| INS-3/S001 | character | The Warrior |  |
| INS-3/S001--shadow-up | characterShadow | â†‘ Excessive, Pushed Too Far, Dark Side | The bully mercenary thug brown over brains |
| INS-3/S001--shadow-back | characterShadow | â†© Withdrawing dark side | The pushover unassertive avoids conflict |
| INS-3/S001--shadow-facet-when | characterArchetypeFacet | This is you when | You're aiming high you're sparring enjoying healthy competition you feel strong head down grit at teeth get on with it doesn't it feel good when you then that training pay off |
| INS-3/S001--shadow-facet-say | characterArchetypeFacet | You say | where is there's a will there's a way....st do it I need ammunition not a ride |
| INS-3/S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | a banner to follow a cause worth figh....training boot camp a spirit de corpse |
| INS-3/S001--archetype-combinations | characterArchetypeCombinations | The Warrior |  |
| S011 | character | The muse | beauty will set you free feel it first express it true gain harmony and intimacy you create hard to discover how things really feel you thrive in the realm of the senses and the symbols what matters is right here right now not the long-planned future seek pleasure and share it with others you delight in seeing a world in a grain of sand or heaven in a wildflower the most important ideas can be hardest to express but you teach as signs symbols and metaphors you hold our hearts in your hand inspiration is a path to connection every day is a creation day |
| S012 | character | The defender | the shield will set you free stand firm first hold the line gain strength and loyalty you protect hard to keep what matters safe you feel grounded and certain when the circle holds people regard you as a guardian protection is a path to peace every day is a stand dayThis keeps the same dense, unpunctuated cadence as the Sage and Muse descriptions. It centres the Defenderâ€™s core drive: creating and holding safety for others, valuing loyalty and firm boundaries over personal glory, and finding certainty in the act of standing between threat and what is precious. |
| INS-4 | concept | The Rebel | Demand more the status quo is not good enough some rules are meant to be broken you are an agent of chaos raging against a machine you defied old order to usher in the new you are impatient an early adopter a firestider an icon breaker you bring giants to their knees |
| INS-4/S001 | character | Rebel |  |
| INS-4/S001--shadow-up | characterShadow | â†‘ Excessive, Pushed Too Far, Dark Side | The cheat liar fraudster breaks rules for selfish gain |
| INS-4/S001--shadow-back | characterShadow | â†© Withdrawing dark side | The stickler rule bound always by the book |
| INS-4/S001--shadow-facet-when | characterArchetypeFacet | This is you when | You're itching to get started but you're being held back you know the rules are stopping you from doing the right thing you've spotted a gap in your opponent's armor |
| INS-4/S001--shadow-facet-say | characterArchetypeFacet | You say | Some rules are meant to be broken revolution not evolution something's gotta give are you gonna take that |
| INS-4/S001--shadow-facet-gift | characterArchetypeFacet | Your gift to others | crowbar a lock pick a place card a pr....rmission to experiment and take risks |
| INS-4/S001--archetype-combinations | characterArchetypeCombinations | Rebel |  |
| S013 | conceptChoice | You give | A map or compass |
| S016 | conceptChoice | You value | New experiences |
| S017 | conceptChoice | You say | Leave your comfort zone |
| S018 | conceptChoice | You give | Crowbar or lock pick |
| S019 | conceptChoice | You give | Paint and a Canvas |
| S020 | conceptChoice | You give | book and a crystal ball |
| S021 | conceptChoice | You give | Armor and padlock |
| S022 | conceptChoice | You give | Weapons and tactics |
| S023 | conceptChoice | You say |  educate yourself |
| S025 | conceptChoice | You say |  Fight the good fight |
| S026 | conceptChoice | You say | Break the rules |
| S027 | conceptChoice | You say | express yourself |
| S028 | conceptChoice | You say | Protect your treasures |
| S029 | conceptChoice | You value | wisdom knowledge |
| S030 | conceptChoice | You value |  Creativity imagination |
| S031 | conceptChoice | You value |  putting things right |
| S032 | conceptChoice | You value | safety security |
| S033 | conceptChoice | You value | disruption radical change |

| From | To | Label or condition |
| --- | --- | --- |
| S001 | S003 |  |
| S003 | S002 |  |
| S001 | S002 |  |
| S002 | S004 |  |
| S001 | S004 |  |
| S016 | INS-1 |  |
| S017 | INS-1 |  |
| S013 | INS-1 |  |
| S029 | INS-2 |  |
| S023 | INS-2 |  |
| S020 | INS-2 |  |
| S031 | INS-3 |  |
| S025 | INS-3 |  |
| S022 | INS-3 |  |
| S028 | S012 |  |
| S032 | S012 |  |
| S021 | S012 |  |
| S027 | S011 |  |
| S019 | S011 |  |
| S030 | S011 |  |
| S018 | INS-4 |  |
| S026 | INS-4 |  |
| S033 | INS-4 |  |

Additional visual records: {"frames": 1, "numberMarkers": 2, "titleMarkers": 2}.


### New concept [LIB-CPT-N045]


Category: storyConcept.


### Saved story structures


#### Item Node Graph Template [LIB-STORY-ITEM-NODE-GRAPH]


Reusable inspector-first Item graph: minimal canvas card, full item detail in inspector, placement ports, linked mechanics, sensor hooks, and No-Solo-Solve support.

| Native path | Kind | Title | Writing |
| --- | --- | --- | --- |
| S1 | item | Item Name | Player-facing lore/flavor goes here. Keep it evocative, not mechanical. |
| S2 | storyLocation | Placement Location | Story Location where the item is placed, discovered, hidden, traded, or activated. |
| S3 | quest | Linked Mechanic | Placeholder for a mechanic reference such as Lockpicking Minigame Event, access gate, decoding ritual, or exchange rule. |
| S4 | quest | Sensor Hook | Sensor interaction placeholder: NFC, QR, GPS, pressure, button, phone macro, or GM-confirmed state. |
| S5 | quest | No-Solo-Solve Rule | Use when the item should require multiple players, separated information, synchronized timing, or a role split. |

| From | To | Label |
| --- | --- | --- |
| S1 | S2 | Placement port |
| S1 | S3 | Linked mechanic port |
| S1 | S4 | Sensor hook port |
| S1 | S5 | enforce when relevant |

#### Ninja Turtle Costume Collection [LIB-STORY-TURTLE-COLLECTION]


Story-side reusable structure for one team collecting five turtle costume Story Items. This stays narrative-only; GPS, MacroDroid, speaker, and MP3 behavior live in the mechanics template.

| Native path | Kind | Title | Writing |
| --- | --- | --- | --- |
| S1 | concept | Turtle Costume Collection | Duplicate this container once per team. It tracks the five costume Story Items and the story moment when the set is complete. |
| S1/P1 | item | Mask / Headband | Team identity costume piece. Story Item only. |
| S1/P2 | item | Arm Sweat Catchers | Wearable costume piece. Story Item only. |
| S1/P3 | item | Leg Sweat Catchers | Wearable costume piece. Story Item only. |
| S1/P4 | item | Weapon | Safe turtle-themed prop weapon. Story Item only unless a physical prop record is linked separately. |
| S1/P5 | item | Shell | Special Story Item. Pair this with the NinjaTurtleShellReaction mechanics template when GPS/MP3 behavior is needed. |
| S1/P6 | quest | Collection Tracker 0/5 | Track which of the five costume pieces have been collected by this team. |
| S1/P7 | event | Costume Set Complete | Story beat triggered when the team has the required costume set. |
| S2 | event | Turtle Assembly Moment | Optional story event for bringing completed turtle teams together. Keep the mechanical GPS/audio template separate. |

| From | To | Label |
| --- | --- | --- |
| S1 | S2 | when narratively complete |


## F Mechanics collections and templates


All 176 current mechanism catalogue records are indexed below. Different mechanism families have different extra parameters. Image data is omitted; image placement metadata is editing detail, not game logic.


### pattern [actionPatternMechanisms]


| ID | Mechanism | Category | Meaning | Additional parameters |
| --- | --- | --- | --- | --- |
| APM-ACTION-POINTS | Action Points | Action Token Systems | Players receive a limited action budget and spend it on available actions. | {"kind": "pattern", "system": "token", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Players receive a limited action budget and spend it on available actions.", "budgetLimit": "", "availability": ""} |
| APM-ACTION-DRAFTING | Action Drafting | Action Token Systems | Players choose limited actions from a shared pool, making those choices unavailable to others. | {"kind": "pattern", "system": "token", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Players choose limited actions from a shared pool, making those choices unavailable to others.", "budgetLimit": "", "availability": ""} |
| APM-ACTION-RETRIEVAL | Action Retrieval | Action Token Systems | Used actions become unavailable until a player retrieves or refreshes them. | {"kind": "pattern", "system": "token", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Used actions become unavailable until a player retrieves or refreshes them.", "budgetLimit": "", "availability": ""} |
| APM-ACTION-EVENT | Action / Event | Action Token Systems | On their turn, the player plays a card that shows Action Points and an Event. They must <br>choose to either use the Action Points or perform the Event. If they choose to use the Action <br>Points, the Event may be performed by another player. | {"kind": "pattern", "system": "token", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "A player chooses between using an action resource and resolving a special event.", "budgetLimit": "", "availability": ""} |
| APM-COMMAND-CARDS | Command Cards | Action Token Systems | Cards determine which units, roles, or participants may act. | {"kind": "pattern", "system": "token", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Cards determine which units, roles, or participants may act.", "budgetLimit": "", "availability": ""} |
| APM-ACTION-QUEUE | Action Queue | Action Order Systems | Players program actions that resolve later in a defined sequence. | {"kind": "pattern", "system": "order", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Players program actions that resolve later in a defined sequence.", "budgetLimit": "", "availability": ""} |
| APM-SHARED-ACTION-QUEUE | Shared Action Queue | Action Order Systems | Players contribute to one common queue whose actions affect everyone. | {"kind": "pattern", "system": "order", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Players contribute to one common queue whose actions affect everyone.", "budgetLimit": "", "availability": ""} |
| APM-FOLLOW | Follow | Action Order Systems | One participant selects an action and others may perform the same or a modified version. | {"kind": "pattern", "system": "order", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "One participant selects an action and others may perform the same or a modified version.", "budgetLimit": "", "availability": ""} |
| APM-ORDER-COUNTERS | Order Counters | Action Order Systems | Players commit hidden or visible orders to locations before resolving them. | {"kind": "pattern", "system": "order", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Players commit hidden or visible orders to locations before resolving them.", "budgetLimit": "", "availability": ""} |
| APM-RONDEL | Rondel | Action Order Systems | Available actions follow a circular sequence, with movement determining access or cost. | {"kind": "pattern", "system": "order", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Available actions follow a circular sequence, with movement determining access or cost.", "budgetLimit": "", "availability": ""} |
| APM-ACTION-SELECTION-RESTRICTIONS | Action Selection Restrictions | Action Special System | Rules restrict which actions a participant may currently choose. | {"kind": "pattern", "system": "special", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Rules restrict which actions a participant may currently choose.", "budgetLimit": "", "availability": ""} |
| APM-VARIABLE-PLAYER-POWERS | Variable Player Powers | Action Special System | Different players or teams receive unique actions or modifications to shared actions. | {"kind": "pattern", "system": "special", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Different players or teams receive unique actions or modifications to shared actions.", "budgetLimit": "", "availability": ""} |
| APM-ONCE-PER-GAME-ABILITIES | Once-per-Game Abilities | Action Special System | A powerful special action may be used only once during the game. | {"kind": "pattern", "system": "special", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "A powerful special action may be used only once during the game.", "budgetLimit": "", "availability": ""} |
| APM-ADVANTAGE-TOKEN | Advantage Token | Action Token Systems | A transferable token grants or modifies a special action for its current holder. | {"kind": "pattern", "system": "token", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "A transferable token grants or modifies a special action for its current holder.", "budgetLimit": "", "availability": ""} |
| APM-GATING-AND-UNLOCKING | Gating and Unlocking | Action Special System | Actions become available only after a condition, threshold, stage, or discovery. | {"kind": "pattern", "system": "special", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Actions become available only after a condition, threshold, stage, or discovery.", "budgetLimit": "", "availability": ""} |
| APM-TECH-TREES-TRACKS | Tech Trees / Tracks | Action Special System | Progress unlocks new actions or improves actions already available. | {"kind": "pattern", "system": "special", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Progress unlocks new actions or improves actions already available.", "budgetLimit": "", "availability": ""} |
| APM-EVENTS | Events | Action Special System | An external event immediately changes the game state or later actions. | {"kind": "pattern", "system": "special", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "An external event immediately changes the game state or later actions.", "budgetLimit": "", "availability": ""} |
| APM-NARRATIVE-CHOICE | Narrative Choice | Action Special System | Players choose between actions presented through a narrative situation. | {"kind": "pattern", "system": "special", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Players choose between actions presented through a narrative situation.", "budgetLimit": "", "availability": ""} |
| APM-BINGO | Bingo | Action Special System | Randomly presented elements determine which actions or patterns players pursue. | {"kind": "pattern", "system": "special", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Randomly presented elements determine which actions or patterns players pursue.", "budgetLimit": "", "availability": ""} |
| APM-LAYERING | Layering | Action Special System | Overlapping physical components determine which visible areas or actions are active. | {"kind": "pattern", "system": "special", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Overlapping physical components determine which visible areas or actions are active.", "budgetLimit": "", "availability": ""} |
| APM-SLIDE-PUSH | Slide / Push | Action Special System | Moving one object pushes or repositions other objects in its path. | {"kind": "pattern", "system": "special", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "Moving one object pushes or repositions other objects in its path.", "budgetLimit": "", "availability": ""} |
| APM-MATCHING | Matching | Action Special System | A new action or component must match a visible feature of an earlier one. | {"kind": "pattern", "system": "special", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "A new action or component must match a visible feature of an earlier one.", "budgetLimit": "", "availability": ""} |
| APM-DRAWING | Drawing | Action Special System | A participant represents something visually for others to interpret or guess. | {"kind": "pattern", "system": "special", "advantages": [""], "effects": [""], "variations": [""], "custom": false, "coreRule": "A participant represents something visually for others to interpret or guess.", "budgetLimit": "", "availability": ""} |


### probability [actionProbabilityMechanisms]


| ID | Mechanism | Category | Meaning | Additional parameters |
| --- | --- | --- | --- | --- |
| APR-HIGH-NUMBER | High Number | Numeric | Compare generated totals; the highest qualifying result wins or succeeds. | {"kind": "probability", "variations": ["Base strength can be modified by some factor.  Also can be  upgradable modifiers: such as D6 to d12 dice.", " If the hits exceed the shields, the \ndefender takes damage based on the difference."], "emotionalSpike": "", "effects": ["Simple effect resolution system very upfront."], "custom": false} |
| APR-STAT-CHECK | Stat Check | Numeric | Compare a result with a character statistic or target threshold to determine success. each type of unit has a target number that it is trying to meet or exceed to <br>score a hi | {"kind": "probability", "variations": ["one or multiple dice can be used", "numbers can be modified", "roll value bellow their stat, but higher than opponent"], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-CRITICAL-HITS-AND-FAILURES | Critical Hits and Failures | Numeric | Extreme results create unusually strong successes or unusually costly failures. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-RATIO-COMBAT-RESULTS-TABLE | Ratio/Combat Results Table | Numeric | Compare opposing strengths as a ratio, then read the resulting outcome from a table. | {"kind": "probability", "variations": ["Column selected by a differential between Attacker \nand Defender", "the final die roll can be modified, or the column used can be shifted left or right. "], "emotionalSpike": "", "effects": ["gives developer a lot of control over resulting actions"], "custom": false} |
| APR-DIE-ICONS | Die Icons | Numeric | Resolve the attempt by counting or interpreting symbols rather than ordinary die totals. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-CARD-PLAY | Card Play | Cards | Players commit or reveal cards whose values and effects determine the result. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-ROCK-PAPER-SCISSORS | Rock, Paper, Scissors | Choice | Simultaneous choices resolve through a circular pattern of strengths and weaknesses. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-PRISONER-S-DILEMMA | Prisoner's Dilemma | Choice | Each participant chooses whether to cooperate or defect, with the combined choices shaping the payoff. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-ALTERNATE-REMOVAL | Alternate Removal | Choice | Participants alternately remove available options until the remaining state determines the outcome. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-PHYSICAL-ACTION | Physical Action | Physical | Real-world accuracy, speed, coordination, or dexterity directly determines the result. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-STATIC-CAPTURE | Static Capture | Spatial | A fixed spatial relationship determines whether an area, target, or piece is captured. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-ENCLOSURE | Enclosure | Spatial | An outcome is achieved by surrounding or enclosing a target, region, or opposing element. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-MINIMAP | Minimap | Spatial | A smaller representation of the play space is used to resolve position, movement, or control. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-FORCE-COMMITMENT | Force Commitment | Choice | Players secretly or openly allocate limited strength before comparing commitments. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-VOTING | Voting | Social | Participants collectively determine an outcome by casting and counting preferences. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-PLAYER-JUDGE | Player Judge | Social | A player evaluates an answer, performance, or interpretation and decides the result. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-TARGETED-CLUES | Targeted Clues | Social | Specific information is directed to selected participants to shape deduction and resolution. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-TIEBREAKERS | Tiebreakers | Numeric | A secondary comparison or rule determines the result when the primary method is tied. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-DICE-SELECTION | Dice Selection | Numeric | Players choose which dice to roll, keep, use, or assign before resolving the result. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-ACTION-SPEED | Action Speed | Timing | The order or speed with which actions are completed determines priority or success. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-REROLLING-AND-LOCKING | Rerolling and Locking | Numeric | Players preserve selected results while rerolling others to improve or complete an outcome. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-KILL-STEAL | Kill Steal | Timing | Credit or reward goes to the participant who completes the decisive final contribution. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-HOT-POTATO | Hot Potato | Timing | A risky state or object passes between participants until a timer or trigger resolves it. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-FLICKING | Flicking | Physical | Players propel components with a finger flick, using the resulting position or contact as the outcome. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-STACKING-AND-BALANCING | Stacking and Balancing | Physical | Players build or balance physical components, with stability and placement determining success. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |
| APR-NEIGHBOR-SCOPE | Neighbor Scope | Spatial | Resolution affects or compares only adjacent participants, spaces, or elements. | {"kind": "probability", "variations": [""], "emotionalSpike": "", "effects": [""], "custom": false} |


### victory [victoryConditionMechanisms]


| ID | Mechanism | Category | Meaning | Additional parameters |
| --- | --- | --- | --- | --- |
| VC-VICTORY-POINTS-FROM-GAME-STATE | Victory Points from Game State | Victory Condition | Award victory points for reaching or maintaining defined states in the game. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-VICTORY-POINTS-FROM-PLAYER-ACTIONS | Victory Points from Player Actions | Victory Condition | Award victory points directly for specific actions completed by players. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-TEMPORARY-AND-PERMANENT-VICTORY-POINTS | Temporary and Permanent Victory Points | Victory Condition | Distinguish points that can still be lost from points secured permanently. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-VICTORY-POINTS-AS-A-RESOURCE | Victory Points as a Resource | Victory Condition | Let players spend, exchange, or otherwise use victory points during play. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-HIDDEN-AND-EXPOSED-VICTORY-POINT | Hidden and Exposed Victory Point | Victory Condition | Mix concealed victory-point information with scores that remain visible to everyone. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-ENDGAME-BONUSES | Endgame Bonuses | Victory Condition | Award additional victory points when final conditions are evaluated at the end of play. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-RACE | Race | Victory Condition | The first player or team to reach a defined destination or objective wins. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-PLAYER-ELIMINATION | Player Elimination | Victory Condition | Players leave contention as elimination conditions are met until a winner remains. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-FIXED-NUMBER-OF-ROUNDS | Fixed Number of Rounds | Victory Condition | End the game after a predetermined number of rounds and evaluate the winner. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-EXHAUSTING-RESOURCES | Exhausting Resources | Victory Condition | End or resolve the game when a defined supply, deck, or other resource is depleted. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-COMPLETING-TARGETS | Completing Targets | Victory Condition | Win by completing a required set or number of objectives. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-FIXED-NUMBER-OF-EVENTS | Fixed Number of Events | Victory Condition | End the game after a predetermined number of events have occurred. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-ELAPSED-REAL-TIME | Elapsed Real Time | Victory Condition | Use a real-world time limit to determine when play ends or victory is checked. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-CONNECTIONS | Connections | Victory Condition | Win by creating a required network, route, chain, or connection between objectives. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-CIRCUIT-BREAKER-SUDDEN-DEATH | Circuit Breaker, Sudden Death | Victory Condition | Trigger an immediate ending when a decisive condition or threshold is reached. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-FINALE | Finale | Victory Condition | Resolve victory through a dedicated concluding phase after the main game. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-KING-OF-HILL | King of Hill | Victory Condition | Win by taking and holding control of a key position or objective. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-CATCH-THE-LEADER | Catch the Leader | Victory Condition | Create victory pressure around reaching, stopping, or overtaking the current leader. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-TUG-OF-WAR | Tug of War | Victory Condition | Move a shared advantage back and forth until one side reaches its winning threshold. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-HIGHEST-LOWEST | Highest Lowest | Victory Condition | Determine victory by comparing the highest or lowest qualifying value at the end. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |
| VC-ORDERING | Ordering | Victory Condition | Determine victory by achieving or predicting a required order of players, objects, or events. | {"kind": "victory", "variations": [""], "effects": [""], "custom": false} |


### uncertainty [uncertaintyMechanisms]


| ID | Mechanism | Category | Meaning | Additional parameters |
| --- | --- | --- | --- | --- |
| UNC-BETTING-AND-BLUFFING | Betting and Bluffing | Uncertainty | Let players stake resources while concealing, exaggerating, or misrepresenting the strength of their position. | {"kind": "uncertainty", "variations": [""], "effects": [""], "custom": false} |
| UNC-PUSH-YOUR-LUCK | Push Your Luck | Uncertainty | Let players choose between securing current gains and risking them for a greater reward. | {"kind": "uncertainty", "variations": [""], "effects": [""], "custom": false} |
| UNC-MEMORY | Memory | Uncertainty | Require participants to remember previously revealed information, positions, or sequences. | {"kind": "uncertainty", "variations": [""], "effects": [""], "custom": false} |
| UNC-HIDDEN-ROLES | Hidden Roles | Uncertainty | Assign concealed identities or responsibilities that shape player goals and behavior. | {"kind": "uncertainty", "variations": [""], "effects": [""], "custom": false} |
| UNC-ROLES-WITH-ASYMMETRIC-INFORMATION | Roles with Asymmetric Information | Uncertainty | Give different roles access to different information relevant to shared or competing decisions. | {"kind": "uncertainty", "variations": [""], "effects": [""], "custom": false} |
| UNC-COMMUNICATION-LIMITS | Communication Limits | Uncertainty | Restrict what, when, or how participants may communicate information. | {"kind": "uncertainty", "variations": [""], "effects": [""], "custom": false} |
| UNC-UNKNOWN-INFORMATION | Unknown Information | Uncertainty | Keep information unavailable to every participant until it is discovered or generated. | {"kind": "uncertainty", "variations": [""], "effects": [""], "custom": false} |
| UNC-HIDDEN-INFORMATION | Hidden Information | Uncertainty | Allow some participants to know information that remains concealed from others. | {"kind": "uncertainty", "variations": [""], "effects": [""], "custom": false} |
| UNC-PROBABILITY-MANAGEMENT | Probability Management | Uncertainty | Let players influence, evaluate, or reduce uncertainty in random outcomes. | {"kind": "uncertainty", "variations": [""], "effects": [""], "custom": false} |
| UNC-VARIABLE-SETUP | Variable Setup | Uncertainty | Change starting conditions, resources, positions, or objectives between plays. | {"kind": "uncertainty", "variations": [""], "effects": [""], "custom": false} |
| UNC-HIDDEN-CONTROL | Hidden Control | Uncertainty | Conceal which participant controls an element, area, or decision. | {"kind": "uncertainty", "variations": [""], "effects": [""], "custom": false} |
| UNC-DEDUCTION | Deduction | Uncertainty | Infer a specific hidden answer by combining evidence and eliminating possibilities. | {"kind": "uncertainty", "variations": [""], "effects": [""], "custom": false} |
| UNC-INDUCTION | Induction | Uncertainty | Form a broader rule or pattern from several observed examples or clues. | {"kind": "uncertainty", "variations": [""], "effects": [""], "custom": false} |
| UNC-QUESTIONS-AND-ANSWERS | Questions and Answers | Uncertainty | Reveal or test information through structured questions and responses. | {"kind": "uncertainty", "variations": [""], "effects": [""], "custom": false} |


### economy [economyMechanisms]


| ID | Mechanism | Category | Meaning | Additional parameters |
| --- | --- | --- | --- | --- |
| ECON-EXCHANGING | Exchanging | Economy | Allow players to exchange resources according to a defined rate or rule. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-TRADING | Trading | Economy | Allow players to negotiate and transfer resources directly between participants. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-MARKET | Market | Economy | Use a shared buying and selling space whose supply, demand, or prices can change. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-DELAYED-PURCHASE | Delayed Purchase | Economy | Separate payment from delivery so a purchase becomes available later. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-INCOME | Income | Economy | Provide recurring resources when a defined phase, interval, or condition occurs. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-AUTOMATIC-RESOURCE-GROWTH | Automatic Resource Growth | Economy | Increase an owned resource automatically over time or between rounds. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-LOANS | Loans | Economy | Provide resources now in exchange for repayment, interest, or a future obligation. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-ALWAYS-AVAILABLE-PURCHASES | Always Available Purchases | Economy | Keep selected purchases continuously available instead of limiting them to a changing market. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-I-CUT-YOU-YOU-CHOOSE | I Cut You, You Choose | Economy | One participant divides available value while another chooses which portion to take. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-DISCOUNTS | Discounts | Economy | Reduce a cost when a player meets a particular condition or possesses an advantage. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-UPGRADES | Upgrades | Economy | Spend resources to improve the value, efficiency, or capability of something already owned. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-RANDOM-PRODUCTION | Random Production | Economy | Determine the amount or type of produced resources through a random process. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-INVESTMENT | Investment | Economy | Commit resources now for a possible larger return later. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-OWNERSHIP | Ownership | Economy | Assign control or rights over resources, locations, actions, or other game elements. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-CONTRACT | Contract | Economy | Create an agreement that exchanges commitments, resources, or future actions. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-BRIBERY | Bribery | Economy | Offer resources or favors to influence another participant, role, or decision. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-INCREASE-VALUE-OF-UNCHOSEN-RESOURCES | Increase Value of Unchosen Resources | Economy | Raise the future value of options that players leave unselected. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-NEGOTIATION | Negotiation | Economy | Let participants determine an exchange or agreement through direct discussion. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-ALLIANCES | Alliances | Economy | Allow participants to coordinate resources or goals through temporary or lasting cooperation. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |
| ECON-RESOURCE-QUEUE | Resource Queue | Economy | Place resources or purchases in an ordered queue that controls when they become available. | {"kind": "economy", "variations": [""], "effects": [""], "custom": false} |


### auction [auctionMechanisms]


| ID | Mechanism | Category | Meaning | Additional parameters |
| --- | --- | --- | --- | --- |
| AUC-OPEN-AUCTION | Open Auction | Auctions | Participants openly raise or change their bids while everyone can see the current offer. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-ENGLISH-AUCTION | English Auction | Auctions | Bids increase openly until no participant is willing to exceed the highest bid. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-TURN-ORDER-UNTIL-PASS-AUCTION | Turn Order Until Pass Auction | Auctions | Participants bid in turn and leave the auction when they pass. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-SEALED-BID-AUCTION | Sealed Bid Auction | Auctions | Participants submit hidden bids that are revealed and compared simultaneously. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-SEALED-BID-WITH-CANCELLATION | Sealed Bid with Cancellation | Auctions | Participants submit hidden bids with a rule that can cancel selected bids or the auction. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-CONSTRAINED-BIDDING | Constrained Bidding | Auctions | Bids must follow defined limits, increments, resources, or eligibility requirements. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-ONCE-AROUND-AUCTION | Once Around Auction | Auctions | Each participant receives one opportunity to bid in a single pass around the group. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-DUTCH-AUCTION | Dutch Auction | Auctions | A price descends until a participant accepts the current offer. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-SECOND-BID-AUCTION | Second Bid Auction | Auctions | The highest bidder wins but pays the value of the second-highest qualifying bid. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-SELECTION-ORDER-BID | Selection Order Bid | Auctions | Bids determine the order in which participants choose rewards, actions, or positions. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-MULTIPLE-LOT-AUCTION | Multiple Lot Auction | Auctions | Several items or groups of items are auctioned within the same bidding process. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-CLOSED-ECONOMY-AUCTION | Closed Economy Auction | Auctions | All bids and payments circulate within a limited game economy rather than leaving it. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-REVERSE-AUCTION | Reverse Auction | Auctions | Participants compete by offering progressively lower costs or requirements. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-DEXTERITY-AUCTION | Dexterity Auction | Auctions | Physical accuracy, speed, or coordination forms part of placing or resolving a bid. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-FIXED-PLACEMENT-AUCTION | Fixed Placement Auction | Auctions | Participants place bids into fixed spaces whose positions affect the outcome. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-DUTCH-PRIORITY-AUCTION | Dutch Priority Auction | Auctions | A descending offer determines both who accepts and the priority they receive. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-BID-AS-WAGERS | Bid as Wagers | Auctions | Bids act as stakes that can be won, lost, or resolved according to a later outcome. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |
| AUC-AUCTION-COMPENSATION | Auction Compensation | Auctions | Participants who lose or withdraw receive compensation based on their bids or position. | {"kind": "auction", "variations": [""], "effects": [""], "custom": false} |


### workerPlacement [workerPlacementMechanisms]


| ID | Mechanism | Category | Meaning | Additional parameters |
| --- | --- | --- | --- | --- |
| WP-STANDARD-WORKER-PLACEMENT | Standard Worker Placement | Worker Placement | Place a limited worker on an available action space to perform or reserve that action. | {"kind": "workerPlacement", "variations": [""], "effects": [""], "custom": false} |
| WP-WORKERS-OF-DIFFERING-TYPES | Workers of Differing Types | Worker Placement | Give different worker types distinct placement permissions, strengths, or effects. | {"kind": "workerPlacement", "variations": [""], "effects": [""], "custom": false} |
| WP-ACQUIRING-AND-LOSING-WORKERS | Acquiring and Losing Workers | Worker Placement | Allow the available worker pool to grow or shrink through game actions and consequences. | {"kind": "workerPlacement", "variations": [""], "effects": [""], "custom": false} |
| WP-WORKERS-AS-DICE | Workers as Dice | Worker Placement | Use dice as workers so their rolled values affect where they can be placed or what they accomplish. | {"kind": "workerPlacement", "variations": [""], "effects": [""], "custom": false} |
| WP-ADDING-AND-BLOCKING-BUILDINGS | Adding and Blocking Buildings | Worker Placement | Add action spaces through buildings while allowing placement or ownership to block access. | {"kind": "workerPlacement", "variations": [""], "effects": [""], "custom": false} |
| WP-SINGLE-WORKERS | Single Workers | Worker Placement | Limit an action space, area, or participant to one worker at a time. | {"kind": "workerPlacement", "variations": [""], "effects": [""], "custom": false} |
| WP-BUILDING-ACTIONS-AND-REWARDS | Building Actions and Rewards | Worker Placement | Connect worker placement on buildings to the actions and rewards those buildings provide. | {"kind": "workerPlacement", "variations": [""], "effects": [""], "custom": false} |
| WP-TURN-ORDER-AND-RESOLUTION-ORDER | Turn Order and Resolution Order | Worker Placement | Use worker placement to establish turn priority or the order in which actions resolve. | {"kind": "workerPlacement", "variations": [""], "effects": [""], "custom": false} |


### movement [movementMechanisms]


| ID | Mechanism | Category | Meaning | Additional parameters |
| --- | --- | --- | --- | --- |
| MOV-TESSELLATION | Tessellation | Movement | Arrange repeating shapes so movement and adjacency follow the geometry of the play space. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-ROLL-AND-MOVE | Roll and Move | Movement | Roll a randomizer and move according to the resulting distance or instruction. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-PATTERN-MOVEMENT | Pattern Movement | Movement | Move pieces according to a predefined spatial pattern. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-MOVEMENT-POINTS | Movement Points | Movement | Spend a limited allowance of points to move through spaces or terrain. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-RESOURCE-TO-MOVE | Resource to Move | Movement | Spend a resource in order to move or increase movement. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-MEASUREMENT | Measurement | Movement | Measure physical distance directly to determine legal movement. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-DIFFERENT-DICE | Different Dice | Movement | Choose or assign different dice whose values and probabilities determine movement. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-DRIFT | Drift | Movement | Apply automatic or persistent movement in a particular direction. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-IMPULSE | Impulse | Movement | Resolve movement in short shared steps or impulses rather than one complete move at a time. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-PROGRAMMED-MOVEMENT | Programmed Movement | Movement | Choose movement instructions in advance and reveal or execute them later. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-RELATIVE-POSITION | Relative Position | Movement | Determine movement from the position or orientation of other pieces rather than a fixed map. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-MANACLA | Manacla | Movement | Move groups of pieces by distributing them sequentially across spaces. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-CHAINING | Chaining | Movement | Continue movement by linking one valid movement, space, or piece to the next. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-BIAS | Bias | Movement | Make movement more likely or effective in selected directions or conditions. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-MOVING-MULTIPLE-UNITS | Moving Multiple Units | Movement | Move several units together, sequentially, or through one shared instruction. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-MAP-ADDITION | Map Addition | Movement | Expand the available play space by adding new map areas during play. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-MAP-PRODUCTION | Map reduction | Movement | Over the course of the game, the map shrinks | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-MAP-DEFORMATION | Map Deformation | Movement | Change the shape, connections, or accessibility of the existing map. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-MOVE-THROUGH-DECK | Move Through Deck | Movement | Represent movement by progressing through cards or an ordered deck. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-MOVEMENT-TEMPO | Movement Template | Movement | A defined Movement Template is used to determine where a piece moves to. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-PIECES-AS-MAP | Pieces as Map | Movement | Use placed pieces themselves to define spaces, routes, or terrain. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-MULTIPLE-MAPS | Multiple Maps | Movement | Use more than one connected or parallel play space for movement. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-SHORTCUTS | Shortcuts | Movement | Provide routes that reduce distance or bypass normal movement requirements. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |
| MOV-HIDDEN-MOVEMENT | Hidden Movement | Movement | Keep some or all movement information concealed from other participants. | {"kind": "movement", "variations": [""], "effects": [""], "custom": false} |


### areaControl [areaControlMechanisms]


| ID | Mechanism | Category | Meaning | Additional parameters |
| --- | --- | --- | --- | --- |
| AC-ABSOLUTE-CONTROL | Absolute Control | Area Control | Control an area by meeting an exclusive requirement that prevents competing control. | {"kind": "areaControl", "variations": [""], "effects": [""], "custom": false} |
| AC-AREA-MAJORITY-INFLUENCE | Area Majority Influence | Area Control | Control or score an area by having more influence there than competing participants. | {"kind": "areaControl", "variations": [""], "effects": [""], "custom": false} |
| AC-TROOP-TYPES | Troop Types | Area Control | Use units with different capabilities or values when establishing control over an area. | {"kind": "areaControl", "variations": [""], "effects": [""], "custom": false} |
| AC-TERRITORIES-AND-REGIONS | Territories and Regions | Area Control | Organize the play space into defined areas that can be occupied, contested, or controlled. | {"kind": "areaControl", "variations": [""], "effects": [""], "custom": false} |
| AC-AREA-PERIMETERS | Area Perimeters | Area Control | Determine control through borders, enclosure, or presence around the edge of an area. | {"kind": "areaControl", "variations": [""], "effects": [""], "custom": false} |
| AC-FORCE-PROJECTION | Force Projection | Area Control | Extend influence or control from a unit, base, or nearby controlled area. | {"kind": "areaControl", "variations": [""], "effects": [""], "custom": false} |
| AC-ZONE-OF-CONTROL | Zone of Control | Area Control | Limit or affect movement and actions within the surrounding reach of a unit or position. | {"kind": "areaControl", "variations": [""], "effects": [""], "custom": false} |
| AC-LINE-OF-SIGHT | Line of Sight | Area Control | Require an unobstructed visual or spatial path for influence, targeting, or control. | {"kind": "areaControl", "variations": [""], "effects": [""], "custom": false} |


### setCollection [setCollectionMechanisms]


| ID | Mechanism | Category | Meaning | Additional parameters |
| --- | --- | --- | --- | --- |
| SET-SET-VALUATION | Set Valuation | Set Collection | Assign value according to the size, composition, rarity, or completeness of a collected set. | {"kind": "setCollection", "variations": [""], "effects": [""], "custom": false} |
| SET-TILE-LAYING | Tile Laying | Set Collection | Place tiles to create patterns, spaces, routes, or scoring relationships. | {"kind": "setCollection", "variations": [""], "effects": [""], "custom": false} |
| SET-GRID-COVERAGE | Grid Coverage | Set Collection | Score or progress by covering required cells, shapes, or regions of a grid. | {"kind": "setCollection", "variations": [""], "effects": [""], "custom": false} |
| SET-NETWORK-BUILDING | Network Building | Set Collection | Connect elements into routes or networks that satisfy goals or generate value. | {"kind": "setCollection", "variations": [""], "effects": [""], "custom": false} |
| SET-COMBO-ABILITIES | Combo Abilities | Set Collection | Combine collected elements so their abilities interact or produce a stronger effect. | {"kind": "setCollection", "variations": [""], "effects": [""], "custom": false} |


### cardMechanism [cardMechanisms]


| ID | Mechanism | Category | Meaning | Additional parameters |
| --- | --- | --- | --- | --- |
| CARD-TRICK-TAKING | Trick Taking | Card Mechanisms | Participants play cards into tricks whose rules determine which card wins each exchange. | {"kind": "cardMechanism", "variations": [""], "effects": [""], "custom": false} |
| CARD-LADDER-CLIMBING | Ladder Climbing | Card Mechanisms | Players successively play higher combinations until everyone else passes or cannot continue. | {"kind": "cardMechanism", "variations": [""], "effects": [""], "custom": false} |
| CARD-MELDING | Melding | Card Mechanisms | Combine cards into recognized sets or sequences to score, progress, or activate effects. | {"kind": "cardMechanism", "variations": [""], "effects": [""], "custom": false} |
| CARD-CARD-DRAW-LIMITS-AND-DECK-EXHAUSTION | Card Draw Limits and Deck Exhaustion | Card Mechanisms | Use limits on drawing and the depletion of a deck to control tempo, scarcity, or ending conditions. | {"kind": "cardMechanism", "variations": [""], "effects": [""], "custom": false} |
| CARD-DECK-BUILDING | Deck Building | Card Mechanisms | Acquire cards during play to improve and specialize a personal deck. | {"kind": "cardMechanism", "variations": [""], "effects": [""], "custom": false} |
| CARD-DRAFTING | Drafting | Card Mechanisms | Choose cards from a shared or passing selection while leaving other choices for later participants. | {"kind": "cardMechanism", "variations": [""], "effects": [""], "custom": false} |
| CARD-DECK-CONSTRUCTION | Deck Construction | Card Mechanisms | Build a deck before play according to defined composition and eligibility rules. | {"kind": "cardMechanism", "variations": [""], "effects": [""], "custom": false} |
| CARD-MULTI-USE-CARDS | Multi-Use Cards | Card Mechanisms | Allow each card to be used in more than one way, requiring a choice between its functions. | {"kind": "cardMechanism", "variations": [""], "effects": [""], "custom": false} |
| CARD-TAGS | Tags | Card Mechanisms | Use labels or traits on cards to create eligibility, combination, and interaction rules. | {"kind": "cardMechanism", "variations": [""], "effects": [""], "custom": false} |


### Saved mechanic trees and action templates


| ID | Name | Template kind | Meaning | Native nodes | Connections | Additional record keys |
| --- | --- | --- | --- | --- | --- | --- |
| LIB-MSTRUCT-ACT-01 | Action Points | action | Players receive a limited action budget and spend it on available actions. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-02 | Action Drafting | action | Players choose limited actions from a shared pool, making those choices unavailable to others. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-03 | Action Retrieval | action | Used actions become unavailable until a player retrieves or refreshes them. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-04 | Action / Event | action | A player chooses between using an action resource and resolving a special event. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-05 | Command Cards | action | Cards determine which units, roles, or participants may act. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-06 | Action Queue | action | Players program actions that resolve later in a defined sequence. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-07 | Shared Action Queue | action | Players contribute to one common queue whose actions affect everyone. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-08 | Follow | action | One participant selects an action and others may perform the same or a modified version. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-09 | Order Counters | action | Players commit hidden or visible orders to locations before resolving them. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-10 | Rondel | action | Available actions follow a circular sequence, with movement determining access or cost. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-11 | Action Selection Restrictions | action | Rules restrict which actions a participant may currently choose. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-12 | Variable Player Powers | action | Different players or teams receive unique actions or modifications to shared actions. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-13 | Once-per-Game Abilities | action | A powerful special action may be used only once during the game. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-14 | Advantage Token | action | A transferable token grants or modifies a special action for its current holder. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-15 | Gating and Unlocking | action | Actions become available only after a condition, threshold, stage, or discovery. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-16 | Tech Trees / Tracks | action | Progress unlocks new actions or improves actions already available. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-17 | Events | action | An external event immediately changes the game state or later actions. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-18 | Narrative Choice | action | Players choose between actions presented through a narrative situation. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-19 | Bingo | action | Randomly presented elements determine which actions or patterns players pursue. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-20 | Layering | action | Overlapping physical components determine which visible areas or actions are active. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-21 | Slide / Push | action | Moving one object pushes or repositions other objects in its path. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-22 | Matching | action | A new action or component must match a visible feature of an earlier one. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-ACT-23 | Drawing | action | A participant represents something visually for others to interpret or guess. | 3 | 2 | ["templateKind", "actionCode", "actionFamily", "estMinutes", "tags", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-TURTLE-SHELL-REACTION | NinjaTurtleShellReaction | saved | Mechanics-only reusable structure for one team shell: GPS zone dwell trigger, frequency control, MacroDroid phone bridge, and MP3 speaker output. Story tone and character meaning belong in Story Structures. | 1 | 0 | ["estMinutes"] |
| LIB-MSTRUCT-N003 | New mechanic structure | saved |  | 1 | 0 | ["estMinutes", "numberMarkers", "titleMarkers"] |
| LIB-MSTRUCT-DOOR | Cooperative Door Challenge | saved | A current-system example: challenge core, prop interaction, sensor input, and actuator output. | 4 | 3 | ["estMinutes"] |

A saved tree is copied as editable graph data. Its schema includes nodes, edges, frames, number/title markers, description, tags, estimated minutes, and optional source/category metadata. It is not a shared live activity instance.


### Library mechanic references


| ID | Definition |
| --- | --- |
| LIB-MECH-LOCK | {"id": "LIB-MECH-LOCK", "name": "Lockpicking minigame", "summary": "Physical pick set on a practice lock; fails raise the alarm.", "params": [{"key": "fails", "label": "Fail limit", "value": "3"}, {"key": "locks", "label": "Locks to pick", "value": "1"}]} |
| LIB-MECH-DECRYPT | {"id": "LIB-MECH-DECRYPT", "name": "Decryption puzzle", "summary": "Button-box cipher wheel; hint unlocks after failed tries.", "params": [{"key": "hintAfter", "label": "Hint after tries", "value": "3"}, {"key": "digits", "label": "Cipher digits", "value": "4"}]} |
| LIB-MECH-COMMS | {"id": "LIB-MECH-COMMS", "name": "Comms link", "summary": "Radio protocol between team units and GM console.", "params": [{"key": "channels", "label": "Channels", "value": "1"}]} |
| LIB-MECH-ACCESS | {"id": "LIB-MECH-ACCESS", "name": "Access control", "summary": "One switch equals one action; all switches open the gate.", "params": [{"key": "switches", "label": "Switches required", "value": "1"}]} |
| LIB-MECH-REVIVE | {"id": "LIB-MECH-REVIVE", "name": "Downed-player revive", "summary": "Medkit card ritual at a safe zone.", "params": [{"key": "seconds", "label": "Revive seconds", "value": "90"}]} |
| LIB-MECH-UV | {"id": "LIB-MECH-UV", "name": "Hidden-ink clues", "summary": "UV-reactive markings on props and walls.", "params": [{"key": "clues", "label": "Clue count", "value": "3"}]} |


## G Inspector and editor control index


This static index records the source-declared labelled controls and input bindings throughout components and views. It is intentionally deeper than the main user guide. A conditional control can appear only for a selected kind, purpose, expansion, or mode. Rows marked hidden are inside an explicit false branch. A label expression such as field.label is resolved by a definition table elsewhere in this document. Temporary picker state is not necessarily a stored entity field.

Source locations use repository-relative paths and line numbers from this audit. They are navigational references, not externally accessible URLs. This is not a screen-by-screen interactive browser verification.


### src/components/AnnotationTools.jsx — AnnotationTools


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 33 | Annotation tools | div |  | conditional or visible |


### src/components/bits.jsx — Chip


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 38 | Remove | button |  | conditional or visible |


### src/components/BoundWizardFields.jsx — BoundWizardFields


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 8 | field.prompt | Field | field.answer \|\| '' | conditional or visible |


### src/components/CharacterFacts.jsx — ShortField


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 10 |  | input | draft | conditional or visible |


### src/components/CharacterFacts.jsx — CharacterImage


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 32 | `${kind} image` | div |  | conditional or visible |
| 37 | `Choose ${kind.toLowerCase()} image` | input |  | explicitly hidden |


### src/components/CharacterFacts.jsx — CharacterFacts


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 56 | Character facts | section |  | conditional or visible |
| 58 | Name / title | ShortField | node.title \|\| node.name \|\| '' | conditional or visible |
| 59 | Story role | ShortField | facts.role | conditional or visible |
| 61 | label | ShortField | facts[key] | conditional or visible |
| 62 | Goal / motivation | ShortField | facts.goal | conditional or visible |
| 64 | `Remove ${category}: ${row.name}` | button |  | conditional or visible |
| 66 | Relationship | select | type | conditional or visible |
| 67 | Character or group | select | targetKey | conditional or visible |
| 68 | Name or short label | input | name | conditional or visible |


### src/components/CharacterInputNode.jsx — CharacterCanvasWizard


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 30 | owner ? 'Add a framework or concept' : 'Story wizard' | NarrativeWizardButton |  | conditional or visible |


### src/components/CharacterInputNode.jsx — CharacterInputNode


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 52 | Include in description | input | row.enabled | conditional or visible |
| 58 | records.length > 1 ? `Edit ${record.sourceLabel \|\| record.sourceId}` : framework ? 'Edit this framework' : 'Edit this concept' | NarrativeWizardButton |  | conditional or visible |


### src/components/CharacterNode.jsx — CharacterDescriptionInputs


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 62 | `${kind} frameworks and concepts` | section |  | conditional or visible |


### src/components/CharacterNode.jsx — CharacterNode


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 75 | `Description of ${node.title \|\| node.name \|\| 'character'}` | button |  | conditional or visible |
| 77 | label | span |  | conditional or visible |


### src/components/CharacterNode.jsx — CharacterDescription


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 100 | kind === 'Group' ? 'Group image' : 'Character portrait' | section |  | conditional or visible |
| 104 | `${kind} details` | section |  | conditional or visible |
| 107 | Full description | section |  | conditional or visible |


### src/components/CharacterProfile.jsx — wizardButton


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 68 | label | NarrativeWizardButton |  | conditional or visible |


### src/components/CharacterProfile.jsx — CharacterProfile


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 74 | `${kind} development` | section |  | conditional or visible |
| 78 | Add a framework or concept | NarrativeWizardButton |  | conditional or visible |
| 79 | Use a canvas input | select |  | conditional or visible |
| 81 |  | input | row.enabled | conditional or visible |
| 85 | Develop | NarrativeWizardButton |  | conditional or visible |
| 87 | `Delete ${row.sourceLabel \|\| row.label} input: ${row.label}` | button |  | conditional or visible |


### src/components/CharacterQuestions.jsx — CharacterQuestions


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 25 | Question sources | nav |  | conditional or visible |


### src/components/CharacterQuestions.jsx — CharacterQuestionPanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 34 | `${group.label} questions` | section |  | conditional or visible |
| 38 | Question | CharacterText | row.prompt \|\| '' | conditional or visible |
| 39 | Answer | CharacterText | row.answer \|\| '' | conditional or visible |


### src/components/CharacterText.jsx — CharacterText


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 6 |  | textarea | draft | conditional or visible |


### src/components/CharacterWorkspace.jsx — CharacterWorkspaceContents


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 35 | `${kind} writing views` | nav |  | conditional or visible |
| 41 | `Combined ${kind.toLowerCase()} description` | CharacterText | node.description ?? node.body ?? '' | conditional or visible |
| 42 | Description updates to review | section |  | conditional or visible |
| 43 | `${kind} output` | textarea | exportText | conditional or visible |
| 44 | Profile format and sharing | section |  | conditional or visible |
| 45 | Output format | select | format | conditional or visible |
| 45 | Include original wizard questions and answers | input | includeQuestions | conditional or visible |
| 46 | · | input | conversationIds.includes(conversation.id) | conditional or visible |
| 54 | `${kind} passage` | CharacterText | block?.text ?? source.text | conditional or visible |
| 59 | Voice notes and performance | CharacterText | profile.performanceText ?? profile.details?.voice ?? '' | conditional or visible |
| 71 | `Earlier note: ${label}` | CharacterText | profile.details[key] | conditional or visible |
| 72 | Earlier authored description | CharacterText | profile.baseline | conditional or visible |
| 74 | Protected earlier passage | CharacterText | block.text | conditional or visible |


### src/components/Conversations.jsx — ConversationBrowser


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 49 | libraryMode ? 'Conversation library' : characterRef ? 'Character conversations' : 'Conversations' | section |  | conditional or visible |
| 51 | Search conversations | input | query | conditional or visible |
| 51 | Story status | select | status | conditional or visible |


### src/components/Conversations.jsx — ConversationBrowserDialog


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 69 | mode === 'library' ? 'Saved conversations' : 'Narrative conversations' | dialog |  | conditional or visible |


### src/components/Conversations.jsx — ConversationEditorContents


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 89 | Conversation title | CharacterText | conversation.title | conditional or visible |
| 90 | Story status | select | conversation.status \|\| 'planned' | conditional or visible |
| 92 | Scene / story context | CharacterText | conversation.context | conditional or visible |
| 98 | `Link ${participant.name} to a character` | select | participant.missing ? '' : characterReferenceKey(row.characterRef) | conditional or visible |
| 101 | Speaker name | CharacterText | row.name | conditional or visible |
| 105 | Add an existing character | select |  | conditional or visible |
| 106 | Name-only speaker | input | name | conditional or visible |
| 111 | Speaker | select | passage.speakerId | conditional or visible |
| 111 | `Move passage ${index + 1} up` | button |  | conditional or visible |
| 111 | `Move passage ${index + 1} down` | button |  | conditional or visible |
| 112 | `Passage ${index + 1}` | CharacterText | passage.text | conditional or visible |


### src/components/DescriptionParagraphReview.jsx — DescriptionParagraphReview


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 6 | `Review description paragraph: ${sourceLabel}` | section |  | conditional or visible |
| 11 | Your revised paragraph | textarea | draft | conditional or visible |


### src/components/DragonWorkshop.jsx — DragonAnswerField


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 32 | Your answer · optional | textarea | value \|\| '' | conditional or visible |


### src/components/DragonWorkshop.jsx — DragonLiveDescription


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 39 | Live concept description | aside |  | conditional or visible |


### src/components/DragonWorkshop.jsx — DragonWorkshop


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 98 | Name this version | input | title | conditional or visible |
| 99 | Dragon concept sections | nav |  | conditional or visible |
| 105 | Possible responses | div |  | conditional or visible |
| 110 | Template nodes | div |  | conditional or visible |
| 112 | Use this for | select | focus | conditional or visible |
| 112 | Save into | select | targetId | conditional or visible |


### src/components/FateCharacter.jsx — text


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 9 |  | textarea | value \|\| '' | conditional or visible |


### src/components/FateCharacter.jsx — FateCharacterNavigation


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 12 | Character FATE steps | nav |  | conditional or visible |


### src/components/FateCharacter.jsx — FateCharacterPreview


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 26 | Live character description | section |  | conditional or visible |


### src/components/FateCharacter.jsx — Strength


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 36 | label | input | chosen ? value : 0 | conditional or visible |


### src/components/FateCharacter.jsx — FateSignalEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 45 | Signal response | div |  | conditional or visible |
| 47 | Custom signal | input | custom | conditional or visible |
| 48 | `Remove signal ${signal.label}` | button |  | conditional or visible |
| 48 | `Attention to ${signal.label}` | Strength | signal.strength | conditional or visible |


### src/components/FateCharacter.jsx — FatePeopleEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 62 | `Choose ${section} person or group` | select | entityKey | conditional or visible |
| 62 | Person or group | select | type | conditional or visible |
| 62 | Name | input | name | conditional or visible |
| 67 | Link to a profile | select | live ? row.entityKey : '' | conditional or visible |
| 69 | Name | input | row.name | conditional or visible |
| 70 | Relationship · optional | input | row.relationship \|\| '' | conditional or visible |
| 72 | Add a character to this group board | select |  | conditional or visible |
| 77 |  | select | row.board?.[person.id] \|\| '' | conditional or visible |


### src/components/FateCharacter.jsx — FateCharacterPatterns


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 89 | `Feeling strength in pattern ${index + 1}` | Strength | pattern.intensity | conditional or visible |


### src/components/FateCharacter.jsx — FateCharacter


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 105 | Character name | input | draft.title | conditional or visible |
| 113 | Character name | input | draft.title | conditional or visible |


### src/components/FatePurposeControls.jsx — FateTypePicker


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 7 | type.label | input | purpose === key | conditional or visible |


### src/components/FatePurposeControls.jsx — FateSelectionDetails


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 12 |  | textarea | getFate(draft, path) \|\| '' | conditional or visible |


### src/components/FatePurposeControls.jsx — FateEmotionPatterns


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 15 |  | textarea | pattern.situation | conditional or visible |
| 15 |  | textarea | pattern[part] | conditional or visible |


### src/components/FatePurposeControls.jsx — FateSelectedIdeas


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 25 | P.selected | Container |  | conditional or visible |


### src/components/FateWizard.jsx — textEntry


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 24 |  | textarea | value \|\| '' | conditional or visible |


### src/components/FateWizard.jsx — selectEntry


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 25 | label | select | value \|\| '' | conditional or visible |


### src/components/FateWizard.jsx — entityPicker


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 125 | label | select | multiple ? '' : getFate(draft, path) \|\| '' | conditional or visible |


### src/components/FateWizard.jsx — calibration


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 175 |  | input | draft.safety.optIn | conditional or visible |
| 175 |  | input | draft.safety.debrief | conditional or visible |


### src/components/FateWizard.jsx — FateEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 182 |  | input | draft.meta.depth === depth | conditional or visible |
| 182 | C.undo | button |  | conditional or visible |
| 182 | C.redo | button |  | conditional or visible |
| 183 | Drafts and saved FATE work | section |  | conditional or visible |
| 183 | Unfinished draft | select | selectedDraft | conditional or visible |
| 183 | Saved profile or conversation | select | selectedModel | conditional or visible |
| 184 | FATE steps | nav |  | conditional or visible |
| 184 | `${item.name}: ${C.completed}` | meter | progress.ratio | conditional or visible |
| 193 |  | input | draft.title | conditional or visible |
| 194 | C.purpose | select | draft.meta.purpose | conditional or visible |
| 202 | label | select | draft.communication[`${role}Ref`] | conditional or visible |
| 203 | P.profilePick | select | selectedProfile | conditional or visible |
| 205 | P.destination | select | target ? JSON.stringify([scope.coll \|\| 'nodes', ...(scope.parentPath \|\| (scope.parentId ? [scope.parentId] : [])), target.id]) : '' | conditional or visible |
| 217 | `${delta < 0 ? C.up : C.down}: ${key}` | button |  | conditional or visible |
| 247 |  | input | draft.title | conditional or visible |


### src/components/FateWizardControls.jsx — FateChoices


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 19 | option | input | selected.includes(option) | conditional or visible |
| 22 |  | input | custom | conditional or visible |


### src/components/FateWizardControls.jsx — FateCurve


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 35 | field.label | svg |  | conditional or visible |
| 40 | `${field.label}: ${C.point} ${i + 1}` | input | point.v | conditional or visible |


### src/components/FateWizardControls.jsx — FateBoard


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 50 | C.addPerson | select | choice | conditional or visible |
| 52 | `${C.move} ${entities.find(entity => entity.key === key)?.name \|\| C.missingEntity}` | select | column | conditional or visible |


### src/components/FateWizardControls.jsx — FateField


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 64 |  | input | value === true | conditional or visible |
| 65 |  | textarea | value \|\| '' | conditional or visible |
| 66 |  | input | value ?? '' | conditional or visible |
| 69 | `${field.label}: ${C[key]}` | input | Math.min(current[i], draft.safety.cap) | conditional or visible |
| 73 | field.label | input | Math.min(shown, max) | conditional or visible |


### src/components/FateWizardControls.jsx — FateCompletionChart


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 80 | C.completeness | svg |  | conditional or visible |


### src/components/FlowCanvas.jsx — FlowCanvas


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1512 | `Combination ${index + 1} base archetype` | input | row.base | conditional or visible |
| 1514 | `Combination ${index + 1} second archetype` | input | row.plus | conditional or visible |
| 1516 | `Combination ${index + 1} result archetype` | input | row.result | conditional or visible |
| 1549 |  | input | color | conditional or visible |


### src/components/FrameworkDetail.jsx — FrameworkDetail


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 17 | fw.label | dialog |  | conditional or visible |
| 18 | Use this framework | NarrativeWizardButton |  | conditional or visible |
| 20 | Framework explanations | section |  | conditional or visible |


### src/components/FrameworkPreview.jsx — FrameworkDesign


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 45 | `${fw.label} framework` | div |  | conditional or visible |
| 50 | versus | span |  | conditional or visible |


### src/components/GameType.jsx — note


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 16 | placeholder | textarea | settings[key] \|\| '' | conditional or visible |


### src/components/GameType.jsx — GameTypeFields


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 18 |  | select | settings.scope \|\| 'activity' | conditional or visible |
| 21 |  | select | settings[question.key] \|\| '' | conditional or visible |
| 28 | Hidden roles | input | !!settings.hiddenRoles | conditional or visible |
| 29 | Hidden traitor | input | !!settings.traitor | conditional or visible |


### src/components/GraphEditor.jsx — renderProgressPreview


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 83 | `${value} out of 10 completed` | div |  | conditional or visible |


### src/components/GroupMembers.jsx — GroupMembers


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 21 | Members and group relationships | section |  | conditional or visible |
| 29 | Name | input | row.name | conditional or visible |
| 30 | Role in this group | input | row.role \|\| '' | conditional or visible |
| 30 | Loyalty or allegiance · optional | input | row.loyalty \|\| '' | conditional or visible |
| 31 | Relationship | input | row.type \|\| '' | conditional or visible |
| 38 | Choose an existing profile | select | chosen | conditional or visible |
| 39 | Name without a profile | input | name | conditional or visible |
| 40 | Role · optional | input | role | conditional or visible |
| 40 | Relationship | input | relation | conditional or visible |


### src/components/GroupPanel.jsx — CompactField


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 14 |  | input | draft | conditional or visible |


### src/components/GroupPanel.jsx — GroupPanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 26 | Group profile | section |  | conditional or visible |
| 28 | Group name | CompactField | node.title \|\| '' | conditional or visible |
| 29 | Kind of group | CompactField | facts.kind | conditional or visible |
| 31 | Approximate size | CompactField | facts.size | conditional or visible |
| 32 | Brief shared purpose | CompactField | facts.purpose | conditional or visible |
| 33 | Group Foundations | GroupWizardButton |  | conditional or visible |
| 33 | `Members & relationships (${facts.members.length})` | GroupWizardButton |  | conditional or visible |


### src/components/GroupRoster.jsx — GroupRoster


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 20 | Edit members & relationships | GroupWizardButton |  | conditional or visible |


### src/components/GroupWizard.jsx — GroupWizard


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 64 | Group Foundations steps | nav |  | conditional or visible |
| 72 |  | textarea | draft.answers[q.key] \|\| '' | conditional or visible |
| 76 | Live group description | aside |  | conditional or visible |


### src/components/GroupWizard.jsx — GroupBasicFields


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 85 | Group details | section |  | conditional or visible |
| 85 | Group name | input | title | conditional or visible |
| 86 | Kind of group | input | facts.kind | conditional or visible |
| 87 | Approximate size | input | facts.size | conditional or visible |
| 88 | Brief shared purpose | input | facts.purpose | conditional or visible |
| 89 | Include optional institution details | input | facts.institution | conditional or visible |


### src/components/HumanValuesControls.jsx — ValuesText


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 7 |  | textarea | value \|\| '' | conditional or visible |


### src/components/HumanValuesControls.jsx — ValuesSelect


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 11 |  | select | value ?? '' | conditional or visible |


### src/components/HumanValuesControls.jsx — ValuesToggle


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 14 |  | input | !!checked | conditional or visible |


### src/components/HumanValuesControls.jsx — ValueStateTrack


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 19 |  | input | value[part] === state | conditional or visible |


### src/components/HumanValuesControls.jsx — ValuesCustomEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 23 | C.customName | ValuesText | name | conditional or visible |
| 23 | C.customStates | ValuesText | states | conditional or visible |
| 23 | C.customDescription | ValuesText | description | conditional or visible |


### src/components/HumanValuesControls.jsx — ValuesStateEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 27 | C.customStates | ValuesText | states | conditional or visible |


### src/components/HumanValuesControls.jsx — ValuesRatings


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 30 | C[part] | input | value[part] ?? 2 | conditional or visible |


### src/components/HumanValuesWizard.jsx — text


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 65 | label | ValuesText | getPath(draft, path) | conditional or visible |


### src/components/HumanValuesWizard.jsx — select


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 66 | label | ValuesSelect | getPath(draft, path) | conditional or visible |


### src/components/HumanValuesWizard.jsx — toggle


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 67 | label | ValuesToggle | getPath(draft, path) | conditional or visible |


### src/components/HumanValuesWizard.jsx — ValuesEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 89 |  | input | draft.meta.depth === depth | conditional or visible |
| 89 | C.undo | button |  | conditional or visible |
| 89 | C.redo | button |  | conditional or visible |
| 90 | Human Values steps | nav |  | conditional or visible |
| 98 | C.savedWizard | ValuesSelect | sessions.findIndex(item => item.record.sourceId === session?.record.sourceId && (item.record.sessionId ? item.record.sessionId === session?.record.sessionId : item.record.title === session?.record.title)) | conditional or visible |
| 100 | C.destination | ValuesSelect | target ? JSON.stringify([scope.coll \|\| 'nodes', ...(scope.parentPath \|\| (scope.parentId ? [scope.parentId] : [])), target.id]) : '' | conditional or visible |
| 101 | C.drafts | ValuesSelect | draftKey | conditional or visible |
| 102 | C.copy | ValuesSelect | modelKey | conditional or visible |
| 104 | C.mode | ValuesSelect | draft.meta.mode | conditional or visible |
| 106 | C.stakeholders | ValuesSelect |  | conditional or visible |
| 107 | C.importPick | ValuesSelect | importKey | conditional or visible |
| 112 | `${value.label}: ${C.category}` | ValuesSelect | value.column | conditional or visible |
| 118 | who | ValuesToggle | row.knownBy.includes(who) | conditional or visible |
| 121 | draft.meta.mode === 'diagnose' ? C.gapReport : draft.meta.purpose === 'character' ? C.characterOutput : C.output | ValuesText | output | conditional or visible |


### src/components/ImageCropDialog.jsx — ImageCropDialog


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 77 | Crop action image | div |  | conditional or visible |
| 106 |  | input | zoom | conditional or visible |


### src/components/Inspector.jsx — ItemPanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 321 | Item name | TextField | item.name | conditional or visible |
| 324 |  | select | item.type | conditional or visible |
| 333 | Description · shown to players | TextField | item.description | conditional or visible |
| 334 | Real-world prop · crew only | TextField | item.propNotes | conditional or visible |
| 335 | Origin | TextField | item.origin | conditional or visible |
| 339 |  | select | item.locationId ?? '' | conditional or visible |
| 389 | Remove requirement | button |  | conditional or visible |
| 400 | Lore notes | TextField | item.loreNotes | conditional or visible |
| 403 |  | input | !!item.persistsAcrossTasks | conditional or visible |


### src/components/Inspector.jsx — LocationPanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 426 | Cover image | ImageUploader |  | conditional or visible |
| 432 | Room schematic | ImageUploader |  | conditional or visible |
| 434 | Location name | TextField | location.name | conditional or visible |
| 435 | Zone / act | TextField | location.zone | conditional or visible |
| 436 | Notes | TextField | location.notes | conditional or visible |
| 437 | Safety · crew only | TextField | location.safety | conditional or visible |


### src/components/Inspector.jsx — PlayerPanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 472 | Player name | TextField | player.name | conditional or visible |
| 476 | Nickname | TextField | player.nickname \|\| '' | conditional or visible |
| 477 | Role | TextField | player.role | conditional or visible |
| 480 | Player photo | ImageUploader |  | conditional or visible |


### src/components/Inspector.jsx — TeamPanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 505 | Team name | TextField | team.name | conditional or visible |
| 506 | Focus | TextField | team.focus \|\| '' | conditional or visible |


### src/components/Inspector.jsx — LinkingNodeInspector


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 543 | Link Target | ISection |  | conditional or visible |
| 545 |  | select | ref.type | conditional or visible |
| 549 |  | select | ref.id \|\| '' | conditional or visible |
| 561 | Link Actions | ISection |  | conditional or visible |


### src/components/Inspector.jsx — NodePanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 609 |  | select | node.kind | conditional or visible |
| 616 | Node title | TextField | node.title | conditional or visible |
| 617 | node.kind === 'reveal' ? 'What players learn · shown / read aloud' : 'Description' | TextField | node.body | conditional or visible |
| 621 |  | select | node.teamId ?? '' | conditional or visible |
| 630 |  | input | minToTime(node.startMin ?? 540) | conditional or visible |
| 652 | Remove | button |  | conditional or visible |
| 677 | Condition, e.g. "IF key retrieved" | input | e.label \|\| '' | conditional or visible |
| 680 |  | select | e.factId \|\| '' | conditional or visible |
| 685 |  | select | e.expect \|\| 'set' | conditional or visible |
| 709 | Node image | ImageUploader |  | conditional or visible |
| 728 | Items | optgroup |  | conditional or visible |
| 731 | Locations | optgroup |  | conditional or visible |


### src/components/Inspector.jsx — FactPanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 757 | Fact name | TextField | fact.name | conditional or visible |
| 760 |  | select | fact.kind | conditional or visible |
| 765 | What it means · how a GM checks it | TextField | fact.detail | conditional or visible |
| 769 |  | select | fact.sensorId \|\| '' | conditional or visible |


### src/components/Inspector.jsx — HistorySection


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 824 | Change History | ISection |  | conditional or visible |


### src/components/Inspector.jsx — BoxDimensionInput


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 844 |  | input | draft | conditional or visible |


### src/components/Inspector.jsx — NodeBoxSizeFields


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 874 | Box Size | ISection |  | conditional or visible |
| 876 | Width · px | BoxDimensionInput | size.width | conditional or visible |
| 877 | Height · px | BoxDimensionInput | size.height | conditional or visible |


### src/components/Inspector.jsx — CharacterQuestionsEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 913 | Question prompt | input | row.prompt ?? '' | conditional or visible |
| 920 | Answer | textarea | row.answer ?? '' | conditional or visible |


### src/components/Inspector.jsx — CharacterTypeGroupsEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 954 | Group label | input | group.label ?? '' | conditional or visible |
| 966 | Option | input | option.label ?? '' | conditional or visible |
| 967 | Remove option | button |  | conditional or visible |


### src/components/Inspector.jsx — CharacterTemplateEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 986 | Edit character card template | ISection |  | conditional or visible |


### src/components/Inspector.jsx — CharacterArchetypeFields


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1003 | Archetype & Dark Sides | ISection |  | conditional or visible |
| 1005 |  | input | enabled | conditional or visible |
| 1006 | Archetype help | span |  | conditional or visible |
| 1011 | `${side.symbol} Dark side` | TextField | node[side.field] \|\| '' | conditional or visible |


### src/components/Inspector.jsx — CharacterArchetypeFacetInspector


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1033 | Title | ISection |  | conditional or visible |
| 1034 | Title | TextField | node.title | conditional or visible |
| 1036 | Description | ISection |  | conditional or visible |
| 1037 | Description | TextField | node.body \|\| '' | conditional or visible |


### src/components/Inspector.jsx — CharacterArchetypeCombinationsInspector


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1058 | Title | ISection |  | conditional or visible |
| 1059 | Title | TextField | node.title | conditional or visible |
| 1061 | Combinations | ISection |  | conditional or visible |
| 1065 | `Combination ${index + 1} base archetype` | input | row.base | conditional or visible |
| 1067 | `Combination ${index + 1} second archetype` | input | row.plus | conditional or visible |
| 1069 | `Combination ${index + 1} result archetype` | input | row.result | conditional or visible |


### src/components/Inspector.jsx — CharacterCardInspector


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1083 | Title | ISection |  | conditional or visible |
| 1084 | Title | TextField | card.title | conditional or visible |
| 1086 | Description | ISection |  | conditional or visible |
| 1087 | Description | TextField | card.description | conditional or visible |
| 1089 | Base Questions | ISection |  | conditional or visible |
| 1092 | Types & Options | ISection |  | conditional or visible |


### src/components/Inspector.jsx — ConceptSelect


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1130 |  | select | value ?? '' | conditional or visible |


### src/components/Inspector.jsx — ConceptTags


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1185 | label | TextField | (Array.isArray(value) ? value : []).join(', ') | conditional or visible |


### src/components/Inspector.jsx — ConceptModuleField


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1203 | field.label | ConceptSelect | value | conditional or visible |
| 1204 | field.label | ConceptMultiSelect | value | conditional or visible |
| 1205 | field.label | ConceptNodeRefs | value | conditional or visible |
| 1206 | field.label | ConceptNodeRefs | value | conditional or visible |
| 1207 | field.label | ConceptTags | value | conditional or visible |
| 1212 |  | input | Number.isFinite(Number(value)) ? Number(value) : 0 | conditional or visible |
| 1233 |  | input | !!current.enabled | conditional or visible |
| 1237 | Ritual Text | TextField | current.text \|\| '' | conditional or visible |
| 1241 | field.label | TextField | value | conditional or visible |


### src/components/Inspector.jsx — ConceptQuestionChoicesEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1270 | Questions & Choices | ISection |  | conditional or visible |
| 1275 | `Question ${index + 1}` | textarea | row.prompt | conditional or visible |
| 1294 | Choice | input | choice.label | conditional or visible |
| 1295 | Remove choice | button |  | conditional or visible |


### src/components/Inspector.jsx — ConceptReferenceFrameworks


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1326 | Reference Frameworks | ISection |  | conditional or visible |


### src/components/Inspector.jsx — ConceptFieldsEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1383 | Concept Core | ISection |  | conditional or visible |
| 1384 | Name | TextField | entity.name ?? entity.title ?? '' | conditional or visible |
| 1385 | Description | TextField | entity.description ?? entity.body ?? '' | conditional or visible |
| 1388 |  | select | category \|\| 'storyConcept' | conditional or visible |
| 1392 | Status | ConceptSelect | entity.status ?? 'seed' | conditional or visible |
| 1393 | One Promise | TextField | entity.onePromise | conditional or visible |


### src/components/Inspector.jsx — ConceptInternalNodeFields


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1405 | Saved answer | ISection |  | conditional or visible |
| 1408 | Answer | TextField | node.wizardAnswer ?? node.body | conditional or visible |
| 1415 | Section Title | ISection |  | conditional or visible |
| 1416 | Title | TextField | node.title | conditional or visible |
| 1417 | Optional note | TextField | node.body | conditional or visible |
| 1425 | Question | ISection |  | conditional or visible |
| 1426 | Question text | TextField | node.title | conditional or visible |
| 1427 | Context | TextField | node.body | conditional or visible |
| 1436 | Choice | ISection |  | conditional or visible |
| 1437 | Choice text | TextField | node.title | conditional or visible |
| 1438 | Meaning / consequence | TextField | node.body | conditional or visible |


### src/components/Inspector.jsx — StoryItemInspectorFields


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1458 | Story Item | ISection |  | conditional or visible |
| 1459 | Title | TextField | node.title | conditional or visible |
| 1460 | Short Title (canvas) | TextField | node.shortTitle | conditional or visible |
| 1463 | Player Lore | TextField | node.playerLore ?? node.playerDescription ?? node.body | conditional or visible |
| 1470 | Complete Lore | TextField | node.completeLore ?? node.facilitatorDescription ?? '' | conditional or visible |
| 1477 | Base Type | TextField | node.baseType ?? node.itemType ?? '' | conditional or visible |
| 1483 | Origin | TextField | node.origin | conditional or visible |
| 1484 | Gameplay Meaning | TextField | node.gameplayMeaning ?? node.mechanicMeaning | conditional or visible |
| 1492 |  | input | !!node.persistsAcrossTasks | conditional or visible |
| 1508 | Item Identity | ISection |  | conditional or visible |
| 1515 |  | select | node.itemType \|\| 'Key' | conditional or visible |
| 1519 | Name | TextField | node.title | conditional or visible |
| 1520 | Short Title (canvas) | TextField | node.shortTitle | conditional or visible |
| 1521 | Image reference | TextField | node.imageRef | conditional or visible |
| 1524 | Descriptions | ISection |  | conditional or visible |
| 1525 | Player-facing Description | TextField | node.playerDescription ?? node.body | conditional or visible |
| 1532 | Facilitator Description | TextField | node.facilitatorDescription | conditional or visible |
| 1539 | Origin | TextField | node.origin | conditional or visible |
| 1542 | Build Status | ISection |  | conditional or visible |
| 1546 | Connections & Ports | ISection |  | conditional or visible |
| 1595 | Sensor Hooks | TextField | node.sensorHooks | conditional or visible |
| 1598 | Gameplay Meaning | ISection |  | conditional or visible |
| 1601 |  | input | !!node.noSoloSolve | conditional or visible |
| 1605 | Mechanic-encoded Meaning | TextField | node.mechanicMeaning | conditional or visible |
| 1612 | Subnodes / Pip Decks templates | TextField | node.attachedTemplateNotes | conditional or visible |


### src/components/Inspector.jsx — CompositionSection


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1638 | `Composition · ${attached.length} attached subnode${attached.length === 1 ? '' : 's'}` | ISection |  | conditional or visible |


### src/components/Inspector.jsx — RelationshipsSection


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1680 | Relationships / Links | ISection |  | conditional or visible |
| 1689 | Condition, e.g. "IF key retrieved" | input | e.label \|\| '' | conditional or visible |
| 1692 |  | select | e.factId \|\| '' | conditional or visible |
| 1697 |  | select | e.expect \|\| 'set' | conditional or visible |
| 1726 | Remove | button |  | conditional or visible |


### src/components/Inspector.jsx — BaseNodePanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 1812 | Core Identity | ISection |  | conditional or visible |
| 1813 | node.kind === 'item' ? 'Name' : 'Title' | TextField | node.title | conditional or visible |
| 1816 |  | select | node.kind | conditional or visible |
| 1821 |  | select | node.teamId ?? '' | conditional or visible |
| 1827 | Main Content | ISection |  | conditional or visible |
| 1828 | Description | TextField | node.body | conditional or visible |
| 1830 | Node image | ImageUploader |  | conditional or visible |
| 1841 | Saved concept answers | ISection |  | conditional or visible |
| 1843 |  | select | node.conceptId ?? '' | conditional or visible |
| 1848 | q.label | TextField | node.conceptAnswers?.[q.key] ?? '' | conditional or visible |
| 1856 | Type-specific · Story Location | ISection |  | conditional or visible |
| 1862 |  | select | node.locationId ?? '' | conditional or visible |
| 1869 | Type-specific · Item | ISection |  | conditional or visible |
| 1871 |  | select | node.itemType \|\| 'Key' | conditional or visible |
| 1874 | Origin | TextField | node.origin | conditional or visible |
| 1876 |  | select | node.itemId ?? '' | conditional or visible |
| 1884 | Type-specific · Character | ISection |  | conditional or visible |
| 1885 | Casting / actor notes | TextField | node.casting | conditional or visible |
| 1902 | Persistence | ISection |  | conditional or visible |
| 1904 |  | input | !!node.persistsAcrossTasks | conditional or visible |


### src/components/Inspector.jsx — ConceptPanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 2004 | Canvas Display | ISection |  | conditional or visible |
| 2012 | Relationships / Links | ISection |  | conditional or visible |


### src/components/Inspector.jsx — mechSelect


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 2105 |  | select | value ?? '' | conditional or visible |


### src/components/Inspector.jsx — SubnodePanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 2122 | Core Identity | ISection |  | conditional or visible |
| 2123 | Title | TextField | sn.title | conditional or visible |
| 2161 | `Main Content · ${branches.length} branches` | ISection |  | conditional or visible |
| 2164 |  | select | sn.mode | conditional or visible |
| 2170 |  | select | sn.selectionType | conditional or visible |
| 2180 | Branch label | input | b.label | conditional or visible |
| 2184 | Narrative outcome (what this path means) | textarea | b.outcome | conditional or visible |
| 2201 | Main Content | ISection |  | conditional or visible |
| 2202 | Relationship type | TextField | sn.relType | conditional or visible |
| 2203 | Target(s) | TextField | sn.targets | conditional or visible |
| 2205 |  | select | sn.direction | conditional or visible |
| 2208 | Intensity | TextField | sn.intensity | conditional or visible |
| 2209 | Trigger / cause | TextField | sn.trigger | conditional or visible |
| 2210 | Functional effects · what paths this opens or closes | TextField | sn.effects | conditional or visible |
| 2219 | Main Content | ISection |  | conditional or visible |
| 2220 | State type | TextField | sn.stateType | conditional or visible |
| 2221 | Intensity / level | TextField | sn.level | conditional or visible |
| 2222 | Trigger / cause | TextField | sn.trigger | conditional or visible |
| 2223 | Functional effects · what this state changes | TextField | sn.effects | conditional or visible |
| 2232 | Main Content | ISection |  | conditional or visible |
| 2234 |  | select | LOCATION_ARCHETYPES.includes(sn.archetype) ? sn.archetype : '__custom' | conditional or visible |
| 2239 | Custom archetype | TextField | sn.archetype | conditional or visible |
| 2240 | How it flavors events & quests here | TextField | sn.influence | conditional or visible |
| 2245 | Main Content | ISection |  | conditional or visible |
| 2246 | Story consequence · rich text | TextField | sn.text | conditional or visible |
| 2251 | Main Content | ISection |  | conditional or visible |
| 2252 | Tone tags (comma separated) | TextField | (sn.tags \|\| []).join(', ') | conditional or visible |
| 2260 | Main Content | ISection |  | conditional or visible |
| 2261 | Notes | TextField | sn.notes | conditional or visible |
| 2266 | Main Content | ISection |  | conditional or visible |
| 2267 | Emotional State | TextField | sn.emotionalState | conditional or visible |
| 2268 | Behavioral Notes | TextField | sn.behavioralNotes | conditional or visible |
| 2269 | Effects / Dialogue Behavior | TextField | sn.effects | conditional or visible |
| 2274 | Main Content | ISection |  | conditional or visible |
| 2277 | Initial Value | TextField | sn.initialValue | conditional or visible |
| 2278 | Current Value | TextField | sn.currentValue | conditional or visible |
| 2279 | Max Value | TextField | sn.maxValue | conditional or visible |
| 2284 | Main Content | ISection |  | conditional or visible |
| 2288 |  | select | sn.lifespanType \|\| 'Task only' | conditional or visible |
| 2291 | Description | TextField | sn.description | conditional or visible |
| 2296 | Main Content | ISection |  | conditional or visible |
| 2299 | Usage Rules | TextField | sn.usageRules | conditional or visible |
| 2300 | Limitations | TextField | sn.limitations | conditional or visible |
| 2304 | Relationships / Links | ISection |  | conditional or visible |


### src/components/Inspector.jsx — FrameAppearanceFields


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 2326 | Move contents with frame | input | frame.sticky === true | conditional or visible |
| 2356 | Background opacity | input | backgroundOpacity | conditional or visible |


### src/components/Inspector.jsx — FramePanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 2386 | Core Identity | ISection |  | conditional or visible |
| 2387 | Label | TextField | frame.label | conditional or visible |
| 2390 | Convert | ISection |  | conditional or visible |


### src/components/Inspector.jsx — FrameworkPanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 2419 | Reference Only | ISection |  | conditional or visible |
| 2431 | Framework title | TextField | framework.title \|\| type.title | conditional or visible |
| 2432 | isValueFramework ? 'Value Poles' : type.layout === 'archetypes' ? 'Archetypes & Shadows' : type.layout === 'profileDomains' ? 'Profile Domains' : type.layout === 'languageSpectrum' ? 'Language Spectrum' : type.layout === 'preferenceSpectra' ? 'Preference Spectra' : 'Acronym / Phases' | ISection |  | conditional or visible |
| 2446 | Canvas | ISection |  | conditional or visible |


### src/components/Inspector.jsx — GraphFramePanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 2474 | Label | TextField | frame.label \|\| 'Frame' | conditional or visible |


### src/components/Inspector.jsx — NumberMarkerFields


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 2505 |  | select | String(marker.value \|\| 'A').toUpperCase() | conditional or visible |
| 2511 | Number | TextField | String(marker.value ?? 1) | conditional or visible |
| 2521 |  | input | sizeDraft | conditional or visible |
| 2531 | Marker size slider | input | Math.max(VISUAL_MARKER_MIN_SIZE, Math.min(VISUAL_MARKER_MAX_SIZE, size)) | conditional or visible |


### src/components/Inspector.jsx — TitleMarkerFields


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 2593 | Title text | TextField | marker.text \|\| 'Title' | conditional or visible |
| 2594 | Font size | TextField | String(marker.fontSize ?? 28) | conditional or visible |


### src/components/Inspector.jsx — GraphNodePanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 2663 | Linked character answer | ISection |  | conditional or visible |
| 2764 | Framework title | TextField | n.title \|\| type.title | conditional or visible |
| 2811 |  | select | n.kind | conditional or visible |
| 2824 | isTravel ? 'Travel label' : isTask ? 'Site time name' : isMasterAct ? 'Act name' : isTaskTemplate ? 'Title' : 'Title' | TextField | n.title | conditional or visible |
| 2825 | isTravel ? 'Travel notes / route' : isTask ? 'Site time description / notes' : isMasterAct ? 'Story description' : (isTaskTemplate \|\| isMechanicSchemaNode) ? 'Description' : 'Detail' | TextField | n.body | conditional or visible |
| 2831 |  | select | n.itemType \|\| 'Key' | conditional or visible |
| 2834 | Origin | TextField | n.origin | conditional or visible |
| 2839 | Team phase / player dynamics (private) | TextField | n.phaseNotes | conditional or visible |
| 2851 |  | input | minToTime(n.startMin ?? 540) | conditional or visible |
| 2853 |  | input | n.durationMin ?? 45 | conditional or visible |
| 2863 |  | input | isFirstTask ? 0 : (n.marginBeforeMin ?? 15) | conditional or visible |
| 2866 |  | input | isLastTask ? 0 : (n.marginAfterMin ?? 15) | conditional or visible |
| 2877 |  | input | n.marginAfterMin ?? 15 | conditional or visible |
| 2886 | Node image | ImageUploader |  | conditional or visible |
| 2904 |  | input | !!n.persistsAcrossTasks | conditional or visible |


### src/components/Inspector.jsx — LibItemPanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 2927 | Name | TextField | template.name | conditional or visible |
| 2930 |  | select | template.type | conditional or visible |
| 2935 | Default lore / description | TextField | template.description | conditional or visible |
| 2936 | Base construction · crew only | TextField | template.propNotes | conditional or visible |
| 2937 | Origin | TextField | template.origin | conditional or visible |
| 2971 |  | input | !!template.persistsAcrossTasks | conditional or visible |


### src/components/Inspector.jsx — LibLocationPanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 2991 | Name | TextField | template.name | conditional or visible |
| 2992 | Notes | TextField | template.notes | conditional or visible |
| 2993 | Safety checklist | TextField | template.safety | conditional or visible |


### src/components/Inspector.jsx — LibMechanicPanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 3009 | Name | TextField | template.name | conditional or visible |
| 3010 | How it plays | TextField | template.summary | conditional or visible |
| 3016 | Parameter | input | p.label | conditional or visible |
| 3018 |  | input | p.value | conditional or visible |
| 3020 | Remove | button |  | conditional or visible |


### src/components/Inspector.jsx — LibSensorPanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 3041 | Import hardware unit | ImportButton |  | conditional or visible |
| 3042 | Kind | TextField | template.kind | conditional or visible |
| 3043 | Build / model notes | TextField | template.label | conditional or visible |


### src/components/Inspector.jsx — LibStoryPanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 3067 | Import structure into game | ImportButton |  | conditional or visible |
| 3068 | Name | TextField | template.name | conditional or visible |
| 3069 | Description | TextField | template.description | conditional or visible |
| 3070 | Estimated duration (minutes) | TextField | String(template.estMinutes) | conditional or visible |
| 3071 | Base Concept (optional) | ISection |  | conditional or visible |
| 3073 |  | input | usesBaseConcept | conditional or visible |
| 3087 |  | select | template.baseConceptId \|\| '' | conditional or visible |


### src/components/Inspector.jsx — LibMechPrimitivePanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 3184 | Add node to game canvas | ImportButton |  | conditional or visible |
| 3186 | Name | TextField | template.name | conditional or visible |
| 3187 | Default description | TextField | template.defaultBody | conditional or visible |
| 3193 |  | input | template.estMinutes | conditional or visible |
| 3196 |  | input | template.crew | conditional or visible |


### src/components/Inspector.jsx — EntityRefsField


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 3229 |  | select | pending | conditional or visible |


### src/components/Inspector.jsx — MechanicSubnodeField


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 3251 |  | input | !!value | conditional or visible |
| 3260 |  | select | value \|\| field.options?.[0] \|\| '' | conditional or visible |
| 3285 | field.label | EntityRefsField | value | conditional or visible |
| 3288 | field.label | EntityRefsField | value | conditional or visible |
| 3294 |  | input | Number.isFinite(Number(value)) ? value : 0 | conditional or visible |
| 3300 | `${field.label}${field.required ? ' *' : ''}` | TextField | value \|\| '' | conditional or visible |


### src/components/Inspector.jsx — MechanicsNodeField


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 3479 | field.label | EntityRefsField | value | conditional or visible |
| 3482 | field.label | EntityRefsField | value | conditional or visible |
| 3534 | Linked ideas | TextField | ideas.join('\n') | conditional or visible |
| 3567 | field.placeholder | textarea | entry \|\| '' | conditional or visible |
| 3598 |  | select | options.includes(current) ? current : '__custom' | conditional or visible |
| 3622 |  | input | Number.isFinite(Number(node?.[field.minKey])) ? node[field.minKey] : 0 | conditional or visible |
| 3625 |  | input | Number.isFinite(Number(node?.[field.maxKey])) ? node[field.maxKey] : 0 | conditional or visible |
| 3635 |  | input | !!value | conditional or visible |
| 3645 | `${current} out of 10 completed` | div |  | conditional or visible |
| 3663 |  | select | value \|\| field.defaultValue \|\| field.options?.[0] \|\| '' | conditional or visible |
| 3673 |  | input | Number.isFinite(Number(value)) ? value : 0 | conditional or visible |
| 3679 | `${field.label}${field.required ? ' *' : ''}` | TextField | value \|\| '' | conditional or visible |


### src/components/Inspector.jsx — MechanicsNodeFields


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 3714 | Purpose | ISection |  | conditional or visible |
| 3719 | Physical Reference | ISection |  | conditional or visible |
| 3729 | isMechanicSubnode ? 'Focused Fields' : mechKind === 'taskTemplate' ? 'Task Template Details' : 'Node Details' | ISection |  | conditional or visible |


### src/components/Inspector.jsx — ActionSystemsEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 3780 | Mechanism | ISection |  | conditional or visible |
| 3783 | Selected Mechanism Details | ISection |  | conditional or visible |


### src/components/Inspector.jsx — ActionMechanismEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 3867 | Applied Mechanism | ISection |  | conditional or visible |
| 3879 | Mechanism Details | ISection |  | conditional or visible |


### src/components/Inspector.jsx — ActionTypePatternEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 3952 | Action Systems | ISection |  | conditional or visible |
| 3971 | Manage Mechanisms | ISection |  | conditional or visible |


### src/components/Inspector.jsx — ActionProbabilityEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 4047 | Resolution Mechanism | ISection |  | conditional or visible |
| 4057 | Resolution Details | ISection |  | conditional or visible |
| 4064 | Emotional Spike | TextField | emotionalSpike | conditional or visible |
| 4073 | Image Framing | ISection |  | conditional or visible |
| 4075 |  | input | imageScale | conditional or visible |


### src/components/Inspector.jsx — LibMechSubnodePanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 4121 | Template name | TextField | template.name \|\| meta.label | conditional or visible |
| 4128 | Description | TextField | template.description \|\| '' | conditional or visible |
| 4137 | Focused Fields | ISection |  | conditional or visible |
| 4144 | Attach Rules | ISection |  | conditional or visible |


### src/components/Inspector.jsx — LibNarrativePanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 4167 | Add as story node in game | ImportButton |  | conditional or visible |
| 4168 | Name | TextField | template.name | conditional or visible |
| 4171 |  | select | template.category | conditional or visible |
| 4179 | Text · the narrative itself | TextField | template.body | conditional or visible |
| 4180 | Tags (comma separated) | TextField | (template.tags \|\| []).join(', ') | conditional or visible |


### src/components/Inspector.jsx — LibNodeTemplatePanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 4248 | Name | TextField | template.name | conditional or visible |
| 4252 |  | select | template.subKind | conditional or visible |
| 4261 |  | select | template.nodeKind | conditional or visible |
| 4270 | Template note | TextField | template.body | conditional or visible |
| 4276 |  | select | template.itemType \|\| template.template?.itemType \|\| 'Key' | conditional or visible |
| 4280 | Origin | TextField | template.origin ?? template.template?.origin ?? '' | conditional or visible |
| 4283 |  | input | !!(template.persistsAcrossTasks ?? template.template?.persistsAcrossTasks) | conditional or visible |
| 4289 | Tags (comma separated) | TextField | (template.tags \|\| []).join(', ') | conditional or visible |


### src/components/Inspector.jsx — LibBuilderNodePanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 4396 | isFramework ? 'Framework title' : 'Node title' | TextField | n.title | conditional or visible |
| 4397 | Description | TextField | n.body | conditional or visible |
| 4408 |  | select | n.itemType \|\| 'Key' | conditional or visible |
| 4412 | Origin | TextField | n.origin | conditional or visible |
| 4415 |  | input | !!n.persistsAcrossTasks | conditional or visible |


### src/components/Inspector.jsx — LibBuilderFramePanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 4461 | Frame label | TextField | f.label \|\| 'Frame' | conditional or visible |
| 4463 |  | input | f.w | conditional or visible |
| 4464 |  | input | f.h | conditional or visible |


### src/components/Inspector.jsx — LibStructFramePanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 4573 | Frame label | TextField | f.label \|\| 'Frame' | conditional or visible |
| 4575 |  | input | f.w | conditional or visible |
| 4576 |  | input | f.h | conditional or visible |


### src/components/Inspector.jsx — LibStructFrameworkPanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 4612 | Framework title | TextField | fw.title \|\| type.title | conditional or visible |


### src/components/Inspector.jsx — LibStructNodePanel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 4795 | Node title | TextField | n.title | conditional or visible |
| 4796 | Description | TextField | n.body | conditional or visible |
| 4807 |  | select | n.itemType \|\| 'Key' | conditional or visible |
| 4811 | Origin | TextField | n.origin | conditional or visible |
| 4814 |  | input | !!n.persistsAcrossTasks | conditional or visible |
| 4823 | Node image | ImageUploader |  | conditional or visible |


### src/components/Inspector.jsx — Inspector


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 4935 | Resize inspector | div |  | conditional or visible |
| 4954 | Open inspector | button |  | conditional or visible |
| 4957 | Collapse inspector | button |  | conditional or visible |
| 5038 | Continue saved wizard | NarrativeWizardButton |  | conditional or visible |
| 5045 | wizardFramework ? 'Use this framework' : wizardConcept ? 'Adapt with questions' : 'Explore with a framework or concept' | NarrativeWizardButton |  | conditional or visible |


### src/components/Inspector.jsx — MechanicChildren


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 5063 | Build the mechanic | ISection |  | conditional or visible |
| 5064 | Goal | TextField | node.mechanicGoal \|\| '' | conditional or visible |
| 5065 | How it works without electronics | TextField | node.analogRule \|\| '' | conditional or visible |
| 5067 | What do players do? | TextField | node.playerActions \|\| '' | conditional or visible |
| 5068 | What are the rules? | TextField | node.gameRules \|\| '' | conditional or visible |
| 5069 | How do we know they succeeded? | TextField | node.successCondition \|\| '' | conditional or visible |


### src/components/KolbWizard.jsx — textField


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 22 | label | textarea | value \|\| '' | conditional or visible |


### src/components/KolbWizard.jsx — selectField


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 23 | label | select | value ?? '' | conditional or visible |


### src/components/KolbWizard.jsx — calibration


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 112 |  | input | draft.safety.failureFraming | conditional or visible |
| 112 |  | input | draft.safety.debrief | conditional or visible |


### src/components/KolbWizard.jsx — KolbEditor


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 123 |  | input | draft.meta.depth === depth | conditional or visible |
| 123 | C.undo | button |  | conditional or visible |
| 123 | C.redo | button |  | conditional or visible |
| 124 | Kolb steps | nav |  | conditional or visible |
| 124 | `${item.name}: ${C.progress}` | meter | progress.filled | conditional or visible |
| 131 | C.name | input | draft.title | conditional or visible |
| 161 | `${mode.name}: ${C.minutes}` | input | turn.durations[mode.key] ?? '' | conditional or visible |
| 173 | C.name | input | draft.title | conditional or visible |


### src/components/KolbWizardControls.jsx — KolbCycleWheel


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 7 | C.progress | svg |  | conditional or visible |
| 13 | `${C.cycle} ${index + 1}: ${mode.name}` | button |  | conditional or visible |


### src/components/KolbWizardControls.jsx — KolbObservationLinks


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 17 | row.text | input | selected.includes(row.id) | conditional or visible |
| 17 | `${C.missingEvidence} ${id}` | input | True | conditional or visible |


### src/components/KolbWizardControls.jsx — KolbBranchBuilder


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 20 | branch.name | input | value.enabled | conditional or visible |
| 20 | `${branch.name}: ${C.resultText}` | textarea | value.text | conditional or visible |
| 20 | `${branch.name}: ${C.consequence}` | input | value.consequence | conditional or visible |


### src/components/KolbWizardControls.jsx — KolbStyleGrid


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 24 | name | input | value === name | conditional or visible |


### src/components/LibraryBrowser.jsx — LibraryBrowser


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 38 | Close | button |  | conditional or visible |
| 40 | Search templates… | input | q | conditional or visible |


### src/components/LocationStage.jsx — LocationStage


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 186 | Items | optgroup |  | conditional or visible |
| 189 | Sensors | optgroup |  | conditional or visible |
| 192 | Quest nodes | optgroup |  | conditional or visible |


### src/components/MechanicsCollection.jsx — SavedMechanics


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 39 |  | input | !hidden[category.id] | conditional or visible |
| 41 | New mechanic category | input | categoryName | conditional or visible |
| 43 | Search saved mechanics | input | query | conditional or visible |
| 44 | `Inspect ${record.name}` | button |  | conditional or visible |
| 44 | `${record.favorite ? 'Remove' : 'Add'} ${record.name} ${record.favorite ? 'from' : 'to'} favorites` | button |  | conditional or visible |
| 46 | Saved mechanic source | select | source | conditional or visible |
| 46 | Saved mechanic category | select | savedMechanicCategory(focused) | conditional or visible |


### src/components/MechanicsCollection.jsx — MechanicsCollection


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 61 | Mechanics collection | div |  | conditional or visible |
| 63 | Mechanics source | select | source | conditional or visible |
| 63 | Mechanism columns | select | columns | conditional or visible |
| 64 | New mechanics source | input | sourceName | conditional or visible |


### src/components/MechanicsToolbox.jsx — ToolboxDialog


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 26 | `Close ${title}` | button |  | conditional or visible |


### src/components/MechanicsToolbox.jsx — QuickAdd


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 45 | Search all mechanics nodes | input | query | conditional or visible |


### src/components/MechanicsToolbox.jsx — MechanicsWizard


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 73 |  | textarea | answers[current.id] \|\| '' | conditional or visible |


### src/components/MechanicsToolbox.jsx — useMechanicsToolbox


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 117 | Mechanics work areas | div |  | conditional or visible |
| 128 |  | input | preferences.pinned[category.id] | conditional or visible |


### src/components/MechanismBrowser.jsx — MechanismTile


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 40 | `Inspect ${record.label}` | button |  | conditional or visible |
| 60 | `${record.favorite ? 'Remove' : 'Add'} ${record.label} ${record.favorite ? 'from' : 'to'} favorites` | button |  | conditional or visible |


### src/components/MechanismBrowser.jsx — RepeatableMechanismField


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 84 |  | textarea | entry \|\| '' | conditional or visible |


### src/components/MechanismBrowser.jsx — MechanismBrowser


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 265 | Close | button |  | conditional or visible |
| 274 |  | input | !!visible[filter.id] | conditional or visible |
| 288 | Search board game mechanisms | input | query | conditional or visible |
| 291 |  | select | sort | conditional or visible |
| 297 | Mechanism columns | select | columnPreference | conditional or visible |
| 319 | draft.image ? 'Drag to position or drop a replacement mechanism image' : 'Drop a mechanism image' | div |  | conditional or visible |
| 344 |  | input | draft.imageScale \|\| 1 | conditional or visible |
| 348 |  | input | clampImagePosition(draft.imagePositionX) | conditional or visible |
| 349 |  | input | clampImagePosition(draft.imagePositionY) | conditional or visible |
| 353 |  | input | draft.label \|\| '' | conditional or visible |
| 354 |  | textarea | draft.description \|\| '' | conditional or visible |
| 355 |  | textarea | draft.playerActions \|\| '' | conditional or visible |
| 356 |  | textarea | draft.gameRules \|\| '' | conditional or visible |
| 357 |  | textarea | draft.successCondition \|\| '' | conditional or visible |
| 360 |  | input | ACTION_PATTERN_SYSTEMS[draft.system]?.label \|\| draft.system | conditional or visible |
| 361 | Advantage | RepeatableMechanismField |  | conditional or visible |
| 362 | Effect | RepeatableMechanismField |  | conditional or visible |
| 363 | Variation | RepeatableMechanismField |  | conditional or visible |
| 367 | Variation | RepeatableMechanismField |  | conditional or visible |
| 368 |  | textarea | draft.emotionalSpike \|\| '' | conditional or visible |
| 369 | Effect | RepeatableMechanismField |  | conditional or visible |
| 370 |  | input | draft.color \|\| '#F08CB4' | conditional or visible |
| 374 | Variation | RepeatableMechanismField |  | conditional or visible |
| 375 | Effect | RepeatableMechanismField |  | conditional or visible |
| 376 |  | input | draft.color \|\| '#43BF87' | conditional or visible |
| 389 | Mechanism Browser | div |  | conditional or visible |


### src/components/MetaProgramsWizard.jsx — MetaProgramsSteps


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 7 | compact ? 'Meta Programs step shortcuts' : 'Meta Programs steps' | nav |  | conditional or visible |
| 10 | `Step ${index + 1}: ${item.short}` | button |  | conditional or visible |


### src/components/MetaProgramsWizard.jsx — MetaProgramField


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 31 | row.prompt | input | position ?? 2 | conditional or visible |
| 42 |  | input | option.value | conditional or visible |
| 48 | row.prompt | textarea | notes | conditional or visible |
| 50 | `${row.prompt} — notes` | textarea | notes | conditional or visible |


### src/components/MetaProgramsWizard.jsx — MetaProgramsWizard


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 69 | Meta Programs workshop | section |  | conditional or visible |
| 81 | Changes in particular situations | section |  | conditional or visible |


### src/components/NarrativeLibraryBrowser.jsx — NarrativeLibraryBrowser


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 43 | title | div |  | conditional or visible |
| 50 | Close | button |  | conditional or visible |
| 52 | Search library | input | query | conditional or visible |
| 61 | Created content categories | nav |  | conditional or visible |


### src/components/NarrativeLinkSourceModal.jsx — NarrativeLinkSourceModal


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 29 | Close | button |  | conditional or visible |


### src/components/NarrativeSetup.jsx — NarrativeSetup


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 7 | Set up this version | section |  | conditional or visible |
| 9 | Name this version | input | title | conditional or visible |
| 18 |  | input | key | conditional or visible |
| 21 | Optional context and version details | aside |  | conditional or visible |
| 23 | Situation or background | textarea | context | conditional or visible |


### src/components/NarrativeSourceCard.jsx — NarrativeSourceCard


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 16 | `Information about ${item.label}` | button |  | conditional or visible |


### src/components/NarrativeWizard.jsx — NarrativeWizardButton


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 48 | ariaLabel | button |  | conditional or visible |


### src/components/NarrativeWizard.jsx — NarrativeWizard


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 224 | Questions | nav |  | conditional or visible |
| 224 | questionAnswer(row, answers) ? 'Answered' : 'Unanswered' | span |  | conditional or visible |
| 228 | Source type | div |  | conditional or visible |
| 229 | searchOpen ? 'Close search' : 'Search frameworks and concepts' | button |  | conditional or visible |
| 229 | Search frameworks and concepts | input | query | conditional or visible |
| 231 | Recommendation fit | div |  | conditional or visible |
| 231 | label | input | visibleFits[key] | conditional or visible |
| 237 | Saved wizard | select | sessions.findIndex(item => item.record === session.record \|\| (item.record.sessionId && item.record.sessionId === session.record.sessionId)) | conditional or visible |
| 243 | Original word or phrase | input | role.original | conditional or visible |
| 243 | What fills this role in your version? | input | role.replacement | conditional or visible |
| 253 | Suggested answers | div |  | conditional or visible |
| 255 | Your answer | textarea | answers[active.textAnswerKey \|\| active.key] \|\| '' | conditional or visible |
| 261 | Title | input | title | conditional or visible |
| 263 | Character description | textarea | preview | conditional or visible |


### src/components/NodePalette.jsx — NodePalette


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 56 | Open node structure builder | button |  | conditional or visible |
| 65 | Resize node palette | div |  | conditional or visible |
| 79 | Collapse node structure builder | button |  | conditional or visible |
| 86 | Search nodes... | input | search | conditional or visible |


### src/components/ProjectMenu.jsx — BackdropSettings


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 152 | Close | button |  | conditional or visible |


### src/components/ProjectMenu.jsx — BackdropSlot


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 204 |  | input | Math.round((slot.opacity ?? 0.25) * 100) | conditional or visible |


### src/components/StoryActivityTimeline.jsx — StoryActivityTimeline


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 7 | Activities on the whole-game timeline | div |  | conditional or visible |
| 15 | `Open ${activity.title}: ${journeyTime(activity.start / 100 * duration)} to ${journeyTime(activity.end / 100 * duration)}` | button |  | conditional or visible |


### src/components/StoryActivityTimeline.jsx — StoryActivityDetails


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 30 | Activity details | section |  | conditional or visible |
| 32 | Activity name | input | activity.title | conditional or visible |
| 33 | Starts at (elapsed minutes) | input | Math.round(activity.start / 100 * duration * 10) / 10 | conditional or visible |
| 34 | Ends at (elapsed minutes) | input | Math.round(activity.end / 100 * duration * 10) / 10 | conditional or visible |
| 40 | Link a story or mechanics node | select |  | conditional or visible |
| 45 | label | optgroup |  | conditional or visible |
| 56 | `Unlink ${live?.title \|\| source.title}` | button |  | conditional or visible |
| 60 | Intended experience / notes | textarea | activity.notes | conditional or visible |


### src/components/StoryBeatFields.jsx — StoryBeatFields


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 11 | Story Beat sections | section |  | conditional or visible |
| 22 | label | Field | details[key] \|\| '' | conditional or visible |
| 25 | Link an existing conversation | select |  | conditional or visible |
| 34 | `Unlink conversation ${game.conversations?.[id]?.title \|\| id}` | button |  | conditional or visible |
| 39 | Link an existing mechanic · optional | select |  | conditional or visible |
| 51 | `Unlink mechanic ${live?.title \|\| ref.title}` | button |  | conditional or visible |


### src/components/StoryItemPhysicalLink.jsx — StoryItemPhysicalLink


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 13 |  | select | node.itemId \|\| '' | conditional or visible |


### src/views/GameMasterRules.jsx — RuleDetail


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 47 | Short, memorable name | Field | rule.title | conditional or visible |
| 52 | State the single guiding principle in a few sentences. | Field | rule.principle | conditional or visible |
| 63 | `Describe the ${t.label.toLowerCase()} for this rule.` | Field | rule[t.id] | conditional or visible |


### src/views/ItemDatabase.jsx — ItemDatabase


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 59 | Search items, props, tags… | input | q | conditional or visible |


### src/views/Library.jsx — ProgressMechanicPreview


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 200 | `${value} out of 10 completed` | div |  | conditional or visible |


### src/views/Library.jsx — ConceptPreview


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 263 | Close | button |  | conditional or visible |
| 288 | Adapt with questions | NarrativeWizardButton |  | conditional or visible |


### src/views/MasterAct.jsx — ActLane


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 66 | `${title} canvas` | section |  | conditional or visible |


### src/views/MasterAct.jsx — MasterAct


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 87 | Resize Story and Game Mechanics | div |  | conditional or visible |


### src/views/Players.jsx — Field


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 46 | placeholder | textarea | value \|\| '' | conditional or visible |
| 49 | placeholder | input | value ?? '' | conditional or visible |


### src/views/Players.jsx — Players


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 93 | Players sections | div |  | conditional or visible |
| 120 | Name | Field | player.name | conditional or visible |
| 121 | Nickname | Field | player.nickname | conditional or visible |
| 122 | Role | Field | player.role | conditional or visible |
| 125 |  | select | player.teamId \|\| '' | conditional or visible |
| 130 | Flags | Field | (player.flags \|\| []).join(', ') | conditional or visible |
| 142 | field.label | Field | player[field.key] | conditional or visible |


### src/views/PlayerTypes.jsx — PlayerTypes


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 15 | Search types | input | query | conditional or visible |
| 16 | Model | select | model | conditional or visible |
| 17 | Assign to player | select | player?.id \|\| '' | conditional or visible |
| 23 | Assign | input | assigned.includes(type.id) | conditional or visible |


### src/views/StoryDynamics.jsx — StoryDynamics


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 249 | Whole-game duration (minutes) | input | duration | conditional or visible |
| 260 |  | select | tagType | conditional or visible |
| 263 | X axis label | input | graph.xLabel | conditional or visible |
| 264 | Y axis label | input | graph.yLabel | conditional or visible |
| 272 | `${activity ? activity.title : 'Whole-game overview'}: planned emotional journey over ${journeyTime(chartDuration)}` | svg |  | conditional or visible |


### src/views/Teams.jsx — Teams


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 115 | `Return ${i.name}` | button |  | conditional or visible |
| 122 | `Return ${x.id}` | button |  | conditional or visible |
| 132 | Items (ready) | optgroup |  | conditional or visible |
| 135 | Sensor hardware | optgroup |  | conditional or visible |


### src/views/Weaver.jsx — Weaver


| Line | Label or label expression | Control | Binding or local value | Availability |
| --- | --- | --- | --- | --- |
| 289 | Master Story view | div |  | conditional or visible |


## H Sources and maintenance


The following source groups define the current implementation. Older architecture documents contain historical names and storage assumptions, so the code and the specific feature notes below take precedence.

- src/App.jsx — SHA256 b6c5b4eb5a0bf708

- src/data/seed.js — SHA256 fe0726fb98edb037

- src/data/csvSchemas.js — SHA256 3b2099c705c00117

- src/state/reducer.js — SHA256 4a6adadf6ff46dea

- src/state/store.jsx — SHA256 cfd2e5831b1eea0a

- src/state/storage.js — SHA256 1be43776c63005b1

- server/localData.js — SHA256 f287eb2f5efeb31c

- src/state/bridge.js — SHA256 7393ac2fb4485a6a

- src/components/Inspector.jsx — SHA256 45b6f80c888c21a1

- src/components/FlowCanvas.jsx — SHA256 ed3a1b7fe4051fa2

- src/components/GraphEditor.jsx — SHA256 da54e81135508ae0

- src/lib/masterAct.js — SHA256 13629cdaf89d6119

- src/components/NarrativeWizard.jsx — SHA256 638e877423ce222b

- src/components/NarrativeSetup.jsx — SHA256 b6c7ef024a71f16f

- src/lib/narrativeWizard.js — SHA256 6fcef8f86c368509

- src/lib/narrativeMemory.js — SHA256 fb10929af5d3131f

- src/lib/narrativeGraph.js — SHA256 a891e16497d7bb1d

- src/lib/narrativeLinks.js — SHA256 ddc646151da46932

- src/lib/narrativeLibrary.js — SHA256 bef7d7cfca43770a

- src/lib/characterProfile.js — SHA256 cfd40cf5772897aa

- src/lib/characterCanvas.js — SHA256 578909483acd5e8c

- src/lib/characterFacts.js — SHA256 a8fd2d9490177f1b

- src/lib/descriptionParagraphs.js — SHA256 3a694c3218eab4fb

- src/lib/groupFoundations.js — SHA256 914373652b38eff6

- src/lib/groupProfile.js — SHA256 e3c7168f28c974c7

- src/lib/conversations.js — SHA256 81b93add702601cf

- src/components/FateCharacter.jsx — SHA256 004cef20ecc26dc0

- src/lib/fateCharacter.js — SHA256 8cec452692f85196

- src/data/fateWizard.js — SHA256 6b67011032980e57

- src/data/fatePurposes.js — SHA256 c8a09e74b6afc843

- src/lib/fateWizard.js — SHA256 1ebddcb9584f8d0f

- src/data/kolbWizard.js — SHA256 92d0a8b3aaaae67f

- src/lib/kolbWizard.js — SHA256 04cc5a419df0aaea

- src/data/humanValuesWizard.js — SHA256 6a7c889e4ebd6c25

- src/lib/humanValuesWizard.js — SHA256 d9c13a7f4e62f913

- src/components/DragonWorkshop.jsx — SHA256 8fe07145258808df

- src/lib/dragonWorkshop.js — SHA256 c0d675b73972bc5f

- src/lib/dragonSync.js — SHA256 629dd16fd885028b

- src/lib/wizardFields.js — SHA256 a6a9ccad7c39034e

- src/mechanics/toolbox.js — SHA256 03f602ec6e00dbf1

- src/mechanics/collections.js — SHA256 d6486d60f4252656

- src/data/mechanismCatalog.js — SHA256 06f6c6c79c5bbe2f

- src/lib/mechanicIO.js — SHA256 490fd6d76ef24970

- src/data/storyDynamics.js — SHA256 5c58e0a5f6485a95

- src/lib/storyBeat.js — SHA256 26417e1f9abe686c

- src/components/StoryItemPhysicalLink.jsx — SHA256 dbbbd4a68eaf0495

- src/lib/workspaceTransfer.js — SHA256 ff6a42a6621fe8f7

- docs/character-development.md — SHA256 d71e077feb466c2b

- docs/group-development.md — SHA256 f3ce36a06b07a2d6

- docs/conversations.md — SHA256 8872e315b63d1688

- docs/story-beats.md — SHA256 4debc707a8cb07ce

- docs/story-dynamics.md — SHA256 0e6e79d2525ebaf2

- docs/story-item-props.md — SHA256 f0d5252dfbb57d91

- docs/story-library-browsers.md — SHA256 f699496c0e1c7cba

- docs/dragon-workshop.md — SHA256 b45606ee6da58481


Local reusable catalogue source: .larpcraft/library.json, inspected read-only. No private project records are copied into this reference. The inventory script reads code exports, generated questions, schema defaults, and labelled JSX controls. Source fingerprints identify this snapshot and are not a claim of an unchanged future checkout.


To refresh: rerun the source inventory after meaningful implementation changes, review changed semantics, regenerate this reference, and update the date. Do not promote planned features to implemented merely because they appear in a backlog or old example.


For another AI: use this file to understand the current system. Use LARPCRAFT_AI_BRIEF.md for the future backlog and ideation preferences. Ask for the relevant source files before proposing a code change. Preserve the two stores, scoped identities, editable answer/prose ownership, and existing authored data.


## Implementation update — 2026-10-28

The original inventory above predates these local additions; use these workflow documents for their current fields and semantics:

- **Goal Compass conversation editor**: Narrative Viewer → Conversations, character Voice and dialogue, and library conversations share a wide three-pane writing desk. Tiny-portrait left/right messages, selected-line inspector, three editable per-speaker goal columns, author relevance/goals, location context, line tags and conversation summary. No generated dialogue is implied. See [Conversations](conversations.md).
- **Philosophy & values**: optional curated/custom philosophy tags, guiding principle, values/outlook, authority style and social expectations in Quick Attributes for Characters and Groups. Group tags are included in canvas chips, full descriptions and exports. These fields stay independent of questionnaire answers and protected prose. See [Philosophy attributes](philosophy-attributes.md).

Conversation icon controls: participants, individual goals and conversations now support built-in symbols, uploaded images, explicit icon removal and restoring defaults. Participant overrides stay local to the exchange and update roster/message/inspector views together. Library copies retain icons and uploaded images. See docs/conversations.md.

Conversation presentation update: the editor uses dark green translucent gradients and glass panels. Its title and story status are editable in the top bar, freeing the left pane for larger participant portraits. Conversation browsing reuses the database gallery shell with a wide search toolbar, collapsible status sidebar, counts and richer script cards; duplicate introduction text is removed. This is a presentation change over the existing saved records. See docs/conversations.md.
