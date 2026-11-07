# Location map labels and zones

Implemented locally on 27 October 2026 as the first stage of the map-improvement plan.

Open a physical location under Build → Locations. Use **Add label** and click on the map, or **Draw zone** and drag a rectangle. The **Map notes** panel edits the selected annotation. Labels support multiline text and a color accent. Zones support a name, translucent color, position, dimensions, and an optional link to an existing top-level Story Location. Neither annotation requires a new narrative node.

Use **Move** to drag a label or zone. A selected zone has a lower-right resize handle. Position and size can also be entered as percentages in Map notes, and labels/zones can be selected with the keyboard. Existing movement arrows are selected for editing rather than deleted on a single click; use Delete arrow in Map notes. Existing item/sensor/narrative markers retain their references and can be dragged or removed as before.

Every overlay can be visible to **Players & facilitator** or **Facilitator only**. Existing overlays retain their visibility until explicitly changed. **Player preview** hides facilitator-only labels, zones, markers, and arrows and removes editor controls. This is a visual authoring preview; it is not a shared page or access-control boundary.

Optional `mapLabels[]` and `mapZones[]` live on the existing location record. Each row has an `id`, canvas `x`/`y`, `color`, and `audience`. Labels add `text`; zones add `name`, `w`, `h`, and optional `storyLocationId`. Positions use the existing 160 × 90 stage plane. Newly created or moved street-map labels/zones additionally store `osmAnchor.start` and, for zones, `osmAnchor.end` latitude/longitude values, so their rendered positions follow panning, zooming and panel resizing. Existing markers/arrows retain their original coordinate behavior. Image-map annotations remain proportional to the schematic canvas, without asserting physical scale.

Changes use normal local game persistence. No authored project/library files are reset. Missing arrays are treated as empty, and old overlay rows without audience metadata remain visible to both audiences. Map edits/deletions are undoable. Drag previews remain transient until the pointer is released; cancelled drags do not save. A lost linked Story Location does not delete the zone or silently replace the saved link.

Validation covers geometry bounds, visibility filtering, legacy compatibility, source-reference preservation, geographic projection, undo and real local-API save/reload into a temporary test directory. A disposable browser fixture exercises drawing, moving, resizing, multiline text/color editing, Story Location linking, player visibility, arrows, deletion and undo without writing test content into the active game.

This stage does not add a print/export workflow, compass, legend, grid, scale calibration, measurement, live geofences or automatic scoring.
