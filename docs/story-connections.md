# Guided node-to-node story creation

**Connect story** sits beside Conversations in the Narrative Weaver, including nested narrative canvases. It is a local editing mode: the button changes colour and its status dot lights when enabled. Toggling it opens no window. Other canvases and normal linking remain available.

In this mode, drawing between supported narrative nodes opens a compact connection workshop before saving the edge. Cancel or Escape discards the new connection and its unsaved answers. Supported pairs cover Character, Group, Story Item, Story Location and Story Beat, including all fifteen same-type/mixed-type combinations. Existing Event/Quest and concept nodes use the story-moment guidance. Framework, annotation, physical player/team and supporting subnodes retain normal linking.

Each pair offers six concrete interactions, symbols and soft colour accents, plus a question specific to the selected pattern and the current names. Examples: a character seeks/conceals/inherits/misunderstands/surrenders/uses an item; an item unlocks/contaminates/reveals/is hidden at/is taken from/belongs at a location. Same-type pairs can reverse who acts. Mixed-type guidance identifies the person/object/place independently of the direction the line was drawn.

Interaction → Pressure → Players → Consequence develops one connection. Pressure offers eight visible families and concrete variations. Player entry and interaction remain distinct. Consequence fields open immediately and stay unrecorded until edited. Reasons and free detail are optional. The preview is on the right, approximately 28% of the width.

Saving writes one versioned edge.storyLink record, containing the pattern, optional reversed roles, reason, free detail and optional workshop answers. Click the saved line label to reopen it, whether the mode is on or off. An existing ordinary edge can gain story answers without being duplicated. Side attachments and other edge metadata are preserved; saving is one undoable batch.

The connected story is a live view of the connected graph component. Connecting two existing components brings their authored connections and Story Beat/concept writing into the same preview. Current work is highlighted. Names resolve from current nodes; biographies and item descriptions remain separate. Normal narrative links and visible relationship links contribute connectivity. No second canonical story or duplicate character is created. Joining components does not automatically reconcile contradictory authored facts.

Native project saves retain the connections. Copy/paste, saved story-structure reuse and the narrative CSV storyLinks column retain their answers while endpoint IDs are remapped by the existing graph transfer workflow. Removing a connection separates the resulting components; deleting an endpoint removes its incident connections. Nested scopes are kept separate even when node IDs coincide.
