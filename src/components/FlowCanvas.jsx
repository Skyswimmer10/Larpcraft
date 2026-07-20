import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ENTITY_COLORS, PrimIcon } from './bits.jsx';

// In-app node clipboard, shared across canvases (copy in a structure
// template, paste on the game canvas, and vice versa).
let nodeClipboard = null;
let activeCanvasElement = null;

export function visibleCanvasPlacement(fallback = { x: 80, y: 80 }, size = { w: NODE_W, h: 130 }) {
  const visibleCanvases = Array.from(document.querySelectorAll('.canvas')).filter((el) => {
    const rect = el.getBoundingClientRect();
    return rect.width > 80 && rect.height > 80 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
  });
  const canvas = activeCanvasElement?.isConnected && visibleCanvases.includes(activeCanvasElement)
    ? activeCanvasElement
    : visibleCanvases.sort((a, b) => {
      const ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
      return br.width * br.height - ar.width * ar.height;
    })[0];
  if (!canvas) return fallback;

  const zoom = Math.max(0.1, Number(canvas.dataset.canvasZoom) || 1);
  const view = {
    x: canvas.scrollLeft / zoom,
    y: canvas.scrollTop / zoom,
    w: canvas.clientWidth / zoom,
    h: canvas.clientHeight / zoom,
  };
  const w = Number(size.w) || NODE_W;
  const h = Number(size.h) || 130;
  const center = { x: view.x + (view.w - w) / 2, y: view.y + (view.h - h) / 2 };
  const canvasRect = canvas.getBoundingClientRect();
  const occupied = Array.from(canvas.querySelectorAll('[data-node]')).map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      x: (rect.left - canvasRect.left + canvas.scrollLeft) / zoom,
      y: (rect.top - canvasRect.top + canvas.scrollTop) / zoom,
      w: rect.width / zoom,
      h: rect.height / zoom,
    };
  });
  const overlaps = (candidate) => occupied.some((box) => (
    candidate.x < box.x + box.w + 24 && candidate.x + w + 24 > box.x
    && candidate.y < box.y + box.h + 24 && candidate.y + h + 24 > box.y
  ));
  const offsets = [{ x: 0, y: 0 }];
  for (let ring = 1; ring <= 5; ring += 1) {
    const stepX = Math.max(180, w + 34);
    const stepY = Math.max(130, h + 34);
    for (let dx = -ring; dx <= ring; dx += 1) {
      offsets.push({ x: dx * stepX, y: -ring * stepY }, { x: dx * stepX, y: ring * stepY });
    }
    for (let dy = -ring + 1; dy < ring; dy += 1) {
      offsets.push({ x: -ring * stepX, y: dy * stepY }, { x: ring * stepX, y: dy * stepY });
    }
  }
  const margin = 24;
  const candidate = offsets.map((offset) => ({
    x: Math.max(view.x + margin, Math.min(view.x + view.w - w - margin, center.x + offset.x)),
    y: Math.max(view.y + margin, Math.min(view.y + view.h - h - margin, center.y + offset.y)),
  })).find((point) => !overlaps(point)) || center;
  return { x: Math.max(8, Math.round(candidate.x)), y: Math.max(8, Math.round(candidate.y)) };
}

export const NODE_W = 236;
export const KIND_LABEL = {
  story: 'Story beat', location: 'Location', objective: 'Objective', enemy: 'Enemy encounter', mechanic: 'Mechanic', sensor: 'Sensor trigger',
  // Narrative v2 typed nodes.
  beat: 'Beat', reveal: 'Reveal', branch: 'Branch', fact: 'Fact change', converge: 'Convergence', timed: 'Timed event', recovery: 'Recovery',
  // Tasks + task-detail node types.
  task: 'Task', travel: 'Travel Time', placement: 'Placement', rule: 'Rule', prop: 'Prop / kit', power: 'Power', effect: 'Effect',
  // Narrative Weaver: base nodes, concept containers, subnodes.
  event: 'Event', character: 'Character', storyLocation: 'Story Location', item: 'Story Item', quest: 'Quest', concept: 'Concept', masterAct: 'Master Act',
  conceptTitle: 'Section Title', conceptQuestion: 'Question', conceptChoice: 'Choice',
  outcomeBranches: 'Outcome Branches', relChange: 'Rel. / Status Change', internalState: 'Internal State',
  locationArchetype: 'Location Archetype', narrativeResponse: 'Narrative Response', emotionalTone: 'Emotional Tone',
};
const SWATCHES = ['#5CA8F5', '#43BF87', '#E0A23C', '#E86464', '#A87BF0', '#3EC6D6', '#E8D25C', '#F08CB4'];
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.1;
const MIN_NODE_W = 148;
const MIN_NODE_H = 74;
const EDGE_SIDES = ['left', 'right', 'top', 'bottom'];
const EDGE_SIDE_LABELS = { left: 'Left', right: 'Right', top: 'Top', bottom: 'Bottom' };
const SIDE_VECTOR = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
};
const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +z.toFixed(2)));
const normalizeSide = (side, fallback) => {
  const clean = String(side || '').trim().toLowerCase();
  return EDGE_SIDES.includes(clean) ? clean : fallback;
};

// Generic interactive node canvas, shared by the active game's quest editor
// and the Library's story-structure editor. The host owns the data and passes
// mutation callbacks:
//   onMove(id,x,y) · onConnect(from,to) · onRemoveEdge(edge) ·
//   onSetColor(id,color|null) · onSelect(id) · onDropPalette(payload,x,y)
// Also accepts drops of palette entries carrying dataTransfer 'text/x-palette'.
export default function FlowCanvas({
  nodes, edges, selId, colorOf,
  onSelect, onMove, onConnect, onRemoveEdge, onRemoveEdges, onSetColor, onDropPalette,
  onPasteNode, onDeleteNode, onDeleteNodes, onMoveNodes, onClearCanvas, onEditEdge, onResizeNode, renderBody, renderExtra,
  // Optional presentation hooks (unused by the library structure editors):
  //   iconOf(node) → icon name · teamOf(node) → {name,color} · dimNode(node) →
  //   bool · edgeFact(edge) → {color,title} to show a fact dot on a connection.
  iconOf, teamOf, dimNode, edgeFact,
  // onOpenNode(id): double-click a node to drill into its nested sub-graph.
  onOpenNode,
  // nodeClass(node) → extra class names ('subnode', 'concept', …).
  nodeClass,
  // attachments: [{ from, to, label?, color? }] — subnode→parent links drawn
  // as dashed lines with a one-click detach (⊘) at the midpoint.
  attachments, onDetach,
  // frames: visual grouping rectangles. Dragging the header moves the frame
  // and everything inside (host reducer handles containment).
  frames, onFrameMove, onFrameResize, onFrameSelect, selFrame,
  // numberMarkers: visual Miro-style numbered badges, not graph nodes.
  numberMarkers, onNumberMarkerSelect, onNumberMarkerMove, onNumberMarkerDelete, selNumberMarker,
  // titleMarkers: draggable text headings for visually grouping graph areas.
  titleMarkers, onTitleMarkerSelect, onTitleMarkerMove, onTitleMarkerDelete, selTitleMarker,
}) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const frameRef = useRef(null);
  const markerRef = useRef(null);
  const titleRef = useRef(null);
  const cutDragRef = useRef(null);
  const linkDragRef = useRef(null);
  const linkTargetRef = useRef(null);
  const [linkDrag, setLinkDrag] = useState(null);
  const [linkTarget, setLinkTarget] = useState(null);
  const [cutDrag, setCutDrag] = useState(null);
  const [boxDrag, setBoxDrag] = useState(null);
  const [multiSel, setMultiSel] = useState(() => new Set());
  const [pickerFor, setPickerFor] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [measuredHeights, setMeasuredHeights] = useState({});
  const [measuredTitleSizes, setMeasuredTitleSizes] = useState({});
  const [alignmentGuides, setAlignmentGuides] = useState({ vertical: [], horizontal: [] });

  // Keyboard: Ctrl/Cmd+C copies the selected node, Ctrl/Cmd+V (or Ctrl+P)
  // pastes a duplicate, Delete/Backspace removes the selected node with its
  // connections, Ctrl+Delete clears the visible graph. All skipped while
  // typing in a field or copying real text.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Delete' && onClearCanvas) {
        e.preventDefault();
        onClearCanvas();
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && multiSel.size > 0 && (onDeleteNodes || onDeleteNode)) {
        e.preventDefault();
        const ids = Array.from(multiSel).filter((id) => nodes[id]);
        if (onDeleteNodes) onDeleteNodes(ids);
        else ids.forEach((id) => onDeleteNode(id));
        setMultiSel(new Set());
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && onNumberMarkerDelete && selNumberMarker && numberMarkers?.[selNumberMarker]) {
        e.preventDefault();
        onNumberMarkerDelete(selNumberMarker);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && onTitleMarkerDelete && selTitleMarker && titleMarkers?.[selTitleMarker]) {
        e.preventDefault();
        onTitleMarkerDelete(selTitleMarker);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && onDeleteNode && selId && nodes[selId]) {
        e.preventDefault();
        onDeleteNode(selId);
        return;
      }
      if (!(e.ctrlKey || e.metaKey) || !onPasteNode) return;
      const k = e.key.toLowerCase();
      if (k === 'c') {
        if (window.getSelection()?.toString()) return; // real text copy wins
        const n = selId && nodes[selId];
        if (!n) return;
        nodeClipboard = { kind: n.kind, title: n.title, body: n.body ?? '', phaseNotes: n.phaseNotes ?? '', color: n.color ?? null, primitiveId: n.primitiveId ?? null, image: n.image ?? null, x: n.x, y: n.y, w: n.w ?? null, h: n.h ?? null };
        e.preventDefault();
      } else if (k === 'v' || k === 'p') {
        if (!nodeClipboard) return;
        e.preventDefault();
        nodeClipboard = { ...nodeClipboard, x: nodeClipboard.x + 28, y: nodeClipboard.y + 28 };
        onPasteNode({ ...nodeClipboard });
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selId, nodes, onPasteNode, onDeleteNode, onDeleteNodes, onClearCanvas, selNumberMarker, numberMarkers, onNumberMarkerDelete, selTitleMarker, titleMarkers, onTitleMarkerDelete, multiSel]);

  useEffect(() => { cutDragRef.current = cutDrag; }, [cutDrag]);
  useEffect(() => { linkDragRef.current = linkDrag; }, [linkDrag]);

  const list = Object.values(nodes);
  const markerList = Object.values(numberMarkers || {});
  const titleList = Object.values(titleMarkers || {});
  const nodeDefaultW = (n) => {
    if (n.kind === 'framework' && n.frameworkId === 'jungianMasculineArchetypes') return 360;
    if (n.kind === 'framework' && n.frameworkId === 'kolbLearningCycle') return 300;
    return String(nodeClass?.(n) || '').includes('subnode') ? 196 : NODE_W;
  };
  const nodeW = (n) => Math.max(MIN_NODE_W, Number(n.w) || nodeDefaultW(n));
  const nodeH = (n) => {
    if (n._titleTarget) return Math.max(20, Number(measuredTitleSizes[n.id]?.h) || Number(n.fontSize) * 1.2 || 34);
    if (Number(n.h)) return Math.max(MIN_NODE_H, Number(n.h));
    return Math.max(MIN_NODE_H, Number(measuredHeights[n.id]) || 130);
  };
  const endpointW = (n) => n._titleTarget
    ? Math.max(40, Number(measuredTitleSizes[n.id]?.w) || Math.min(560, String(n.text || 'Title').length * (Number(n.fontSize) || 28) * 0.58 + 16))
    : nodeW(n);
  const endpointFor = (id) => nodes[id] || (titleMarkers?.[id] ? { ...titleMarkers[id], _titleTarget: true } : null);
  const frameRect = (f) => ({
    id: f.id,
    x: Math.min(f.x, f.x + f.w),
    y: Math.min(f.y, f.y + f.h),
    w: Math.abs(f.w),
    h: Math.abs(f.h),
  });
  const objectRects = () => [
    ...list.map((n) => ({ id: n.id, x: n.x, y: n.y, w: nodeW(n), h: nodeH(n) })),
    ...Object.values(frames || {}).map(frameRect),
    ...markerList.map((m) => ({ id: m.id, x: m.x, y: m.y, w: 34, h: 34 })),
    ...titleList.map((m) => ({ id: m.id, x: m.x, y: m.y, w: endpointW({ ...m, _titleTarget: true }), h: nodeH({ ...m, _titleTarget: true }) })),
  ];
  const guidesForRect = (moving, excludedIds = []) => {
    const excluded = new Set(excludedIds);
    const tolerance = 7 / zoom;
    const vertical = [];
    const horizontal = [];
    const movingX = [moving.x, moving.x + moving.w / 2, moving.x + moving.w];
    const movingY = [moving.y, moving.y + moving.h / 2, moving.y + moving.h];
    objectRects().filter((item) => !excluded.has(item.id)).forEach((item) => {
      const itemX = [item.x, item.x + item.w / 2, item.x + item.w];
      const itemY = [item.y, item.y + item.h / 2, item.y + item.h];
      movingX.forEach((value, index) => {
        if (Math.abs(value - itemX[index]) <= tolerance) vertical.push({ value: itemX[index], kind: index === 1 ? 'center' : 'edge' });
      });
      movingY.forEach((value, index) => {
        if (Math.abs(value - itemY[index]) <= tolerance) horizontal.push({ value: itemY[index], kind: index === 1 ? 'center' : 'edge' });
      });
    });
    const unique = (guides) => guides.filter((guide, index, all) => all.findIndex((item) => Math.abs(item.value - guide.value) < 0.5 && item.kind === guide.kind) === index);
    setAlignmentGuides({ vertical: unique(vertical), horizontal: unique(horizontal) });
  };
  const clearAlignmentGuides = () => setAlignmentGuides({ vertical: [], horizontal: [] });
  const explicitNodeH = (n) => (Number(n.h) ? Math.max(MIN_NODE_H, Number(n.h)) : null);
  const extentX = Math.max(1400, ...list.map((n) => n.x + nodeW(n) + 320), ...Object.values(frames || {}).map((f) => frameRect(f).x + frameRect(f).w + 180), ...markerList.map((m) => m.x + 180), ...titleList.map((m) => m.x + 520));
  const extentY = Math.max(620, ...list.map((n) => n.y + nodeH(n) + 260), ...Object.values(frames || {}).map((f) => frameRect(f).y + frameRect(f).h + 180), ...markerList.map((m) => m.y + 180), ...titleList.map((m) => m.y + 160));

  useLayoutEffect(() => {
    const world = canvasRef.current?.querySelector('.canvas-world');
    if (!world) return undefined;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = {};
        world.querySelectorAll('[data-node]').forEach((el) => {
          const id = el.dataset.node;
          if (id) next[id] = el.offsetHeight;
        });
        setMeasuredHeights((prev) => {
          const prevKeys = Object.keys(prev);
          const nextKeys = Object.keys(next);
          const same = prevKeys.length === nextKeys.length && nextKeys.every((key) => prev[key] === next[key]);
          return same ? prev : next;
        });
        const titleSizes = {};
        world.querySelectorAll('[data-title-marker]').forEach((el) => {
          const id = el.dataset.titleMarker;
          if (id) titleSizes[id] = { w: el.offsetWidth, h: el.offsetHeight };
        });
        setMeasuredTitleSizes((prev) => {
          const keys = Object.keys(titleSizes);
          const same = Object.keys(prev).length === keys.length && keys.every((key) => prev[key]?.w === titleSizes[key].w && prev[key]?.h === titleSizes[key].h);
          return same ? prev : titleSizes;
        });
      });
    };
    const observer = new ResizeObserver(measure);
    world.querySelectorAll('[data-node]').forEach((el) => observer.observe(el));
    world.querySelectorAll('[data-title-marker]').forEach((el) => observer.observe(el));
    measure();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [nodes, selId, multiSel, zoom]);

  const canvasPoint = (e) => {
    const el = canvasRef.current;
    const r = el.getBoundingClientRect();
    return { x: (e.clientX - r.left + el.scrollLeft) / zoom, y: (e.clientY - r.top + el.scrollTop) / zoom };
  };
  const setZoomAt = (nextZoom, clientX, clientY) => {
    const el = canvasRef.current;
    if (!el) {
      setZoom(nextZoom);
      return;
    }
    const r = el.getBoundingClientRect();
    const localX = clientX - r.left;
    const localY = clientY - r.top;
    const worldX = (localX + el.scrollLeft) / zoom;
    const worldY = (localY + el.scrollTop) / zoom;
    setZoom(nextZoom);
    requestAnimationFrame(() => {
      el.scrollLeft = Math.max(0, worldX * nextZoom - localX);
      el.scrollTop = Math.max(0, worldY * nextZoom - localY);
    });
  };
  const zoomBy = (direction, clientX, clientY) => {
    const nextZoom = clampZoom(zoom + direction * ZOOM_STEP);
    if (nextZoom === zoom) return;
    setZoomAt(nextZoom, clientX, clientY);
  };
  const onWheel = (e) => {
    if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? -1 : 1, e.clientX, e.clientY);
  };
  const anchorFor = (n, side = 'right') => {
    const w = endpointW(n);
    const h = nodeH(n);
    const s = normalizeSide(side, 'right');
    if (s === 'left') return { x: n.x, y: n.y + h / 2 };
    if (s === 'right') return { x: n.x + w, y: n.y + h / 2 };
    if (s === 'top') return { x: n.x + w / 2, y: n.y };
    return { x: n.x + w / 2, y: n.y + h };
  };
  const outAnchor = (n, side = 'right') => anchorFor(n, side);
  const inAnchor = (n, side = 'left') => anchorFor(n, side);
  const controlPoints = (a, b, fromSide = 'right', toSide = 'left') => {
    const distance = Math.max(55, Math.min(220, Math.hypot(b.x - a.x, b.y - a.y) * 0.35));
    const start = SIDE_VECTOR[normalizeSide(fromSide, 'right')];
    const end = SIDE_VECTOR[normalizeSide(toSide, 'left')];
    return {
      c1: { x: a.x + start.x * distance, y: a.y + start.y * distance },
      c2: { x: b.x + end.x * distance, y: b.y + end.y * distance },
    };
  };
  const edgePath = (a, b, fromSide = 'right', toSide = 'left') => {
    const { c1, c2 } = controlPoints(a, b, fromSide, toSide);
    return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
  };
  const cubicPoint = (a, c1, c2, b, t) => {
    const mt = 1 - t;
    return {
      x: mt ** 3 * a.x + 3 * mt ** 2 * t * c1.x + 3 * mt * t ** 2 * c2.x + t ** 3 * b.x,
      y: mt ** 3 * a.y + 3 * mt ** 2 * t * c1.y + 3 * mt * t ** 2 * c2.y + t ** 3 * b.y,
    };
  };
  const ccw = (a, b, c) => (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  const segmentsCross = (a, b, c, d) => ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
  const normRect = (a, b) => ({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  });
  const nodeHitsRect = (n, r) => {
    const w = nodeW(n);
    const h = nodeH(n);
    return n.x < r.x + r.w && n.x + w > r.x && n.y < r.y + r.h && n.y + h > r.y;
  };
  const cutHitsEdge = (cutPoints, e) => {
    const from = endpointFor(e.from), to = endpointFor(e.to);
    if (!from || !to || cutPoints.length < 2) return false;
    const fromSide = normalizeSide(e.fromSide, 'right');
    const toSide = normalizeSide(e.toSide, 'left');
    const a = outAnchor(from, fromSide), b = inAnchor(to, toSide);
    const { c1, c2 } = controlPoints(a, b, fromSide, toSide);
    const curve = Array.from({ length: 25 }, (_, i) => cubicPoint(a, c1, c2, b, i / 24));
    for (let i = 1; i < cutPoints.length; i += 1) {
      for (let j = 1; j < curve.length; j += 1) {
        if (segmentsCross(cutPoints[i - 1], cutPoints[i], curve[j - 1], curve[j])) return true;
      }
    }
    return false;
  };

  const onNodeDown = (e, n) => {
    if (e.button !== 0 || e.target.closest('.port, .icpick, .swatchpop, .x, .nresize')) return;
    const p = canvasPoint(e);
    clearAlignmentGuides();
    const group = multiSel.has(n.id) ? Array.from(multiSel).filter((id) => nodes[id]) : [];
    dragRef.current = group.length > 1
      ? {
        id: n.id,
        group,
        startX: p.x,
        startY: p.y,
        undoGroup: `multi-node-move:${Date.now()}`,
        starts: Object.fromEntries(group.map((id) => [id, { x: nodes[id].x, y: nodes[id].y }])),
        moved: false,
      }
      : { id: n.id, offX: p.x - n.x, offY: p.y - n.y, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onNodeMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const p = canvasPoint(e);
    if (d.group?.length > 1) {
      const dx = Math.round(p.x - d.startX);
      const dy = Math.round(p.y - d.startY);
      if (!d.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      d.moved = true;
      const positions = {};
      d.group.forEach((id) => {
        const start = d.starts[id];
        if (start) positions[id] = { x: Math.max(8, start.x + dx), y: Math.max(8, start.y + dy) };
      });
      if (onMoveNodes) onMoveNodes(positions, { undoGroup: d.undoGroup });
      else Object.entries(positions).forEach(([id, pos]) => onMove(id, pos.x, pos.y));
      const rects = d.group.map((id) => ({ x: positions[id].x, y: positions[id].y, w: nodeW(nodes[id]), h: nodeH(nodes[id]) }));
      const left = Math.min(...rects.map((item) => item.x));
      const top = Math.min(...rects.map((item) => item.y));
      guidesForRect({
        x: left,
        y: top,
        w: Math.max(...rects.map((item) => item.x + item.w)) - left,
        h: Math.max(...rects.map((item) => item.y + item.h)) - top,
      }, d.group);
      return;
    }
    const x = Math.max(8, Math.round(p.x - d.offX));
    const y = Math.max(8, Math.round(p.y - d.offY));
    const n = nodes[d.id];
    if (!d.moved && Math.abs(x - n.x) + Math.abs(y - n.y) < 4) return;
    d.moved = true;
    onMove(d.id, x, y);
    guidesForRect({ x, y, w: nodeW(n), h: nodeH(n) }, [d.id]);
  };
  const onNodeUp = (e, n) => {
    const d = dragRef.current;
    dragRef.current = null;
    clearAlignmentGuides();
    if (d && !d.moved) {
      if (!d.group?.length) setMultiSel(new Set());
      onSelect(n.id);
      setPickerFor(null);
    }
  };
  const onResizeDown = (e, n, dir) => {
    if (e.button !== 0 || !onResizeNode) return;
    e.stopPropagation();
    const p = canvasPoint(e);
    resizeRef.current = { id: n.id, dir, startX: p.x, startY: p.y, x: n.x, y: n.y, w: nodeW(n), h: nodeH(n) || e.currentTarget.closest('.node')?.offsetHeight || MIN_NODE_H };
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect(n.id);
  };
  const onResizeMove = (e) => {
    const d = resizeRef.current;
    if (!d || !onResizeNode) return;
    const p = canvasPoint(e);
    const dx = Math.round(p.x - d.startX);
    const dy = Math.round(p.y - d.startY);
    let x = d.x, y = d.y, w = d.w, h = d.h;
    if (d.dir.includes('e')) w = Math.max(MIN_NODE_W, d.w + dx);
    if (d.dir.includes('s')) h = Math.max(MIN_NODE_H, d.h + dy);
    if (d.dir.includes('w')) {
      w = Math.max(MIN_NODE_W, d.w - dx);
      x = d.x + (d.w - w);
    }
    if (d.dir.includes('n')) {
      h = Math.max(MIN_NODE_H, d.h - dy);
      y = d.y + (d.h - h);
    }
    onResizeNode(d.id, { x: Math.max(8, x), y: Math.max(8, y), w: Math.round(w), h: Math.round(h) });
  };
  const onResizeUp = () => { resizeRef.current = null; };

  const inferTargetSide = (e, targetEl, targetPort = null) => {
    const portSide = targetPort?.dataset?.side;
    if (EDGE_SIDES.includes(portSide)) return portSide;
    const rect = targetEl.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    const distances = [
      ['left', dx],
      ['right', rect.width - dx],
      ['top', dy],
      ['bottom', rect.height - dy],
    ];
    distances.sort((a, b) => a[1] - b[1]);
    return distances[0][0];
  };
  const connectionTargetAt = (e, activeLink) => {
    const stack = document.elementsFromPoint(e.clientX, e.clientY);
    const targetPort = stack.map((el) => el.closest?.('.port')).find((el) => el?.closest?.('[data-edge-target]')?.dataset?.edgeTarget !== activeLink.from);
    const directNode = targetPort?.closest?.('[data-edge-target]')
      || stack.map((el) => el.closest?.('[data-edge-target]')).find((el) => el?.dataset?.edgeTarget !== activeLink.from);
    if (directNode) return { nodeEl: directNode, portEl: targetPort || null };

    // Keep side ports easy to land on even when the cursor is a few pixels
    // outside the node border.
    const candidates = Array.from(canvasRef.current?.querySelectorAll?.('[data-edge-target]') || [])
      .filter((el) => el.dataset.edgeTarget !== activeLink.from)
      .map((el) => {
        const rect = el.getBoundingClientRect();
        const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
        const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
        return { el, distance: Math.hypot(dx, dy) };
      })
      .filter((entry) => entry.distance <= 14)
      .sort((a, b) => a.distance - b.distance);
    return candidates[0] ? { nodeEl: candidates[0].el, portEl: null } : null;
  };
  const onPortDown = (e, n, side = 'right') => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const p = canvasPoint(e);
    const next = { from: n.id, side, x: p.x, y: p.y };
    linkDragRef.current = next;
    linkTargetRef.current = null;
    setLinkTarget(null);
    setLinkDrag(next);
  };
  const onPortEnter = (e, n, side) => {
    const active = linkDragRef.current;
    if (!active || active.from === n.id) return;
    const target = { nodeEl: e.currentTarget.closest('[data-edge-target]'), portEl: e.currentTarget, nodeId: n.id, side };
    linkTargetRef.current = target;
    setLinkTarget({ nodeId: n.id, side });
  };
  const onPortLeave = (e, n, side) => {
    const target = linkTargetRef.current;
    if (target?.nodeId !== n.id || target?.side !== side) return;
    linkTargetRef.current = null;
    setLinkTarget(null);
  };

  useEffect(() => {
    if (!linkDrag) return undefined;
    const move = (e) => {
      if (!linkDragRef.current) return;
      const p = canvasPoint(e);
      const next = { ...linkDragRef.current, x: p.x, y: p.y };
      linkDragRef.current = next;
      setLinkDrag(next);
      const target = connectionTargetAt(e, next);
      const nodeId = target?.nodeEl?.dataset?.edgeTarget;
      if (nodeId) {
        const side = inferTargetSide(e, target.nodeEl, target.portEl);
        linkTargetRef.current = { ...target, nodeId, side };
        setLinkTarget((current) => current?.nodeId === nodeId && current?.side === side ? current : { nodeId, side });
      } else {
        linkTargetRef.current = null;
        setLinkTarget(null);
      }
    };
    const finish = (e) => {
      const active = linkDragRef.current;
      if (!active) return;
      const target = connectionTargetAt(e, active);
      const to = target?.nodeEl?.dataset?.edgeTarget;
      if (to && to !== active.from) {
        onConnect(active.from, to, {
          fromSide: normalizeSide(active.side, 'right'),
          toSide: inferTargetSide(e, target.nodeEl, target.portEl),
        });
      }
      linkDragRef.current = null;
      linkTargetRef.current = null;
      setLinkTarget(null);
      setLinkDrag(null);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', finish);
    document.addEventListener('pointercancel', finish);
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', finish);
      document.removeEventListener('pointercancel', finish);
    };
  }, [linkDrag, onConnect]);
  const editEdgeLabel = (edge) => {
    const v = window.prompt('Connection label (e.g. "IF key obtained"):', edge.label || '');
    if (v !== null) onEditEdge?.(edge, { label: v.trim() });
  };
  const editEdgeSides = (edge) => {
    const fromSide = window.prompt('Start side: left, right, top, or bottom', normalizeSide(edge.fromSide, 'right'));
    if (fromSide === null) return;
    const toSide = window.prompt('End side: left, right, top, or bottom', normalizeSide(edge.toSide, 'left'));
    if (toSide === null) return;
    onEditEdge?.(edge, {
      fromSide: normalizeSide(fromSide, normalizeSide(edge.fromSide, 'right')),
      toSide: normalizeSide(toSide, normalizeSide(edge.toSide, 'left')),
    });
  };

  // Frame drag (header) and resize (corner handle).
  const onFrameDown = (e, f, mode) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const p = canvasPoint(e);
    clearAlignmentGuides();
    frameRef.current = { id: f.id, mode, lastX: p.x, lastY: p.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    onFrameSelect?.(f.id);
    const move = (event) => onFramePtrMove(event);
    const finish = () => {
      onFramePtrUp();
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', finish);
      document.removeEventListener('pointercancel', finish);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', finish);
    document.addEventListener('pointercancel', finish);
  };
  const onFramePtrMove = (e) => {
    const d = frameRef.current;
    if (!d) return;
    const p = canvasPoint(e);
    const dx = Math.round(p.x - d.lastX), dy = Math.round(p.y - d.lastY);
    if (dx === 0 && dy === 0) return;
    d.lastX = p.x; d.lastY = p.y;
    const f = frames[d.id];
    if (d.mode === 'move') {
      onFrameMove?.(d.id, dx, dy);
      guidesForRect({ x: f.x + dx, y: f.y + dy, w: f.w, h: f.h }, [d.id]);
    } else if (f.shape === 'arrow') {
      let w = f.w + dx;
      let h = f.h + dy;
      if (Math.hypot(w, h) < 30) {
        const angle = Math.atan2(h || f.h || 1, w || f.w || 1);
        w = Math.cos(angle) * 30;
        h = Math.sin(angle) * 30;
      }
      onFrameResize?.(d.id, Math.round(w), Math.round(h));
    } else if (f.shape === 'circle') {
      const diameter = Math.max(24, Math.round(Math.max(f.w + dx, f.h + dy)));
      onFrameResize?.(d.id, diameter, diameter);
    } else onFrameResize?.(d.id, Math.max(160, f.w + dx), Math.max(100, f.h + dy));
  };
  const onFramePtrUp = () => { frameRef.current = null; clearAlignmentGuides(); };
  const onMarkerDown = (e, marker) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const p = canvasPoint(e);
    clearAlignmentGuides();
    markerRef.current = { id: marker.id, lastX: p.x, lastY: p.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    onNumberMarkerSelect?.(marker.id);
  };
  const onMarkerMove = (e) => {
    const d = markerRef.current;
    if (!d) return;
    const p = canvasPoint(e);
    const dx = Math.round(p.x - d.lastX), dy = Math.round(p.y - d.lastY);
    if (dx === 0 && dy === 0) return;
    d.lastX = p.x; d.lastY = p.y;
    onNumberMarkerMove?.(d.id, dx, dy);
    const marker = numberMarkers?.[d.id];
    if (marker) guidesForRect({ x: marker.x + dx, y: marker.y + dy, w: 34, h: 34 }, [d.id]);
  };
  const onMarkerUp = () => { markerRef.current = null; clearAlignmentGuides(); };
  const onTitleDown = (e, marker) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const p = canvasPoint(e);
    clearAlignmentGuides();
    titleRef.current = { id: marker.id, lastX: p.x, lastY: p.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    onTitleMarkerSelect?.(marker.id);
  };
  const onTitleMove = (e) => {
    const d = titleRef.current;
    if (!d) return;
    const p = canvasPoint(e);
    const dx = Math.round(p.x - d.lastX), dy = Math.round(p.y - d.lastY);
    if (dx === 0 && dy === 0) return;
    d.lastX = p.x; d.lastY = p.y;
    onTitleMarkerMove?.(d.id, dx, dy);
    const marker = titleMarkers?.[d.id];
    if (marker) guidesForRect({
      x: marker.x + dx, y: marker.y + dy,
      w: endpointW({ ...marker, _titleTarget: true }), h: nodeH({ ...marker, _titleTarget: true }),
    }, [d.id]);
  };
  const onTitleUp = () => { titleRef.current = null; clearAlignmentGuides(); };
  const onCanvasDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest?.('[data-node], .gframe, .garrow, .numarker, .titlemarker, .zoomctl, .elab, .attlab, .port, .icpick, .swatchpop, .nresize, button, input, textarea, select')) return;
    const p = canvasPoint(e);
    if (e.ctrlKey || e.metaKey) {
      setCutDrag(null);
      setBoxDrag({ start: p, current: p });
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if (!onRemoveEdge) return;
    setMultiSel(new Set());
    setCutDrag({ points: [p] });
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onCanvasMove = (e) => {
    if (boxDrag) {
      const p = canvasPoint(e);
      setBoxDrag((d) => ({ ...d, current: p }));
      return;
    }
    if (!cutDrag) return;
    const p = canvasPoint(e);
    setCutDrag((d) => {
      const prev = d.points[d.points.length - 1];
      if (Math.hypot(p.x - prev.x, p.y - prev.y) < 3) return d;
      return { points: [...d.points, p] };
    });
  };
  const finishCut = () => {
    const active = cutDragRef.current;
    if (!active) return;
    const hit = edges.filter((e) => cutHitsEdge(active.points, e));
    if (hit.length) {
      if (onRemoveEdges) onRemoveEdges(hit);
      else hit.forEach((e) => onRemoveEdge(e));
    }
    cutDragRef.current = null;
    setCutDrag(null);
  };
  const finishBoxSelect = () => {
    if (!boxDrag) return;
    const r = normRect(boxDrag.start, boxDrag.current);
    const ids = r.w < 4 && r.h < 4 ? [] : list.filter((n) => nodeHitsRect(n, r)).map((n) => n.id);
    setMultiSel(new Set(ids));
    if (ids.length > 0) onSelect(ids[ids.length - 1]);
    setBoxDrag(null);
  };
  const onCanvasUp = () => {
    if (boxDrag) finishBoxSelect();
    else finishCut();
  };

  useEffect(() => {
    if (!cutDrag) return undefined;
    const clear = () => finishCut();
    document.addEventListener('pointerup', clear);
    document.addEventListener('pointercancel', clear);
    return () => {
      document.removeEventListener('pointerup', clear);
      document.removeEventListener('pointercancel', clear);
    };
  }, [cutDrag, edges, onRemoveEdges, onRemoveEdge]);

  useEffect(() => {
    if (!boxDrag) return undefined;
    const clear = () => finishBoxSelect();
    document.addEventListener('pointerup', clear);
    document.addEventListener('pointercancel', clear);
    return () => {
      document.removeEventListener('pointerup', clear);
      document.removeEventListener('pointercancel', clear);
    };
  }, [boxDrag, list]);

  return (
    <div
      className="canvas" ref={canvasRef}
      data-canvas-zoom={zoom}
      onPointerEnter={(e) => { activeCanvasElement = e.currentTarget; }}
      onScroll={(e) => { activeCanvasElement = e.currentTarget; }}
      onPointerDown={onCanvasDown}
      onPointerMove={onCanvasMove}
      onPointerUp={onCanvasUp}
      onPointerCancel={() => { setCutDrag(null); setBoxDrag(null); clearAlignmentGuides(); }}
      onWheel={onWheel}
      onDragOver={onDropPalette ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } : undefined}
      onDrop={onDropPalette ? (e) => {
        e.preventDefault();
        const payload = e.dataTransfer.getData('text/x-palette');
        if (!payload) return;
        const p = canvasPoint(e);
        onDropPalette(payload, Math.max(8, p.x - NODE_W / 2), Math.max(8, p.y - 20));
      } : undefined}
    >
      <div className="zoomctl" onPointerDown={(e) => e.stopPropagation()}>
        <button title="Zoom out" onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}>-</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button title="Zoom in" onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}>+</button>
        <button title="Reset zoom" onClick={() => setZoom(1)}>1:1</button>
      </div>
      {multiSel.size > 1 && <div className="multisel-count">{multiSel.size} nodes selected</div>}
      <div className="canvas-zoom" style={{ width: extentX * zoom, height: extentY * zoom }}>
        <div className="canvas-world" style={{ width: extentX, height: extentY, transform: `scale(${zoom})` }}>
      {frames && Object.values(frames).map((f) => f.shape === 'arrow' ? (() => {
        const rect = frameRect(f);
        const x1 = f.w >= 0 ? 0 : rect.w;
        const y1 = f.h >= 0 ? 0 : rect.h;
        const x2 = f.w >= 0 ? rect.w : 0;
        const y2 = f.h >= 0 ? rect.h : 0;
        const markerId = `arrowhead-${String(f.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;
        return (
          <div key={f.id} className={`garrow${selFrame === f.id ? ' sel' : ''}`}
            style={{ left: rect.x, top: rect.y, width: Math.max(1, rect.w), height: Math.max(1, rect.h), color: f.color || '#5CA8F5' }}>
            <svg viewBox={`0 0 ${Math.max(1, rect.w)} ${Math.max(1, rect.h)}`} preserveAspectRatio="none">
              <defs><marker id={markerId} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M 0 0 L 9 4.5 L 0 9 z" fill="currentColor" /></marker></defs>
              <line className="garrow-line" x1={x1} y1={y1} x2={x2} y2={y2} markerEnd={`url(#${markerId})`} />
              <line className="garrow-hit" x1={x1} y1={y1} x2={x2} y2={y2}
                onPointerDown={(e) => onFrameDown(e, f, 'move')} />
            </svg>
            <div className="garrow-start" style={{ left: x1, top: y1 }}
              onPointerDown={(e) => onFrameDown(e, f, 'move')} />
            <div className="garrow-end" style={{ left: x2, top: y2 }} title="Drag to change arrow direction and length"
              onPointerDown={(e) => onFrameDown(e, f, 'resize')} />
          </div>
        );
      })() : (
        <div key={f.id} className={`gframe${f.shape === 'circle' ? ' gcircle' : ''}${selFrame === f.id ? ' sel' : ''}`}
          style={{ left: f.x, top: f.y, width: f.w, height: f.h, borderColor: f.color || 'var(--line)' }}>
          {f.shape === 'circle' ? (
            <div className="gcirclemove" style={{ borderColor: f.color || 'var(--line)', color: f.color || 'var(--muted)' }}
              onPointerDown={(e) => onFrameDown(e, f, 'move')}
              title="Drag to move circle">○</div>
          ) : (
            <div className="gframehead" style={{ background: f.color || 'var(--raised)' }}
              onPointerDown={(e) => onFrameDown(e, f, 'move')}
              title="Drag to move the frame and everything inside it">
              {f.label || 'Frame'}
            </div>
          )}
          <div className="gframegrip" title="Drag to resize"
            onPointerDown={(e) => onFrameDown(e, f, 'resize')} />
        </div>
      ))}
      {markerList.map((marker) => (
        <div
          key={marker.id}
          className={`numarker${selNumberMarker === marker.id ? ' sel' : ''}`}
          style={{ left: marker.x, top: marker.y, '--marker-color': marker.color || '#E8D25C' }}
          title="Drag to move this number marker"
          onPointerDown={(e) => onMarkerDown(e, marker)}
          onPointerMove={onMarkerMove}
          onPointerUp={onMarkerUp}
          onPointerCancel={onMarkerUp}
        >
          <span>{marker.value ?? '?'}</span>
          {selNumberMarker === marker.id && onNumberMarkerDelete && (
            <button
              className="numarker-x"
              title="Delete number marker"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onNumberMarkerDelete(marker.id); }}
            >×</button>
          )}
        </div>
      ))}
      {titleList.map((marker) => (
        <div
          key={marker.id}
          data-title-marker={marker.id}
          data-edge-target={marker.id}
          className={`titlemarker${selTitleMarker === marker.id ? ' sel' : ''}`}
          style={{ left: marker.x, top: marker.y, color: marker.color || '#E9EBF3', fontSize: `${Math.max(12, Math.min(96, Number(marker.fontSize) || 28))}px` }}
          title="Drag to move this title"
          onPointerDown={(e) => onTitleDown(e, marker)}
          onPointerMove={onTitleMove}
          onPointerUp={onTitleUp}
          onPointerCancel={onTitleUp}
        >
          <span>{marker.text || 'Title'}</span>
          {onConnect && EDGE_SIDES.map((side) => (
            <span key={side} data-side={side}
              className={`port titleport ${side}${linkTarget?.nodeId === marker.id && linkTarget.side === side ? ' target' : ''}`}
              title={`Connect to the title's ${side} side`}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerEnter={(e) => onPortEnter(e, marker, side)}
              onPointerLeave={(e) => onPortLeave(e, marker, side)} />
          ))}
          {selTitleMarker === marker.id && onTitleMarkerDelete && (
            <button
              className="titlemarker-x"
              title="Delete title"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onTitleMarkerDelete(marker.id); }}
            >Ã—</button>
          )}
        </div>
      ))}
      {boxDrag && (() => {
        const r = normRect(boxDrag.start, boxDrag.current);
        return <div className="boxselect" style={{ left: r.x, top: r.y, width: r.w, height: r.h }} />;
      })()}
      {alignmentGuides.vertical.map((guide, index) => (
        <div key={`vg-${index}`} className={`alignment-guide vertical ${guide.kind}`} style={{ left: guide.value, height: extentY }} />
      ))}
      {alignmentGuides.horizontal.map((guide, index) => (
        <div key={`hg-${index}`} className={`alignment-guide horizontal ${guide.kind}`} style={{ top: guide.value, width: extentX }} />
      ))}
      <svg className="edges" width={extentX} height={extentY}>
        {(attachments || []).map((a, idx) => {
          const from = nodes[a.from], to = nodes[a.to];
          if (!from || !to) return null;
          const x1 = from.x + nodeW(from) / 2, y1 = from.y + 30, x2 = to.x + nodeW(to) / 2, y2 = to.y + 34;
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          const color = a.color || '#F08CB4';
          return (
            <g key={`att${idx}`}>
              <path d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeWidth="1.6" strokeDasharray="4 4" fill="none" opacity=".75" />
              <foreignObject x={mx - 55} y={my - 12} width="110" height="24">
                <div className="attlab" style={{ borderColor: color, color }}>
                  <span>{a.label || 'enriches'}</span>
                  {onDetach && <button className="x" title="Detach subnode" onClick={() => onDetach(a.from)}>⊘</button>}
                </div>
              </foreignObject>
            </g>
          );
        })}
        {edges.map((e, idx) => {
          const from = endpointFor(e.from), to = endpointFor(e.to);
          if (!from || !to) return null;
          const fromSide = normalizeSide(e.fromSide, 'right');
          const toSide = normalizeSide(e.toSide, 'left');
          const a = outAnchor(from, fromSide), b = inAnchor(to, toSide);
          const { c1, c2 } = controlPoints(a, b, fromSide, toSide);
          const mid = cubicPoint(a, c1, c2, b, 0.5);
          const color = e.color || ENTITY_COLORS[e.kindColor] || colorOf(from) || '#8B92A6';
          const fact = edgeFact?.(e);
          return (
            <g key={idx}>
              <path d={edgePath(a, b, fromSide, toSide)} stroke={color} strokeWidth="2" fill="none" opacity=".8" />
              <foreignObject x={mid.x - 100} y={mid.y - 26} width="200" height="32">
                <div className={`elab${e.label ? '' : ' empty'}`} style={{ borderColor: color, color }}>
                  {fact && <span className="efact" style={{ background: fact.color }} title={fact.title} />}
                  <span className={onEditEdge ? 'editable' : ''}
                    title={onEditEdge ? 'Click to edit the connection label' : undefined}
                    onClick={onEditEdge ? () => editEdgeLabel(e) : undefined}>
                    {e.label || (onEditEdge ? '+ label' : '•')}
                  </span>
                  {onEditEdge && <button className="sidebtn" title={`Attach sides: ${EDGE_SIDE_LABELS[fromSide]} to ${EDGE_SIDE_LABELS[toSide]}`} onClick={() => editEdgeSides(e)}>sides</button>}
                  {onRemoveEdge && <button className="x" title="Remove connection" onClick={() => onRemoveEdge(e)}>×</button>}
                </div>
              </foreignObject>
            </g>
          );
        })}
        {linkDrag && (() => {
          const fromSide = normalizeSide(linkDrag.side, 'right');
          const a = outAnchor(nodes[linkDrag.from], fromSide);
          return <path d={edgePath(a, { x: linkDrag.x, y: linkDrag.y }, fromSide, 'left')}
            stroke={colorOf(nodes[linkDrag.from])} strokeWidth="2" strokeDasharray="6 5" fill="none" opacity=".9" />;
        })()}
        {cutDrag && cutDrag.points.length > 1 && (
          <polyline
            points={cutDrag.points.map((p) => `${p.x},${p.y}`).join(' ')}
            className="cutline"
          />
        )}
      </svg>

      {list.map((n) => {
        const color = colorOf(n);
        const icon = iconOf?.(n);
        const team = teamOf?.(n);
        const isFramework = n.kind === 'framework';
        const body = renderBody ? renderBody(n) : n.body;
        const w = nodeW(n);
        const h = explicitNodeH(n);
        return (
          <div
            key={n.id} data-node={n.id} data-edge-target={n.id} role="button" tabIndex={0}
            className={`node${selId === n.id || multiSel.has(n.id) ? ' sel' : ''}${multiSel.has(n.id) ? ' multisel' : ''}${linkDrag && linkDrag.from !== n.id ? ' droppable' : ''}${dimNode?.(n) ? ' dim' : ''}${nodeClass ? ` ${nodeClass(n) || ''}` : ''}`}
            style={{ left: n.x, top: n.y, width: w, ...(h ? { height: h } : {}), borderTopColor: color }}
            onPointerDown={(e) => onNodeDown(e, n)}
            onPointerMove={onNodeMove}
            onPointerUp={(e) => onNodeUp(e, n)}
            onPointerCancel={(e) => onNodeUp(e, n)}
            onDoubleClick={onOpenNode && !isFramework ? (e) => { e.stopPropagation(); onOpenNode(n.id); } : undefined}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(n.id); }}
          >
            <div className="nh">
              {onSetColor ? (
                <button className="icpick" style={{ background: color }} title="Change node color"
                  onClick={(e) => { e.stopPropagation(); setPickerFor(pickerFor === n.id ? null : n.id); }}>
                  {icon && <PrimIcon icon={icon} color="#fff" size={12} />}
                </button>
              ) : <span className="icpick" style={{ background: color }}>{icon && <PrimIcon icon={icon} color="#fff" size={12} />}</span>}
              <div className="nhmeta"><small style={{ color }}>{KIND_LABEL[n.kind] ?? n.kind}</small><b>{n.kind === 'item' ? (n.shortTitle || n.title) : n.title}</b></div>
              {team && <span className="nteam" style={{ background: team.color }} title={`Lane: ${team.name}`}>{team.name}</span>}
              {onOpenNode && !isFramework && (
                <button className="nopen" title="Open detail graph (or double-click the node)"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onOpenNode(n.id); }}>
                  {Object.keys(n.sub?.nodes || {}).length > 0 ? `⧉ ${Object.keys(n.sub.nodes).length}` : '⧉'}
                </button>
              )}
            </div>
            <div className="nb">
              {n.image?.dataUrl && <img className="nimg" src={n.image.dataUrl} alt="" draggable={false} />}
              {body}
              {renderExtra?.(n)}
            </div>
            {onConnect && EDGE_SIDES.map((side) => (
              <span key={side} data-side={side}
                className={`port ${side}${linkTarget?.nodeId === n.id && linkTarget.side === side ? ' target' : ''}`}
                title={`Drag from or connect to the ${side} side`}
                onPointerDown={(e) => onPortDown(e, n, side)}
                onPointerEnter={(e) => onPortEnter(e, n, side)}
                onPointerLeave={(e) => onPortLeave(e, n, side)} />
            ))}
            {onResizeNode && selId === n.id && ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((dir) => (
              <span
                key={dir}
                className={`nresize ${dir}`}
                title="Drag to resize node"
                onPointerDown={(e) => onResizeDown(e, n, dir)}
                onPointerMove={onResizeMove}
                onPointerUp={onResizeUp}
                onPointerCancel={onResizeUp}
              />
            ))}
            {onSetColor && pickerFor === n.id && (
              <div className="swatchpop" onPointerDown={(e) => e.stopPropagation()}>
                {SWATCHES.map((c) => (
                  <button key={c} className={`swatch${color === c ? ' on' : ''}`} style={{ background: c }}
                    onClick={() => { onSetColor(n.id, c); setPickerFor(null); }} />
                ))}
                <label className="swatch custom" title="Custom color">
                  <input type="color" value={color} onChange={(e) => onSetColor(n.id, e.target.value)} />
                </label>
                <button className="swatchauto" onClick={() => { onSetColor(n.id, null); setPickerFor(null); }}>Auto</button>
              </div>
            )}
          </div>
        );
      })}
        </div>
      </div>
    </div>
  );
}
