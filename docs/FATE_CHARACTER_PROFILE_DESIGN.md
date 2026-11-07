# FATE Character Profile — proposed redesign

Status: implemented locally, 25 October 2026, following the user's approval and final adjustments. This document retains the proposed workflow and records the implementation below.

## Implemented adjustments and verification

- The colored step navigation is restored inside the character wizard: Start, Focus, Authority, Tribe, Emotion, Character description. It sits on the left on larger screens, highlights the current step, allows direct navigation, and becomes a scrollable row on narrow screens.
- The right pane shows a live character description above Selected ideas. It derives immediately from current answers, including individual signal strength and pattern changes. An edited final description remains protected; the pane explains that its live preview follows the answers. On smaller screens the preview appears within the step content.

- Character Profile and Communication remain the two large starting choices. A small Drafts & saved work header control opens unfinished drafts, edits completed FATE sessions, or copies saved work. A fresh opening no longer jumps automatically into an unrelated unfinished draft.
- Focus groups concrete choices into Visual, Audio and Kinesthetic, with custom triggers, separate attention/overlooked choices, and independent unset-by-default strength/example cards. Abstract meanings remain optional.
- Both Authority and Tribe accept existing game characters/groups or names without profiles. Links use collection and nested paths. Renamed linked records update character contributions in the same undoable transaction; missing links retain names. Library copies detach external references. Included root character references remap on clipboard copy; nested external references detach safely to names.
- Group membership is specific to a named group and admits characters only, including named-only people. Existing game characters can be added directly to that board.
- Emotional patterns carry independent triggers, mixed feelings, response, strength, observable behaviour, broad origin and exceptions. Earlier general tendencies remain editable as earlier information and are not copied onto all patterns.
- Character setup and rebuilt output omit scene/message/outcome settings. Existing generated or manual prose remains protected until an explicit rebuild; retired settings remain in Earlier writing. Character names follow the current node unless the author explicitly edits the name in the draft.
- Character review has one editable FATE contribution and collapsible Selected ideas with links back to the relevant step. Communication's separate fields and spoken output remain available.
- Regression coverage includes unit/reducer tests, complete advanced-screen server rendering, editable saved-question round trips, purpose banks, copy/remapping and temporary-directory disk persistence. Interactive browser verification remains unavailable because the browser tool blocked localhost access; HTTP/Vite checks are separate from visual verification.

This combines the user's three recorded reviews into one proposed workflow. Explicit keep/remove requests are requirements. New layouts, option wording and resolutions of undecided fields below are design recommendations. They are not claims about the author's original model. The author's manual excerpt and business commentary were supplied on 25 October 2026; [the source comparison](FATE_SOURCE_COMPARISON_2026-10-25.md) distinguishes source mechanisms from the character-authoring adaptation. That review does not change questionnaire content.

## Purpose and interaction rules

Help the author discover a character through attention, trust, belonging and recurring emotional responses. A prewritten situation, message, intended outcome or scene is unnecessary.

- Six screens: Start → Focus → Authority → Tribe → Emotion → Character description.
- Every FATE category and answer is optional. A name is needed when creating a new character; it can be entered at the end. No minimum completion score.
- Choices come before explanatory writing. Selecting something reveals a compact detail editor; it never requires writing a paragraph to proceed.
- Simple and Advanced use the same answers. Advanced reveals optional detail, rather than adding a different purpose or changing existing answers.
- Keep Selected ideas as a compact, collapsible strip. Keep only a short relevant carried-forward summary when earlier material exists. Remove Show all context and empty 'not described yet' banners.
- Keep draft autosave and undo/redo. Resume draft belongs in the header as a secondary action; it opens a picker instead of occupying the main form.
- Use character language throughout. Communication controls and communication output remain in their own mode.

## Screen 1 — Start

Main content: two large mode choices (Character Profile and Communication), Character name, then Start exploring. Draft continuation/editing is a smaller header control.

Keep the Character Profile / Communication mode choice at the top. When launched from an existing character, prefill its current name and make the destination implicit. On save, an explicitly edited character name changes that character's name; simply opening or continuing a session does not rename it from an old saved version title. Historical wizard version titles remain metadata, not competing visible character names.

When creating fresh work, Save creates a Character node in the current narrative canvas or narrative act lane. If launched outside a narrative canvas, use the game's main Narrative canvas. Continuing a saved profile updates its existing character in its original scope. Do not attach by matching names; names can be duplicated.

Remove from Character Profile setup: Situation/background, destination/category chooser, message carrier, affected people, other people/groups, desired outcome and its explanation, scene intensity, emphasis ordering, and intensity/organizer notes. The scene-diagnosis setup also does not belong in this character-discovery path; preserve older diagnosis records separately.

Draft continuation, copying saved work and remembered-choice settings remain secondary header/menu actions. Opening a draft picker does not discard the current draft.

## Screen 2 — Focus

Main question: What catches their attention, and what tends to pass unnoticed?

Offer the same concrete trigger library in two selections: Draws attention and Easily overlooked. Group the choices into Visual, Audio and Kinesthetic. Options include:

- Loud or sudden sounds; raised voices or shouting; other sounds.
- Spoken words; silence or a pause.
- Bright light; distinctive colours.
- Movement; gestures or facial expressions.
- Written words; noticeable objects.
- Something unfamiliar or changed.
- Touch, vibration, temperature, pressure/discomfort, body position/balance and physical effort.
- Add a custom trigger.

Keep the abstract choices Possible threat, Something worth gaining and Uncertain signal under an optional Meaning of the signal disclosure. They supplement concrete triggers and are not prerequisites.

Each selected trigger opens a small card:

1. Trigger label and whether it draws attention or is easily overlooked.
2. How strongly does it pull their attention? An explicitly chosen slider: Usually ignored → Passing glance → Brief pause → Clear attention → Strong attention → Full concentration. No response is selected by default.
3. Add a specific example, condition or exception, collapsed until used. No duplicate general channel questionnaire.

Example: 'Raised voices — Brief pause — They look up, then return to their work.' A different trigger on the same character can have a different strength.

If a trigger appears in both selections, invite a condition such as 'while concentrating' or 'when someone uses their name'. Keep it editable and nonblocking; do not silently choose which answer wins. An unset strength remains unspecified.

An optional In your own words summary comes after the choices. Remove What could be lost, What could be gained, What competes for attention and Focus's Note to self/description from this screen.

Recommendation for the undecided How does attention continue: omit the standalone control from the new character form. An author can describe sustained or recurring attention in that trigger's optional example. Preserve existing answers in Earlier writing.

Narrative contribution: concrete noticing/overlooking tendencies, their strength and authored qualifications. A loud sound does not automatically become danger, fear or a particular action.

## Screen 3 — Authority

Main question: Whom do they trust, and what earns that trust?

Keep the existing authority-source choices and custom options. Add these proposed choices:

- Familiar people — people they know well or encounter regularly.
- Close relationships — family, close friends or trusted companions.

For each selected source, optionally name an actual person/group or explain what gives that source weight. Being familiar and being emotionally close are separate reasons; neither requires a formal rank.

Keep Trust can be questioned or shaken, revealing What makes them doubt someone they trusted? when selected. Keep Actual power or ability, Belief that they have power and Trust earned through actions in optional More detail. Retain the unreviewed visible-credibility choices under More detail with character wording; do not introduce them as required questions.

Narrative contribution: what gives a person's judgment weight, who exemplifies it, and what might undermine that trust. Do not infer compliance, loyalty, or an emotional reaction merely from an authority choice.

## Screen 4 — Tribe

Main question: Where do they feel they belong?

Start with the approved choices about acceptance, close relationships, protecting their group, independence and several groups. Keep the existing benefits/risks and usual group positions. Optional custom choices already provide expansion; do not add a long speculative catalogue before seeing a need.

### People and groups that matter

Add person/group opens two clear paths: Choose from game, or Enter a name. Game search includes saved characters and explicitly represented groups/teams/factions. It excludes acts, generic story containers, mechanics, items, locations, sectors and player-management records. A story container is not treated as a group solely because it has a name.

For a named entry, choose Person or Group. A typed name remains an independent reference and never creates a node automatically. Link to an existing profile is available later. Names can remain unlinked indefinitely.

Each entry can contain:

- Name and optional link.
- Optional relationship label, such as friend, sibling, rival, member of, or loyal to. Merely 'matters to them' does not imply friendship or loyalty.
- What place do they have here, and why does this group or relationship matter?
- Optional group-specific role or stakes, when a general answer would be misleading.

Remove the Starting idea / explain what it means here boilerplate. Reuse the character node's relationship names and links where possible, but do not overwrite native relationship facts from an unclassified mention. Keep FATE's deeper explanation as FATE input.

Existing links use stable collection and nested-node paths, not names or a bare node ID. Renaming follows the linked record. Missing records retain their last known name and explanation; they do not become linked to an unrelated record with the same ID in another scope. Any later cross-reference outside the originating graph must preserve that full identity.

### Loyalties and group behaviour

Use How do loyalties support or conflict? — optional. Place the approved group-behaviour choices directly in this section: fitting in, watching the group, putting expectations first, enforcing norms, pressuring conformity and checking their own behaviour. The choices remain usable even when the author leaves the explanation blank.

Recommendation for the undecided belonging symbol: move it to a collapsed Recognisable signs of belonging field on a particular group entry. Examples could be a badge, shared phrase or ritual. Keep it off the main question list.

Keep the group board as an optional view. It must identify which group is being described and list characters only, including named people already added here without profiles. Keep Belongs / Undecided / Outside. Membership does not imply friendship, trust or enemy status. Existing invalid board entries are retained as earlier data, not displayed as characters.

Narrative contribution: named relationships, belonging needs, group roles, stakes and explicitly authored tensions. Link metadata remains available for later game authoring.

## Screen 5 — Emotion

Main question: Which feelings return, and how do they usually respond?

Keep recurring-feeling choices, including fear, pride, curiosity, hope, anger, sadness and relief, plus the existing additional/custom choices. One especially common feeling remains optional More detail.

Make recurring emotional patterns the main content. Each Add emotional pattern card contains:

1. What brings this pattern out? A situation or trigger, with optional existing trigger suggestions.
2. Which feelings mix here? Multiple choices.
3. What might they do with these feelings? Move toward it, Pull away, Both impulses conflict, It depends, or their own description.
4. How strong are these feelings here? Faint → Mild → Clear → Strong → Overwhelming; unset until chosen.
5. When might they respond differently? An optional exception or what helps them respond differently.

Optional pattern details retain What behaviour shows their feelings? and the broad origin choice Where does this reaction come from in your story? (protective response, learned experience, both, or unspecified). An observable example adds detail to the usual-response answer; it need not repeat it.

This relocates response and strength into the relevant pattern. It prevents an answer about fear from automatically becoming the character's reaction to pride or curiosity. Existing broad response answers remain available as general tendencies until the author assigns them to particular patterns.

Remove the separate What learned pattern repeats, What experience shaped it, What happens to the familiar reaction, and Feeling across the scene controls. The removed learned-pattern field is distinct from the retained recurring emotional pattern cards. Do not request an invented formative event when the author has not specified one.

Narrative contribution: qualified situation → feelings → usual response → exception passages. Unspecified links remain unspecified. Patterns describe tendencies rather than guaranteed reactions or established scenes.

## Screen 6 — Character description

Make Review now lead here, with the navigation label Character description. Its value is seeing and editing the actual text that will be saved.

Show one large editable FATE description, with Selected ideas beside it on a wide screen or below it on a narrow screen. Clicking a selected idea returns to its question. No second copy of the same prose and no default questionnaire dump.

The FATE description is one contribution to the existing unified Character node. It does not replace other framework/concept contributions or the character's separately authored basic facts.

Default output is coherent character prose, with paragraphs as needed to retain named relationships, intensity differences and exceptions. Remove the conversation-oriented Result format selector from character mode. Recommendation: also omit tone/length controls from the initial redesign; editing the actual prose is sufficient, and reducing length must not silently drop an exception.

Recommendation for Recorded details and the completion chart: remove both from the main review. Answers remain editable at their original steps. Populated notes from retired controls remain under Earlier writing, accessible from the draft/menu. No mandatory completion graphic.

Keep Save to game and Save to library + game. Save updates the same FATE contribution when continuing a saved session. Untouched prose follows answer edits; manual wording remains protected with an updated proposal available for review.

## Example of the intended result

Illustrative invented inputs: Uno gives raised voices a brief pause, is easily distracted by movement, trusts familiar companions, protects the town guard, and usually approaches a problem when afraid but pauses when a companion asks them to.

> Uno usually pauses briefly at raised voices, while movement readily draws their attention away from their current task. Familiar companions carry particular weight in their decisions. They feel a strong responsibility to protect the town guard. When afraid, they tend to approach the problem; a companion asking them to stop can lead them to pause instead.

The example illustrates the form. It is not data to insert into the user's existing Uno character. Actual output must use only the user's recorded material and must not invent motives, causal connections, scenes, diagnoses or background history. The current app's local formatter can express recorded choices; more sophisticated connective prose would be a separate capability decision.

## Preservation and implementation boundaries

- No bulk rewrite of characters, library templates or canonical .larpcraft data.
- Keep existing drafts, all saved wizard sessions, original option labels, links, manual text and legacy answers. Retiring a field from the character form does not delete its saved value.
- Removed communication/scene fields must not keep affecting a newly rebuilt character passage through hidden output rules. If existing prose uses them, retain that prose until an explicit rebuild or accepted revision; keep the underlying writing accessible as Earlier writing.
- Do not copy an old global attention strength onto every trigger, or assign a broad emotional response to every pattern. Offer the saved value as earlier information for explicit reuse.
- Name changes and relationship changes save in the same undoable transaction as the FATE contribution and unified description update. Preserve existing manual-description review safeguards.
- Character-specific screens and formatting must be separated by purpose. Communication, listener-profile snapshots and other saved purpose banks retain their own content and behaviour.
- Use shared entity identity, selection and text controls where useful; avoid a second unrelated character store. Exact data migration/versioning is an implementation step, not part of this design-only change.

## Acceptance checks for the later implementation

1. A new character can be developed from choices without an opening situation paragraph, destination chooser or scene controls.
2. Two attention triggers can have different strengths and conditions, and both survive save/reopen and export.
3. Trust in familiar people can be expressed without implying a formal position or obedience.
4. Existing and named-only relationships can coexist; nested characters with repeated IDs remain distinguishable. Non-character records never appear on the character board.
5. Two emotional patterns can have different feelings, responses, strengths and exceptions without overwriting each other.
6. A skipped category produces no invented text and does not block saving.
7. Review shows the passage that will actually be saved. Reopening and editing the same session updates that contribution, preserves other inputs and supports undo.
8. Saved legacy notes and manual writing remain recoverable. Retired scene settings do not leak into a deliberately rebuilt character description.
9. Communication mode still restores its own drafts, destination, spoken lines and output independently.
