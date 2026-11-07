# Infinite canvas navigation

Every graph rendered with `FlowCanvas` uses an unbounded camera instead of a finite scroll area. Hold the middle mouse button and drag to pan in any direction, including beyond the original top and left boundaries. Starting over a node or a control still pans, without selecting or moving graph content. Pointer capture maintains dragging outside the canvas; release, cancellation, lost capture and window blur end the gesture. Browser middle-button autoscroll is suppressed.

Wheel and trackpad movement pan; Shift + wheel pans horizontally. Alt + wheel zooms around the cursor. Zoom buttons retain the viewport centre. Fit all and Focus selection recalculate their camera from graph content. The grid follows camera translation and zoom; the toolbar stays fixed. Camera changes are local view state and do not write graph coordinates or create undo entries.

Coordinate conversion, drag/drop placement and toolbar insertion all use the same camera. Nodes can be placed, moved and resized at negative world coordinates. SVG connections remain visible outside the original positive drawing area. This applies to game, library and nested graph canvases that share the component.

`FlowCanvasNavigation.test.jsx` covers panning across all boundaries, starting over nodes, interruption cleanup, zoom anchoring, negative-coordinate dragging/drop/insertion and fitting the graph after a distant pan. The full test suite and production build pass; browser verification also checks horizontal movement across the original origin.
