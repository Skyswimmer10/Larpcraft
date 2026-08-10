import React from 'react';
import { useGame, useDispatch, useLibrary } from '../state/store.jsx';
import { locateGraph } from '../state/reducer.js';
import { ENTITY_COLORS, PrimIcon } from './bits.jsx';
import FlowCanvas, { visibleCanvasPlacement } from './FlowCanvas.jsx';
import { genId } from '../data/csvSchemas.js';
import { FRAMEWORK_TYPES, cloneCharacterCardTemplate } from '../data/seed.js';
import { isProgressStateNode, isSupportingMechanicSubnode, progressPercent, progressValue, supportingMechanicSubnodePreview } from '../mechanics/palette.js';
import FrameworkPreview from './FrameworkPreview.jsx';
import { nextVisualMarkerValue } from '../lib/visualMarkers.js';
import { remapCanvasClipboard } from '../lib/canvasClipboard.js';
import MechanismNodePreview, { isMechanismPreviewNode } from './MechanismNodePreview.jsx';

const scopeKey = (s) => `${s.coll}:${(s.parentPath ?? (s.parentId ? [s.parentId] : [])).join('/')}`;
const sameScope = (a, b) => a && b && scopeKey(a) === scopeKey(b);

// A self-contained node canvas bound to one located graph (a surface task flow
// or any node's nested `.sub`). All edits flow through the generic GRAPH_*
// actions, so the same component drives every level of the hierarchy.
//   scope   — { coll, parentId? } locating the graph to edit
//   palette — typed node kinds to offer in the add row
//   allowOpen / onOpen — enable double-click drill-in on this level
export default function GraphEditor({
  scope, palette, allowOpen, onOpen, selection, onSelect, idPrefix = 'D',
  filterNode = () => true, showToolbar = true, createNodeFromPalette, enableFrames = false,
}) {
  const s = useGame();
  const lib = useLibrary();
  const dispatch = useDispatch();
  const g = locateGraph(s, scope);
  const nodes = Object.fromEntries(Object.entries(g.nodes).filter(([, n]) => filterNode(n)));
  const frames = g.frames || {};
  const numberMarkers = g.numberMarkers || {};
  const titleMarkers = g.titleMarkers || {};
  const isVisibleEndpoint = (id) => Boolean(nodes[id] || titleMarkers[id]);
  const edges = g.edges.filter((e) => isVisibleEndpoint(e.from) && isVisibleEndpoint(e.to));
  const paletteById = Object.fromEntries(palette.map((p) => [p.id, p]));
  const selId = selection?.kind === 'graphnode' && sameScope(selection.scope, scope) && nodes[selection.id] ? selection.id : null;
  const selFrame = selection?.kind === 'graphframe' && sameScope(selection.scope, scope) && frames[selection.id] ? selection.id : null;
  const selNumberMarker = selection?.kind === 'graphnumber' && sameScope(selection.scope, scope) && numberMarkers[selection.id] ? selection.id : null;
  const selTitleMarker = selection?.kind === 'graphtitle' && sameScope(selection.scope, scope) && titleMarkers[selection.id] ? selection.id : null;

  const colorOf = (n) => n?.kind === 'framework'
    ? (n.color || FRAMEWORK_TYPES[n.frameworkId]?.color || ENTITY_COLORS.framework)
    : n?.color || paletteById[n?.kind]?.color || ENTITY_COLORS[n?.kind] || '#8B92A6';
  const iconOf = (n) => n.kind === 'framework' ? (FRAMEWORK_TYPES[n.frameworkId]?.icon || 'target') : (n.icon || paletteById[n.kind]?.icon || null);
  const renderSupportingPreview = (n) => {
    const preview = supportingMechanicSubnodePreview(n, s);
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
                  onSelect({ kind: link.kind, id: link.id });
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
  };
  const renderProgressPreview = (n) => {
    if (!isProgressStateNode(n)) return null;
    const value = progressValue(n);
    return (
      <div className="progress-preview">
        <div className="progress-preview-head"><b>{value}/10</b><span>{progressPercent(n)}%</span></div>
        <div className="progress-mini" aria-label={`${value} out of 10 completed`}>
          {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < value ? 'on' : ''} />)}
        </div>
      </div>
    );
  };

  const addNode = (kind, pos = null, patch = {}) => {
    const id = genId(g.nodes, `${idPrefix}-`);
    const nodePos = pos || visibleCanvasPlacement({ x: 80, y: 80 });
    const node = {
      id, kind, title: `New ${(paletteById[kind]?.label || kind).toLowerCase()}`,
      x: nodePos.x, y: nodePos.y,
      body: '', color: null,
      ...(kind === 'character' ? cloneCharacterCardTemplate(s.meta.characterCardTemplate) : {}),
      ...patch,
    };
    dispatch({ type: 'GRAPH_ADD_NODE', scope, node });
    onSelect({ kind: 'graphnode', scope, id });
  };
  const addPalettePayload = (payload, pos = null) => {
    const nodePos = pos || visibleCanvasPlacement({ x: 80, y: 80 });
    const node = createNodeFromPalette?.(payload, nodePos, g.nodes);
    if (node) {
      dispatch({ type: 'GRAPH_ADD_NODE', scope, node });
      onSelect({ kind: 'graphnode', scope, id: node.id });
      return;
    }
    addNode(payload, nodePos);
  };
  const addFrame = () => {
    const id = genId(frames, 'FR-');
    const size = { w: 360, h: 220 };
    const pos = visibleCanvasPlacement({ x: 70, y: 70 }, size);
    const frame = { id, label: 'Frame', ...pos, ...size, color: '#8B92A6' };
    dispatch({ type: 'GRAPH_ADD_FRAME', scope, frame });
    onSelect({ kind: 'graphframe', scope, id });
  };
  const addCircle = () => {
    const id = genId(frames, 'CIR-');
    const size = { w: 160, h: 160 };
    const pos = visibleCanvasPlacement({ x: 90, y: 90 }, size);
    const frame = { id, label: 'Circle', shape: 'circle', ...pos, ...size, color: '#5CA8F5' };
    dispatch({ type: 'GRAPH_ADD_FRAME', scope, frame });
    onSelect({ kind: 'graphframe', scope, id });
  };
  const addArrow = () => {
    const id = genId(frames, 'ARR-');
    const pos = visibleCanvasPlacement({ x: 100, y: 100 }, { w: 200, h: 80 });
    const frame = { id, label: 'Arrow', shape: 'arrow', ...pos, w: 200, h: 80, color: '#5CA8F5' };
    dispatch({ type: 'GRAPH_ADD_FRAME', scope, frame });
    onSelect({ kind: 'graphframe', scope, id });
  };
  const addSpline = () => {
    const id = genId(frames, 'SPL-');
    const pos = visibleCanvasPlacement({ x: 100, y: 150 }, { w: 220, h: 80 });
    const frame = { id, label: 'Spline', shape: 'spline', ...pos, w: 220, h: 80, curveX: 0, curveY: -70, color: '#5CA8F5' };
    dispatch({ type: 'GRAPH_ADD_FRAME', scope, frame });
    onSelect({ kind: 'graphframe', scope, id });
  };
  const addVisualMarker = (markerType = 'number') => {
    const id = genId(numberMarkers, markerType === 'letter' ? 'LTR-' : 'NUM-');
    const marker = { id, markerType, value: nextVisualMarkerValue(numberMarkers, markerType), ...visibleCanvasPlacement({ x: 110, y: 110 }, { w: 34, h: 34 }), color: '#E8D25C' };
    dispatch({ type: 'GRAPH_ADD_NUMBER_MARKER', scope, marker });
    onSelect({ kind: 'graphnumber', scope, id });
  };
  const addTitleMarker = () => {
    const id = genId(titleMarkers, 'TTL-');
    const marker = { id, text: 'Title', ...visibleCanvasPlacement({ x: 130, y: 120 }, { w: 120, h: 42 }), fontSize: 28, color: '#E9EBF3' };
    dispatch({ type: 'GRAPH_ADD_TITLE_MARKER', scope, marker });
    onSelect({ kind: 'graphtitle', scope, id });
  };

  const empty = Object.keys(nodes).length === 0 && Object.keys(frames).length === 0 && Object.keys(numberMarkers).length === 0 && Object.keys(titleMarkers).length === 0;

  return (
    <>
      {(showToolbar || enableFrames) && (
        <div className={`toolrow${enableFrames && !showToolbar ? ' framebar' : ''}`}>
          {showToolbar && <div className="canvas-tool-group node-tool-group"><span className="tool-kind-label">Nodes</span>{palette.map((p) => (
            <button key={p.id} className="addnode" title={p.blurb} onClick={() => addNode(p.id)}>
              <span className="sq" style={{ background: p.color }}>{p.icon && <PrimIcon icon={p.icon} color="#fff" size={11} />}</span>{p.label}
            </button>
          ))}</div>}
          {enableFrames && <div className="canvas-tool-group support-tool-group"><span className="tool-kind-label">Support</span>
            <button className="addnode frameadd" title="Add a visual grouping frame" onClick={addFrame}>
              <span className="sq" style={{ background: '#8B92A6' }}><PrimIcon icon="layers" color="#fff" size={11} /></span>Frame
            </button>
            <button className="addnode frameadd" title="Add a resizable circle" onClick={addCircle}>
              <span className="sq shapecircle" style={{ borderColor: '#5CA8F5' }} />Circle
            </button>
            <button className="addnode frameadd" title="Add a visual number marker" onClick={() => addVisualMarker('number')}>
              <span className="sq" style={{ background: '#E8D25C', color: '#111' }}>1</span>Number
            </button>
            <button className="addnode frameadd" title="Add a visual letter marker (A-Z)" onClick={() => addVisualMarker('letter')}>
              <span className="sq" style={{ background: '#E8D25C', color: '#111' }}>A</span>Letter
            </button>
            <button className="addnode frameadd" title="Add a draggable title label" onClick={addTitleMarker}>
              <span className="sq" style={{ background: '#E9EBF3', color: '#111' }}>T</span>Title
            </button>
            <button className="addnode frameadd" title="Add a directional support arrow" onClick={addArrow}>
              <span className="sq arrowglyph" style={{ color: '#5CA8F5' }}>→</span>Arrow
            </button>
            <button className="addnode frameadd" title="Add an editable curved support line" onClick={addSpline}>
              <span className="sq splineglyph" style={{ color: '#5CA8F5' }}>∿</span>Spline
            </button>
          </div>}
        </div>
      )}
      {empty ? (
        <div className="emptyview"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
          onDrop={(e) => {
            const payload = e.dataTransfer.getData('text/x-palette');
            if (!payload) return;
            e.preventDefault();
            addPalettePayload(payload, { x: 90, y: 90 });
          }}>
          <h3>Nothing here yet</h3>
          <p>Add a node from the sidebar to start building this out.</p>
        </div>
      ) : (
        <FlowCanvas
          nodes={nodes} edges={edges} selId={selId} colorOf={colorOf} iconOf={iconOf}
          onSelect={(id) => onSelect({ kind: 'graphnode', scope, id })}
          onMove={(id, x, y) => dispatch({ type: 'GRAPH_UPDATE_NODE', scope, id, patch: { x, y } })}
          onUpdateNode={(id, patch) => dispatch({ type: 'GRAPH_UPDATE_NODE', scope, id, patch })}
          onMoveNodes={(positions, meta) => dispatch({
            type: 'BATCH',
            undoGroup: meta?.undoGroup,
            actions: Object.entries(positions).map(([id, patch]) => ({ type: 'GRAPH_UPDATE_NODE', scope, id, patch })),
          })}
          onMoveSelection={(patches, meta) => dispatch({
            type: 'BATCH',
            undoGroup: meta?.undoGroup,
            actions: [
              ...Object.entries(patches.nodes).map(([id, patch]) => ({ type: 'GRAPH_UPDATE_NODE', scope, id, patch })),
              ...Object.entries(patches.frames).map(([id, patch]) => ({ type: 'GRAPH_UPDATE_FRAME', scope, id, patch })),
              ...Object.entries(patches.numberMarkers).map(([id, patch]) => ({ type: 'GRAPH_UPDATE_NUMBER_MARKER', scope, id, patch })),
              ...Object.entries(patches.titleMarkers).map(([id, patch]) => ({ type: 'GRAPH_UPDATE_TITLE_MARKER', scope, id, patch })),
            ],
          })}
          onResizeNode={(id, patch) => dispatch({ type: 'GRAPH_UPDATE_NODE', scope, id, patch })}
          onConnect={(from, to, edgePatch = {}) => dispatch({ type: 'GRAPH_ADD_EDGE', scope, from, to, color: colorOf(g.nodes[from] || titleMarkers[from]), ...edgePatch })}
          onRemoveEdge={(e) => dispatch({ type: 'GRAPH_REMOVE_EDGE', scope, from: e.from, to: e.to })}
          onRemoveEdges={(hit) => hit.forEach((e) => dispatch({ type: 'GRAPH_REMOVE_EDGE', scope, from: e.from, to: e.to }))}
          onSetColor={(id, color) => dispatch({ type: 'GRAPH_UPDATE_NODE', scope, id, patch: { color } })}
          onDeleteNode={(id) => { dispatch({ type: 'GRAPH_DELETE_NODE', scope, id }); onSelect(null); }}
          onDeleteNodes={(ids) => {
            dispatch({ type: 'BATCH', actions: ids.map((id) => ({ type: 'GRAPH_DELETE_NODE', scope, id })) });
            onSelect(null);
          }}
          onDeleteSelection={(selection) => {
            dispatch({
              type: 'BATCH',
              actions: [
                ...selection.nodes.map((id) => ({ type: 'GRAPH_DELETE_NODE', scope, id })),
                ...selection.frames.map((id) => ({ type: 'GRAPH_DELETE_FRAME', scope, id })),
                ...selection.numberMarkers.map((id) => ({ type: 'GRAPH_DELETE_NUMBER_MARKER', scope, id })),
                ...selection.titleMarkers.map((id) => ({ type: 'GRAPH_DELETE_TITLE_MARKER', scope, id })),
              ],
            });
            onSelect(null);
          }}
          onClearCanvas={() => {
            dispatch({ type: 'GRAPH_CLEAR', scope });
            onSelect(null);
          }}
          onEditEdge={(e, patch) => dispatch({ type: 'GRAPH_UPDATE_EDGE', scope, from: e.from, to: e.to, patch })}
          onDropPalette={(payload, x, y) => addPalettePayload(payload, { x, y })}
          frames={enableFrames ? frames : undefined}
          selFrame={selFrame}
          onFrameSelect={enableFrames ? (id) => onSelect({ kind: 'graphframe', scope, id }) : undefined}
          onFrameDelete={enableFrames ? (id) => { dispatch({ type: 'GRAPH_DELETE_FRAME', scope, id }); onSelect(null); } : undefined}
          onFrameMove={enableFrames ? (id, dx, dy) => dispatch({ type: 'GRAPH_MOVE_FRAME', scope, id, dx, dy }) : undefined}
          onFrameResize={enableFrames ? (id, w, h) => dispatch({ type: 'GRAPH_UPDATE_FRAME', scope, id, patch: { w, h } }) : undefined}
          onFrameGeometry={enableFrames ? (id, patch) => dispatch({ type: 'GRAPH_UPDATE_FRAME', scope, id, patch }) : undefined}
          onFrameScale={enableFrames ? (id, transform) => dispatch({ type: 'GRAPH_SCALE_FRAME', scope, id, transform }) : undefined}
          numberMarkers={enableFrames ? numberMarkers : undefined}
          selNumberMarker={selNumberMarker}
          onNumberMarkerSelect={enableFrames ? (id) => onSelect({ kind: 'graphnumber', scope, id }) : undefined}
          onNumberMarkerMove={enableFrames ? (id, dx, dy) => {
            const marker = numberMarkers[id];
            if (marker) dispatch({ type: 'GRAPH_UPDATE_NUMBER_MARKER', scope, id, patch: { x: marker.x + dx, y: marker.y + dy } });
          } : undefined}
          onNumberMarkerUpdate={enableFrames ? (id, patch) => dispatch({ type: 'GRAPH_UPDATE_NUMBER_MARKER', scope, id, patch }) : undefined}
          onNumberMarkerDelete={enableFrames ? (id) => { dispatch({ type: 'GRAPH_DELETE_NUMBER_MARKER', scope, id }); onSelect(null); } : undefined}
          titleMarkers={enableFrames ? titleMarkers : undefined}
          selTitleMarker={selTitleMarker}
          onTitleMarkerSelect={enableFrames ? (id) => onSelect({ kind: 'graphtitle', scope, id }) : undefined}
          onTitleMarkerMove={enableFrames ? (id, dx, dy) => {
            const marker = titleMarkers[id];
            if (marker) dispatch({ type: 'GRAPH_UPDATE_TITLE_MARKER', scope, id, patch: { x: marker.x + dx, y: marker.y + dy } });
          } : undefined}
          onTitleMarkerDelete={enableFrames ? (id) => { dispatch({ type: 'GRAPH_DELETE_TITLE_MARKER', scope, id }); onSelect(null); } : undefined}
          onOpenNode={allowOpen ? onOpen : undefined}
          onPasteNode={(p) => {
            const id = genId(g.nodes, `${idPrefix}-`);
            dispatch({ type: 'GRAPH_ADD_NODE', scope, node: { id, kind: p.kind, title: p.title, body: p.body ?? '', color: p.color ?? null, x: p.x, y: p.y, w: p.w ?? undefined, h: p.h ?? undefined } });
            onSelect({ kind: 'graphnode', scope, id });
          }}
          onPasteNodes={(clipboard) => {
            const pasted = remapCanvasClipboard(clipboard, g.nodes, `${idPrefix}-COPY-`);
            dispatch({
              type: 'BATCH',
              actions: [
                ...Object.values(pasted.nodes).map((node) => ({ type: 'GRAPH_ADD_NODE', scope, node })),
                ...pasted.edges.map((edge) => ({ type: 'GRAPH_ADD_EDGE', scope, ...edge })),
              ],
            });
            onSelect({ kind: 'graphnode', scope, id: pasted.ids[pasted.ids.length - 1] });
          }}
          renderBody={(n) => (isSupportingMechanicSubnode(n) || isMechanismPreviewNode(n) || n.kind === 'item' || n.kind === 'framework' ? null : n.body)}
          renderExtra={(n, dimensions) => {
            if (n.kind === 'framework') {
              const fw = FRAMEWORK_TYPES[n.frameworkId] || FRAMEWORK_TYPES.fate;
              return <FrameworkPreview frameworkId={fw.id} nodeWidth={dimensions.width} nodeHeight={dimensions.height} />;
            }
            const support = renderSupportingPreview(n);
            if (support) return support;
            const progress = renderProgressPreview(n);
            if (progress) return progress;
            if (isMechanismPreviewNode(n)) return <MechanismNodePreview node={n} lib={lib} />;
            if (n.kind === 'item') {
              return (
                <div className="nsets">
                  <span className="factchip sm subcount"><i />{n.buildStatus || 'concept'}</span>
                </div>
              );
            }
            if (!allowOpen) return null;
            const cnt = Object.keys(n.sub?.nodes || {}).length;
            return <div className="nsub dim">{cnt > 0 ? `${cnt} detail node${cnt === 1 ? '' : 's'} · double-click to open` : 'double-click to add detail'}</div>;
          }}
        />
      )}
    </>
  );
}
