# Guided Story Beat design — decisions and proposals

Status: Wide Workshop implemented November 4, 2026 following the selected layout: six compact grouped inspector buttons, six window tabs, concrete icon/colour choices, live highlighted prose on the right and compact participants below. See story-beats.md for the implemented model and compatibility. Guided node-to-node story mode is implemented; see story-connections.md. Category Rail and the shared occasion-pairing catalogue are also implemented following the selected mockups.

## Accepted direction

A Story Beat helps compose what happens among linked characters, groups, locations and items. Selecting concrete options should already generate a usable situation. The wizard and node should edit the same information. Names from linked entities should appear in prompts and generated sentences.

All sections are optional. The user used “mandatory” while explaining that sections may be left blank, completed later or omitted; the operational interpretation is optional, with no completion gate.

The main sequence is **Opener → Complication → Player involvement → Possible consequences**. Occasion supplies context across this sequence. Change & stakes describes what may change, be protected or be restored, and why it matters.

### Opener

- Retain extensible families: Information; Requests & bargains; Conflict; Possession; Loyalty; Disruption.
- Add ways to start: Need; Obstacle; Discovery; Clash; Obligation; Opportunity.
- Include encounter starters such as an abandoned camp, an unopened delivery, people waiting for someone, or contradictory instructions.
- These are several ways to browse starter patterns, not compulsory consecutive questions or mutually exclusive classifications.

### Occasion

The user's broad label Occasion covers recognisable happenings, activities and established practices:

- Social occasions: arrival, delivery, ceremony, reunion, wedding, departure, celebration, handover.
- Undertakings: rescue, escape, escort, recovery, theft, repair, search, sabotage.
- Transitions: appointment, dismissal, inheritance, exile, acceptance, retirement, return, loss of status.
- Rules and exceptions: entry restrictions, required rituals, membership conditions, ownership rights and difficult exceptions.
- Distribution: dividing supplies, money, land, authority, credit, shelter or access.

Each occasion can offer typical roles, expectations, objects and steps for explicit selection. For an institution, these can describe its established procedures, such as a court session or inspection. A linked organisation retains its own Group record.

An optional **Combine occasions** control adds another occasion. Select how they meet: interruption, simultaneous demands, shared participant, shared object, blocked access, mistaken identity or a deliberately combined activity. A collision is not automatically required to be hostile.

## Proposed complication system

Choose a complication family, then a concrete variation, then bind the relevant existing participant/object/place. Generate wording using the chosen opener and names.

| Family | Concrete variations |
|---|---|
| Resistance | Someone refuses; demands proof; imposes a condition; actively interferes |
| Missing means | A person is absent; an item is unavailable; a route is blocked; supplies are insufficient |
| Uncertain information | Accounts conflict; evidence is incomplete; a message is misinterpreted; the explanation is disputed |
| Time pressure | A deadline approaches; something arrives early; a delay changes the situation; opportunities overlap |
| Competing commitments | A promise conflicts with another duty; someone is needed in two places; two claims concern one resource |
| Exposure | A witness appears; a secret risks discovery; an action becomes public; the wrong person receives information |
| Cost or tradeoff | Proceeding risks a relationship; consumes a resource; creates a debt; transfers risk to someone else |
| Unexpected development | A participant changes sides; an object has another use; success creates a new demand; the situation changes while people act |

The model records who/what introduces the complication, which part of the intended action it affects, and whether it blocks, delays, redirects, exposes or adds a cost. Those details supply causal structure without requiring free-text answers. Offer one complication initially; more can be added optionally.

## Proposed player involvement system

Keep the route into a beat separate from the kind of participation it offers.

1. **Invitation or contact:** asked directly; stumble across it; witness it; become affected; receive a clue; become responsible; pursue a personal goal; are offered a benefit.
2. **Interaction:** discover/investigate; talk/persuade/negotiate; choose/judge; cooperate/coordinate; overcome/endure; witness/interpret. Multiple interactions may coexist, and their order is optional.
3. **Influence:** what their participation can affect — knowledge, agreement, access, possession, resources, relationships, timing or another outcome.

Skipping participation is valid for backstory and offstage happenings. Optional non-intervention consequences describe how the situation might develop if players leave it alone. Never assume that players must take the suggested approach.

## Proposed consequence system

Represent each possible consequence as **condition → affected entity → effect → resulting state**, with optional timing and visibility.

- Conditions: opener proceeds; a complication is overcome; a particular player approach is used; a resource runs out; a deadline passes; players leave it alone; an author-defined condition.
- Effects: gain/lose; reveal/conceal; strengthen/weaken; grant/restrict; transfer; create/end; protect/restore; preserve the current state; introduce a follow-up demand.
- Optional timing: immediate; later; after another beat; ongoing.
- Optional visibility: publicly apparent; known to selected characters; discoverable through clues; organiser knowledge.

Support several branches, mixed outcomes and secondary effects. Success/failure can be offered when useful, but do not force every story outcome into a binary score.

## Change & stakes: shared use of existing value tools

Use one section for three connected questions:

1. **What could change?** Knowledge/understanding; trust/relationships; power/authority; possession/access; goals/commitments; danger/opportunity; other.
2. **Why does it matter, and to whom?** Reuse Human Values definitions, named states, affected people, starting conditions, possible endings and viewpoints.
3. **Which principles pull against each other?** Reuse Haidt Moral Conflicts options when relevant, and allow custom tensions.

The current Human Values workshop already supports named states, alternate endings, protection/restoration/celebration, consequences, choices, viewpoint differences and information timing. Its stored answers should be reused or explicitly linked rather than independently copied into another editor. A public authority change and a character's feeling of respect can be connected without treating them as identical facts. General knowledge, access and ownership changes remain valid without moral stakes.

Consequences can link to these state changes. Changing a value definition or outcome should not rewrite manually authored character descriptions or assert which outcome actually happened.

## Connection suggestion mode

Accepted intent: a compact toggle near the UI toggle, visible in Narrative Viewer. When enabled, drawing a link between entities opens appropriate suggested connections. Examples:

- Character → Character: asks for help; conceals from; blames; protects; owes.
- Character → Item: seeks; conceals; inherits; misunderstands; must surrender.
- Group → Location: claims; abandons; depends on; forbids entry to.
- Item → Location: unlocks; contaminates; reveals something about; belongs elsewhere.

Design detail to settle: distinguish an ongoing relationship from an action in a particular beat. The existing relationship system stores directional, shared relationship records with descriptions; a one-time action such as stealing an item should remain scoped to its story situation. The chosen connection can supply a role/action for the active Story Beat or become the basis of a new beat through an explicit creation action.

## Still being reviewed

The user has not yet commented on dependency, claim-to-test, timing, public/private agenda, chain reaction and history-returning approaches. Their placement is intentionally undecided.

The selected Wide Workshop, Category Rail and occasion-pairing layouts are implemented. Guided connection mode is available separately beside Conversations. Preserve the focused-workshop preference: useful choices, linked context and an updating story description, with optional deeper detail.
