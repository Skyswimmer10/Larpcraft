import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLibrary, useLibraryDispatch, useGame, useDispatch } from '../state/store.jsx';
import { Thumb, ENTITY_COLORS, PrimIcon, SectionLabel } from '../components/bits.jsx';
import FlowCanvas, { visibleCanvasPlacement } from '../components/FlowCanvas.jsx';
import StructureThumb, { structNodeColor } from '../components/StructureThumb.jsx';
import NodePalette from '../components/NodePalette.jsx';
import NarrativeLibraryBrowser from '../components/NarrativeLibraryBrowser.jsx';
import FrameworkPreview from '../components/FrameworkPreview.jsx';
import { narrativeToStructNode, mechPrimitiveToStructNode } from '../state/bridge.js';
import { LIB_BLANK, LIB_PREFIX, BASE_NODE_TYPES, CONCEPT_INTERNAL_NODE_TYPES, MASTER_ACT_TYPE, ADDITIONAL_NODE_TYPES, SUBNODE_TYPES, SUBNODE_BLANK, FRAMEWORK_TYPES, MECHANIC_SUBNODE_TYPES, cloneCharacterCardTemplate } from '../data/seed.js';
import { genId } from '../data/csvSchemas.js';
import TypeChips from '../components/TypeChips.jsx';
import {
  buildMechanicsLibrarySections,
  buildMechanicsPaletteGroups,
  filterMechanicsPaletteGroups,
  isProgressStateNode,
  isSupportingMechanicSubnode,
  mechanicSubnodeCategory,
  mechanicsPayloadToNode,
  MECHANICS_PALETTE_FILTERS,
  progressPercent,
  progressValue,
  supportingMechanicSubnodePreview,
} from '../mechanics/palette.js';

function useUndoableLocalState(initialValue) {
  const [stack, setStack] = useState({ present: initialValue, past: [] });
  const pointerActive = useRef(false);
  const pointerSnapshotTaken = useRef(false);

  useEffect(() => {
    const start = () => { pointerActive.current = true; pointerSnapshotTaken.current = false; };
    const finish = () => { pointerActive.current = false; pointerSnapshotTaken.current = false; };
    window.addEventListener('pointerdown', start, true);
    window.addEventListener('pointerup', finish, true);
    window.addEventListener('pointercancel', finish, true);
    return () => {
      window.removeEventListener('pointerdown', start, true);
      window.removeEventListener('pointerup', finish, true);
      window.removeEventListener('pointercancel', finish, true);
    };
  }, []);

  const setPresent = useCallback((update) => {
    setStack((current) => {
      const next = typeof update === 'function' ? update(current.present) : update;
      if (next === current.present) return current;
      if (pointerActive.current && pointerSnapshotTaken.current) return { ...current, present: next };
      if (pointerActive.current) pointerSnapshotTaken.current = true;
      return { present: next, past: [...current.past, current.present].slice(-100) };
    });
  }, []);

  const undo = useCallback(() => {
    setStack((current) => current.past.length ? {
      present: current.past[current.past.length - 1],
      past: current.past.slice(0, -1),
    } : current);
  }, []);

  return [stack.present, setPresent, undo];
}

// Library catalogue order for Additional Node ("concept") categories.
const CONCEPT_ORDER = ['storyConcept', 'structureConcept', 'characterConcept', 'functionConcept', 'styleConcept'];
const baseTemplateMeta = (kind) => BASE_NODE_TYPES[kind] || (kind === 'masterAct' ? MASTER_ACT_TYPE : null);
const CONCEPT_GRAPH_NODE_TYPES = { ...CONCEPT_INTERNAL_NODE_TYPES, ...BASE_NODE_TYPES };
const CONCEPT_GRAPH_PALETTE = [...Object.values(CONCEPT_INTERNAL_NODE_TYPES), ...Object.values(BASE_NODE_TYPES)];

const TABS = [
  { id: 'items', label: 'Items & Gadgets', color: 'var(--c-item)', addLabel: '+ New item template' },
  { id: 'locations', label: 'Locations', color: 'var(--c-location)', addLabel: '+ New location template' },
  { id: 'mechanics', label: 'Rules & Mechanics', color: 'var(--c-mechanic)', addLabel: '+ New mechanic' },
  { id: 'mechBuilder', label: 'NodeStructureBuilder', color: '#8B7BF5', addLabel: '+ New mechanic draft' },
  { id: 'mechPrimitives', label: 'Mechanic Nodes', color: '#A87BF0', addLabel: '+ New mechanic node' },
  { id: 'mechSubnodes', label: 'Mechanic Subnodes', color: '#F08CB4', addLabel: '+ New mechanic subnode' },
  { id: 'mechStructures', label: 'Mechanic Structures', color: 'var(--c-mechanic)', addLabel: '+ New mechanic structure' },
  { id: 'sensors', label: 'Sensor hardware', color: 'var(--c-sensor)', addLabel: '+ New sensor type' },
  { id: 'narrative', label: 'NodeStructureBuilder', color: '#F08CB4', addLabel: '+ New draft' },
  { id: 'baseNodes', label: 'Base Nodes', color: '#5CA8F5', addLabel: '+ New base node' },
  { id: 'stories', label: 'Story Structures', color: 'var(--c-narrative)', addLabel: '+ New structure' },
  { id: 'concepts', label: 'Concepts', color: '#E8D25C', addLabel: '+ New concept' },
  { id: 'frameworks', label: 'Frameworks', color: '#E8D25C', addLabel: '+ New framework' },
];

// Three top-level groups keep the catalogue uncrowded. Story & Narrative holds
// only story content; the mechanic node tree lives under Game Mechanics.
const GROUP_META = {
  physical: { label: 'Physical', tabs: ['items', 'locations', 'sensors'] },
  mechanics: { label: 'Game Mechanics', tabs: ['mechBuilder', 'mechPrimitives', 'mechSubnodes', 'mechStructures'] },
  story: { label: 'Story & Narrative', tabs: ['narrative', 'baseNodes', 'concepts', 'stories', 'frameworks'] },
};

// The two structure kinds share one editor: same canvas, different node pool.
const STRUCT_KINDS = {
  stories: { paletteColl: 'narrative', paletteKind: 'lib-narrative', build: narrativeToStructNode, paletteLabel: 'Narrative nodes', paletteHint: 'Story content only. Drag onto the canvas to add a beat.', backLabel: '← Story Structures' },
  mechStructures: { paletteColl: 'mechPrimitives', paletteKind: 'lib-mechPrimitives', build: mechPrimitiveToStructNode, paletteLabel: 'Mechanic nodes', paletteHint: 'Sensors, puzzles, challenges, timers. Drag onto the canvas.', backLabel: '← Mechanic Structures' },
};

const CATEGORY_COLORS = ['#F08CB4', '#5CA8F5', '#E0A23C', '#43BF87', '#A87BF0', '#E8D25C', '#3EC6D6', '#E86464'];
const MECHANIC_SUBNODE_CATEGORY_SECTIONS = [
  { id: 'gameplayModifiers', label: 'Gameplay Modifiers', hint: 'Core gameplay-related subnodes that affect how tasks and mechanics function.' },
  { id: 'supporting', label: 'Supporting', hint: 'Helper and organizational subnodes for comments, facilitator notes, player/team assignment, and readiness status.' },
];

function moveFrameGraphPatch(graph, frameId, dx, dy) {
  const fr = graph.frames?.[frameId];
  if (!fr) return null;
  if (fr.shape === 'circle' || fr.shape === 'arrow') {
    return { frames: { ...(graph.frames || {}), [frameId]: { ...fr, x: fr.x + dx, y: fr.y + dy } } };
  }
  const inside = (x, y) => x >= fr.x && x <= fr.x + fr.w && y >= fr.y && y <= fr.y + fr.h;
  const shift = (coll = {}) => Object.fromEntries(Object.entries(coll).map(([id, item]) => (
    [id, inside(item.x, item.y) ? { ...item, x: item.x + dx, y: item.y + dy } : item]
  )));
  const frames = Object.fromEntries(Object.entries(graph.frames || {}).map(([id, frame]) => {
    if (id === frameId) return [id, { ...frame, x: frame.x + dx, y: frame.y + dy }];
    const fullyInside = inside(frame.x, frame.y) && inside(frame.x + frame.w, frame.y + frame.h);
    return [id, fullyInside ? { ...frame, x: frame.x + dx, y: frame.y + dy } : frame];
  }));
  return {
    nodes: shift(graph.nodes || {}),
    subnodes: shift(graph.subnodes || {}),
    frameworks: shift(graph.frameworks || {}),
    frames,
    numberMarkers: shift(graph.numberMarkers || {}),
    titleMarkers: shift(graph.titleMarkers || {}),
  };
}

function SupportingMechanicPreview({ node, game, onSelect }) {
  const preview = supportingMechanicSubnodePreview(node, game);
  if (!preview) return null;
  return (
    <div className="support-preview">
      <b>{preview.label}</b>
      {preview.links?.length ? (
        <span className="support-link-list">
          {preview.links.map((link) => (
            <button
              key={`${link.kind}:${link.id}`}
              className="support-link"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.({ kind: link.kind, id: link.id });
              }}
            >
              {link.label}
            </button>
          ))}
        </span>
      ) : <span>{preview.text || preview.empty}</span>}
      {preview.detail && <small>{preview.detail}</small>}
    </div>
  );
}

function ProgressMechanicPreview({ node }) {
  if (!isProgressStateNode(node)) return null;
  const value = progressValue(node);
  return (
    <div className="progress-preview">
      <div className="progress-preview-head"><b>{value}/10</b><span>{progressPercent(node)}%</span></div>
      <div className="progress-mini" aria-label={`${value} out of 10 completed`}>
        {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < value ? 'on' : ''} />)}
      </div>
    </div>
  );
}

// Draggable palette entry (narrative node): drop onto the structure canvas.
function PaletteNode({ n, onSelect }) {
  return (
    <div className="pnode" draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/x-palette', n.id); e.dataTransfer.effectAllowed = 'copy'; }}
      onClick={onSelect} title={`${n.body || ''} (drag onto the canvas)`}>
      <PrimIcon icon={n.icon} color={n.color} />
      <div><b>{n.name}</b>{n.category && <small>{n.category}</small>}</div>
    </div>
  );
}

// Preview (opened from the library): a live but non-editable mini mind-map of
// the internal structure plus example filled answers, with Add to Canvas.
function ConceptPreview({ concept, onClose, onEdit }) {
  const lib = useLibrary();
  const proj = useGame();
  const dispatch = useDispatch();
  const meta = ADDITIONAL_NODE_TYPES[concept.category] || { label: 'Concept', color: '#E8D25C' };
  const addToCanvas = () => {
    const id = genId(proj.nodes, `${proj.meta.prefix}-N-`);
    dispatch({
      type: 'ADD_NODE',
      node: {
        id, kind: 'concept', conceptKind: concept.category, conceptId: concept.id,
        title: concept.name, name: concept.name, x: 90, y: 90, body: concept.description, description: concept.description, color: null,
        status: concept.status ?? 'seed', onePromise: concept.onePromise ?? '',
        referenceFrameworkIds: JSON.parse(JSON.stringify(concept.referenceFrameworkIds || [])),
        teamId: null, sets: [], collapsed: true, conceptAnswers: {}, history: [],
        sub: JSON.parse(JSON.stringify({
          nodes: {
            ...(concept.nodes || {}),
            ...Object.fromEntries(Object.values(concept.frameworks || {}).map((fw) => {
              const type = FRAMEWORK_TYPES[fw.frameworkId] || FRAMEWORK_TYPES.fate;
              return [fw.id, { ...fw, kind: 'framework', title: fw.title || type.title, body: type.summary }];
            })),
          },
          edges: concept.edges || [],
          frames: concept.frames || {},
          numberMarkers: concept.numberMarkers || {},
          titleMarkers: concept.titleMarkers || {},
        })),
      },
    });
    onClose(true);
  };
  return (
    <div className="modal-backdrop" onClick={() => onClose(false)}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modalhead">
          <b>{concept.name}</b>
          <span className="cptbadge" style={{ color: meta.color, borderColor: meta.color }}>{meta.label}</span>
          <button className="x big" onClick={() => onClose(false)} aria-label="Close">×</button>
        </div>
        <div className="previewbody">
          <div className="previewmap">
            {Object.keys(concept.nodes || {}).length > 0
              ? <StructureThumb structure={concept} lib={lib} width={430} height={200} />
              : <div className="empty">Empty — build inside after adding, or open the editor.</div>}
            <div className="hint" style={{ marginTop: 6 }}>Live mini-map of the internal structure (read-only).</div>
          </div>
          <div className="previewinfo">
            <p className="dim">{concept.description || 'No description yet.'}</p>
            {(concept.questions || []).length > 0 && (
              <div className="previewqa">
                {concept.questions.map((q) => (
                  <div className="qa" key={q.key}>
                    <small>{q.label}</small>
                    <b>{concept.example?.[q.key] || '—'}</b>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modalfoot">
          <button className="btn primary" onClick={addToCanvas}>Add to Canvas (collapsed)</button>
          <button className="btn" onClick={() => onEdit?.(concept.id)}>Edit</button>
          <button className="btn" onClick={() => onClose(false)}>Close</button>
        </div>
      </div>
    </div>
  );
}

// Dedicated editing viewport for a concept template's internal structure —
// same canvas engine, base-node palette. Edits update the master template.
function ConceptEditor({ concept, selection, onSelect, onBack }) {
  const libDispatch = useLibraryDispatch();
  const patch = (p) => libDispatch({ type: 'UPDATE_ENTITY', coll: 'concepts', id: concept.id, patch: p });
  const selId = (selection?.kind === 'lib-structnode' || selection?.kind === 'lib-structframework') && selection.storyId === concept.id ? selection.id : null;
  const colorOf = (n) => n.color || CONCEPT_GRAPH_NODE_TYPES[n.kind]?.color || '#8B92A6';
  const meta = ADDITIONAL_NODE_TYPES[concept.category] || { label: 'Concept' };
  const conceptCanvasNodes = {
    ...concept.nodes,
    ...Object.fromEntries(Object.values(concept.frameworks || {}).map((fw) => {
      const type = FRAMEWORK_TYPES[fw.frameworkId] || FRAMEWORK_TYPES.fate;
      return [fw.id, { ...fw, kind: 'framework', title: fw.title || type.title, body: type.summary }];
    })),
  };
  const canvasColorOf = (n) => n.kind === 'framework' ? (n.color || FRAMEWORK_TYPES[n.frameworkId]?.color || '#E8D25C') : colorOf(n);
  const canvasIconOf = (n) => n.kind === 'framework' ? (FRAMEWORK_TYPES[n.frameworkId]?.icon || 'target') : (CONCEPT_GRAPH_NODE_TYPES[n.kind]?.icon || null);
  const addBase = (kind) => {
    const type = CONCEPT_GRAPH_NODE_TYPES[kind] || { label: kind };
    const id = genId(concept.nodes, 'S');
    const nodePos = visibleCanvasPlacement({ x: 80, y: 70 });
    const node = {
      id, kind, title: `New ${type.label.toLowerCase()}`, ...nodePos, body: '', color: null,
      ...(kind === 'character' ? cloneCharacterCardTemplate() : {}),
    };
    patch({ nodes: { ...concept.nodes, [id]: node } });
    onSelect({ kind: 'lib-structnode', id, storyId: concept.id, coll: 'concepts' });
  };
  const addNumberMarker = () => {
    const markers = concept.numberMarkers || {};
    const id = genId(markers, 'NUM-');
    const values = Object.values(markers).map((m) => Number(m.value)).filter(Number.isFinite);
    const marker = { id, value: values.length ? Math.max(...values) + 1 : 1, ...visibleCanvasPlacement({ x: 120, y: 120 }, { w: 34, h: 34 }), color: '#E8D25C' };
    patch({ numberMarkers: { ...markers, [id]: marker } });
    onSelect({ kind: 'lib-structnumber', id, storyId: concept.id, coll: 'concepts' });
  };
  const addFrame = () => {
    const frames = concept.frames || {};
    const id = genId(frames, 'FR-');
    const size = { w: 360, h: 220 };
    const pos = visibleCanvasPlacement({ x: 90, y: 90 }, size);
    const frame = { id, label: 'Frame', ...pos, ...size, color: '#8B92A6' };
    patch({ frames: { ...frames, [id]: frame } });
    onSelect({ kind: 'lib-structframe', id, storyId: concept.id, coll: 'concepts' });
  };
  const addCircle = () => {
    const frames = concept.frames || {};
    const id = genId(frames, 'CIR-');
    const size = { w: 160, h: 160 };
    const pos = visibleCanvasPlacement({ x: 100, y: 100 }, size);
    const frame = { id, label: 'Circle', shape: 'circle', ...pos, ...size, color: '#5CA8F5' };
    patch({ frames: { ...frames, [id]: frame } });
    onSelect({ kind: 'lib-structframe', id, storyId: concept.id, coll: 'concepts' });
  };
  const addArrow = () => {
    const frames = concept.frames || {};
    const id = genId(frames, 'ARR-');
    const pos = visibleCanvasPlacement({ x: 110, y: 110 }, { w: 200, h: 80 });
    const frame = { id, label: 'Arrow', shape: 'arrow', ...pos, w: 200, h: 80, color: '#5CA8F5' };
    patch({ frames: { ...frames, [id]: frame } });
    onSelect({ kind: 'lib-structframe', id, storyId: concept.id, coll: 'concepts' });
  };
  const addTitleMarker = () => {
    const markers = concept.titleMarkers || {};
    const id = genId(markers, 'TTL-');
    const marker = { id, text: 'Title', ...visibleCanvasPlacement({ x: 140, y: 110 }, { w: 120, h: 42 }), fontSize: 28, color: '#E9EBF3' };
    patch({ titleMarkers: { ...markers, [id]: marker } });
    onSelect({ kind: 'lib-structtitle', id, storyId: concept.id, coll: 'concepts' });
  };
  return (
    <div className="main">
      <div className="mhead">
        <div>
          <div className="crumb"><button className="linkbtn" onClick={onBack}>← Concepts</button></div>
          <h2>{concept.name} <span className="libbadge inline">master template · {meta.label}</span></h2>
        </div>
        <div className="right"><span className="mono dim">{Object.keys(concept.nodes).length} nodes · {concept.edges.length} links</span></div>
      </div>
      <div className="toolrow">
        <div className="canvas-tool-group node-tool-group"><span className="tool-kind-label">Nodes</span>
        {CONCEPT_GRAPH_PALETTE.map((t) => (
          <button key={t.id} className="addnode" title={t.blurb} onClick={() => addBase(t.id)}>
            <span className="sq" style={{ background: t.color }}><PrimIcon icon={t.icon} color="#fff" size={11} /></span>{t.label}
          </button>
        ))}</div>
        <div className="canvas-tool-group support-tool-group"><span className="tool-kind-label">Support</span>
        <button className="addnode frameadd" title="Add a visual grouping frame" onClick={addFrame}>
          <span className="sq" style={{ background: '#8B92A6' }}><PrimIcon icon="layers" color="#fff" size={11} /></span>Frame
        </button>
        <button className="addnode frameadd" title="Add a resizable circle" onClick={addCircle}>
          <span className="sq shapecircle" style={{ borderColor: '#5CA8F5' }} />Circle
        </button>
        <button className="addnode frameadd" title="Add a visual number marker" onClick={addNumberMarker}>
          <span className="sq" style={{ background: '#E8D25C', color: '#111' }}>1</span>Number
        </button>
        <button className="addnode frameadd" title="Add a draggable title label" onClick={addTitleMarker}>
          <span className="sq" style={{ background: '#E9EBF3', color: '#111' }}>T</span>Title
        </button>
        <button className="addnode frameadd" title="Add a directional support arrow" onClick={addArrow}>
          <span className="sq arrowglyph" style={{ color: '#5CA8F5' }}>→</span>Arrow
        </button>
        </div>
      </div>
      <FlowCanvas
        nodes={conceptCanvasNodes} edges={concept.edges} selId={selId} colorOf={canvasColorOf}
        iconOf={canvasIconOf}
        nodeClass={(n) => (n.kind === 'framework' ? 'framework' : '')}
        onSelect={(id) => onSelect(concept.frameworks?.[id] ? { kind: 'lib-structframework', id, storyId: concept.id, coll: 'concepts' } : { kind: 'lib-structnode', id, storyId: concept.id, coll: 'concepts' })}
        onMove={(id, x, y) => concept.frameworks?.[id]
          ? patch({ frameworks: { ...(concept.frameworks || {}), [id]: { ...concept.frameworks[id], x, y } } })
          : patch({ nodes: { ...concept.nodes, [id]: { ...concept.nodes[id], x, y } } })}
        onMoveNodes={(positions) => {
          const nodes = { ...concept.nodes };
          const frameworks = { ...(concept.frameworks || {}) };
          Object.entries(positions).forEach(([id, pos]) => {
            if (frameworks[id]) frameworks[id] = { ...frameworks[id], ...pos };
            else if (nodes[id]) nodes[id] = { ...nodes[id], ...pos };
          });
          patch({ nodes, frameworks });
        }}
        onResizeNode={(id, nodePatch) => concept.frameworks?.[id]
          ? patch({ frameworks: { ...(concept.frameworks || {}), [id]: { ...concept.frameworks[id], ...nodePatch } } })
          : patch({ nodes: { ...concept.nodes, [id]: { ...concept.nodes[id], ...nodePatch } } })}
        onConnect={(from, to, edgePatch = {}) => {
          if (concept.edges.some((e) => e.from === from && e.to === to)) {
            patch({ edges: concept.edges.map((e) => e.from === from && e.to === to ? { ...e, ...edgePatch } : e) });
            return;
          }
          patch({ edges: [...concept.edges, { from, to, label: '', color: null, ...edgePatch }] });
        }}
        onRemoveEdge={(e) => patch({ edges: concept.edges.filter((x) => !(x.from === e.from && x.to === e.to)) })}
        onRemoveEdges={(hit) => patch({ edges: concept.edges.filter((x) => !hit.some((e) => e.from === x.from && e.to === x.to)) })}
        onSetColor={(id, color) => concept.frameworks?.[id]
          ? patch({ frameworks: { ...(concept.frameworks || {}), [id]: { ...concept.frameworks[id], color } } })
          : patch({ nodes: { ...concept.nodes, [id]: { ...concept.nodes[id], color } } })}
        onDeleteNode={(id) => {
          if (concept.frameworks?.[id]) {
            const frameworks = { ...(concept.frameworks || {}) };
            delete frameworks[id];
            patch({ frameworks });
          } else {
            const nodes = { ...concept.nodes };
            delete nodes[id];
            patch({ nodes, edges: concept.edges.filter((e) => e.from !== id && e.to !== id) });
          }
          onSelect(null);
        }}
        onDeleteNodes={(ids) => {
          const removed = new Set(ids);
          const nodes = { ...concept.nodes };
          const frameworks = { ...(concept.frameworks || {}) };
          ids.forEach((id) => { delete nodes[id]; delete frameworks[id]; });
          patch({ nodes, frameworks, edges: concept.edges.filter((e) => !removed.has(e.from) && !removed.has(e.to)) });
          onSelect(null);
        }}
        onClearCanvas={() => {
          patch({ nodes: {}, edges: [], frameworks: {}, frames: {}, numberMarkers: {}, titleMarkers: {} });
          onSelect(null);
        }}
        onEditEdge={(e, edgePatch) => patch({ edges: concept.edges.map((x) => (x.from === e.from && x.to === e.to ? { ...x, ...edgePatch } : x)) })}
        frames={concept.frames || {}}
        selFrame={selection?.kind === 'lib-structframe' && selection.storyId === concept.id ? selection.id : null}
        onFrameSelect={(id) => onSelect({ kind: 'lib-structframe', id, storyId: concept.id, coll: 'concepts' })}
        onFrameMove={(id, dx, dy) => {
          const moved = moveFrameGraphPatch(concept, id, dx, dy);
          if (moved) patch(moved);
        }}
        onFrameResize={(id, w, h) => {
          const fr = concept.frames?.[id];
          if (fr) patch({ frames: { ...(concept.frames || {}), [id]: { ...fr, w, h } } });
        }}
        numberMarkers={concept.numberMarkers || {}}
        selNumberMarker={selection?.kind === 'lib-structnumber' && selection.storyId === concept.id ? selection.id : null}
        onNumberMarkerSelect={(id) => onSelect({ kind: 'lib-structnumber', id, storyId: concept.id, coll: 'concepts' })}
        onNumberMarkerMove={(id, dx, dy) => {
          const marker = concept.numberMarkers?.[id];
          if (marker) patch({ numberMarkers: { ...(concept.numberMarkers || {}), [id]: { ...marker, x: marker.x + dx, y: marker.y + dy } } });
        }}
        onNumberMarkerDelete={(id) => {
          const numberMarkers = { ...(concept.numberMarkers || {}) };
          delete numberMarkers[id];
          patch({ numberMarkers });
          onSelect(null);
        }}
        titleMarkers={concept.titleMarkers || {}}
        selTitleMarker={selection?.kind === 'lib-structtitle' && selection.storyId === concept.id ? selection.id : null}
        onTitleMarkerSelect={(id) => onSelect({ kind: 'lib-structtitle', id, storyId: concept.id, coll: 'concepts' })}
        onTitleMarkerMove={(id, dx, dy) => {
          const marker = concept.titleMarkers?.[id];
          if (marker) patch({ titleMarkers: { ...(concept.titleMarkers || {}), [id]: { ...marker, x: marker.x + dx, y: marker.y + dy } } });
        }}
        onTitleMarkerDelete={(id) => {
          const titleMarkers = { ...(concept.titleMarkers || {}) };
          delete titleMarkers[id];
          patch({ titleMarkers, edges: concept.edges.filter((e) => e.from !== id && e.to !== id) });
          onSelect(null);
        }}
        onPasteNode={(p) => {
          const id = genId(concept.nodes, 'S');
          patch({ nodes: { ...concept.nodes, [id]: { id, kind: p.kind, title: p.title, x: p.x, y: p.y, body: p.body, color: p.color ?? null, w: p.w ?? undefined, h: p.h ?? undefined } } });
        }}
        renderExtra={(n) => {
          if (n.kind !== 'framework') return null;
          const fw = FRAMEWORK_TYPES[n.frameworkId] || FRAMEWORK_TYPES.fate;
          return <FrameworkPreview frameworkId={fw.id} />;
        }}
      />
      <div className="statusbar">
        <span>Editing the <b>master template</b> — every game that adds it later gets this structure · rename / describe it from the inspector.</span>
      </div>
    </div>
  );
}

// One editor drives both Story Structures and Mechanic Structures: the same
// FlowCanvas (drag, connect, disconnect, recolor, delete, copy/paste, edge
// labels), only the node palette differs. Every change updates the master
// template in the LIBRARY store.
const blankGraph = { nodes: {}, edges: [], frames: {}, numberMarkers: {}, titleMarkers: {} };

function structureGraphAtPath(structure, path) {
  let graph = { nodes: structure.nodes || {}, edges: structure.edges || [], frames: structure.frames || {}, numberMarkers: structure.numberMarkers || {}, titleMarkers: structure.titleMarkers || {} };
  for (const id of path) {
    const node = graph.nodes?.[id];
    graph = {
      nodes: node?.sub?.nodes || {},
      edges: node?.sub?.edges || [],
      frames: node?.sub?.frames || {},
      numberMarkers: node?.sub?.numberMarkers || {},
      titleMarkers: node?.sub?.titleMarkers || {},
    };
  }
  return graph;
}

function patchSubgraphAtPath(nodes, path, nextGraph) {
  if (!path.length) return nodes;
  const [head, ...rest] = path;
  const node = nodes?.[head];
  if (!node) return nodes || {};
  const currentSub = node.sub || blankGraph;
  if (!rest.length) {
    return {
      ...(nodes || {}),
      [head]: { ...node, sub: { ...currentSub, ...nextGraph } },
    };
  }
  return {
    ...(nodes || {}),
    [head]: {
      ...node,
      sub: {
        ...currentSub,
        nodes: patchSubgraphAtPath(currentSub.nodes || {}, rest, nextGraph),
      },
    },
  };
}

function StructureEditor({ coll, structure, selection, onSelect, onBack }) {
  const lib = useLibrary();
  const proj = useGame();
  const libDispatch = useLibraryDispatch();
  const cfg = STRUCT_KINDS[coll];
  const isMechanicStructure = coll === 'mechStructures';
  const [mechQuery, setMechQuery] = useState('');
  const [mechPaletteFilter, setMechPaletteFilter] = useState('all');
  const [openPath, setOpenPath] = useState([]);
  const patch = (p) => libDispatch({ type: 'UPDATE_ENTITY', coll, id: structure.id, patch: p });
  const activePath = isMechanicStructure ? openPath : [];
  const currentGraph = structureGraphAtPath(structure, activePath);
  const nested = isMechanicStructure && activePath.length > 0;
  const sameGraphPath = JSON.stringify(selection?.graphPath || []) === JSON.stringify(activePath);
  const patchCurrentGraph = (p) => {
    if (!nested) {
      patch(p);
      return;
    }
    patch({ nodes: patchSubgraphAtPath(structure.nodes || {}, activePath, { ...currentGraph, ...p }) });
  };
  const selId = (selection?.kind === 'lib-structnode' || selection?.kind === 'lib-structframework') && selection.storyId === structure.id && sameGraphPath ? selection.id : null;
  const canvasNodes = {
    ...currentGraph.nodes,
    ...(!nested ? Object.fromEntries(Object.values(structure.frameworks || {}).map((fw) => {
      const type = FRAMEWORK_TYPES[fw.frameworkId] || FRAMEWORK_TYPES.fate;
      return [fw.id, { ...fw, kind: 'framework', title: fw.title || type.title, body: type.summary }];
    })) : {}),
  };
  const canvasColor = (n) => n.kind === 'framework' ? (n.color || FRAMEWORK_TYPES[n.frameworkId]?.color || '#E8D25C') : structNodeColor(n, lib);
  const canvasIcon = (n) => n.kind === 'framework' ? (FRAMEWORK_TYPES[n.frameworkId]?.icon || 'target') : undefined;
  const addMechanicPayload = (payload, x = null, y = null) => {
    const nodePos = x == null || y == null ? visibleCanvasPlacement({ x: 90, y: 90 }) : { x, y };
    const node = mechanicsPayloadToNode(payload, lib, currentGraph.nodes, nodePos.x, nodePos.y, nested ? 'D' : 'S');
    if (!node) return;
    patchCurrentGraph({ nodes: { ...currentGraph.nodes, [node.id]: node } });
    onSelect({ kind: 'lib-structnode', id: node.id, storyId: structure.id, coll, graphPath: activePath });
  };
  const graphTitle = activePath.reduce((title, id, idx) => {
    const graph = structureGraphAtPath(structure, activePath.slice(0, idx));
    return graph.nodes?.[id]?.title || title;
  }, structure.name);
  const mechanicPaletteGroups = filterMechanicsPaletteGroups(
    buildMechanicsPaletteGroups(lib, {
      onAdd: (payload) => addMechanicPayload(payload),
      includeTask: false,
      includeDetail: nested,
      includeTemplates: false,
    }),
    mechPaletteFilter,
  );
  const addNumberMarker = () => {
    const markers = currentGraph.numberMarkers || {};
    const id = genId(markers, 'NUM-');
    const values = Object.values(markers).map((m) => Number(m.value)).filter(Number.isFinite);
    const marker = { id, value: values.length ? Math.max(...values) + 1 : 1, ...visibleCanvasPlacement({ x: 120, y: 120 }, { w: 34, h: 34 }), color: '#E8D25C' };
    patchCurrentGraph({ numberMarkers: { ...markers, [id]: marker } });
    onSelect({ kind: 'lib-structnumber', id, storyId: structure.id, coll, graphPath: activePath });
  };
  const addFrame = () => {
    const frames = currentGraph.frames || {};
    const id = genId(frames, 'FR-');
    const size = { w: 360, h: 220 };
    const pos = visibleCanvasPlacement({ x: 90, y: 90 }, size);
    const frame = { id, label: 'Frame', ...pos, ...size, color: '#8B92A6' };
    patchCurrentGraph({ frames: { ...frames, [id]: frame } });
    onSelect({ kind: 'lib-structframe', id, storyId: structure.id, coll, graphPath: activePath });
  };
  const addCircle = () => {
    const frames = currentGraph.frames || {};
    const id = genId(frames, 'CIR-');
    const size = { w: 160, h: 160 };
    const pos = visibleCanvasPlacement({ x: 100, y: 100 }, size);
    const frame = { id, label: 'Circle', shape: 'circle', ...pos, ...size, color: '#5CA8F5' };
    patchCurrentGraph({ frames: { ...frames, [id]: frame } });
    onSelect({ kind: 'lib-structframe', id, storyId: structure.id, coll, graphPath: activePath });
  };
  const addArrow = () => {
    const frames = currentGraph.frames || {};
    const id = genId(frames, 'ARR-');
    const pos = visibleCanvasPlacement({ x: 110, y: 110 }, { w: 200, h: 80 });
    const frame = { id, label: 'Arrow', shape: 'arrow', ...pos, w: 200, h: 80, color: '#5CA8F5' };
    patchCurrentGraph({ frames: { ...frames, [id]: frame } });
    onSelect({ kind: 'lib-structframe', id, storyId: structure.id, coll, graphPath: activePath });
  };
  const addTitleMarker = () => {
    const markers = currentGraph.titleMarkers || {};
    const id = genId(markers, 'TTL-');
    const marker = { id, text: 'Title', ...visibleCanvasPlacement({ x: 140, y: 110 }, { w: 120, h: 42 }), fontSize: 28, color: '#E9EBF3' };
    patchCurrentGraph({ titleMarkers: { ...markers, [id]: marker } });
    onSelect({ kind: 'lib-structtitle', id, storyId: structure.id, coll, graphPath: activePath });
  };

  return (
    <div className="main">
      <div className="mhead">
        <div>
          <div className="crumb">
            <button className="linkbtn" onClick={onBack}>{cfg.backLabel}</button>
            {nested && <> / <button className="crumblink" onClick={() => { setOpenPath([]); onSelect(null); }}>{structure.name}</button> / <b>{graphTitle}</b></>}
          </div>
          <h2>{nested ? graphTitle : structure.name} <span className="libbadge inline">master template</span></h2>
        </div>
        <div className="right">
          {nested && <button className="btn" onClick={() => { setOpenPath(openPath.slice(0, -1)); onSelect(null); }}>Back one level</button>}
          <div className="canvas-tool-cluster support-tool-group"><span className="tool-kind-label">Support</span>
            <button className="btn" onClick={addFrame}>Frame</button>
            <button className="btn" onClick={addCircle}>Circle</button>
            <button className="btn" onClick={addNumberMarker}>Number</button>
            <button className="btn" onClick={addTitleMarker}>Title</button>
            <button className="btn" onClick={addArrow}>Arrow</button>
          </div>
          <span className="mono dim">~{structure.estMinutes} min · {Object.keys(currentGraph.nodes).length} nodes · {currentGraph.edges.length} links</span>
        </div>
      </div>
      <div className={isMechanicStructure ? 'nodebuilder-wrap' : 'structeditor'}>
        {isMechanicStructure ? (
          <NodePalette
            title="Mechanics Nodes"
            subtitle="Build reusable task templates"
            search={mechQuery}
            onSearch={setMechQuery}
            filters={MECHANICS_PALETTE_FILTERS.filter((f) => f.id !== 'templates')}
            activeFilter={mechPaletteFilter}
            onFilter={setMechPaletteFilter}
            groups={mechanicPaletteGroups}
          />
        ) : (
          <div className="palette">
            <div className="lab">{cfg.paletteLabel}</div>
            <div className="hint" style={{ marginBottom: 9 }}>{cfg.paletteHint}</div>
            {Object.values(lib[cfg.paletteColl]).map((n) => (
              <PaletteNode key={n.id} n={n} onSelect={() => onSelect({ kind: cfg.paletteKind, id: n.id })} />
            ))}
          </div>
        )}
        <FlowCanvas
          nodes={canvasNodes} edges={currentGraph.edges} selId={selId}
          colorOf={canvasColor}
          iconOf={canvasIcon}
          nodeClass={(n) => (n.kind === 'framework' ? 'framework' : '')}
          onOpenNode={isMechanicStructure && activePath.length < 3 ? (id) => { setOpenPath([...activePath, id]); onSelect(null); } : undefined}
          onSelect={(id) => onSelect(!nested && structure.frameworks?.[id] ? { kind: 'lib-structframework', id, storyId: structure.id, coll } : { kind: 'lib-structnode', id, storyId: structure.id, coll, graphPath: activePath })}
          onMove={(id, x, y) => !nested && structure.frameworks?.[id]
            ? patch({ frameworks: { ...(structure.frameworks || {}), [id]: { ...structure.frameworks[id], x, y } } })
            : patchCurrentGraph({ nodes: { ...currentGraph.nodes, [id]: { ...currentGraph.nodes[id], x, y } } })}
          onMoveNodes={(positions) => {
            const nodes = { ...currentGraph.nodes };
            const frameworks = { ...(!nested ? structure.frameworks || {} : {}) };
            Object.entries(positions).forEach(([id, pos]) => {
              if (!nested && frameworks[id]) frameworks[id] = { ...frameworks[id], ...pos };
              else if (nodes[id]) nodes[id] = { ...nodes[id], ...pos };
            });
            if (!nested) patch({ nodes, frameworks });
            else patchCurrentGraph({ nodes });
          }}
          onResizeNode={(id, nodePatch) => !nested && structure.frameworks?.[id]
            ? patch({ frameworks: { ...(structure.frameworks || {}), [id]: { ...structure.frameworks[id], ...nodePatch } } })
            : patchCurrentGraph({ nodes: { ...currentGraph.nodes, [id]: { ...currentGraph.nodes[id], ...nodePatch } } })}
          onConnect={(from, to, edgePatch = {}) => {
            if (currentGraph.edges.some((e) => e.from === from && e.to === to)) {
              patchCurrentGraph({ edges: currentGraph.edges.map((e) => e.from === from && e.to === to ? { ...e, ...edgePatch } : e) });
              return;
            }
            patchCurrentGraph({ edges: [...currentGraph.edges, { from, to, label: '', color: null, ...edgePatch }] });
          }}
          onRemoveEdge={(e) => patchCurrentGraph({ edges: currentGraph.edges.filter((x) => !(x.from === e.from && x.to === e.to)) })}
          onRemoveEdges={(hit) => patchCurrentGraph({ edges: currentGraph.edges.filter((x) => !hit.some((e) => e.from === x.from && e.to === x.to)) })}
          onSetColor={(id, color) => !nested && structure.frameworks?.[id]
            ? patch({ frameworks: { ...(structure.frameworks || {}), [id]: { ...structure.frameworks[id], color } } })
            : patchCurrentGraph({ nodes: { ...currentGraph.nodes, [id]: { ...currentGraph.nodes[id], color } } })}
          onDropPalette={(nodeTypeId, x, y) => {
            if (isMechanicStructure) {
              addMechanicPayload(nodeTypeId, x, y);
              return;
            }
            const t = lib[cfg.paletteColl][nodeTypeId];
            if (!t) return;
            const node = cfg.build(t, currentGraph.nodes, x, y);
            patch({ nodes: { ...structure.nodes, [node.id]: node } });
            onSelect({ kind: 'lib-structnode', id: node.id, storyId: structure.id, coll });
          }}
          onPasteNode={(p) => {
            const id = genId(currentGraph.nodes, nested ? 'D' : 'S');
            const node = { id, primitiveId: p.primitiveId ?? null, kind: p.kind, title: p.title, x: p.x, y: p.y, body: p.body, color: p.color ?? null, image: p.image ?? null, w: p.w ?? undefined, h: p.h ?? undefined };
            patchCurrentGraph({ nodes: { ...currentGraph.nodes, [id]: node } });
            onSelect({ kind: 'lib-structnode', id, storyId: structure.id, coll, graphPath: activePath });
          }}
          onDeleteNode={(id) => {
            if (!nested && structure.frameworks?.[id]) {
              const frameworks = { ...(structure.frameworks || {}) };
              delete frameworks[id];
              patch({ frameworks });
            } else {
              const nodes = { ...currentGraph.nodes };
              delete nodes[id];
              patchCurrentGraph({ nodes, edges: currentGraph.edges.filter((e) => e.from !== id && e.to !== id) });
            }
            onSelect(null);
          }}
          onDeleteNodes={(ids) => {
            const removed = new Set(ids);
            const nodes = { ...currentGraph.nodes };
            const frameworks = { ...(!nested ? structure.frameworks || {} : {}) };
            ids.forEach((id) => { delete nodes[id]; delete frameworks[id]; });
            const graphPatch = { nodes, edges: currentGraph.edges.filter((e) => !removed.has(e.from) && !removed.has(e.to)) };
            if (!nested) patch({ ...graphPatch, frameworks });
            else patchCurrentGraph(graphPatch);
            onSelect(null);
          }}
          onClearCanvas={() => {
            if (!nested) {
              patch({ nodes: {}, edges: [], frames: {}, frameworks: {}, numberMarkers: {}, titleMarkers: {} });
            } else {
              patchCurrentGraph({ nodes: {}, edges: [], frames: {}, numberMarkers: {}, titleMarkers: {} });
            }
            onSelect(null);
          }}
          onEditEdge={(e, edgePatch) => patchCurrentGraph({ edges: currentGraph.edges.map((x) => (x.from === e.from && x.to === e.to ? { ...x, ...edgePatch } : x)) })}
          renderBody={(n) => (isSupportingMechanicSubnode(n) || n.kind === 'item' ? null : n.body)}
          renderExtra={(n) => {
            if (isMechanicStructure && supportingMechanicSubnodePreview(n, proj)) return <SupportingMechanicPreview node={n} game={proj} onSelect={onSelect} />;
            if (isMechanicStructure && isProgressStateNode(n)) return <ProgressMechanicPreview node={n} />;
            if (n.kind === 'item') {
              return (
                <div className="nsets">
                  <span className="factchip sm subcount"><i />{n.buildStatus || 'concept'}</span>
                </div>
              );
            }
            if (n.kind !== 'framework') return null;
            const fw = FRAMEWORK_TYPES[n.frameworkId] || FRAMEWORK_TYPES.fate;
            return <FrameworkPreview frameworkId={fw.id} />;
          }}
          frames={currentGraph.frames || {}}
          selFrame={selection?.kind === 'lib-structframe' && selection.storyId === structure.id && sameGraphPath ? selection.id : null}
          onFrameSelect={(id) => onSelect({ kind: 'lib-structframe', id, storyId: structure.id, coll, graphPath: activePath })}
          onFrameMove={(id, dx, dy) => {
            const moved = moveFrameGraphPatch({ ...currentGraph, frameworks: nested ? {} : (structure.frameworks || {}) }, id, dx, dy);
            if (moved) patchCurrentGraph(moved);
          }}
          onFrameResize={(id, w, h) => {
            const fr = currentGraph.frames?.[id];
            if (fr) patchCurrentGraph({ frames: { ...(currentGraph.frames || {}), [id]: { ...fr, w, h } } });
          }}
          numberMarkers={currentGraph.numberMarkers || {}}
          selNumberMarker={selection?.kind === 'lib-structnumber' && selection.storyId === structure.id && sameGraphPath ? selection.id : null}
          onNumberMarkerSelect={(id) => onSelect({ kind: 'lib-structnumber', id, storyId: structure.id, coll, graphPath: activePath })}
          onNumberMarkerMove={(id, dx, dy) => {
            const marker = currentGraph.numberMarkers?.[id];
            if (marker) patchCurrentGraph({ numberMarkers: { ...(currentGraph.numberMarkers || {}), [id]: { ...marker, x: marker.x + dx, y: marker.y + dy } } });
          }}
          onNumberMarkerDelete={(id) => {
            const numberMarkers = { ...(currentGraph.numberMarkers || {}) };
            delete numberMarkers[id];
            patchCurrentGraph({ numberMarkers });
            onSelect(null);
          }}
          titleMarkers={currentGraph.titleMarkers || {}}
          selTitleMarker={selection?.kind === 'lib-structtitle' && selection.storyId === structure.id && sameGraphPath ? selection.id : null}
          onTitleMarkerSelect={(id) => onSelect({ kind: 'lib-structtitle', id, storyId: structure.id, coll, graphPath: activePath })}
          onTitleMarkerMove={(id, dx, dy) => {
            const marker = currentGraph.titleMarkers?.[id];
            if (marker) patchCurrentGraph({ titleMarkers: { ...(currentGraph.titleMarkers || {}), [id]: { ...marker, x: marker.x + dx, y: marker.y + dy } } });
          }}
          onTitleMarkerDelete={(id) => {
            const titleMarkers = { ...(currentGraph.titleMarkers || {}) };
            delete titleMarkers[id];
            patchCurrentGraph({ titleMarkers, edges: currentGraph.edges.filter((e) => e.from !== id && e.to !== id) });
            onSelect(null);
          }}
        />
      </div>
      <div className="statusbar">
        <span>Editing the <b>master template</b> · drag to arrange · <b>○ port</b> connects, click a link to disconnect · <b>Ctrl+C</b>/<b>V</b> copy-paste · <b>Delete</b> removes a node.</span>
      </div>
    </div>
  );
}

export default function Library({ group = 'physical', selection, onSelect }) {
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  const proj = useGame();
  const projDispatch = useDispatch();
  const groupMeta = GROUP_META[group] ?? GROUP_META.physical;
  const [tab, setTab] = useState(groupMeta.tabs[0]);
  const [editing, setEditing] = useState(null); // { coll, id } for a structure being edited
  const [preview, setPreview] = useState(null); // concept id being previewed
  const [narrFilter, setNarrFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [builder, setBuilder, undoBuilder] = useUndoableLocalState({ target: 'stories', conceptKind: 'storyConcept', name: 'New story structure', description: '', nodes: {}, edges: [], subnodes: {}, frameworks: {}, frames: {}, numberMarkers: {}, titleMarkers: {} });
  const [builderSel, setBuilderSel] = useState(null);
  const [builderFrameSel, setBuilderFrameSel] = useState(null);
  const [builderNumberSel, setBuilderNumberSel] = useState(null);
  const [builderTitleSel, setBuilderTitleSel] = useState(null);
  const [mechBuilderQuery, setMechBuilderQuery] = useState('');
  const [mechBuilderFilter, setMechBuilderFilter] = useState('all');
  const [browsingNarrativeLibrary, setBrowsingNarrativeLibrary] = useState(false);
  const [browsingMechanicsLibrary, setBrowsingMechanicsLibrary] = useState(false);

  useEffect(() => {
    if (tab !== 'narrative' && tab !== 'mechanics') return undefined;
    const onUndo = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== 'z') return;
      const tag = e.target?.tagName?.toLowerCase();
      if (e.target?.isContentEditable || ['input', 'textarea', 'select'].includes(tag)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      undoBuilder();
    };
    window.addEventListener('keydown', onUndo, true);
    return () => window.removeEventListener('keydown', onUndo, true);
  }, [tab, undoBuilder]);
  const selId = selection?.kind?.startsWith('lib-') ? selection.id : null;
  const pick = (coll, id) => onSelect({ kind: `lib-${coll}`, id });
  const deleteTemplate = (coll, id, label, name) => {
    if (!window.confirm(`Delete ${label} "${name}"? This cannot be undone.`)) return;
    libDispatch({ type: 'DELETE_ENTITY', coll, id });
    if (selId === id) onSelect(null);
    if (editing?.coll === coll && editing?.id === id) setEditing(null);
    if (preview === id) setPreview(null);
  };

  React.useEffect(() => {
    if (!groupMeta.tabs.includes(tab)) { setTab(groupMeta.tabs[0]); setEditing(null); }
  }, [group]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (tab === 'mechBuilder' && builder.target !== 'mechStructures') {
      setBuilder({ target: 'mechStructures', conceptKind: 'storyConcept', name: 'New mechanic structure', description: '', nodes: {}, edges: [], subnodes: {}, frameworks: {}, frames: {}, numberMarkers: {}, titleMarkers: {} });
      setBuilderSel(null);
      setBuilderFrameSel(null);
      onSelect(null);
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const addNew = () => {
    if (tab === 'narrative' || tab === 'mechBuilder') {
      setBuilder({
        target: tab === 'mechBuilder' ? 'mechStructures' : 'stories',
        conceptKind: 'storyConcept',
        name: tab === 'mechBuilder' ? 'New mechanic structure' : 'New story structure',
        description: '',
        nodes: {}, edges: [], subnodes: {}, frameworks: {}, frames: {}, numberMarkers: {}, titleMarkers: {},
      });
      setBuilderSel(null);
      setBuilderFrameSel(null);
      onSelect(null);
      return;
    }
    if (tab === 'frameworks') {
      pick('frameworkType', 'fate');
      return;
    }
    if (tab === 'baseNodes') {
      addNodeTemplate('event');
      setTab('baseNodes');
      return;
    }
    const id = genId(lib[tab], LIB_PREFIX[tab]);
    let entity = LIB_BLANK[tab](id);
    if (tab === 'narrative') {
      const cat = narrFilter !== 'all' && lib.narrativeCategories[narrFilter]
        ? narrFilter : Object.keys(lib.narrativeCategories)[0] ?? 'story-beat';
      const meta = lib.narrativeCategories[cat];
      entity = { ...entity, category: cat, color: meta?.color ?? entity.color, icon: meta?.icon ?? entity.icon };
    }
    libDispatch({ type: 'ADD_ENTITY', coll: tab, entity });
    pick(tab, id);
    if (tab === 'stories' || tab === 'mechStructures' || tab === 'concepts') setEditing({ coll: tab, id });
  };

  // "Create new …" inside a specific concept category: starts completely
  // empty; the designer builds inside, renames, and it becomes reusable.
  const addConcept = (category) => {
    const id = genId(lib.concepts, LIB_PREFIX.concepts);
    const entity = { ...LIB_BLANK.concepts(id), category, name: `New ${ADDITIONAL_NODE_TYPES[category]?.label.toLowerCase() ?? 'concept'}` };
    libDispatch({ type: 'ADD_ENTITY', coll: 'concepts', entity });
    pick('concepts', id);
    setEditing({ coll: 'concepts', id });
  };
  const addNodeTemplate = (kind) => {
    const meta = baseTemplateMeta(kind);
    const id = genId(lib.narrative, LIB_PREFIX.narrative);
    const entity = {
      ...LIB_BLANK.narrative(id),
      nodeClass: 'base',
      nodeKind: kind,
      name: `New ${meta.label.toLowerCase()} template`,
      category: kind,
      color: meta.color,
      icon: meta.icon,
      body: meta.blurb,
      ...(kind === 'item' ? {
        itemType: 'Artifact', shortTitle: 'Item', playerDescription: '', facilitatorDescription: '', imageRef: '',
        buildStatus: 'concept', origin: '', placementNodeIds: [], linkedMechanicNodeIds: [], linkedMechanicIds: [],
        sensorHooks: '', noSoloSolve: false, mechanicMeaning: '', attachedTemplateNotes: '', persistsAcrossTasks: false,
      } : {}),
      ...(kind === 'character' ? cloneCharacterCardTemplate(proj.meta.characterCardTemplate) : {}),
    };
    libDispatch({ type: 'ADD_ENTITY', coll: 'narrative', entity });
    setTab('baseNodes');
    pick('narrative', id);
  };
  const addSubnodeTemplate = (kind) => {
    const meta = SUBNODE_TYPES[kind];
    const id = genId(lib.narrative, LIB_PREFIX.narrative);
    const entity = {
      ...LIB_BLANK.narrative(id),
      nodeClass: 'subnode',
      subKind: kind,
      name: `New ${meta.label.toLowerCase()} template`,
      category: kind,
      color: meta.color,
      icon: meta.icon,
      body: meta.blurb,
      template: { ...SUBNODE_BLANK('TEMPLATE', kind), id: undefined, x: undefined, y: undefined, parentRef: null, history: [] },
    };
    libDispatch({ type: 'ADD_ENTITY', coll: 'narrative', entity });
    setTab('narrative');
    pick('narrative', id);
  };
  const addStoryStructure = () => {
    const id = genId(lib.stories, LIB_PREFIX.stories);
    libDispatch({ type: 'ADD_ENTITY', coll: 'stories', entity: LIB_BLANK.stories(id) });
    setTab('stories');
    pick('stories', id);
    setEditing({ coll: 'stories', id });
  };
  const builderMerged = {
    ...builder.nodes,
    ...Object.fromEntries(Object.values(builder.subnodes || {}).map((sn) => [sn.id, { ...sn, _sub: true }])),
    ...Object.fromEntries(Object.values(builder.frameworks || {}).map((fw) => {
      const type = FRAMEWORK_TYPES[fw.frameworkId] || FRAMEWORK_TYPES.fate;
      return [fw.id, { ...fw, kind: 'framework', title: fw.title || type.title, body: type.summary }];
    })),
  };
  const builderColor = (n) => {
    if (n._sub) return n.color || SUBNODE_TYPES[n.kind]?.color || '#F08CB4';
    if (n.kind === 'framework') return n.color || FRAMEWORK_TYPES[n.frameworkId]?.color || '#E8D25C';
    if (n.kind === 'concept') return n.color || ADDITIONAL_NODE_TYPES[n.conceptKind]?.color || '#E8D25C';
    if (n.kind === 'mechanicSubnode') return n.color || MECHANIC_SUBNODE_TYPES[n.subnodeKind]?.color || '#F08CB4';
    if (n.physicalKind === 'item' && n.itemId && lib.items?.[n.itemId]) return n.color || lib.itemTypes?.[lib.items[n.itemId].type]?.color || '#E0A23C';
    if (n.physicalKind === 'sensor') return n.color || ENTITY_COLORS.sensor;
    if (n.physicalKind === 'location') return n.color || ENTITY_COLORS.location;
    if (n.mechKind) return n.color || lib.mechPrimitives?.[n.primitiveId]?.color || '#A87BF0';
    return n.color || BASE_NODE_TYPES[n.kind]?.color || '#8B92A6';
  };
  const builderIcon = (n) => {
    if (n._sub) return SUBNODE_TYPES[n.kind]?.icon;
    if (n.kind === 'framework') return FRAMEWORK_TYPES[n.frameworkId]?.icon || 'target';
    if (n.kind === 'concept') return ADDITIONAL_NODE_TYPES[n.conceptKind]?.icon || 'book';
    if (n.kind === 'mechanicSubnode') return n.icon || MECHANIC_SUBNODE_TYPES[n.subnodeKind]?.icon || 'pin';
    if (n.physicalKind === 'sensor') return 'zap';
    if (n.physicalKind === 'location') return 'pin';
    if (n.physicalKind === 'item') return 'swap';
    if (n.mechKind) return lib.mechPrimitives?.[n.primitiveId]?.icon || 'cog';
    return BASE_NODE_TYPES[n.kind]?.icon || 'flag';
  };
  const selectBuilderNode = (id, source = builderMerged) => {
    const n = source[id];
    setBuilderSel(id);
    setBuilderFrameSel(null);
    setBuilderNumberSel(null);
    setBuilderTitleSel(null);
    if (n) onSelect({ kind: 'lib-buildernode', id, node: n, onPatch: (patch) => patchBuilderNode(id, patch) });
  };
  const selectBuilderFrame = (id, source = builder.frames || {}) => {
    const frame = source[id];
    setBuilderSel(null);
    setBuilderFrameSel(id);
    setBuilderNumberSel(null);
    setBuilderTitleSel(null);
    if (frame) onSelect({ kind: 'lib-builderframe', id, frame, onPatch: (patch) => patchBuilderFrame(id, patch), onDelete: () => deleteBuilderFrame(id) });
  };
  const selectBuilderNumber = (id, source = builder.numberMarkers || {}) => {
    const marker = source[id];
    setBuilderSel(null);
    setBuilderFrameSel(null);
    setBuilderNumberSel(id);
    setBuilderTitleSel(null);
    if (marker) onSelect({ kind: 'lib-buildernumber', id, marker, onPatch: (patch) => patchBuilderNumber(id, patch), onDelete: () => deleteBuilderNumber(id) });
  };
  const selectBuilderTitle = (id, source = builder.titleMarkers || {}) => {
    const marker = source[id];
    setBuilderSel(null);
    setBuilderFrameSel(null);
    setBuilderNumberSel(null);
    setBuilderTitleSel(id);
    if (marker) onSelect({ kind: 'lib-buildertitle', id, marker, onPatch: (patch) => patchBuilderTitle(id, patch), onDelete: () => deleteBuilderTitle(id) });
  };
  const patchBuilderNode = (id, patch) => {
    setBuilder((b) => {
      const coll = b.subnodes?.[id] ? 'subnodes' : b.frameworks?.[id] ? 'frameworks' : 'nodes';
      const current = b[coll]?.[id];
      if (!current) return b;
      const nextNode = { ...current, ...patch };
      onSelect({ kind: 'lib-buildernode', id, node: { ...builderMerged[id], ...nextNode }, onPatch: (p) => patchBuilderNode(id, p) });
      return { ...b, [coll]: { ...b[coll], [id]: nextNode } };
    });
  };
  const patchBuilderFrame = (id, patch) => {
    setBuilder((b) => {
      const current = b.frames?.[id];
      if (!current) return b;
      const nextFrame = { ...current, ...patch };
      onSelect({ kind: 'lib-builderframe', id, frame: nextFrame, onPatch: (p) => patchBuilderFrame(id, p), onDelete: () => deleteBuilderFrame(id) });
      return { ...b, frames: { ...(b.frames || {}), [id]: nextFrame } };
    });
  };
  const deleteBuilderFrame = (id) => {
    setBuilder((b) => {
      const frames = { ...(b.frames || {}) };
      delete frames[id];
      return { ...b, frames };
    });
    setBuilderFrameSel(null);
    onSelect(null);
  };
  const patchBuilderNumber = (id, patch) => {
    setBuilder((b) => {
      const current = b.numberMarkers?.[id];
      if (!current) return b;
      const nextMarker = { ...current, ...patch };
      onSelect({ kind: 'lib-buildernumber', id, marker: nextMarker, onPatch: (p) => patchBuilderNumber(id, p), onDelete: () => deleteBuilderNumber(id) });
      return { ...b, numberMarkers: { ...(b.numberMarkers || {}), [id]: nextMarker } };
    });
  };
  const deleteBuilderNumber = (id) => {
    setBuilder((b) => {
      const numberMarkers = { ...(b.numberMarkers || {}) };
      delete numberMarkers[id];
      return { ...b, numberMarkers };
    });
    setBuilderNumberSel(null);
    onSelect(null);
  };
  const patchBuilderTitle = (id, patch) => {
    setBuilder((b) => {
      const current = b.titleMarkers?.[id];
      if (!current) return b;
      const nextMarker = { ...current, ...patch };
      onSelect({ kind: 'lib-buildertitle', id, marker: nextMarker, onPatch: (p) => patchBuilderTitle(id, p), onDelete: () => deleteBuilderTitle(id) });
      return { ...b, titleMarkers: { ...(b.titleMarkers || {}), [id]: nextMarker } };
    });
  };
  const deleteBuilderTitle = (id) => {
    setBuilder((b) => {
      const titleMarkers = { ...(b.titleMarkers || {}) };
      delete titleMarkers[id];
      return { ...b, titleMarkers, edges: b.edges.filter((e) => e.from !== id && e.to !== id) };
    });
    setBuilderTitleSel(null);
    onSelect(null);
  };
  const addBuilderBase = (kind, pos = null) => {
    const t = BASE_NODE_TYPES[kind];
    const id = genId(builder.nodes, 'B');
    const nodePos = pos || visibleCanvasPlacement({ x: 80, y: 80 });
    const node = {
      id, kind, title: `New ${t.label.toLowerCase()}`, ...nodePos, body: '', color: null,
      ...(kind === 'item' ? {
        itemType: 'Artifact', shortTitle: 'Item', playerDescription: '', facilitatorDescription: '', imageRef: '',
        buildStatus: 'concept', origin: '', placementNodeIds: [], linkedMechanicNodeIds: [], linkedMechanicIds: [],
        sensorHooks: '', noSoloSolve: false, mechanicMeaning: '', attachedTemplateNotes: '', persistsAcrossTasks: false,
      } : {}),
    };
    setBuilder((b) => ({ ...b, nodes: { ...b.nodes, [id]: node } }));
    selectBuilderNode(id, { ...builderMerged, [id]: node });
  };
  const addBuilderConcept = (conceptKind, pos = null) => {
    const t = ADDITIONAL_NODE_TYPES[conceptKind];
    const id = genId(builder.nodes, 'B');
    const title = `New ${t.label.toLowerCase()}`;
    const nodePos = pos || visibleCanvasPlacement({ x: 100, y: 100 });
    const node = {
      id, kind: 'concept', conceptKind, title, name: title,
      x: nodePos.x, y: nodePos.y, body: '', description: '',
      conceptType: 'unset', status: 'seed', onePromise: '',
      referenceFrameworkIds: [],
      color: null, collapsed: true, sub: { nodes: {}, edges: [], frames: {}, numberMarkers: {}, titleMarkers: {} },
    };
    setBuilder((b) => ({ ...b, nodes: { ...b.nodes, [id]: node } }));
    selectBuilderNode(id, { ...builderMerged, [id]: node });
  };
  const addBuilderSub = (kind, pos = null) => {
    const id = genId(builder.subnodes || {}, 'BSB');
    const sn = { ...SUBNODE_BLANK(id, kind), ...(pos || visibleCanvasPlacement({ x: 120, y: 120 }, { w: 196, h: 110 })) };
    setBuilder((b) => ({ ...b, subnodes: { ...(b.subnodes || {}), [id]: sn } }));
    selectBuilderNode(id, { ...builderMerged, [id]: { ...sn, _sub: true } });
  };
  const addBuilderFramework = (frameworkId, pos = null) => {
    const type = FRAMEWORK_TYPES[frameworkId] || FRAMEWORK_TYPES.fate;
    const id = genId(builder.frameworks || {}, 'BFW');
    const nodePos = pos || visibleCanvasPlacement({ x: 140, y: 140 }, { w: 300, h: 260 });
    const fw = {
      id, kind: 'framework', frameworkId, title: type.title,
      x: nodePos.x, y: nodePos.y, color: type.color,
    };
    setBuilder((b) => ({ ...b, frameworks: { ...(b.frameworks || {}), [id]: fw } }));
    selectBuilderNode(id, { ...builderMerged, [id]: { ...fw, body: type.summary } });
  };
  const addBuilderFrame = (pos = null) => {
    const id = genId(builder.frames || {}, 'BFR');
    const size = { w: 360, h: 220 };
    const framePos = pos || visibleCanvasPlacement({ x: 80, y: 80 }, size);
    const frame = { id, label: 'Frame', ...framePos, ...size, color: '#8B92A6' };
    setBuilder((b) => ({ ...b, frames: { ...(b.frames || {}), [id]: frame } }));
    selectBuilderFrame(id, { ...(builder.frames || {}), [id]: frame });
  };
  const addBuilderCircle = (pos = null) => {
    const id = genId(builder.frames || {}, 'BCIR');
    const size = { w: 160, h: 160 };
    const circlePos = pos || visibleCanvasPlacement({ x: 100, y: 100 }, size);
    const frame = { id, label: 'Circle', shape: 'circle', ...circlePos, ...size, color: '#5CA8F5' };
    setBuilder((b) => ({ ...b, frames: { ...(b.frames || {}), [id]: frame } }));
    selectBuilderFrame(id, { ...(builder.frames || {}), [id]: frame });
  };
  const addBuilderArrow = (pos = null) => {
    const id = genId(builder.frames || {}, 'BARR');
    const arrowPos = pos || visibleCanvasPlacement({ x: 110, y: 110 }, { w: 200, h: 80 });
    const frame = { id, label: 'Arrow', shape: 'arrow', ...arrowPos, w: 200, h: 80, color: '#5CA8F5' };
    setBuilder((b) => ({ ...b, frames: { ...(b.frames || {}), [id]: frame } }));
    selectBuilderFrame(id, { ...(builder.frames || {}), [id]: frame });
  };
  const addBuilderNumber = (pos = null) => {
    const markers = builder.numberMarkers || {};
    const id = genId(markers, 'BNUM-');
    const values = Object.values(markers).map((m) => Number(m.value)).filter(Number.isFinite);
    const marker = { id, value: values.length ? Math.max(...values) + 1 : 1, ...(pos || visibleCanvasPlacement({ x: 100, y: 100 }, { w: 34, h: 34 })), color: '#E8D25C' };
    setBuilder((b) => ({ ...b, numberMarkers: { ...(b.numberMarkers || {}), [id]: marker } }));
    selectBuilderNumber(id, { ...markers, [id]: marker });
  };
  const addBuilderTitle = (pos = null) => {
    const markers = builder.titleMarkers || {};
    const id = genId(markers, 'BTTL-');
    const marker = { id, text: 'Title', ...(pos || visibleCanvasPlacement({ x: 130, y: 100 }, { w: 120, h: 42 })), fontSize: 28, color: '#E9EBF3' };
    setBuilder((b) => ({ ...b, titleMarkers: { ...(b.titleMarkers || {}), [id]: marker } }));
    selectBuilderTitle(id, { ...markers, [id]: marker });
  };
  const handleBuilderDrop = (payload, x, y) => {
    const [type, id] = payload.split(':');
    const pos = { x: Math.round(x), y: Math.round(y) };
    if (type === 'lib-base') addBuilderBase(id, pos);
    else if (type === 'lib-concept') addBuilderConcept(id, pos);
    else if (type === 'lib-sub') addBuilderSub(id, pos);
    else if (type === 'lib-framework') addBuilderFramework(id, pos);
    else if (type === 'lib-frame') addBuilderFrame(pos);
    else if (type === 'lib-number') addBuilderNumber(pos);
    else if (type === 'lib-title') addBuilderTitle(pos);
    else if (builder.target === 'mechStructures') {
      const node = mechanicsPayloadToNode(payload, lib, builder.nodes, pos.x, pos.y, 'B');
      if (!node) return;
      setBuilder((b) => ({ ...b, nodes: { ...b.nodes, [node.id]: node } }));
      selectBuilderNode(node.id, { ...builderMerged, [node.id]: node });
    }
  };
  const clearBuilder = () => {
    setBuilder((b) => ({ ...b, nodes: {}, edges: [], subnodes: {}, frameworks: {}, frames: {}, numberMarkers: {}, titleMarkers: {} }));
    setBuilderSel(null);
    setBuilderFrameSel(null);
    setBuilderNumberSel(null);
    setBuilderTitleSel(null);
    onSelect(null);
  };
  const saveBuilder = () => {
    const name = builder.name.trim() || (builder.target === 'concepts' ? 'New concept' : builder.target === 'mechStructures' ? 'New mechanic structure' : 'New story structure');
    if (builder.target === 'mechStructures') {
      const id = genId(lib.mechStructures || {}, LIB_PREFIX.mechStructures);
      libDispatch({
        type: 'ADD_ENTITY',
        coll: 'mechStructures',
        entity: {
          id, name, description: builder.description, estMinutes: 10,
          nodes: JSON.parse(JSON.stringify(builder.nodes)),
          edges: JSON.parse(JSON.stringify(builder.edges)),
          frames: JSON.parse(JSON.stringify(builder.frames || {})),
          numberMarkers: JSON.parse(JSON.stringify(builder.numberMarkers || {})),
          titleMarkers: JSON.parse(JSON.stringify(builder.titleMarkers || {})),
        },
      });
      pick('mechStructures', id);
      setTab('mechStructures');
    } else if (builder.target === 'concepts') {
      const id = genId(lib.concepts || {}, LIB_PREFIX.concepts);
      libDispatch({
        type: 'ADD_ENTITY',
        coll: 'concepts',
        entity: {
          id, category: builder.conceptKind, name, description: builder.description,
          conceptType: 'unset',
          status: 'seed',
          onePromise: '',
          referenceFrameworkIds: JSON.parse(JSON.stringify(builder.referenceFrameworkIds || [])),
          premade: false, questions: [], example: {},
          nodes: JSON.parse(JSON.stringify(builder.nodes)),
          edges: JSON.parse(JSON.stringify(builder.edges)),
          subnodes: JSON.parse(JSON.stringify(builder.subnodes || {})),
          frameworks: JSON.parse(JSON.stringify(builder.frameworks || {})),
          frames: JSON.parse(JSON.stringify(builder.frames || {})),
          numberMarkers: JSON.parse(JSON.stringify(builder.numberMarkers || {})),
          titleMarkers: JSON.parse(JSON.stringify(builder.titleMarkers || {})),
        },
      });
      pick('concepts', id);
    } else {
      const id = genId(lib.stories || {}, LIB_PREFIX.stories);
      libDispatch({
        type: 'ADD_ENTITY',
        coll: 'stories',
        entity: {
          id, name, description: builder.description, estMinutes: 15,
          nodes: JSON.parse(JSON.stringify(builder.nodes)),
          edges: JSON.parse(JSON.stringify(builder.edges)),
          subnodes: JSON.parse(JSON.stringify(builder.subnodes || {})),
          frameworks: JSON.parse(JSON.stringify(builder.frameworks || {})),
          frames: JSON.parse(JSON.stringify(builder.frames || {})),
          numberMarkers: JSON.parse(JSON.stringify(builder.numberMarkers || {})),
          titleMarkers: JSON.parse(JSON.stringify(builder.titleMarkers || {})),
        },
      });
      pick('stories', id);
    }
  };
  const libraryPaletteGroups = [
    {
      id: 'base',
      label: 'Base Nodes',
      items: Object.values(BASE_NODE_TYPES).map((t) => ({
        id: `lib-base:${t.id}`, label: t.label, blurb: t.blurb, color: t.color, icon: t.icon,
        dragPayload: `lib-base:${t.id}`, onClick: () => addBuilderBase(t.id),
      })),
    },
    {
      id: 'sub',
      label: 'Subnodes',
      items: Object.values(SUBNODE_TYPES).map((t) => ({
        id: `lib-sub:${t.id}`, label: t.label, blurb: t.blurb, color: t.color, icon: t.icon,
        dragPayload: `lib-sub:${t.id}`, onClick: () => addBuilderSub(t.id),
      })),
    },
    {
      id: 'supporting',
      label: 'Supporting Notes',
      hint: 'Comment and supporting note cards for narrative structures.',
      items: Object.values(SUBNODE_TYPES).filter((t) => t.category === 'supporting').map((t) => ({
        id: `lib-sub:${t.id}`, label: t.label, blurb: t.blurb, color: t.color, icon: t.icon,
        dragPayload: `lib-sub:${t.id}`, onClick: () => addBuilderSub(t.id),
      })),
    },
    {
      id: 'stories',
      label: 'Story Structures',
      items: [{
        id: 'lib-story-blank', label: 'Story Structure', blurb: 'Create a reusable connected group of narrative nodes.', color: '#5CA8F5', icon: 'layers',
        onClick: () => setBuilder((b) => ({ ...b, target: 'stories', name: 'New story structure' })),
      }],
    },
  ];
  const openLibraryRecord = (targetTab, coll, id, edit = false) => {
    setTab(targetTab);
    pick(coll, id);
    if (edit) setEditing({ coll, id });
  };
  const narrativeBrowserSections = [
    {
      id: 'libraryTemplates',
      label: 'Library Templates',
      hint: 'Saved base node and subnode cards.',
      items: Object.values(lib.narrative || {}).filter((n) => n.nodeClass).map((n) => {
        const isSub = n.nodeClass === 'subnode';
        const meta = isSub ? SUBNODE_TYPES[n.subKind] : baseTemplateMeta(n.nodeKind);
        return {
          id: `narrative:${n.id}`,
          label: n.name,
          blurb: n.body || meta?.blurb || 'Saved narrative node template',
          color: n.color || meta?.color,
          icon: n.icon || meta?.icon,
          kicker: isSub ? 'Subnode template' : 'Base node template',
          onPick: () => openLibraryRecord('baseNodes', 'narrative', n.id),
        };
      }),
    },
    {
      id: 'referenceFrameworks',
      label: 'Reference Frameworks',
      hint: 'Static thinking aids and design frameworks.',
      items: Object.values(FRAMEWORK_TYPES).map((fw) => ({
        id: `framework:${fw.id}`,
        label: fw.label,
        blurb: fw.blurb,
        color: fw.color,
        icon: fw.icon,
        kicker: 'Reference only',
        onPick: () => {
          setTab('frameworks');
          pick('frameworkType', fw.id);
        },
      })),
    },
    {
      id: 'storyStructures',
      label: 'Story Structures',
      hint: 'Reusable connected narrative structures.',
      items: Object.values(lib.stories || {}).map((st) => ({
        id: `story:${st.id}`,
        label: st.name,
        blurb: st.description || 'Reusable connected node structure.',
        color: '#5CA8F5',
        icon: 'layers',
        kicker: `${Object.keys(st.nodes || {}).length} nodes`,
        onPick: () => openLibraryRecord('stories', 'stories', st.id, true),
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
          onPick: () => openLibraryRecord('concepts', 'concepts', c.id, true),
        };
      }),
    },
  ];
  const addMechanicBuilderPayload = (payload, pos = null) => {
    const node = mechanicsPayloadToNode(payload, lib, builder.nodes, pos?.x ?? 90, pos?.y ?? 90, 'B');
    if (!node) return;
    setBuilder((b) => ({ ...b, nodes: { ...b.nodes, [node.id]: node } }));
    selectBuilderNode(node.id, { ...builderMerged, [node.id]: node });
  };
  const mechBuilderPaletteGroups = filterMechanicsPaletteGroups(
    buildMechanicsPaletteGroups(lib, {
      onAdd: (payload) => addMechanicBuilderPayload(payload),
      includeTask: false,
      includeDetail: false,
      includeTemplates: false,
      includePhysical: false,
      includeLocations: false,
    }),
    mechBuilderFilter,
  );
  const mechanicsBrowserSections = buildMechanicsLibrarySections(lib, (payload) => addMechanicBuilderPayload(payload));
  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];
  const tabCount = (tid) => {
    if (tid === 'baseNodes') return Object.values(lib.narrative || {}).filter((n) => n.nodeClass === 'base').length;
    if (tid === 'frameworks') return Object.keys(FRAMEWORK_TYPES).length;
    return Object.keys(lib[tid] ?? {}).length;
  };

  // ---- editable narrative categories ----
  const addCategory = () => {
    const label = window.prompt('Name for the new narrative category:');
    if (!label?.trim()) return;
    let key = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'category';
    while (lib.narrativeCategories[key]) key += '-2';
    const color = CATEGORY_COLORS[Object.keys(lib.narrativeCategories).length % CATEGORY_COLORS.length];
    libDispatch({ type: 'ADD_ENTITY', coll: 'narrativeCategories', entity: { id: key, label: label.trim(), color, icon: 'flag' } });
    setNarrFilter(key);
  };
  const deleteCategory = (key) => {
    const remaining = Object.keys(lib.narrativeCategories).filter((k) => k !== key);
    if (remaining.length === 0) { window.alert('At least one category must remain.'); return; }
    const used = Object.values(lib.narrative).filter((n) => n.category === key);
    const fallback = remaining[0];
    const msg = used.length
      ? `Delete "${lib.narrativeCategories[key].label}"? ${used.length} item(s) will move to "${lib.narrativeCategories[fallback].label}".`
      : `Delete the empty category "${lib.narrativeCategories[key].label}"?`;
    if (!window.confirm(msg)) return;
    used.forEach((n) => libDispatch({ type: 'UPDATE_ENTITY', coll: 'narrative', id: n.id, patch: { category: fallback } }));
    libDispatch({ type: 'DELETE_ENTITY', coll: 'narrativeCategories', id: key });
    if (narrFilter === key) setNarrFilter('all');
  };

  if (editing && lib[editing.coll]?.[editing.id]) {
    if (editing.coll === 'concepts') {
      return <ConceptEditor concept={lib.concepts[editing.id]} selection={selection} onSelect={onSelect}
        onBack={() => { setEditing(null); setTab('concepts'); }} />;
    }
    return <StructureEditor coll={editing.coll} structure={lib[editing.coll][editing.id]} selection={selection} onSelect={onSelect}
      onBack={() => { setEditing(null); setTab(editing.coll); }} />;
  }

  return (
    <div className="main">
      <div className="mhead">
        <div>
          <div className="crumb">Library / <b>{groupMeta.label}</b></div>
          <h2>Library — {groupMeta.label}</h2>
        </div>
        <div className="right">
          <span className="libbadge">Templates — reusable across games</span>
          <button className="btn primary" onClick={addNew}>{activeTab.addLabel}</button>
        </div>
      </div>
      <div className="toolrow">
        {groupMeta.tabs.map((tid) => {
          const t = TABS.find((x) => x.id === tid);
          return (
            <button key={t.id} className={`chip${tab === t.id ? ' on' : ''}`}
              style={tab === t.id ? { background: t.color } : undefined}
              onClick={() => setTab(t.id)}>
              {t.label} · {tabCount(t.id)}
            </button>
          );
        })}
      </div>

      {tab === 'items' && (
        <div className="toolrow" style={{ paddingBottom: 12 }}>
          <TypeChips value={typeFilter} onChange={setTypeFilter} totalLabel={`All types · ${Object.keys(lib.items).length}`} />
        </div>
      )}
      {(tab === 'items' || tab === 'locations') && (
        <div className={`gallery${tab === 'locations' ? ' loc' : ''}`}>
          {Object.values(lib[tab]).filter((t) => tab !== 'items' || typeFilter === 'all' || t.type === typeFilter).map((t) => (
            <figure key={t.id} className={`card lib${selId === t.id ? ' sel' : ''}`} onClick={() => pick(tab, t.id)}>
              <div className="thumb"><Thumb image={t.image} type={t.type || 'location'} /></div>
              <figcaption>
                <b>{t.name}</b>
                <span className="tag libtag">Template · <span className="mono">{t.id}</span></span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {tab === 'mechanics' && (
        <div className="librows">
          {Object.values(lib.mechanics).map((m) => (
            <button key={m.id} className={`librow${selId === m.id ? ' sel' : ''}`} onClick={() => pick('mechanics', m.id)}>
              <span className="sq" style={{ background: ENTITY_COLORS.mechanic }} />
              <div><b>{m.name}</b><small>{m.summary}{m.params?.length ? ` · ${m.params.map((p) => `${p.label} ${p.value}`).join(', ')}` : ''}</small></div>
              <span className="mono dim">{m.id}</span>
            </button>
          ))}
        </div>
      )}

      {tab === 'mechBuilder' && (
        <div className="nodebuilder-wrap">
          <NodePalette
            title="Mechanics NodeStructureBuilder"
            subtitle="Create reusable task templates"
            search={mechBuilderQuery}
            onSearch={setMechBuilderQuery}
            filters={MECHANICS_PALETTE_FILTERS.filter((f) => !['templates', 'physical', 'locations'].includes(f.id))}
            activeFilter={mechBuilderFilter}
            onFilter={setMechBuilderFilter}
            groups={mechBuilderPaletteGroups}
            headerAction={<><div className="canvas-tool-cluster support-tool-group"><span className="tool-kind-label">Support</span>
              <button className="btn tiny" onClick={() => addBuilderFrame()}>Frame</button>
              <button className="btn tiny" onClick={() => addBuilderCircle()}>Circle</button>
              <button className="btn tiny" onClick={() => addBuilderNumber()}>Number</button>
              <button className="btn tiny" onClick={() => addBuilderTitle()}>Title</button>
              <button className="btn tiny" onClick={() => addBuilderArrow()}>Arrow</button>
              </div>
              <button className="btn tiny" onClick={() => setBrowsingMechanicsLibrary(true)}>Browse Library</button>
            </>}
          />
          <div className="nodebuilder-main">
            <FlowCanvas
              nodes={builder.nodes}
              edges={builder.edges}
              selId={builderSel}
              colorOf={builderColor}
              iconOf={builderIcon}
              nodeClass={(n) => (n.kind === 'mechanicSubnode' ? 'subnode' : '')}
              onSelect={(id) => selectBuilderNode(id, builder.nodes)}
              onMove={(id, x, y) => setBuilder((b) => ({ ...b, nodes: { ...b.nodes, [id]: { ...b.nodes[id], x, y } } }))}
              onMoveNodes={(positions) => setBuilder((b) => {
                const nodes = { ...b.nodes };
                Object.entries(positions).forEach(([id, pos]) => {
                  if (nodes[id]) nodes[id] = { ...nodes[id], ...pos };
                });
                return { ...b, nodes };
              })}
              onResizeNode={(id, patch) => setBuilder((b) => ({ ...b, nodes: { ...b.nodes, [id]: { ...b.nodes[id], ...patch } } }))}
              onConnect={(from, to, edgePatch = {}) => setBuilder((b) => {
                if (from === to) return b;
                if (b.edges.some((e) => e.from === from && e.to === to)) {
                  return { ...b, edges: b.edges.map((e) => e.from === from && e.to === to ? { ...e, ...edgePatch } : e) };
                }
                return { ...b, edges: [...b.edges, { from, to, label: '', color: builderColor(b.nodes[from]), ...edgePatch }] };
              })}
              onRemoveEdge={(e) => setBuilder((b) => ({ ...b, edges: b.edges.filter((x) => !(x.from === e.from && x.to === e.to)) }))}
              onRemoveEdges={(hit) => setBuilder((b) => ({ ...b, edges: b.edges.filter((x) => !hit.some((e) => e.from === x.from && e.to === x.to)) }))}
              onSetColor={(id, color) => setBuilder((b) => ({ ...b, nodes: { ...b.nodes, [id]: { ...b.nodes[id], color } } }))}
              onDeleteNode={(id) => setBuilder((b) => {
                const nodes = { ...b.nodes };
                delete nodes[id];
                setBuilderSel(null);
                return { ...b, nodes, edges: b.edges.filter((e) => e.from !== id && e.to !== id) };
              })}
              onDeleteNodes={(ids) => setBuilder((b) => {
                const removed = new Set(ids);
                const nodes = { ...b.nodes };
                ids.forEach((id) => delete nodes[id]);
                setBuilderSel(null);
                return { ...b, nodes, edges: b.edges.filter((e) => !removed.has(e.from) && !removed.has(e.to)) };
              })}
              onClearCanvas={() => {
                setBuilder((b) => ({ ...b, nodes: {}, edges: [], frames: {}, numberMarkers: {}, titleMarkers: {} }));
                setBuilderSel(null);
                setBuilderFrameSel(null);
                setBuilderNumberSel(null);
                setBuilderTitleSel(null);
              }}
              onEditEdge={(e, edgePatch) => setBuilder((b) => ({ ...b, edges: b.edges.map((x) => (x.from === e.from && x.to === e.to ? { ...x, ...edgePatch } : x)) }))}
              onDropPalette={(payload, x, y) => addMechanicBuilderPayload(payload, { x, y })}
              onPasteNode={(p) => {
                const id = genId(builder.nodes, 'B');
                const node = { ...p, id, x: p.x, y: p.y, w: p.w ?? undefined, h: p.h ?? undefined };
                setBuilder((b) => ({ ...b, nodes: { ...b.nodes, [id]: node } }));
                setBuilderSel(id);
              }}
              renderBody={(n) => (isSupportingMechanicSubnode(n) || n.kind === 'item' ? null : n.body)}
              renderExtra={(n) => {
                if (supportingMechanicSubnodePreview(n, proj)) return <SupportingMechanicPreview node={n} game={proj} onSelect={onSelect} />;
                if (isProgressStateNode(n)) return <ProgressMechanicPreview node={n} />;
                if (n.kind === 'item') return <div className="nsets"><span className="factchip sm subcount"><i />{n.buildStatus || 'concept'}</span></div>;
                return null;
              }}
              frames={builder.frames || {}}
              selFrame={builderFrameSel}
              onFrameSelect={(id) => selectBuilderFrame(id)}
              onFrameMove={(id, dx, dy) => setBuilder((b) => {
                const moved = moveFrameGraphPatch(b, id, dx, dy);
                return moved ? { ...b, ...moved } : b;
              })}
              onFrameResize={(id, w, h) => setBuilder((b) => {
                const fr = b.frames?.[id];
                if (!fr) return b;
                return { ...b, frames: { ...(b.frames || {}), [id]: { ...fr, w, h } } };
              })}
              numberMarkers={builder.numberMarkers || {}}
              selNumberMarker={builderNumberSel}
              onNumberMarkerSelect={(id) => selectBuilderNumber(id)}
              onNumberMarkerMove={(id, dx, dy) => setBuilder((b) => {
                const marker = b.numberMarkers?.[id];
                if (!marker) return b;
                return { ...b, numberMarkers: { ...(b.numberMarkers || {}), [id]: { ...marker, x: marker.x + dx, y: marker.y + dy } } };
              })}
              onNumberMarkerDelete={deleteBuilderNumber}
              titleMarkers={builder.titleMarkers || {}}
              selTitleMarker={builderTitleSel}
              onTitleMarkerSelect={(id) => selectBuilderTitle(id)}
              onTitleMarkerMove={(id, dx, dy) => setBuilder((b) => {
                const marker = b.titleMarkers?.[id];
                if (!marker) return b;
                return { ...b, titleMarkers: { ...(b.titleMarkers || {}), [id]: { ...marker, x: marker.x + dx, y: marker.y + dy } } };
              })}
              onTitleMarkerDelete={deleteBuilderTitle}
            />
          </div>
        </div>
      )}

      {tab === 'mechPrimitives' && (
        <div className="gallery prim">
          {Object.values(lib.mechPrimitives).filter((p) => !p.deprecated).map((p) => (
            <button key={p.id} className={`primcard${selId === p.id ? ' sel' : ''}`}
              style={{ borderTopColor: p.color }} onClick={() => pick('mechPrimitives', p.id)}>
              <div className="primhead">
                <span className="primic" style={{ background: p.color }}><PrimIcon icon={p.icon} color="#fff" /></span>
                <b>{p.name}</b>
              </div>
              <small>{p.defaultBody}</small>
              <div className="primmeta dim mono">~{p.estMinutes} min · {p.id}</div>
            </button>
          ))}
        </div>
      )}

      {tab === 'mechSubnodes' && (
        <div className="subnode-catalog">
          {MECHANIC_SUBNODE_CATEGORY_SECTIONS.map((section) => {
            const subnodes = Object.values(lib.mechSubnodes || {}).filter((sn) => !sn.deprecated && !sn.hiddenFromPalette && mechanicSubnodeCategory(sn) === section.id);
            if (!subnodes.length) return null;
            return (
              <section key={section.id} className="subnode-section">
                <div className="subnode-section-head">
                  <div><b>{section.label}</b><small>{section.hint}</small></div>
                  <span>{subnodes.length}</span>
                </div>
                <div className="gallery prim compact">
                  {subnodes.map((sn) => {
                    const meta = MECHANIC_SUBNODE_TYPES[sn.kind] || {};
                    return (
                      <button key={sn.id} className={`primcard subnode${selId === sn.id ? ' sel' : ''}`}
                        style={{ borderTopColor: sn.color || meta.color }} onClick={() => pick('mechSubnodes', sn.id)}>
                        <div className="primhead">
                          <span className="primic" style={{ background: sn.color || meta.color }}><PrimIcon icon={sn.icon || meta.icon} color="#fff" /></span>
                          <b>{sn.name || meta.label}</b>
                        </div>
                        <small>{sn.purpose || meta.purpose}</small>
                        <div className="primmeta dim mono">{section.label} - {sn.id}</div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {tab === 'sensors' && (
        <div className="librows">
          {Object.values(lib.sensors).map((x) => (
            <button key={x.id} className={`librow${selId === x.id ? ' sel' : ''}`} onClick={() => pick('sensors', x.id)}>
              <span className="sq" style={{ background: ENTITY_COLORS.sensor }} />
              <div><b>{x.kind}</b><small>{x.label}</small></div>
              <span className="mono dim">{x.id}</span>
            </button>
          ))}
        </div>
      )}

      {tab === 'narrative' && (
        <div className="nodebuilder-wrap">
          <NodePalette
            title="NodeStructureBuilder"
            subtitle="Create reusable templates"
            groups={libraryPaletteGroups}
            headerAction={<><div className="canvas-tool-cluster support-tool-group"><span className="tool-kind-label">Support</span>
              <button className="btn tiny" onClick={() => addBuilderFrame()}>Frame</button>
              <button className="btn tiny" onClick={() => addBuilderCircle()}>Circle</button>
              <button className="btn tiny" onClick={() => addBuilderNumber()}>Number</button>
              <button className="btn tiny" onClick={() => addBuilderTitle()}>Title</button>
              <button className="btn tiny" onClick={() => addBuilderArrow()}>Arrow</button>
              </div>
              <button className="btn tiny" onClick={() => setBrowsingNarrativeLibrary(true)}>Browse Library</button>
            </>}
          />
          <div className="nodebuilder-main">
            <FlowCanvas
              nodes={builderMerged}
              edges={builder.edges}
              selId={builderSel}
              colorOf={builderColor}
              iconOf={builderIcon}
              nodeClass={(n) => (n._sub ? 'subnode' : n.kind === 'framework' ? 'framework' : n.kind === 'concept' ? 'concept' : '')}
              onSelect={(id) => selectBuilderNode(id)}
              onMove={(id, x, y) => setBuilder((b) => {
                const coll = b.subnodes?.[id] ? 'subnodes' : b.frameworks?.[id] ? 'frameworks' : 'nodes';
                return { ...b, [coll]: { ...b[coll], [id]: { ...b[coll][id], x, y } } };
              })}
              onMoveNodes={(positions) => setBuilder((b) => {
                const next = { ...b, nodes: { ...b.nodes }, subnodes: { ...(b.subnodes || {}) }, frameworks: { ...(b.frameworks || {}) } };
                Object.entries(positions).forEach(([id, pos]) => {
                  const coll = next.subnodes[id] ? 'subnodes' : next.frameworks[id] ? 'frameworks' : 'nodes';
                  if (next[coll][id]) next[coll][id] = { ...next[coll][id], ...pos };
                });
                return next;
              })}
              onResizeNode={(id, patch) => setBuilder((b) => {
                const coll = b.subnodes?.[id] ? 'subnodes' : b.frameworks?.[id] ? 'frameworks' : 'nodes';
                return { ...b, [coll]: { ...b[coll], [id]: { ...b[coll][id], ...patch } } };
              })}
              onConnect={(from, to, edgePatch = {}) => setBuilder((b) => {
                if (from === to) return b;
                if (b.edges.some((e) => e.from === from && e.to === to)) {
                  return { ...b, edges: b.edges.map((e) => e.from === from && e.to === to ? { ...e, ...edgePatch } : e) };
                }
                return { ...b, edges: [...b.edges, { from, to, label: '', color: builderColor(builderMerged[from]), ...edgePatch }] };
              })}
              onRemoveEdge={(e) => setBuilder((b) => ({ ...b, edges: b.edges.filter((x) => !(x.from === e.from && x.to === e.to)) }))}
              onRemoveEdges={(hit) => setBuilder((b) => ({ ...b, edges: b.edges.filter((x) => !hit.some((e) => e.from === x.from && e.to === x.to)) }))}
              onSetColor={(id, color) => setBuilder((b) => {
                const coll = b.subnodes?.[id] ? 'subnodes' : b.frameworks?.[id] ? 'frameworks' : 'nodes';
                return { ...b, [coll]: { ...b[coll], [id]: { ...b[coll][id], color } } };
              })}
              onDeleteNode={(id) => setBuilder((b) => {
                const coll = b.subnodes?.[id] ? 'subnodes' : b.frameworks?.[id] ? 'frameworks' : 'nodes';
                const next = { ...b[coll] };
                delete next[id];
                setBuilderSel(null);
                return { ...b, [coll]: next, edges: b.edges.filter((e) => e.from !== id && e.to !== id) };
              })}
              onDeleteNodes={(ids) => setBuilder((b) => {
                const removed = new Set(ids);
                const next = { ...b, nodes: { ...b.nodes }, subnodes: { ...(b.subnodes || {}) }, frameworks: { ...(b.frameworks || {}) } };
                ids.forEach((id) => {
                  delete next.nodes[id];
                  delete next.subnodes[id];
                  delete next.frameworks[id];
                });
                next.edges = b.edges.filter((e) => !removed.has(e.from) && !removed.has(e.to));
                setBuilderSel(null);
                return next;
              })}
              onClearCanvas={() => {
                setBuilder((b) => ({ ...b, nodes: {}, subnodes: {}, frameworks: {}, edges: [], frames: {}, numberMarkers: {}, titleMarkers: {} }));
                setBuilderSel(null);
                setBuilderFrameSel(null);
                setBuilderNumberSel(null);
                setBuilderTitleSel(null);
              }}
              onEditEdge={(e, edgePatch) => setBuilder((b) => ({ ...b, edges: b.edges.map((x) => (x.from === e.from && x.to === e.to ? { ...x, ...edgePatch } : x)) }))}
              onDropPalette={handleBuilderDrop}
              onPasteNode={(p) => {
                const id = genId(builder.nodes, 'B');
                setBuilder((b) => ({ ...b, nodes: { ...b.nodes, [id]: { id, kind: p.kind, title: p.title, x: p.x, y: p.y, body: p.body || '', color: p.color ?? null, w: p.w ?? undefined, h: p.h ?? undefined } } }));
                setBuilderSel(id);
              }}
              frames={builder.frames || {}}
              selFrame={builderFrameSel}
              onFrameSelect={(id) => selectBuilderFrame(id)}
              onFrameMove={(id, dx, dy) => setBuilder((b) => {
                const moved = moveFrameGraphPatch(b, id, dx, dy);
                return moved ? { ...b, ...moved } : b;
              })}
              onFrameResize={(id, w, h) => setBuilder((b) => {
                const fr = b.frames?.[id];
                if (!fr) return b;
                return { ...b, frames: { ...(b.frames || {}), [id]: { ...fr, w, h } } };
              })}
              numberMarkers={builder.numberMarkers || {}}
              selNumberMarker={builderNumberSel}
              onNumberMarkerSelect={(id) => selectBuilderNumber(id)}
              onNumberMarkerMove={(id, dx, dy) => setBuilder((b) => {
                const marker = b.numberMarkers?.[id];
                if (!marker) return b;
                return { ...b, numberMarkers: { ...(b.numberMarkers || {}), [id]: { ...marker, x: marker.x + dx, y: marker.y + dy } } };
              })}
              onNumberMarkerDelete={deleteBuilderNumber}
              titleMarkers={builder.titleMarkers || {}}
              selTitleMarker={builderTitleSel}
              onTitleMarkerSelect={(id) => selectBuilderTitle(id)}
              onTitleMarkerMove={(id, dx, dy) => setBuilder((b) => {
                const marker = b.titleMarkers?.[id];
                if (!marker) return b;
                return { ...b, titleMarkers: { ...(b.titleMarkers || {}), [id]: { ...marker, x: marker.x + dx, y: marker.y + dy } } };
              })}
              onTitleMarkerDelete={deleteBuilderTitle}
              renderBody={(n) => (n.kind === 'item' ? null : n.body)}
              renderExtra={(n) => {
                if (n.kind === 'item') return <div className="nsets"><span className="factchip sm subcount"><i />{n.buildStatus || 'concept'}</span></div>;
                if (n.kind !== 'framework') return null;
                const fw = FRAMEWORK_TYPES[n.frameworkId] || FRAMEWORK_TYPES.fate;
                return <FrameworkPreview frameworkId={fw.id} />;
              }}
            />
            <div className="nodebuilder-intro">
              <div>
                <b>Reusable node templates</b>
                <small>Base node and subnode templates stay in the Library until imported or used in a game.</small>
              </div>
              <button className="btn" onClick={addStoryStructure}>New Story Structure</button>
            </div>
            <div className="cptsection">
              <div className="cptsectionhead">Base Node Templates</div>
              <div className="cptgrid">
                {Object.values(lib.narrative || {}).filter((n) => n.nodeClass === 'base').map((n) => {
                  const meta = BASE_NODE_TYPES[n.nodeKind] || { label: 'Node', color: n.color || '#8B92A6', icon: n.icon || 'flag' };
                  return (
                    <button key={n.id} className={`cptcard${selId === n.id ? ' sel' : ''}`} style={{ borderTopColor: n.color || meta.color }}
                      onClick={() => pick('narrative', n.id)}>
                      <div className="primhead">
                        <span className="primic" style={{ background: n.color || meta.color }}><PrimIcon icon={n.icon || meta.icon} color="#fff" /></span>
                        <b>{n.name}</b>
                      </div>
                      <small>{n.body || meta.blurb}</small>
                      <div className="structmeta">
                        <span className="linkbtn danger" onClick={(e) => { e.stopPropagation(); deleteTemplate('narrative', n.id, n.nodeClass === 'subnode' ? 'subnode template' : 'base node template', n.name); }}>Delete</span>
                      </div>
                      <div className="primmeta dim mono">{meta.label} · {n.id}</div>
                    </button>
                  );
                })}
                {Object.values(lib.narrative || {}).filter((n) => n.nodeClass === 'base').length === 0 && (
                  <div className="empty">No base node templates yet. Use the Library Nodes sidebar to create one.</div>
                )}
              </div>
            </div>
            <div className="cptsection">
              <div className="cptsectionhead">Subnode Templates</div>
              <div className="cptgrid">
                {Object.values(lib.narrative || {}).filter((n) => n.nodeClass === 'subnode').map((n) => {
                  const meta = SUBNODE_TYPES[n.subKind] || { label: 'Subnode', color: n.color || '#F08CB4', icon: n.icon || 'swap' };
                  return (
                    <button key={n.id} className={`cptcard${selId === n.id ? ' sel' : ''}`} style={{ borderTopColor: n.color || meta.color }}
                      onClick={() => pick('narrative', n.id)}>
                      <div className="primhead">
                        <span className="primic" style={{ background: n.color || meta.color }}><PrimIcon icon={n.icon || meta.icon} color="#fff" /></span>
                        <b>{n.name}</b>
                      </div>
                      <small>{n.body || meta.blurb}</small>
                      <div className="primmeta dim mono">{meta.label} · {n.id}</div>
                    </button>
                  );
                })}
                {Object.values(lib.narrative || {}).filter((n) => n.nodeClass === 'subnode').length === 0 && (
                  <div className="empty">No subnode templates yet. Use the Library Nodes sidebar to create one.</div>
                )}
              </div>
            </div>
            <div className="cptsection">
              <div className="cptsectionhead">Story Structures</div>
              <div className="structgrid">
                {Object.values(lib.stories || {}).map((st) => (
                  <button key={st.id} className={`structcard${selId === st.id ? ' sel' : ''}`}
                    onClick={() => { pick('stories', st.id); setEditing({ coll: 'stories', id: st.id }); }}>
                    <StructureThumb structure={st} lib={lib} />
                    <b>{st.name}</b>
                    <small>{st.description}</small>
                    <div className="structmeta">
                      <span className="mono">~{st.estMinutes} min</span>
                      <span className="mono dim">{Object.keys(st.nodes).length} nodes · {st.edges.length} links</span>
                      <span className="linkbtn danger" onClick={(e) => { e.stopPropagation(); deleteTemplate('stories', st.id, 'story structure', st.name); }}>Delete</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'narrative' && (
        <div className="elemwrap">
          <div className="toolrow" style={{ paddingTop: 12 }}>
            <button className={`chip${narrFilter === 'all' ? ' on' : ''}`}
              style={narrFilter === 'all' ? { background: '#F08CB4' } : undefined}
              onClick={() => setNarrFilter('all')}>All · {Object.keys(lib.narrative).length}</button>
            {Object.values(lib.narrativeCategories).map((meta) => (
              <span key={meta.id} className={`chip cat${narrFilter === meta.id ? ' on' : ''}`}
                style={narrFilter === meta.id ? { background: meta.color } : undefined}
                onClick={() => setNarrFilter(meta.id)} role="button" tabIndex={0}>
                {meta.label}s
                <button className="x" title={`Delete category "${meta.label}"`}
                  onClick={(e) => { e.stopPropagation(); deleteCategory(meta.id); }}>×</button>
              </span>
            ))}
            <button className="chip addcat" onClick={addCategory}>+ New category</button>
          </div>
          <div className="gallery elem">
            {Object.values(lib.narrative)
              .filter((n) => narrFilter === 'all' || n.category === narrFilter)
              .map((n) => {
                const meta = lib.narrativeCategories[n.category] ?? { label: n.category, color: '#8B92A6' };
                return (
                  <button key={n.id} className={`elemcard${selId === n.id ? ' sel' : ''}`}
                    style={{ borderTopColor: n.color || meta.color }} onClick={() => pick('narrative', n.id)}>
                    <span className="etag" style={{ color: n.color || meta.color }}><PrimIcon icon={n.icon} color={n.color || meta.color} size={12} /> {meta.label}</span>
                    <b>{n.name}</b>
                    <small>{n.body}</small>
                    <div className="primmeta dim mono">{(n.tags || []).map((t) => `#${t}`).join(' ')} · {n.id}</div>
                  </button>
                );
              })}
            {Object.values(lib.narrative).every((n) => narrFilter !== 'all' && n.category !== narrFilter) && (
              <div className="empty" style={{ gridColumn: '1/-1' }}>
                Nothing in this category yet — <b>{activeTab.addLabel}</b> creates one here.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'baseNodes' && (
        <div className="cptcatalogue">
          <div className="cptsection">
            <div className="cptsectionhead">Fresh Base Nodes</div>
            <div className="cptgrid">
              {Object.values(BASE_NODE_TYPES).map((t) => (
                <button key={t.id} className="cptcard base" style={{ borderTopColor: t.color }} onClick={() => addNodeTemplate(t.id)}>
                  <div className="primhead">
                    <span className="primic" style={{ background: t.color }}><PrimIcon icon={t.icon} color="#fff" /></span>
                    <b>{t.label}</b>
                  </div>
                  <small>{t.blurb}</small>
                  <div className="structmeta">
                    <span className="linkbtn">Create reusable template</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="cptsection">
            <div className="cptsectionhead">Saved Base Nodes</div>
            <div className="cptgrid">
              {Object.values(lib.narrative || {}).filter((n) => n.nodeClass === 'base').map((n) => {
                const meta = baseTemplateMeta(n.nodeKind) || { label: 'Base Node', color: n.color || '#8B92A6', icon: n.icon || 'flag' };
                return (
                  <button key={n.id} className={`cptcard${selId === n.id ? ' sel' : ''}`} style={{ borderTopColor: n.color || meta.color }}
                    onClick={() => pick('narrative', n.id)}>
                    <div className="primhead">
                      <span className="primic" style={{ background: n.color || meta.color }}><PrimIcon icon={n.icon || meta.icon} color="#fff" /></span>
                      <b>{n.name}</b>
                    </div>
                    <small>{n.body || meta.blurb}</small>
                    <div className="structmeta">
                      <span className="linkbtn danger" onClick={(e) => { e.stopPropagation(); deleteTemplate('narrative', n.id, n.nodeClass === 'subnode' ? 'subnode template' : 'base node template', n.name); }}>Delete</span>
                    </div>
                    <div className="primmeta dim mono">{meta.label} · {n.id}</div>
                  </button>
                );
              })}
              {Object.values(lib.narrative || {}).filter((n) => n.nodeClass === 'base').length === 0 && (
                <div className="empty" style={{ gridColumn: '1/-1' }}>No saved base nodes yet. Select a node in Narrative Weaver or Master Story and use <b>Save as Base Node</b>.</div>
              )}
            </div>
          </div>
          <div className="cptsection">
            <div className="cptsectionhead">Saved Subnodes</div>
            <div className="cptgrid">
              {Object.values(lib.narrative || {}).filter((n) => n.nodeClass === 'subnode').map((n) => {
                const meta = SUBNODE_TYPES[n.subKind] || { label: 'Subnode', color: n.color || '#F08CB4', icon: n.icon || 'swap' };
                return (
                  <button key={n.id} className={`cptcard${selId === n.id ? ' sel' : ''}`} style={{ borderTopColor: n.color || meta.color }}
                    onClick={() => pick('narrative', n.id)}>
                    <div className="primhead">
                      <span className="primic" style={{ background: n.color || meta.color }}><PrimIcon icon={n.icon || meta.icon} color="#fff" /></span>
                      <b>{n.name}</b>
                    </div>
                    <small>{n.body || meta.blurb}</small>
                    <div className="primmeta dim mono">{meta.label} · {n.id}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'concepts' && (
        <div className="cptcatalogue concepts-only">
          {/* Base Nodes — the minimum independent building blocks. */}
          <div className="cptsection">
            <div className="cptsectionhead">Base Nodes</div>
            <div className="cptgrid">
              {Object.values(BASE_NODE_TYPES).map((t) => (
                <div key={t.id} className="cptcard base" style={{ borderTopColor: t.color }}>
                  <div className="primhead">
                    <span className="primic" style={{ background: t.color }}><PrimIcon icon={t.icon} color="#fff" /></span>
                    <b>{t.label}</b>
                  </div>
                  <small>{t.blurb}</small>
                  <div className="structmeta">
                    <button className="btn" onClick={() => {
                      const id = genId(proj.nodes, `${proj.meta.prefix}-N-`);
                      projDispatch({ type: 'ADD_NODE', node: {
                        id, kind: t.id, title: `New ${t.label.toLowerCase()}`, x: 90, y: 90, body: '', color: null,
                        teamId: null, sets: [], locationId: null, itemId: null, mechanicIds: [], sensorIds: [], history: [],
                        ...(t.id === 'item' ? {
                          itemType: 'Artifact', shortTitle: 'Item', playerDescription: '', facilitatorDescription: '', imageRef: '',
                          buildStatus: 'concept', origin: '', placementNodeIds: [], linkedMechanicNodeIds: [], linkedMechanicIds: [],
                          sensorHooks: '', noSoloSolve: false, mechanicMeaning: '', attachedTemplateNotes: '', persistsAcrossTasks: false,
                        } : {}),
                      } });
                    }}>Add to Canvas</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Additional Node categories, in the locked order. */}
          {CONCEPT_ORDER.map((cat) => {
            const meta = ADDITIONAL_NODE_TYPES[cat];
            const inCat = Object.values(lib.concepts ?? {}).filter((c) => c.category === cat);
            return (
              <div className="cptsection" key={cat}>
                <div className="cptsectionhead" style={{ color: meta.color }}>
                  <PrimIcon icon={meta.icon} color={meta.color} size={13} /> {meta.label}s
                </div>
                <div className="cptgrid">
                  <button className="cptcard create" onClick={() => addConcept(cat)}>
                    <b>+ Create new {meta.label.toLowerCase()}…</b>
                    <small>Starts completely empty — build inside, rename, save. It becomes a reusable template.</small>
                  </button>
                  {inCat.map((c) => (
                    <button key={c.id} className={`cptcard${selId === c.id ? ' sel' : ''}`} style={{ borderTopColor: meta.color }}
                      onClick={() => { pick('concepts', c.id); setPreview(c.id); }}>
                      <div className="primhead">
                        <span className="primic" style={{ background: meta.color }}><PrimIcon icon={meta.icon} color="#fff" /></span>
                        <b>{c.name}</b>
                        {c.premade && <span className="cptbadge premade">pre-made</span>}
                      </div>
                      <StructureThumb structure={c} lib={lib} width={216} height={70} />
                      <small>{c.description}</small>
                      <div className="primmeta dim mono">{Object.keys(c.nodes).length} nodes · {c.id}</div>
                      <div className="structmeta">
                        <span className="linkbtn danger" onClick={(e) => { e.stopPropagation(); deleteTemplate('concepts', c.id, 'concept', c.name); }}>Delete</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'frameworks' && (
        <div className="cptcatalogue">
          <div className="cptsection">
            <div className="cptsectionhead">Frameworks</div>
            <div className="cptgrid">
              {Object.values(FRAMEWORK_TYPES).map((fw) => (
                <button key={fw.id} className={`cptcard${selId === fw.id ? ' sel' : ''}`} style={{ borderTopColor: fw.color }}
                  onClick={() => pick('frameworkType', fw.id)}>
                  <div className="primhead">
                    <span className="primic" style={{ background: fw.color }}><PrimIcon icon={fw.icon} color="#fff" /></span>
                    <b>{fw.label}</b>
                  </div>
                  <StructureThumb structure={{ nodes: {}, edges: [] }} lib={lib} width={216} height={28} />
                  <small>{fw.blurb}</small>
                  <div className={`fw-inspector-card${fw.layout === 'values' ? ' values' : ''}`}>
                    {fw.phases.map((phase, idx) => (
                      <div key={phase.key}><span>{idx + 1}</span><b>{phase.key}</b><small>{phase.name}</small></div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'concepts' && preview && lib.concepts?.[preview] && (
        <ConceptPreview
          concept={lib.concepts[preview]}
          onClose={() => setPreview(null)}
          onEdit={(id) => {
            setPreview(null);
            pick('concepts', id);
            setEditing({ coll: 'concepts', id });
          }}
        />
      )}
      {browsingNarrativeLibrary && (
        <NarrativeLibraryBrowser sections={narrativeBrowserSections} onClose={() => setBrowsingNarrativeLibrary(false)} />
      )}
      {browsingMechanicsLibrary && (
        <NarrativeLibraryBrowser
          title="Mechanics Library Browser"
          subtitle="Browse task templates, physical elements, sensors, and locations."
          sections={mechanicsBrowserSections}
          onClose={() => setBrowsingMechanicsLibrary(false)}
        />
      )}

      {(tab === 'stories' || tab === 'mechStructures') && (
        <div className="structgrid pad">
          {Object.values(lib[tab]).map((st) => (
            <button key={st.id} className={`structcard${selId === st.id ? ' sel' : ''}`}
              onClick={() => { pick(tab, st.id); setEditing({ coll: tab, id: st.id }); }}>
              <StructureThumb structure={st} lib={lib} />
              <b>{st.name}</b>
              <small>{st.description}</small>
              <div className="structmeta">
                <span className="mono">~{st.estMinutes} min</span>
                <span className="mono dim">{Object.keys(st.nodes).length} nodes · {st.edges.length} links</span>
                {(tab === 'stories' || tab === 'mechStructures') && (
                  <span className="linkbtn danger" onClick={(e) => {
                    e.stopPropagation();
                    deleteTemplate(tab, st.id, tab === 'mechStructures' ? 'mechanic structure' : 'story structure', st.name);
                  }}>Delete</span>
                )}
                <span className="linkbtn">Open editor →</span>
              </div>
            </button>
          ))}
          {Object.keys(lib[tab]).length === 0 && (
            <div className="empty" style={{ gridColumn: '1/-1' }}>No structures yet — <b>{activeTab.addLabel}</b> opens a blank canvas.</div>
          )}
        </div>
      )}

      <div className="statusbar">
        <span>Editing a template updates the <b>master blueprint for future games</b> — instances already in a game keep their own copy.</span>
      </div>
    </div>
  );
}
