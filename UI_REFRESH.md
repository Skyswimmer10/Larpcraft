# Optional UI first pass

Use **Refreshed UI · On** in the top-right title bar to return to the original
appearance. Click **Refreshed UI · Off** to enable it again. The preference is
stored separately as `larpcraft:refreshed-ui`; no library or game migration is used.

The refresh includes larger interface text, brighter secondary text, automatic
hiding of an empty inspector, a wider inspector with a sticky heading, compact
single-column palette rows, collapsible palette groups, and a palette resize grip
(drag, or focus it and use Left/Right arrows). Search reveals matching entries
even inside collapsed groups. Focus mode hides navigation, palette, and inspector
without unmounting the editors; Exit focus restores their previous states.

Appearance overrides live in `src/ui-refresh.css` and are scoped to `.ui-refresh`.
`AppearanceContext.jsx` controls the feature. App and NodePalette integrations
are conditional; turning it off restores their original presentation. The only
control retained in the original appearance is the opt-in toggle itself.

This pass does not reposition existing nodes or modify saved content.

## Second pass

Refreshed mode also includes compact framework cards with a native full-detail
modal (Close or Escape), an Annotate dropdown preserving all annotation actions,
Story / Timeline / Split view controls, Fit all and Focus selection, and selected
connection emphasis. Original presentation returns when Refreshed UI is off.
Auto-arrange is explicit, applies to selected nodes when multiple are selected,
otherwise all nodes, and offers Undo arrange. It uses the existing grouped move
callbacks. It is disabled for framed layouts to preserve grouping geometry.
`nFollow-up: original inspector sizing restored; annotations use an inline tray beneath the toolbar; palette descriptions use a hover/focus popup without resizing rows. Navigation uses light outline icons in refreshed mode.
