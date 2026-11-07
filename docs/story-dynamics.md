# Overview and activity journeys

**Story Dynamics Graph** has two levels. The existing curves and tags remain the **whole-game overview**. **+ Activity journey** creates a blank, independent chart for a shorter activity. Click a named activity or its colored timeline band to open it; use the breadcrumb or **Whole-game overview** to return.

Set the whole-game duration in minutes. Initially it uses the game's Master Story timeline duration, or four hours when no valid timeline exists. Each activity has a start and end in elapsed minutes. Bands show their position in the overview; activities may overlap. The chart inside an activity runs from its own zero to its own duration. Changing the whole-game duration scales activity positions proportionally; it does not change the shape of any curve.

Draw, reshape and tag either chart using the existing tools. Overview and activity curves never sum or regenerate each other. They represent the author's intended emotional experience. **Clear curves** and **Reset** affect only the chart currently open. Resetting the overview keeps activity journeys. Removing an activity removes its local chart and links; Undo restores them.

The optional **Story and mechanics contributing to this activity** section links existing Master Story, Narrative and Mechanics nodes, including nested nodes. Multiple sources can contribute to one activity. **Inspect** opens the selected source in the inspector. A source rename is displayed immediately; a deleted source remains marked missing and can be unlinked. Links do not change the source nodes or infer emotional responses.

Data remains project-owned in `storyDynamicsGraph`. Its original `curves`, `tags`, `xLabel` and `yLabel` fields are the overview. `durationMinutes` is optional. `activities` stores ID, title, proportional start/end (0–100), color, notes, scoped source references and its own chart. An activity chart has no further nested activity layer. Older graphs without activities open as before.
