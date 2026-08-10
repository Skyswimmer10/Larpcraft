import React, { useState } from 'react';
import { useGame, useDispatch, useLibrary, useLibraryDispatch } from '../state/store.jsx';
import { ENTITY_COLORS, Pill, PrimIcon } from '../components/bits.jsx';
import FlowCanvas, { visibleCanvasPlacement } from '../components/FlowCanvas.jsx';
import StructureThumb from '../components/StructureThumb.jsx';
import CsvButtons from '../components/CsvButtons.jsx';
import NodePalette from '../components/NodePalette.jsx';
import NarrativeLibraryBrowser from '../components/NarrativeLibraryBrowser.jsx';
import FrameworkPreview from '../components/FrameworkPreview.jsx';
import { genId } from '../data/csvSchemas.js';
import {
  BASE_NODE_TYPES, CONCEPT_INTERNAL_NODE_TYPES, ADDITIONAL_NODE_TYPES, SUBNODE_TYPES, SUBNODE_BLANK, LINKING_NODE_TYPE,
  FACT_KINDS, NARR_NODE_TYPES, FRAMEWORK_TYPES, cloneCharacterCardTemplate,
} from '../data/seed.js';
import GraphEditor from '../components/GraphEditor.jsx';
import { nextVisualMarkerValue } from '../lib/visualMarkers.js';
import LinkingNodePreview from '../components/LinkingNodePreview.jsx';
import { buildNarrativeLinkInsertion, createLinkingNode, LINKING_NODE_KIND, STORY_STRUCTURE_CONTAINER_KIND } from '../lib/narrativeLinks.js';
import { remapCanvasClipboard } from '../lib/canvasClipboard.js';

// The Narrative Weaver canvas: Base Nodes + collapsed Additional Nodes
// (concepts) + Subnodes, kept deliberately calm — icons, short titles and
// badges live here; everything else lives in the inspector.

const BASE_PALETTE = Object.values(BASE_NODE_TYPES);
const CONCEPT_INTERNAL_PALETTE = Object.values(CONCEPT_INTERNAL_NODE_TYPES);
const CONCEPT_GRAPH_PALETTE = [...CONCEPT_INTERNAL_PALETTE, ...BASE_PALETTE];
const SUB_PALETTE = Object.values(SUBNODE_TYPES);

export const nodeColor = (n) => {
  if (n._sub) return n.color || SUBNODE_TYPES[n.kind]?.color || '#F08CB4';
  if (n.kind === 'framework') return n.color || FRAMEWORK_TYPES[n.frameworkId]?.color || '#E8D25C';
  if (n.kind === 'concept') return n.color || ADDITIONAL_NODE_TYPES[n.conceptKind]?.color || '#E8D25C';
  if (n.kind === LINKING_NODE_KIND) return n.color || LINKING_NODE_TYPE.color;
  if (n.kind === STORY_STRUCTURE_CONTAINER_KIND) return n.color || '#5CA8F5';
  return n.color || BASE_NODE_TYPES[n.kind]?.color || NARR_NODE_TYPES[n.kind]?.color || ENTITY_COLORS[n.kind] || '#8B92A6';
};
const nodeIcon = (n) => {
  if (n._sub) return SUBNODE_TYPES[n.kind]?.icon || null;
  if (n.kind === 'framework') return FRAMEWORK_TYPES[n.frameworkId]?.icon || 'target';
  if (n.kind === 'concept') return ADDITIONAL_NODE_TYPES[n.conceptKind]?.icon || 'book';
  if (n.kind === LINKING_NODE_KIND) return LINKING_NODE_TYPE.icon;
  if (n.kind === STORY_STRUCTURE_CONTAINER_KIND) return 'layers';
  return BASE_NODE_TYPES[n.kind]?.icon || NARR_NODE_TYPES[n.kind]?.icon || null;
};

// A one-line canvas summary per subnode kind (details live in the inspector).
const subBody = (sn) => {
  switch (sn.kind) {
    case 'outcomeBranches': return `${sn.branches?.length ?? 0} branches · ${sn.mode}`;
    case 'relChange': return `${sn.relType || 'relationship'} · ${sn.direction}`;
    case 'internalState': return `${sn.stateType || 'state'}${sn.level ? ` · ${sn.level}` : ''}`;
    case 'locationArchetype': return sn.archetype;
    case 'narrativeResponse': return sn.text ? `${sn.text.slice(0, 60)}…` : 'empty';
    case 'emotionalTone': return (sn.tags || []).join(' · ') || 'no tags';
    case 'comment': return sn.notes ? `${sn.notes.slice(0, 80)}${sn.notes.length > 80 ? '...' : ''}` : 'empty comment';
    default: return '';
  }
};

// Retired story-structure import modal kept disabled for reference.
// Story structures are edited in the Library instead of imported here.
/*
function StructureImportModal({ onClose, onImported }) {
  const lib = useLibrary();
  const proj = useGame();
  const dispatch = useDispatch();
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modalhead">
          <b>Retired story-structure import</b>
          <button className="x big" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="structgrid">
          {Object.values(lib.stories).map((st) => (
            <div className="structcard" key={st.id}>
              <StructureThumb structure={st} lib={lib} />
              <b>{st.name}</b>
              <small>{st.description}</small>
              <div className="structmeta">
                <span className="mono">~{st.estMinutes} min</span>
                <span className="mono dim">{Object.keys(st.nodes).length} nodes</span>
                <button className="btn primary" onClick={() => {
                  const result = importStory(lib, proj, st.id);
                  if (!result) return;
                  dispatch({ type: 'IMPORT_FROM_LIBRARY', ...result });
                  onImported(result.createdId);
                }}>Import</button>
              </div>
            </div>
          ))}
        </div>
        <div className="modalfoot dim">Importing creates a detached copy on this game's canvas — the master template is untouched.</div>
      </div>
    </div>
  );
}

*/
export default function ScenarioFlow({ selection, onSelect, onNavigate }) {
  const s = useGame();
  const lib = useLibrary();
  const dispatch = useDispatch();
  const libDispatch = useLibraryDispatch();
  const [browsingLibrary, setBrowsingLibrary] = useState(false);
  const [paletteFilter, setPaletteFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [openPath, setOpenPath] = useState([]); // drill-in path, ≤ 3 levels
  const facts = s.facts || {};
  const subnodesColl = s.subnodes || {};

  // ---- drill-in (Edit viewport for concepts / any node's inner graph) ----
  const openTitles = [];
  {
    let cur = s.nodes;
    for (const pid of openPath) {
      const n = cur?.[pid];
      if (!n) break;
      openTitles.push(n.title);
      cur = n.sub?.nodes;
    }
  }
  if (openPath.length && openTitles.length === openPath.length) {
    const depth = openPath.length;
    return (
      <div className="main">
        <div className="mhead">
          <div>
            <div className="crumb">
              {s.meta.name} / <button className="crumblink" onClick={() => { setOpenPath([]); onSelect(null); }}>Narrative</button>
              {openTitles.map((t, i) => (
                <span key={i}> / {i === openTitles.length - 1 ? <b>{t}</b>
                  : <button className="crumblink" onClick={() => { setOpenPath(openPath.slice(0, i + 1)); onSelect(null); }}>{t}</button>}</span>
              ))}
            </div>
            <h2>{openTitles[openTitles.length - 1]} · internal structure</h2>
          </div>
          <div className="right">
            <button className="btn" onClick={() => { setOpenPath(openPath.slice(0, -1)); onSelect(null); }}>← Up one level</button>
          </div>
        </div>
        <div className="subintro dim">Dedicated editing viewport — build the internal nodes, then return. Level {depth} of 3.</div>
        <GraphEditor scope={{ coll: 'nodes', parentPath: openPath }} palette={CONCEPT_GRAPH_PALETTE}
          idPrefix={`${s.meta.prefix}-S`} selection={selection} onSelect={onSelect}
          enableFrames
          allowOpen={depth < 3} onOpen={(id) => { setOpenPath([...openPath, id]); onSelect(null); }} />
        <div className="statusbar"><span>Editing an internal structure · saves live · <b>← Up one level</b> returns{depth < 3 ? ' · double-click nests one level deeper' : ' · max nesting depth reached'}.</span></div>
      </div>
    );
  }

  // ---- merged canvas model: nodes + subnodes in one map ----
  const merged = { ...s.nodes };
  for (const sn of Object.values(subnodesColl)) {
    merged[sn.id] = { ...sn, _sub: true, body: subBody(sn) };
  }
  for (const fw of Object.values(s.frameworks || {})) {
    const type = FRAMEWORK_TYPES[fw.frameworkId] || FRAMEWORK_TYPES.fate;
    merged[fw.id] = { ...fw, kind: 'framework', title: fw.title || type.title, body: type.summary };
  }

  // Subnode → parent attachment lines (with branch labels where relevant).
  const attachments = [];
  for (const sn of Object.values(subnodesColl)) {
    const pr = sn.parentRef;
    if (!pr) continue;
    const to = pr.nodeId || pr.subnodeId;
    if (!merged[to]) continue;
    let label = 'enriches';
    if (pr.subnodeId && pr.branchIndex != null) {
      const parent = subnodesColl[pr.subnodeId];
      label = parent?.branches?.[pr.branchIndex]?.label || `branch ${pr.branchIndex + 1}`;
    }
    attachments.push({ from: sn.id, to, label, color: SUBNODE_TYPES[sn.kind]?.color });
  }

  const addBase = (kind, pos = null) => {
    const id = genId(s.nodes, `${s.meta.prefix}-N-`);
    const nodePos = pos || visibleCanvasPlacement({ x: 90, y: 80 });
    dispatch({
      type: 'ADD_NODE',
      node: {
        id, kind, title: `New ${BASE_NODE_TYPES[kind].label.toLowerCase()}`,
        x: nodePos.x, y: nodePos.y,
        body: '', color: null, teamId: null, sets: [],
        locationId: null, itemId: null, mechanicIds: [], sensorIds: [], history: [],
        ...(kind === 'item' ? {
          itemType: 'Artifact', shortTitle: 'Item', playerDescription: '', facilitatorDescription: '', imageRef: '',
          buildStatus: 'concept', origin: '', placementNodeIds: [], linkedMechanicNodeIds: [], linkedMechanicIds: [],
          sensorHooks: '', noSoloSolve: false, mechanicMeaning: '', attachedTemplateNotes: '', persistsAcrossTasks: false,
        } : {}),
        ...(kind === 'character' ? cloneCharacterCardTemplate(s.meta.characterCardTemplate) : {}),
      },
    });
    onSelect({ kind: 'node', id });
  };
  const addSub = (kind, pos = null, template = null) => {
    const id = genId(subnodesColl, `${s.meta.prefix}-SB-`);
    const nodePos = pos || visibleCanvasPlacement({ x: 120, y: 120 }, { w: 196, h: 110 });
    const sn = {
      ...SUBNODE_BLANK(id, kind),
      ...(template || {}),
      id,
      x: nodePos.x,
      y: nodePos.y,
      parentRef: null,
      history: [],
    };
    dispatch({ type: 'ADD_ENTITY', coll: 'subnodes', entity: sn });
    onSelect({ kind: 'subnode', id });
  };
  const addLinkingNode = (pos = null) => {
    const nodePos = pos || visibleCanvasPlacement({ x: 120, y: 120 }, { w: 280, h: 150 });
    const node = createLinkingNode(s.nodes, nodePos, `${s.meta.prefix}-LINK-`);
    dispatch({ type: 'ADD_NODE', node });
    onSelect({ kind: 'node', id: node.id });
  };
  const insertLinkedTarget = (linkNode, ref) => {
    const size = { w: linkNode.w || 280, h: linkNode.h || 150 };
    const node = buildNarrativeLinkInsertion(
      lib,
      ref,
      s.nodes,
      { x: linkNode.x + size.w + 50, y: linkNode.y },
      `${s.meta.prefix}-INS-`,
    );
    if (!node) return;
    dispatch({ type: 'ADD_NODE', node });
    onSelect({ kind: 'node', id: node.id });
  };
  const addFrame = (pos = null) => {
    const id = genId(s.frames || {}, 'FR-');
    const size = { w: 420, h: 300 };
    const framePos = pos || visibleCanvasPlacement({ x: 60, y: 60 }, size);
    dispatch({ type: 'ADD_ENTITY', coll: 'frames', entity: { id, label: 'New frame', ...framePos, ...size, color: null } });
    onSelect({ kind: 'frame', id });
  };
  const addCircle = (pos = null) => {
    const id = genId(s.frames || {}, 'CIR-');
    const size = { w: 160, h: 160 };
    const circlePos = pos || visibleCanvasPlacement({ x: 80, y: 80 }, size);
    dispatch({ type: 'ADD_ENTITY', coll: 'frames', entity: { id, label: 'Circle', shape: 'circle', ...circlePos, ...size, color: '#5CA8F5' } });
    onSelect({ kind: 'frame', id });
  };
  const addArrow = (pos = null) => {
    const id = genId(s.frames || {}, 'ARR-');
    const arrowPos = pos || visibleCanvasPlacement({ x: 100, y: 100 }, { w: 200, h: 80 });
    dispatch({ type: 'ADD_ENTITY', coll: 'frames', entity: { id, label: 'Arrow', shape: 'arrow', ...arrowPos, w: 200, h: 80, color: '#5CA8F5' } });
    onSelect({ kind: 'frame', id });
  };
  const addSpline = (pos = null) => {
    const id = genId(s.frames || {}, 'SPL-');
    const splinePos = pos || visibleCanvasPlacement({ x: 100, y: 150 }, { w: 220, h: 80 });
    dispatch({ type: 'ADD_ENTITY', coll: 'frames', entity: { id, label: 'Spline', shape: 'spline', ...splinePos, w: 220, h: 80, curveX: 0, curveY: -70, color: '#5CA8F5' } });
    onSelect({ kind: 'frame', id });
  };
  const addVisualMarker = (markerType = 'number', pos = null) => {
    const markers = s.numberMarkers || {};
    const id = genId(markers, markerType === 'letter' ? 'LTR-' : 'NUM-');
    const markerPos = pos || visibleCanvasPlacement({ x: 90, y: 90 }, { w: 34, h: 34 });
    const entity = { id, markerType, value: nextVisualMarkerValue(markers, markerType), ...markerPos, color: '#E8D25C' };
    dispatch({ type: 'ADD_ENTITY', coll: 'numberMarkers', entity });
    onSelect({ kind: 'numberMarker', id });
  };
  const addTitleMarker = (pos = null) => {
    const markers = s.titleMarkers || {};
    const id = genId(markers, 'TTL-');
    const markerPos = pos || visibleCanvasPlacement({ x: 120, y: 100 }, { w: 120, h: 42 });
    const entity = { id, text: 'Title', ...markerPos, fontSize: 28, color: '#E9EBF3' };
    dispatch({ type: 'ADD_ENTITY', coll: 'titleMarkers', entity });
    onSelect({ kind: 'titleMarker', id });
  };
  const addFramework = (frameworkId, pos = null) => {
    const type = FRAMEWORK_TYPES[frameworkId] || FRAMEWORK_TYPES.fate;
    const id = genId(s.frameworks || {}, `${s.meta.prefix}-FW-`);
    const nodePos = pos || visibleCanvasPlacement({ x: 140, y: 140 }, { w: 300, h: 260 });
    dispatch({
      type: 'ADD_ENTITY',
      coll: 'frameworks',
      entity: {
        id,
        kind: 'framework',
        frameworkId,
        title: type.title,
        x: nodePos.x,
        y: nodePos.y,
        color: type.color,
      },
    });
    onSelect({ kind: 'framework', id });
  };
  const addConceptKind = (conceptKind, pos = null, template = null) => {
    const meta = ADDITIONAL_NODE_TYPES[conceptKind] || ADDITIONAL_NODE_TYPES.storyConcept;
    const id = genId(s.nodes, `${s.meta.prefix}-N-`);
    const nodePos = pos || visibleCanvasPlacement({ x: 110, y: 100 });
    dispatch({
      type: 'ADD_NODE',
      node: {
        id, kind: 'concept', conceptKind, conceptId: template?.id ?? null,
        title: template?.name ?? `New ${meta.label.toLowerCase()}`,
        name: template?.name ?? `New ${meta.label.toLowerCase()}`,
        x: nodePos.x,
        y: nodePos.y,
        body: template?.description ?? '', description: template?.description ?? '',
        conceptType: template?.conceptType ?? 'unset',
        status: template?.status ?? 'seed',
        onePromise: template?.onePromise ?? '',
        referenceFrameworkIds: JSON.parse(JSON.stringify(template?.referenceFrameworkIds || [])),
        ...(template?.conceptModules ? { conceptModules: JSON.parse(JSON.stringify(template.conceptModules)) } : {}),
        color: null, teamId: null, sets: [],
        collapsed: true, conceptAnswers: {}, history: [],
        sub: JSON.parse(JSON.stringify({
          nodes: {
            ...(template?.nodes || {}),
            ...Object.fromEntries(Object.values(template?.frameworks || {}).map((fw) => {
              const type = FRAMEWORK_TYPES[fw.frameworkId] || FRAMEWORK_TYPES.fate;
              return [fw.id, { ...fw, kind: 'framework', title: fw.title || type.title, body: type.summary }];
            })),
          },
          edges: template?.edges || [],
          frames: template?.frames || {},
          numberMarkers: template?.numberMarkers || {},
          titleMarkers: template?.titleMarkers || {},
        })),
      },
    });
    onSelect({ kind: 'node', id });
  };
  const addNodeTemplate = (template, pos = null) => {
    if (template.nodeClass === 'subnode') {
      addSub(template.subKind || 'outcomeBranches', pos, template.template);
      return;
    }
    const kind = template.nodeKind || 'event';
    if (kind === 'masterAct') {
      const id = genId(s.masterNodes || {}, 'ACT-');
      const nodePos = pos || visibleCanvasPlacement({ x: 100, y: 100 });
      dispatch({
        type: 'GRAPH_ADD_NODE',
        scope: { coll: 'masterNodes' },
        node: { ...(template.template || {}), id, kind: 'masterAct', title: template.name, ...nodePos, body: template.body || '', color: template.color ?? null },
      });
      onSelect({ kind: 'graphnode', scope: { coll: 'masterNodes' }, id });
      return;
    }
    const id = genId(s.nodes, `${s.meta.prefix}-N-`);
    const nodePos = pos || visibleCanvasPlacement({ x: 100, y: 100 });
    dispatch({
      type: 'ADD_NODE',
      node: {
        ...(template.template || {}),
        id, primitiveId: template.id, kind, title: template.name || `New ${BASE_NODE_TYPES[kind]?.label?.toLowerCase() || 'node'}`,
        x: nodePos.x, y: nodePos.y, body: template.template?.body ?? template.body ?? '', color: template.color ?? template.template?.color ?? null,
        itemType: template.template?.itemType ?? template.itemType ?? (kind === 'item' ? 'Artifact' : undefined),
        shortTitle: template.template?.shortTitle ?? template.shortTitle ?? undefined,
        playerDescription: template.template?.playerDescription ?? template.playerDescription ?? undefined,
        facilitatorDescription: template.template?.facilitatorDescription ?? template.facilitatorDescription ?? undefined,
        imageRef: template.template?.imageRef ?? template.imageRef ?? undefined,
        buildStatus: template.template?.buildStatus ?? template.buildStatus ?? (kind === 'item' ? 'concept' : undefined),
        placementNodeIds: template.template?.placementNodeIds ?? template.placementNodeIds ?? [],
        linkedMechanicNodeIds: template.template?.linkedMechanicNodeIds ?? template.linkedMechanicNodeIds ?? [],
        linkedMechanicIds: template.template?.linkedMechanicIds ?? template.linkedMechanicIds ?? [],
        sensorHooks: template.template?.sensorHooks ?? template.sensorHooks ?? undefined,
        noSoloSolve: template.template?.noSoloSolve ?? template.noSoloSolve ?? false,
        mechanicMeaning: template.template?.mechanicMeaning ?? template.mechanicMeaning ?? undefined,
        attachedTemplateNotes: template.template?.attachedTemplateNotes ?? template.attachedTemplateNotes ?? undefined,
        origin: template.template?.origin ?? template.origin ?? '',
        persistsAcrossTasks: template.template?.persistsAcrossTasks ?? !!template.persistsAcrossTasks,
        teamId: null, sets: [], locationId: null, itemId: null, mechanicIds: [], sensorIds: [], history: [],
      },
    });
    onSelect({ kind: 'node', id });
  };
  const saveCanvasAsStructure = () => {
    const name = window.prompt('Save current narrative canvas as Story Structure:', `${s.meta.name} structure`);
    if (!name?.trim()) return;
    const ids = new Set(Object.keys(s.nodes));
    if (ids.size === 0) return;
    const minX = Math.min(...Object.values(s.nodes).map((n) => n.x));
    const minY = Math.min(...Object.values(s.nodes).map((n) => n.y));
    const nodes = Object.fromEntries(Object.values(s.nodes).map((n) => [n.id, {
      id: n.id, primitiveId: n.primitiveId ?? n.conceptId ?? null, kind: n.kind,
      title: n.title, x: Math.round(n.x - minX + 40), y: Math.round(n.y - minY + 40),
      body: n.body || '', color: n.color ?? null, w: n.w ?? undefined, h: n.h ?? undefined,
      conceptKind: n.conceptKind, conceptId: n.conceptId ?? null,
      ...(n.kind === 'concept' ? { name: n.name ?? n.title, description: n.description ?? n.body ?? '', status: n.status ?? 'seed', onePromise: n.onePromise ?? '', referenceFrameworkIds: JSON.parse(JSON.stringify(n.referenceFrameworkIds || [])) } : {}),
      sub: n.sub ? JSON.parse(JSON.stringify(n.sub)) : undefined,
    }]));
    const edges = s.edges.filter((e) => ids.has(e.from) && ids.has(e.to))
      .map((e) => ({ from: e.from, to: e.to, label: e.label || '', color: e.color ?? null }));
    const frames = JSON.parse(JSON.stringify(s.frames || {}));
    const numberMarkers = JSON.parse(JSON.stringify(s.numberMarkers || {}));
    const titleMarkers = JSON.parse(JSON.stringify(s.titleMarkers || {}));
    const id = genId(lib.stories || {}, 'LIB-STORY-N');
    libDispatch({
      type: 'ADD_ENTITY',
      coll: 'stories',
      entity: { id, name: name.trim(), description: `Saved from ${s.meta.name}`, estMinutes: 30, nodes, edges, frames, numberMarkers, titleMarkers },
    });
  };

  const q = query.trim().toLowerCase();
  const matches = (n) => !q || `${n.title} ${n.body || ''}`.toLowerCase().includes(q);
  const dimNode = (n) => !matches(n);
  const teamOf = (n) => (n.teamId && s.teams[n.teamId] ? { name: s.teams[n.teamId].name, color: s.teams[n.teamId].color } : null);
  const edgeFact = (e) => {
    const f = e.factId && facts[e.factId];
    if (!f) return null;
    const fk = FACT_KINDS[f.kind] || { color: '#8B92A6' };
    return { color: fk.color, title: `${e.expect === 'unset' ? 'NOT ' : ''}${f.name}` };
  };
  const selId = (selection?.kind === 'node' || selection?.kind === 'subnode' || selection?.kind === 'framework') ? selection.id : null;
  const empty = Object.keys(merged).length === 0 && Object.keys(s.frames || {}).length === 0 && Object.keys(s.numberMarkers || {}).length === 0 && Object.keys(s.titleMarkers || {}).length === 0;
  const libNodeTemplates = Object.values(lib.narrative || {}).filter((n) => n.nodeClass);
  const paletteFilters = [
    { id: 'all', label: 'All', color: '#8B7BF5' },
    { id: 'base', label: 'Base Nodes', color: '#5CA8F5' },
    { id: 'sub', label: 'Subnodes', color: '#F08CB4' },
    { id: 'supporting', label: 'Supporting', color: '#68D7C0' },
    { id: 'templates', label: 'Templates', color: '#B58CFF' },
  ];
  const paletteGroups = [
    {
      id: 'base',
      label: 'Base Nodes',
      items: BASE_PALETTE.map((t) => ({
        id: `base:${t.id}`, label: t.label, blurb: t.blurb, color: t.color, icon: t.icon,
        dragPayload: `base:${t.id}`, onClick: () => addBase(t.id),
      })),
    },
    {
      id: 'sub',
      label: 'Subnodes',
      items: SUB_PALETTE.map((t) => ({
        id: `sub:${t.id}`, label: t.label, blurb: t.blurb, color: t.color, icon: t.icon,
        dragPayload: `sub:${t.id}`, onClick: () => addSub(t.id),
      })),
    },
    {
      id: 'supportingNotes',
      filterId: 'supporting',
      label: 'Supporting Notes',
      hint: 'Notes and support cards that can be attached to the story graph.',
      items: [
        {
          id: 'linkingNode', label: LINKING_NODE_TYPE.label, blurb: LINKING_NODE_TYPE.blurb,
          color: LINKING_NODE_TYPE.color, icon: LINKING_NODE_TYPE.icon,
          dragPayload: 'linkingNode:new', onClick: () => addLinkingNode(),
        },
        ...SUB_PALETTE.filter((t) => t.category === 'supporting').map((t) => ({
        id: `sub:${t.id}`, label: t.label, blurb: t.blurb, color: t.color, icon: t.icon,
        dragPayload: `sub:${t.id}`, onClick: () => addSub(t.id),
        })),
      ],
    },
    {
      id: 'templates',
      label: 'Library Templates',
      hint: 'Saved base node and subnode cards stay reusable.',
      items: [
        ...libNodeTemplates.map((n) => {
          const isSub = n.nodeClass === 'subnode';
          const meta = isSub ? SUBNODE_TYPES[n.subKind] : BASE_NODE_TYPES[n.nodeKind];
          return {
            id: `nodeTemplate:${n.id}`, label: n.name, blurb: n.body || meta?.blurb || 'Saved node template', color: n.color || meta?.color, icon: n.icon || meta?.icon,
            kicker: isSub ? 'Subnode template' : 'Base node template', dragPayload: `nodeTemplate:${n.id}`, onClick: () => addNodeTemplate(n),
          };
        }),
      ],
    },
  ];
  const visiblePaletteGroups = (() => {
    if (paletteFilter === 'all') return paletteGroups;
    return paletteGroups.filter((group) => (group.filterId || group.id) === paletteFilter);
  })();
  const libraryBrowserSections = [
    {
      id: 'libraryTemplates',
      label: 'Library Templates',
      hint: 'Saved base node and subnode cards.',
      items: libNodeTemplates.map((n) => {
        const isSub = n.nodeClass === 'subnode';
        const meta = isSub ? SUBNODE_TYPES[n.subKind] : BASE_NODE_TYPES[n.nodeKind];
        return {
          id: `nodeTemplate:${n.id}`,
          label: n.name,
          blurb: n.body || meta?.blurb || 'Saved narrative node template',
          color: n.color || meta?.color,
          icon: n.icon || meta?.icon,
          kicker: isSub ? 'Subnode template' : 'Base node template',
          onPick: () => addNodeTemplate(n),
        };
      }),
    },
    {
      id: 'referenceFrameworks',
      label: 'Reference Frameworks',
      hint: 'Static thinking aids that can be placed on the canvas.',
      items: Object.values(FRAMEWORK_TYPES).map((fw) => ({
        id: `framework:${fw.id}`,
        label: fw.label,
        blurb: fw.blurb,
        color: fw.color,
        icon: fw.icon,
        kicker: 'Reference only',
        onPick: () => addFramework(fw.id),
      })),
    },
    {
      id: 'concepts',
      label: 'Concepts',
      hint: 'Reusable concept containers with internal node maps.',
      items: Object.values(lib.concepts || {}).map((c) => {
        const meta = ADDITIONAL_NODE_TYPES[c.category] || ADDITIONAL_NODE_TYPES.storyConcept;
        return {
          id: `concept:${c.id}`,
          label: c.name,
          blurb: c.description || `${meta.label} template`,
          color: meta.color,
          icon: meta.icon,
          kicker: `${Object.keys(c.nodes || {}).length} inside`,
          onPick: () => addConceptKind(c.category, null, c),
        };
      }),
    },
  ];
  const handleDropPalette = (payload, x, y) => {
    const [type, id] = payload.split(':');
    const pos = { x: Math.round(x), y: Math.round(y) };
    if (type === 'base') addBase(id, pos);
    else if (type === 'linkingNode') addLinkingNode(pos);
    else if (type === 'sub') addSub(id, pos);
    else if (type === 'concept') addConceptKind(id, pos);
    else if (type === 'framework') addFramework(id, pos);
    else if (type === 'conceptTemplate') {
      const c = lib.concepts?.[id];
      if (c) addConceptKind(c.category, pos, c);
    } else if (type === 'nodeTemplate') {
      const t = lib.narrative?.[id];
      if (t) addNodeTemplate(t, pos);
    } else if (type === 'frame') addFrame(pos);
    else if (type === 'number') addVisualMarker('number', pos);
    else if (type === 'letter') addVisualMarker('letter', pos);
    else if (type === 'title') addTitleMarker(pos);
  };

  return (
    <div className="main splitmain">
      <NodePalette
        title="Narrative Nodes"
        subtitle="Click or drag onto the canvas"
        search={query}
        onSearch={setQuery}
        filters={paletteFilters}
        activeFilter={paletteFilter}
        onFilter={setPaletteFilter}
        groups={visiblePaletteGroups}
        headerAction={<button className="btn tiny" onClick={() => setBrowsingLibrary(true)}>Browse Library</button>}
      />
      <div className="mainpane">
      <div className="mhead">
        <div>
          <div className="crumb">{s.meta.name} / <b>Narrative Weaver</b></div>
          <h2>Narrative</h2>
        </div>
        <div className="right">
          <div className="canvas-tool-cluster support-tool-group"><span className="tool-kind-label">Support</span>
            <button className="btn" onClick={() => addFrame()}>Frame</button>
            <button className="btn" onClick={() => addCircle()}>Circle</button>
            <button className="btn" onClick={() => addVisualMarker('number')}>Number</button>
            <button className="btn" onClick={() => addVisualMarker('letter')}>Letter</button>
            <button className="btn" onClick={() => addTitleMarker()}>Title</button>
            <button className="btn" onClick={() => addArrow()}>Arrow</button>
            <button className="btn" onClick={() => addSpline()}>Spline</button>
          </div>
          <CsvButtons coll="nodes" />
        </div>
      </div>

      <div className="toolrow node-tool-group">
        <span className="dim addlab">Base:</span>
        {BASE_PALETTE.map((t) => (
          <button key={t.id} className="addnode" title={t.blurb} onClick={() => addBase(t.id)}>
            <span className="sq" style={{ background: t.color }}><PrimIcon icon={t.icon} color="#fff" size={11} /></span>{t.label}
          </button>
        ))}
      </div>
      <div className="toolrow subrow node-tool-group">
        <span className="dim addlab">Subnodes:</span>
        {SUB_PALETTE.map((t) => (
          <button key={t.id} className="addnode sub" title={t.blurb} onClick={() => addSub(t.id)}>
            <span className="sq" style={{ background: t.color }}><PrimIcon icon={t.icon} color="#fff" size={11} /></span>{t.label}
          </button>
        ))}
      </div>

      {empty ? (
        <div className="emptyview">
          <h3>The canvas is empty</h3>
          <p>Add Base Nodes (Event, Character, Story Location, Item, Quest), drop a concept from the Library, or add a supporting reference.</p>
        </div>
      ) : (
        <FlowCanvas
          nodes={merged} edges={s.edges} selId={selId} colorOf={nodeColor}
          iconOf={nodeIcon} teamOf={teamOf} dimNode={dimNode} edgeFact={edgeFact}
          nodeClass={(n) => (n._sub ? 'subnode' : n.kind === 'framework' ? 'framework' : n.kind === 'concept' || n.kind === STORY_STRUCTURE_CONTAINER_KIND ? `concept${n.collapsed === false ? ' expanded' : ''}` : n.kind === LINKING_NODE_KIND ? 'linking-node' : '')}
          attachments={attachments}
          onDetach={(subId) => dispatch({ type: 'UPDATE_ENTITY', coll: 'subnodes', id: subId, patch: { parentRef: null } })}
          frames={s.frames || {}} selFrame={selection?.kind === 'frame' ? selection.id : null}
          onFrameMove={(id, dx, dy) => dispatch({ type: 'FRAME_MOVE', frameId: id, dx, dy })}
          onFrameResize={(id, w, h) => dispatch({ type: 'UPDATE_ENTITY', coll: 'frames', id, patch: { w, h } })}
          onFrameGeometry={(id, patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'frames', id, patch })}
          onFrameScale={(id, transform) => dispatch({ type: 'FRAME_SCALE', frameId: id, transform })}
          onFrameSelect={(id) => onSelect({ kind: 'frame', id })}
          onFrameDelete={(id) => { dispatch({ type: 'DELETE_ENTITY', coll: 'frames', id }); onSelect(null); }}
          numberMarkers={s.numberMarkers || {}}
          selNumberMarker={selection?.kind === 'numberMarker' ? selection.id : null}
          onNumberMarkerSelect={(id) => onSelect({ kind: 'numberMarker', id })}
          onNumberMarkerMove={(id, dx, dy) => {
            const marker = s.numberMarkers?.[id];
            if (marker) dispatch({ type: 'UPDATE_ENTITY', coll: 'numberMarkers', id, patch: { x: marker.x + dx, y: marker.y + dy } });
          }}
          onNumberMarkerUpdate={(id, patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'numberMarkers', id, patch })}
          onNumberMarkerDelete={(id) => { dispatch({ type: 'DELETE_ENTITY', coll: 'numberMarkers', id }); onSelect(null); }}
          titleMarkers={s.titleMarkers || {}}
          selTitleMarker={selection?.kind === 'titleMarker' ? selection.id : null}
          onTitleMarkerSelect={(id) => onSelect({ kind: 'titleMarker', id })}
          onTitleMarkerMove={(id, dx, dy) => {
            const marker = s.titleMarkers?.[id];
            if (marker) dispatch({ type: 'UPDATE_ENTITY', coll: 'titleMarkers', id, patch: { x: marker.x + dx, y: marker.y + dy } });
          }}
          onTitleMarkerDelete={(id) => { dispatch({ type: 'DELETE_ENTITY', coll: 'titleMarkers', id }); onSelect(null); }}
          onSelect={(id) => onSelect(merged[id]?._sub ? { kind: 'subnode', id } : merged[id]?.kind === 'framework' ? { kind: 'framework', id } : { kind: 'node', id })}
          onMove={(id, x, y) => dispatch({ type: 'UPDATE_ENTITY', coll: merged[id]?._sub ? 'subnodes' : merged[id]?.kind === 'framework' ? 'frameworks' : 'nodes', id, patch: { x, y } })}
          onUpdateNode={(id, patch) => dispatch({ type: 'UPDATE_ENTITY', coll: merged[id]?._sub ? 'subnodes' : merged[id]?.kind === 'framework' ? 'frameworks' : 'nodes', id, patch })}
          onMoveNodes={(positions, meta) => dispatch({
            type: 'BATCH',
            undoGroup: meta?.undoGroup,
            actions: Object.entries(positions).map(([id, patch]) => ({
              type: 'UPDATE_ENTITY',
              coll: merged[id]?._sub ? 'subnodes' : merged[id]?.kind === 'framework' ? 'frameworks' : 'nodes',
              id,
              patch,
            })),
          })}
          onMoveSelection={(patches, meta) => dispatch({
            type: 'BATCH',
            undoGroup: meta?.undoGroup,
            actions: [
              ...Object.entries(patches.nodes).map(([id, patch]) => ({
                type: 'UPDATE_ENTITY',
                coll: merged[id]?._sub ? 'subnodes' : merged[id]?.kind === 'framework' ? 'frameworks' : 'nodes',
                id,
                patch,
              })),
              ...Object.entries(patches.frames).map(([id, patch]) => ({ type: 'UPDATE_ENTITY', coll: 'frames', id, patch })),
              ...Object.entries(patches.numberMarkers).map(([id, patch]) => ({ type: 'UPDATE_ENTITY', coll: 'numberMarkers', id, patch })),
              ...Object.entries(patches.titleMarkers).map(([id, patch]) => ({ type: 'UPDATE_ENTITY', coll: 'titleMarkers', id, patch })),
            ],
          })}
          onResizeNode={(id, patch) => dispatch({ type: 'UPDATE_ENTITY', coll: merged[id]?._sub ? 'subnodes' : merged[id]?.kind === 'framework' ? 'frameworks' : 'nodes', id, patch })}
          onConnect={(from, to, edgePatch = {}) => dispatch({ type: 'ADD_EDGE', from, to, color: nodeColor(merged[from]), ...edgePatch })}
          onRemoveEdge={(e) => dispatch({ type: 'REMOVE_EDGE', from: e.from, to: e.to })}
          onDropPalette={handleDropPalette}
          onSetColor={(id, color) => dispatch({ type: 'UPDATE_ENTITY', coll: merged[id]?._sub ? 'subnodes' : merged[id]?.kind === 'framework' ? 'frameworks' : 'nodes', id, patch: { color } })}
          onDeleteNode={(id) => {
            dispatch(merged[id]?._sub ? { type: 'DELETE_SUBNODE', subnodeId: id } : merged[id]?.kind === 'framework' ? { type: 'DELETE_ENTITY', coll: 'frameworks', id } : { type: 'DELETE_NODE', nodeId: id });
            onSelect(null);
          }}
          onDeleteNodes={(ids) => {
            dispatch({
              type: 'BATCH',
              actions: ids.map((id) => merged[id]?._sub
                ? { type: 'DELETE_SUBNODE', subnodeId: id }
                : merged[id]?.kind === 'framework'
                  ? { type: 'DELETE_ENTITY', coll: 'frameworks', id }
                  : { type: 'DELETE_NODE', nodeId: id }),
            });
            onSelect(null);
          }}
          onDeleteSelection={(selection) => {
            dispatch({
              type: 'BATCH',
              actions: [
                ...selection.nodes.map((id) => merged[id]?._sub
                  ? { type: 'DELETE_SUBNODE', subnodeId: id }
                  : merged[id]?.kind === 'framework'
                    ? { type: 'DELETE_ENTITY', coll: 'frameworks', id }
                    : { type: 'DELETE_NODE', nodeId: id }),
                ...selection.frames.map((id) => ({ type: 'DELETE_ENTITY', coll: 'frames', id })),
                ...selection.numberMarkers.map((id) => ({ type: 'DELETE_ENTITY', coll: 'numberMarkers', id })),
                ...selection.titleMarkers.map((id) => ({ type: 'DELETE_ENTITY', coll: 'titleMarkers', id })),
              ],
            });
            onSelect(null);
          }}
          onClearCanvas={() => {
            dispatch({ type: 'CLEAR_NARRATIVE_CANVAS' });
            onSelect(null);
          }}
          onEditEdge={(e, patch) => dispatch({ type: 'UPDATE_EDGE', from: e.from, to: e.to, patch })}
          onOpenNode={(id) => { if (!merged[id]?._sub) { setOpenPath([id]); onSelect(null); } }}
          onPasteNode={(p) => {
            const id = genId(s.nodes, `${s.meta.prefix}-N-`);
            dispatch({ type: 'ADD_NODE', node: { id, ...p, teamId: p.teamId ?? null, sets: [], locationId: null, itemId: null, mechanicIds: [], sensorIds: [], history: [] } });
            onSelect({ kind: 'node', id });
          }}
          onPasteNodes={(clipboard) => {
            const pasted = remapCanvasClipboard(clipboard, s.nodes, `${s.meta.prefix}-COPY-`);
            dispatch({
              type: 'BATCH',
              actions: [
                ...Object.values(pasted.nodes).map((node) => ({ type: 'ADD_NODE', node: { ...node, history: [] } })),
                ...pasted.edges.map((edge) => ({ type: 'ADD_EDGE', ...edge })),
              ],
            });
            onSelect({ kind: 'node', id: pasted.ids[pasted.ids.length - 1] });
          }}
          renderBody={(n) => (n.kind === 'item' || n.kind === LINKING_NODE_KIND ? null : n.body)}
          renderExtra={(n, dimensions) => {
            if (n._sub) return null;
            if (n.kind === 'framework') {
              const fw = FRAMEWORK_TYPES[n.frameworkId] || FRAMEWORK_TYPES.fate;
              return <FrameworkPreview frameworkId={fw.id} nodeWidth={dimensions.width} nodeHeight={dimensions.height} />;
            }
            if (n.kind === 'concept') {
              const cnt = Object.keys(n.sub?.nodes || {}).length;
              const expanded = n.collapsed === false;
              return (
                <div className="cptbody">
                  {expanded && n.sub && <div className="cptmap"><StructureThumb structure={n.sub} lib={lib} width={200} height={110} /></div>}
                  <div className="cptrow">
                    <span className="cptbadge">{ADDITIONAL_NODE_TYPES[n.conceptKind]?.label ?? 'Concept'} · {cnt} inside</span>
                    <button className="linkbtn" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'UPDATE_ENTITY', coll: 'nodes', id: n.id, patch: { collapsed: expanded } }); }}>
                      {expanded ? '⊟ Collapse' : '⊞ Expand'}
                    </button>
                    <button className="linkbtn" onClick={(e) => { e.stopPropagation(); setOpenPath([n.id]); onSelect(null); }}>✎ Edit</button>
                  </div>
                </div>
              );
            }
            if (n.kind === STORY_STRUCTURE_CONTAINER_KIND) {
              const cnt = Object.keys(n.sub?.nodes || {}).length;
              return (
                <div className="cptbody">
                  <div className="cptrow">
                    <span className="cptbadge">Story Structure · {cnt} inside</span>
                    <button className="linkbtn" onClick={(e) => { e.stopPropagation(); setOpenPath([n.id]); onSelect(null); }}>Enter structure</button>
                  </div>
                </div>
              );
            }
            if (n.kind === LINKING_NODE_KIND) {
              return <LinkingNodePreview node={n} onNavigate={onNavigate} onInsert={(ref) => insertLinkedTarget(n, ref)} />;
            }
            if (n.kind === 'item') {
              return (
                <div className="nsets">
                  <span className="factchip sm subcount"><i />{n.buildStatus || 'concept'}</span>
                </div>
              );
            }
            const item = n.itemId ? s.items[n.itemId] : null;
            const sets = (n.sets || []).map((x) => facts[x.factId]).filter(Boolean);
            const attached = Object.values(subnodesColl).filter((sn) => sn.parentRef?.nodeId === n.id).length;
            return (
              <>
                {item && (
                  <div className="nref">
                    <span className="mono">{item.id}</span>
                    <Pill availability={item.availability} />
                  </div>
                )}
                {(sets.length > 0 || attached > 0) && (
                  <div className="nsets">
                    {sets.map((f) => {
                      const fk = FACT_KINDS[f.kind] || { color: '#8B92A6' };
                      return <span key={f.id} className="factchip sm" style={{ borderColor: fk.color, color: fk.color }}><i style={{ background: fk.color }} />sets {f.name}</span>;
                    })}
                    {attached > 0 && <span className="factchip sm subcount"><i />{attached} subnode{attached === 1 ? '' : 's'}</span>}
                  </div>
                )}
              </>
            );
          }}
        />
      )}
      <div className="statusbar">
        <span><b>Base</b> nodes carry the story · <b>Subnodes</b> enrich (drag one on, then attach from its inspector — <b>⊘</b> on the line detaches) · <b>concepts</b> expand/edit · <b>double-click</b> opens internals.</span>
      </div>
      {browsingLibrary && <NarrativeLibraryBrowser sections={libraryBrowserSections} onClose={() => setBrowsingLibrary(false)} />}
      </div>
    </div>
  );
}
