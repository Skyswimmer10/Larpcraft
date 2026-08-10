# Mechanics Node System

This module should reuse the Narrative Weaver architecture instead of creating a second UI language. Mechanics are pure game logic: physical tasks, hybrid physical-cognitive tasks, sensors, actuators, props, restrictions, timers, and persistent item/resource behavior.

## Reuse From Narrative

- `FlowCanvas.jsx`: keep the same pan/zoom, drag, connect, delete-edge pencil, frame, and drop-palette behavior.
- `NodePalette.jsx`: use the same collapsible left node sidebar, filters, search, two/three-column responsive cards, and library template groups.
- `Library.jsx`: keep the split between individual base nodes and saved structures. Mechanics use `mechPrimitives` for base mechanic node types and `mechStructures` for reusable Task Templates.
- `Inspector.jsx`: extend the existing graph-node inspector pattern with mechanic-specific sections. Keep progressive disclosure: identity first, timing/outcomes next, technical details lower down.
- `StructureThumb.jsx`: reuse for saved Task Template previews.

## Main Areas

- Mechanics Fever: the session/runtime viewer. Adding a Task Template drops a collapsed clean node onto the active game, while expanding opens its editable subgraph.
- Game Mechanics Library: stores individual base mechanic nodes and individual mechanic subnodes.
- Mechanics Builder: combines base nodes into structures and saves completed structures as reusable Task Templates.

## Initial Folder Structure

```text
src/mechanics/
  README.md
  MechanicsViewer.jsx
  MechanicsLibrary.jsx
  MechanicsBuilder.jsx
  MechanicsInspector.jsx
  mechanicsTemplates.js
  mechanicsAdapters.js
```

`mechanicsAdapters.js` should translate between library templates, canvas graph nodes, and active-game instances. The existing `src/state/bridge.js` import helpers are the model to follow.

## Core Node Types

- Task Template: collapsed reusable container with a saved internal graph.
- Cooperation: focused node for selecting how players cooperate, with attachable modifiers for roles, no-solo rules, discussion, and arbitration.
- Physical Restriction: body/movement/communication limits plus safety and stop rules.
- Prop Interaction: physical manipulation of existing item/artifact records.
- Sensor Node: gameplay input detection.
- Actuator Node: gameplay output/effect behavior.
- Action: one atomic step with Who Acts, Number of Players, and attachable modifiers.
- Player-Facing Instruction: a separate node containing the exact instruction presented to players.
- Action Sequence: collapsible container with a library-extensible custom sequence mode.
- Resolution: selects one of the probability or resolution mechanisms and records a human-readable category and procedure for applying it.
- Character State: pre-authored NPC/character behavior for dialogue trees and AI-agent responses.

## Action System

Action nodes stay deliberately small. Selection rules, budgets, availability, prompts, and physical resolution use one reusable Action Type Pattern subnode. Its mechanisms are organized into Action Token Systems, Action Order Systems, and Action Special System dropdowns, and each mechanism can recall saved rule settings from the library.

The 23 `ACT-01` through `ACT-23` mechanisms from *Building Blocks of Tabletop Game Design* are stored as `templateKind: 'action'` records in `mechStructures`. The UI presents these as Action Templates, separately from Task Templates. Inserting one creates a collapsed Action Sequence containing an editable Action node, a Player-Facing Instruction node, and its matching modifier; it does not create 23 permanent base-node types.

## Mechanic Subnodes

Mechanic subnodes are stored separately in `lib.mechSubnodes`, mirroring narrative subnodes. They are attachable modifiers rather than standalone task containers. Most attach to Cooperation and Task Template nodes; reusable notes/prompts can attach more broadly.

- Progressive Feedback Mod: positive feedback loop from earlier success to later clarity or ease.
- Fail-Safe + Scaffolding Mod: hints, partial credit, skip rules, and grace periods.
- Escalating Pressure Mod: time, body, environment, resource, or NPC pressure that ramps upward.
- Cooperative Ethos / Role Mod: cooperation structure and desired social tone.
- No-Solo Enforcer: physical/spatial/timing constraints that require multiple players.
- Arbitration Mod: tolerance, facilitator override, and variance logging.
- Team Discussion Prompt: reusable discussion prompt before, during, or after tasks.
- Facilitator Note: reusable GM guidance.
- Value: numeric or tradable value for an item, resource, or state.
- Lifespan: how long an item/resource persists in pre-authored game design.
- Spend / Use Rule: authored rules for spending, consuming, or using an item/resource.
- Core Mechanic Modifier: deliberate variation of a core task dimension.

## Inspector Integration

Each mechanic subnode inspector should follow this order:

1. Identity: template name, type, reusable/modifier status.
2. Purpose: read-only explanation of why the subnode exists.
3. Collapse settings: depth 0-4 and collapsed-by-default.
4. Focused fields: generated from the subnode schema, with only relevant controls visible.
5. Attach rules: target node kinds such as `cooperation`, `taskTemplate`, or `*`.

The library inspector already renders these schema-driven fields. The next step is attaching copies of these library subnodes into mechanic task graphs and exposing them in Mechanics Fever as collapsible modifiers under their parent task node.

## Reuse Rule

Do not duplicate physical item, artifact, location, or sensor records. Mechanics nodes should reference existing `items`, `locations`, and `sensors` by id through `refs`, `propItemIds`, or `sensorIds`.

## Save Flow

1. Builder starts with a blank `mechStructures` draft or an existing Task Template.
2. Designer drags base mechanic nodes into the structure canvas.
3. Nodes can contain nested `sub` graphs up to 3-4 levels.
4. Saving writes the graph to `lib.mechStructures`.
5. Using a template in the Mechanics Viewer creates a detached game copy so the session can be adjusted without mutating the library template.
