import { applyFrameScale } from '../lib/frameScale.js';
import { moveFrameContents } from '../lib/frameContents.js';
import { includeGeneratedCharacterNodes, syncCharacterArchetypeGraph } from '../lib/characterArchetype.js';

// Pure state transitions. Every view dispatches through here, so an edit made
// anywhere (inspector, teams screen, uploader) is visible everywhere on the
// next render — there is exactly one copy of each entity.

// ---- located graphs (for hierarchical / nested node editing) ----
// A `scope` addresses one editable {nodes, edges} graph in the project:
//   { coll:'nodes' }                        → the narrative graph
//   { coll:'taskNodes' }                    → the surface Task flow
//   { coll:'masterNodes' }                  → the separate Master Story graph
//   { coll, parentId }                      → that parent node's nested `.sub`
//   { coll, parentPath:[id0,id1,…] }        → deeper nesting (≤ 3 levels)
const topKeys = (coll) => {
  if (coll === 'taskNodes') return { nk: 'taskNodes', ek: 'taskEdges', fk: 'taskFrames', mk: 'taskNumberMarkers', tk: 'taskTitleMarkers' };
  if (coll === 'storyboardNodes') return { nk: 'storyboardNodes', ek: 'storyboardEdges', fk: 'storyboardFrames', mk: 'storyboardNumberMarkers', tk: 'storyboardTitleMarkers' };
  if (coll === 'masterNodes') return { nk: 'masterNodes', ek: 'masterEdges', fk: 'masterFrames', mk: 'masterNumberMarkers', tk: 'masterTitleMarkers' };
  return { nk: 'nodes', ek: 'edges', fk: 'frames', mk: 'numberMarkers', tk: 'titleMarkers' };
};
const scopePath = (scope) => scope.parentPath ?? (scope.parentId ? [scope.parentId] : []);

export function locateGraph(state, scope) {
  const { nk, ek, fk, mk, tk } = topKeys(scope.coll);
  let nodes = state[nk] || {};
  let edges = state[ek] || [];
  let frames = state[fk] || {};
  let numberMarkers = state[mk] || {};
  let titleMarkers = state[tk] || {};
  for (const pid of scopePath(scope)) {
    const sub = nodes[pid]?.sub || { nodes: {}, edges: [], frames: {}, numberMarkers: {}, titleMarkers: {} };
    nodes = sub.nodes || {};
    edges = sub.edges || [];
    frames = sub.frames || {};
    numberMarkers = sub.numberMarkers || {};
    titleMarkers = sub.titleMarkers || {};
  }
  return { nodes, edges, frames, numberMarkers, titleMarkers };
}
function writeGraph(state, scope, next) {
  const { nk, ek, fk, mk, tk } = topKeys(scope.coll);
  const path = scopePath(scope);
  if (path.length === 0) {
    const patch = { [nk]: next.nodes, [ek]: next.edges };
    if (next.frames) patch[fk] = next.frames;
    if (next.numberMarkers) patch[mk] = next.numberMarkers;
    if (next.titleMarkers) patch[tk] = next.titleMarkers;
    return { ...state, ...patch };
  }
  // Rebuild the chain of parents immutably from the top down.
  const rebuild = (nodes, depth) => {
    const pid = path[depth];
    const parent = nodes[pid];
    if (!parent) return nodes;
    const sub = parent.sub || { nodes: {}, edges: [], frames: {}, numberMarkers: {}, titleMarkers: {} };
    const inner = depth === path.length - 1
      ? { nodes: next.nodes, edges: next.edges, frames: next.frames || sub.frames || {}, numberMarkers: next.numberMarkers || sub.numberMarkers || {}, titleMarkers: next.titleMarkers || sub.titleMarkers || {} }
      : { nodes: rebuild(sub.nodes || {}, depth + 1), edges: sub.edges || [], frames: sub.frames || {}, numberMarkers: sub.numberMarkers || {}, titleMarkers: sub.titleMarkers || {} };
    return { ...nodes, [pid]: { ...parent, sub: inner } };
  };
  return { ...state, [nk]: rebuild(state[nk], 0) };
}

// Append a change-history entry (skips pure position/history writes) so every
// node and subnode carries its own audit trail, capped at 20 entries.
const HISTORY_SKIP = new Set(['x', 'y', 'history', 'sub', 'collapsed']);
function withHistory(entity, patch) {
  const fields = Object.keys(patch).filter((k) => !HISTORY_SKIP.has(k));
  if (fields.length === 0) return { ...entity, ...patch };
  const history = [...(entity.history || []), { t: Date.now(), fields }].slice(-20);
  return { ...entity, ...patch, history };
}

export function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return action.seed;

    case 'BATCH':
      return (action.actions || []).reduce((next, child) => reducer(next, child), state);

    // Generic field edit from the inspector: { coll:'items', id, patch:{name:'…'} }
    // Narrative nodes and subnodes also log a change-history entry.
    case 'UPDATE_ENTITY': {
      const { coll, id, patch } = action;
      const current = state[coll] || {};
      const entity = current[id];
      if (!entity) return state;
      const next = (coll === 'nodes' || coll === 'subnodes') ? withHistory(entity, patch) : { ...entity, ...patch };
      return { ...state, [coll]: { ...current, [id]: next } };
    }

    // Issue a physical item to a player. Availability flips to 'in-use'
    // automatically so the Item Database reflects the assignment instantly.
    case 'ASSIGN_ITEM': {
      const { itemId, teamId, playerId } = action;
      const item = state.items[itemId];
      if (!item) return state;
      return {
        ...state,
        items: {
          ...state.items,
          [itemId]: { ...item, assignedTo: { teamId, playerId: playerId ?? null }, availability: 'in-use' },
        },
      };
    }

    case 'UNASSIGN_ITEM': {
      const item = state.items[action.itemId];
      if (!item) return state;
      return {
        ...state,
        items: { ...state.items, [action.itemId]: { ...item, assignedTo: null, availability: 'ready' } },
      };
    }

    // Place an item in the field (environmental placement) → 'deployed'.
    case 'DEPLOY_ITEM': {
      const item = state.items[action.itemId];
      if (!item) return state;
      return {
        ...state,
        items: {
          ...state.items,
          [action.itemId]: { ...item, locationId: action.locationId, assignedTo: null, availability: 'deployed' },
        },
      };
    }

    // Issue sensor hardware (NFC reader, button box, …) to a player role.
    case 'ASSIGN_SENSOR': {
      const sensor = state.sensors[action.sensorId];
      if (!sensor) return state;
      return {
        ...state,
        sensors: { ...state.sensors, [action.sensorId]: { ...sensor, assignedTo: action.playerId ?? null } },
      };
    }

    // Add/remove a hardware requirement on an item.
    case 'ADD_SENSOR_REQ': {
      const item = state.items[action.itemId];
      if (!item || item.sensorReqs.some((r) => r.sensorId === action.sensorId)) return state;
      return {
        ...state,
        items: {
          ...state.items,
          [action.itemId]: { ...item, sensorReqs: [...item.sensorReqs, { sensorId: action.sensorId, note: action.note || '' }] },
        },
      };
    }
    case 'REMOVE_SENSOR_REQ': {
      const item = state.items[action.itemId];
      if (!item) return state;
      return {
        ...state,
        items: {
          ...state.items,
          [action.itemId]: { ...item, sensorReqs: item.sensorReqs.filter((r) => r.sensorId !== action.sensorId) },
        },
      };
    }

    case 'DELETE_ENTITY': {
      const { coll, id } = action;
      if (!state[coll]?.[id]) return state;
      const next = { ...state[coll] };
      delete next[id];
      return coll === 'titleMarkers' || coll === 'frameworks'
        ? { ...state, [coll]: next, edges: state.edges.filter((e) => e.from !== id && e.to !== id) }
        : { ...state, [coll]: next };
    }

    // "Add new" buttons: insert a fresh entity into a collection.
    case 'ADD_ENTITY': {
      const { coll, entity } = action;
      const current = state[coll] || {};
      if (!entity?.id || current[entity.id]) return state;
      return { ...state, [coll]: { ...current, [entity.id]: entity } };
    }

    // CSV import: entities are fully built by the caller (existing records
    // merged, new records from blanks) and replace by id.
    case 'IMPORT_ENTITIES': {
      const { coll, entities } = action;
      return { ...state, [coll]: { ...state[coll], ...entities } };
    }

    // Library → project import: pre-built instances land in the game.
    case 'IMPORT_FROM_LIBRARY': {
      return {
        ...state,
        items: { ...state.items, ...(action.items || {}) },
        locations: { ...state.locations, ...(action.locations || {}) },
        sensors: { ...state.sensors, ...(action.sensors || {}) },
        mechanics: { ...(state.mechanics || {}), ...(action.mechanics || {}) },
        nodes: { ...state.nodes, ...(action.nodes || {}) },
        subnodes: { ...(state.subnodes || {}), ...(action.subnodes || {}) },
        frameworks: { ...(state.frameworks || {}), ...(action.frameworks || {}) },
        frames: { ...(state.frames || {}), ...(action.frames || {}) },
        numberMarkers: { ...(state.numberMarkers || {}), ...(action.numberMarkers || {}) },
        titleMarkers: { ...(state.titleMarkers || {}), ...(action.titleMarkers || {}) },
        edges: action.edges?.length ? [...state.edges, ...action.edges] : state.edges,
      };
    }

    case 'RENAME_PROJECT': {
      return { ...state, meta: { ...state.meta, name: action.name } };
    }

    // Per-game settings (hero backdrop image + opacity, etc.).
    case 'SET_META': {
      return { ...state, meta: { ...state.meta, ...action.patch } };
    }

    case 'SET_STORY_DYNAMICS_GRAPH': {
      return { ...state, storyDynamicsGraph: action.graph };
    }

    case 'SYNC_CHARACTER_ARCHETYPE': {
      const scope = action.scope || { coll: 'nodes' };
      const graph = locateGraph(state, scope);
      const next = syncCharacterArchetypeGraph(graph, action.id, action.patch);
      return next === graph ? state : writeGraph(state, scope, next);
    }

    // Delete a node and every connection (and Weaver alignment) touching it.
    // Subnodes attached to it are detached (set floating), never destroyed.
    case 'DELETE_NODE': {
      const { nodeId } = action;
      if (!state.nodes[nodeId]) return state;
      const nodes = { ...state.nodes };
      const removed = includeGeneratedCharacterNodes(nodes, [nodeId]);
      removed.forEach((id) => delete nodes[id]);
      const subnodes = Object.fromEntries(Object.entries(state.subnodes || {}).map(([id, sn]) =>
        [id, sn.parentRef?.nodeId === nodeId ? { ...sn, parentRef: null } : sn]));
      return {
        ...state, nodes, subnodes,
        edges: state.edges.filter((e) => !removed.has(e.from) && !removed.has(e.to)),
        alignments: (state.alignments || []).filter((a) => a.story !== nodeId && a.task !== nodeId),
      };
    }

    // Delete a subnode: cascades to its child subnodes and removes any canvas
    // connections that start or end on the deleted subnodes.
    case 'DELETE_SUBNODE': {
      const { subnodeId } = action;
      if (!state.subnodes?.[subnodeId]) return state;
      const doomed = new Set([subnodeId]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const sn of Object.values(state.subnodes)) {
          if (!doomed.has(sn.id) && sn.parentRef?.subnodeId && doomed.has(sn.parentRef.subnodeId)) { doomed.add(sn.id); grew = true; }
        }
      }
      const subnodes = Object.fromEntries(Object.entries(state.subnodes).filter(([id]) => !doomed.has(id)));
      return { ...state, subnodes, edges: state.edges.filter((e) => !doomed.has(e.from) && !doomed.has(e.to)) };
    }

    case 'CLEAR_NARRATIVE_CANVAS': {
      return {
        ...state,
        nodes: {},
        subnodes: {},
        frameworks: {},
        frames: {},
        numberMarkers: {},
        titleMarkers: {},
        edges: [],
        alignments: [],
      };
    }

    // Weaver: position of a story beat on the left story-track canvas
    // (kept separate from its Narrative & Quests canvas position).
    case 'SET_STORY_POS': {
      return { ...state, storyTrack: { ...(state.storyTrack || {}), [action.nodeId]: { x: action.x, y: action.y } } };
    }

    // Weaver: conceptual alignment links between a story beat and a task.
    case 'ADD_ALIGN': {
      const aligns = state.alignments || [];
      if (aligns.some((a) => a.story === action.story && a.task === action.task)) return state;
      return { ...state, alignments: [...aligns, { story: action.story, task: action.task }] };
    }
    case 'REMOVE_ALIGN': {
      return { ...state, alignments: (state.alignments || []).filter((a) => !(a.story === action.story && a.task === action.task)) };
    }

    // Edit a connection's label (or other fields).
    case 'UPDATE_EDGE': {
      const { from, to, patch } = action;
      return { ...state, edges: state.edges.map((e) => (e.from === from && e.to === to ? { ...e, ...patch } : e)) };
    }

    // ---- scenario graph editing ----
    case 'ADD_NODE': {
      const n = action.node;
      if (!n?.id || state.nodes[n.id]) return state;
      return { ...state, nodes: { ...state.nodes, [n.id]: n } };
    }

    // Connect two nodes (or subnodes — e.g. an Outcome branch merging into a
    // later node). Ignores self-loops and duplicate connections.
    case 'ADD_EDGE': {
      const { from, to, label = '', color = null, fromSide = 'right', toSide = 'left' } = action;
      const exists = (id) => state.nodes[id] || state.subnodes?.[id] || state.frameworks?.[id] || state.titleMarkers?.[id];
      if (from === to || !exists(from) || !exists(to)) return state;
      if (state.edges.some((e) => e.from === from && e.to === to)) {
        return { ...state, edges: state.edges.map((e) => e.from === from && e.to === to ? { ...e, fromSide, toSide } : e) };
      }
      return { ...state, edges: [...state.edges, { from, to, label, color, fromSide, toSide }] };
    }

    // ---- frames: purely visual grouping; moving a frame carries members ----
    // Members are recomputed by containment on every step: nodes/subnodes
    // whose top-left sits inside the frame, and frames fully inside it.
    case 'FRAME_MOVE': {
      const { frameId, dx, dy } = action;
      const moved = moveFrameContents(state, frameId, dx, dy);
      return moved ? { ...state, ...moved } : state;
    }

    case 'FRAME_SCALE':
      return applyFrameScale(state, action.frameId, action.transform);

    // Convert a Frame into a Composite (concept node): member nodes move into
    // the new node's sub-graph; interior edges follow; edges crossing the
    // boundary re-point to the composite. The frame itself disappears.
    case 'FRAME_TO_COMPOSITE': {
      const { frameId, nodeId } = action;
      const fr = state.frames?.[frameId];
      if (!fr || !nodeId || state.nodes[nodeId]) return state;
      const inside = (n) => n.x >= fr.x && n.x <= fr.x + fr.w && n.y >= fr.y && n.y <= fr.y + fr.h;
      const memberIds = new Set(Object.values(state.nodes).filter(inside).map((n) => n.id));
      if (memberIds.size === 0) return state;
      const subNodes = {};
      for (const id of memberIds) {
        const n = state.nodes[id];
        subNodes[id] = { ...n, x: n.x - fr.x + 20, y: n.y - fr.y + 20 };
      }
      const subEdges = state.edges.filter((e) => memberIds.has(e.from) && memberIds.has(e.to));
      const edges = state.edges
        .filter((e) => !(memberIds.has(e.from) && memberIds.has(e.to)))
        .map((e) => ({
          ...e,
          from: memberIds.has(e.from) ? nodeId : e.from,
          to: memberIds.has(e.to) ? nodeId : e.to,
        }))
        .filter((e) => e.from !== e.to);
      const nodes = Object.fromEntries(Object.entries(state.nodes).filter(([id]) => !memberIds.has(id)));
      nodes[nodeId] = {
        id: nodeId, kind: 'concept', conceptKind: 'structureConcept', conceptId: null,
        title: fr.label || 'Composite', x: fr.x, y: fr.y, body: '', color: fr.color ?? null,
        teamId: null, sets: [], collapsed: true, conceptAnswers: {},
        sub: { nodes: subNodes, edges: subEdges },
      };
      const frames = { ...state.frames };
      delete frames[frameId];
      const subnodes = Object.fromEntries(Object.entries(state.subnodes || {}).map(([id, sn]) =>
        [id, sn.parentRef?.nodeId && memberIds.has(sn.parentRef.nodeId) ? { ...sn, parentRef: { nodeId } } : sn]));
      return { ...state, nodes, edges, frames, subnodes };
    }

    // Convert a Composite (concept node) back into a Frame: its sub-graph
    // spills onto the canvas grouped under a new frame; the node disappears.
    case 'COMPOSITE_TO_FRAME': {
      const { nodeId, frameId } = action;
      const n = state.nodes[nodeId];
      if (!n?.sub || !frameId || state.frames?.[frameId]) return state;
      const inner = Object.values(n.sub.nodes || {});
      if (inner.length === 0) return state;
      const nodes = { ...state.nodes };
      delete nodes[nodeId];
      const remap = {};
      for (const m of inner) {
        let id = m.id;
        while (nodes[id]) id = `${id}X`; // avoid collisions with canvas ids
        remap[m.id] = id;
        nodes[id] = { ...m, id, x: n.x + m.x - 20 + 0, y: n.y + m.y - 20 + 34 };
      }
      const maxX = Math.max(...inner.map((m) => m.x)) + 260;
      const maxY = Math.max(...inner.map((m) => m.y)) + 140;
      const frames = { ...(state.frames || {}), [frameId]: { id: frameId, label: n.title, x: n.x, y: n.y, w: maxX, h: maxY + 34, color: n.color ?? null } };
      const innerEdges = (n.sub.edges || []).map((e) => ({ ...e, from: remap[e.from], to: remap[e.to] }));
      const edges = [...state.edges.filter((e) => e.from !== nodeId && e.to !== nodeId), ...innerEdges];
      return { ...state, nodes, edges, frames };
    }

    case 'REMOVE_EDGE': {
      return { ...state, edges: state.edges.filter((e) => !(e.from === action.from && e.to === action.to)) };
    }

    // ---- generic located-graph editing (surface task flow + nested subs) ----
    case 'GRAPH_ADD_NODE': {
      const { scope, node } = action;
      const g = locateGraph(state, scope);
      if (!node?.id || g.nodes[node.id]) return state;
      return writeGraph(state, scope, { nodes: { ...g.nodes, [node.id]: node }, edges: g.edges });
    }
    case 'GRAPH_UPDATE_NODE': {
      const { scope, id, patch } = action;
      const g = locateGraph(state, scope);
      if (!g.nodes[id]) return state;
      return writeGraph(state, scope, { nodes: { ...g.nodes, [id]: { ...g.nodes[id], ...patch } }, edges: g.edges });
    }
    case 'GRAPH_DELETE_NODE': {
      const { scope, id } = action;
      const g = locateGraph(state, scope);
      if (!g.nodes[id]) return state;
      const nodes = { ...g.nodes };
      const removed = includeGeneratedCharacterNodes(nodes, [id]);
      removed.forEach((nodeId) => delete nodes[nodeId]);
      const next = writeGraph(state, scope, { nodes, edges: g.edges.filter((e) => !removed.has(e.from) && !removed.has(e.to)) });
      // Deleting a top-level task also clears its Weaver alignments.
      if ((scope.coll === 'taskNodes' || scope.coll === 'storyboardNodes') && !scopePath(scope).length) {
        next.alignments = (next.alignments || []).filter((a) => a.task !== id);
      }
      if (scope.coll === 'masterNodes' && !scopePath(scope).length) {
        next.alignments = (next.alignments || []).filter((a) => a.story !== id);
      }
      return next;
    }
    case 'GRAPH_ADD_EDGE': {
      const { scope, from, to, label = '', color = null, fromSide = 'right', toSide = 'left' } = action;
      const g = locateGraph(state, scope);
      const exists = (id) => g.nodes[id] || g.titleMarkers?.[id];
      if (from === to || !exists(from) || !exists(to)) return state;
      if (g.edges.some((e) => e.from === from && e.to === to)) {
        return writeGraph(state, scope, { nodes: g.nodes, edges: g.edges.map((e) => e.from === from && e.to === to ? { ...e, fromSide, toSide } : e) });
      }
      return writeGraph(state, scope, { nodes: g.nodes, edges: [...g.edges, { from, to, label, color, fromSide, toSide }] });
    }
    case 'GRAPH_UPDATE_EDGE': {
      const { scope, from, to, patch } = action;
      const g = locateGraph(state, scope);
      return writeGraph(state, scope, { nodes: g.nodes, edges: g.edges.map((e) => (e.from === from && e.to === to ? { ...e, ...patch } : e)) });
    }
    case 'GRAPH_REMOVE_EDGE': {
      const { scope, from, to } = action;
      const g = locateGraph(state, scope);
      return writeGraph(state, scope, { nodes: g.nodes, edges: g.edges.filter((e) => !(e.from === from && e.to === to)) });
    }

    // Uploaded file lands on the entity's image field — `field` picks which
    // one (default cover 'image'; locations also have 'schematic').
    case 'GRAPH_CLEAR': {
      const { scope } = action;
      const next = writeGraph(state, scope, { nodes: {}, edges: [], frames: {}, numberMarkers: {}, titleMarkers: {} });
      if ((scope.coll === 'taskNodes' || scope.coll === 'storyboardNodes' || scope.coll === 'masterNodes') && !scopePath(scope).length) {
        next.alignments = [];
      }
      return next;
    }

    case 'GRAPH_ADD_FRAME': {
      const { scope, frame } = action;
      const g = locateGraph(state, scope);
      if (!frame?.id || g.frames?.[frame.id]) return state;
      return writeGraph(state, scope, { nodes: g.nodes, edges: g.edges, frames: { ...(g.frames || {}), [frame.id]: frame } });
    }
    case 'GRAPH_UPDATE_FRAME': {
      const { scope, id, patch } = action;
      const g = locateGraph(state, scope);
      if (!g.frames?.[id]) return state;
      return writeGraph(state, scope, { nodes: g.nodes, edges: g.edges, frames: { ...g.frames, [id]: { ...g.frames[id], ...patch } } });
    }
    case 'GRAPH_SCALE_FRAME': {
      const { scope, id, transform } = action;
      const g = locateGraph(state, scope);
      return writeGraph(state, scope, applyFrameScale(g, id, transform));
    }
    case 'GRAPH_DELETE_FRAME': {
      const { scope, id } = action;
      const g = locateGraph(state, scope);
      if (!g.frames?.[id]) return state;
      const frames = { ...g.frames };
      delete frames[id];
      return writeGraph(state, scope, { nodes: g.nodes, edges: g.edges, frames });
    }
    case 'GRAPH_ADD_NUMBER_MARKER': {
      const { scope, marker } = action;
      const g = locateGraph(state, scope);
      if (!marker?.id || g.numberMarkers?.[marker.id]) return state;
      return writeGraph(state, scope, { nodes: g.nodes, edges: g.edges, frames: g.frames, numberMarkers: { ...(g.numberMarkers || {}), [marker.id]: marker } });
    }
    case 'GRAPH_UPDATE_NUMBER_MARKER': {
      const { scope, id, patch } = action;
      const g = locateGraph(state, scope);
      if (!g.numberMarkers?.[id]) return state;
      return writeGraph(state, scope, { nodes: g.nodes, edges: g.edges, frames: g.frames, numberMarkers: { ...g.numberMarkers, [id]: { ...g.numberMarkers[id], ...patch } } });
    }
    case 'GRAPH_DELETE_NUMBER_MARKER': {
      const { scope, id } = action;
      const g = locateGraph(state, scope);
      if (!g.numberMarkers?.[id]) return state;
      const numberMarkers = { ...g.numberMarkers };
      delete numberMarkers[id];
      return writeGraph(state, scope, { nodes: g.nodes, edges: g.edges, frames: g.frames, numberMarkers });
    }
    case 'GRAPH_ADD_TITLE_MARKER': {
      const { scope, marker } = action;
      const g = locateGraph(state, scope);
      if (!marker?.id || g.titleMarkers?.[marker.id]) return state;
      return writeGraph(state, scope, { nodes: g.nodes, edges: g.edges, frames: g.frames, numberMarkers: g.numberMarkers, titleMarkers: { ...(g.titleMarkers || {}), [marker.id]: marker } });
    }
    case 'GRAPH_UPDATE_TITLE_MARKER': {
      const { scope, id, patch } = action;
      const g = locateGraph(state, scope);
      if (!g.titleMarkers?.[id]) return state;
      return writeGraph(state, scope, { nodes: g.nodes, edges: g.edges, frames: g.frames, numberMarkers: g.numberMarkers, titleMarkers: { ...g.titleMarkers, [id]: { ...g.titleMarkers[id], ...patch } } });
    }
    case 'GRAPH_DELETE_TITLE_MARKER': {
      const { scope, id } = action;
      const g = locateGraph(state, scope);
      if (!g.titleMarkers?.[id]) return state;
      const titleMarkers = { ...g.titleMarkers };
      delete titleMarkers[id];
      return writeGraph(state, scope, { nodes: g.nodes, edges: g.edges.filter((e) => e.from !== id && e.to !== id), frames: g.frames, numberMarkers: g.numberMarkers, titleMarkers });
    }
    case 'GRAPH_MOVE_FRAME': {
      const { scope, id, dx, dy } = action;
      const g = locateGraph(state, scope);
      const moved = moveFrameContents(g, id, dx, dy);
      return moved ? writeGraph(state, scope, { ...g, ...moved }) : state;
    }

    case 'SET_IMAGE': {
      const { coll, id, image, field = 'image' } = action;
      const entity = state[coll][id];
      if (!entity) return state;
      return { ...state, [coll]: { ...state[coll], [id]: { ...entity, [field]: image } } };
    }

    default:
      return state;
  }
}

// ---------- selectors (derived views; keep single source of truth) ----------

export const itemList = (s) => Object.values(s.items);

export const itemsAssignedToTeam = (s, teamId) =>
  itemList(s).filter((i) => i.assignedTo?.teamId === teamId);

export const itemsAssignedToPlayer = (s, playerId) =>
  itemList(s).filter((i) => i.assignedTo?.playerId === playerId);

export const sensorsAssignedToPlayer = (s, playerId) =>
  Object.values(s.sensors).filter((x) => x.assignedTo === playerId);

export const availableItems = (s) => itemList(s).filter((i) => i.availability === 'ready');

export const playersOfTeam = (s, teamId) =>
  Object.values(s.players).filter((p) => p.teamId === teamId);

// The cross-reference at the heart of the app: a flow node resolves to live
// records — item/location/sensor instances from the project, rules from the
// library master database.
export const resolveNode = (s, lib, nodeId) => {
  const node = s.nodes[nodeId];
  if (!node) return null;
  return {
    node,
    item: node.itemId ? s.items[node.itemId] : null,
    location: node.locationId ? s.locations[node.locationId] : null,
    mechanics: (node.mechanicIds || []).map((id) => lib.mechanics[id]).filter(Boolean),
    sensors: (node.sensorIds || []).map((id) => s.sensors[id]).filter(Boolean),
  };
};
