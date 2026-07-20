import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGame, useDispatch, useLibrary, useLibraryDispatch } from '../state/store.jsx';
import { ENTITY_COLORS } from '../components/bits.jsx';
import FlowCanvas, { visibleCanvasPlacement } from '../components/FlowCanvas.jsx';
import { storyTrackToStructure } from '../state/bridge.js';
import { genId } from '../data/csvSchemas.js';
import { LIB_PREFIX } from '../data/seed.js';

const TASK_COLOR = ENTITY_COLORS.task || '#5BC0BE';
const TRAVEL_COLOR = ENTITY_COLORS.travel || '#E0A23C';
const MASTER_COLOR = '#3EC6D6';
const pad2 = (v) => String(v).padStart(2, '0');
const toLabel = (min) => `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;
const parseHM = (s) => { const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim()); return m ? +m[1] * 60 + +m[2] : null; };
const round5 = (v) => Math.round(v / 5) * 5;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const defaultMargin = (dur) => Math.max(5, round5((dur || 45) / 3));
const TIMELINE_STEPS = [5, 10, 15, 30, 60, 120];
const SEGMENT_PX = 96;
const normalizeTimelineStep = (step) => (TIMELINE_STEPS.includes(step) ? step : 30);

// Master Story is deliberately separate from the detailed Narrative Weaver:
// this canvas holds the short act-level shape of the game, while the timeline
// shows task estimates that can be conceptually aligned to those acts.
export default function Weaver({ selection, onSelect = () => {} }) {
  const s = useGame();
  const dispatch = useDispatch();
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const barDrag = useRef(null);
  const [armed, setArmed] = useState(null);
  const [, setTick] = useState(0);
  const anchorsRef = useRef({});
  const anchors = anchorsRef.current;

  const win = s.meta.timeline || { startMin: 540, endMin: 1020 };
  const timelineStep = normalizeTimelineStep(s.meta.timelineStep);
  const span = Math.max(60, win.endMin - win.startMin);
  const aligns = s.alignments || [];
  const masterNodes = s.masterNodes || {};
  const masterEdges = s.masterEdges || [];
  const masterFrames = s.masterFrames || {};
  const masterNumberMarkers = s.masterNumberMarkers || {};
  const masterTitleMarkers = s.masterTitleMarkers || {};
  const timelineItems = Object.values(s.storyboardNodes || {}).sort((a, b) => (a.startMin ?? 9999) - (b.startMin ?? 9999) || a.x - b.x);
  const taskOnlyItems = timelineItems.filter((t) => t.kind !== 'travel');
  const effStart = (t, i) => t.startMin ?? Math.round(win.startMin + ((i + 1) * span) / (timelineItems.length + 1));
  const effDur = (t) => t.durationMin ?? (t.kind === 'travel' ? 20 : 45);
  const isFirstTaskItem = (t) => t.kind !== 'travel' && taskOnlyItems[0]?.id === t.id;
  const isLastTaskItem = (t) => t.kind !== 'travel' && taskOnlyItems[taskOnlyItems.length - 1]?.id === t.id;
  const itemBefore = (t) => t.kind === 'travel' || isFirstTaskItem(t) ? 0 : (t.marginBeforeMin ?? defaultMargin(effDur(t)));
  const itemAfter = (t, i) => t.kind === 'travel'
    ? (t.marginAfterMin ?? defaultMargin(effDur(t)))
    : (isLastTaskItem(t) ? 0 : (t.marginAfterMin ?? defaultMargin(effDur(t))));
  const itemColor = (t) => t.color || (t.kind === 'travel' ? TRAVEL_COLOR : TASK_COLOR);
  const itemKindLabel = (t) => t.kind === 'travel' ? 'Travel Time' : 'Task';
  const masterSelId = selection?.kind === 'graphnode' && selection.scope?.coll === 'masterNodes' ? selection.id : null;
  const masterFrameSelId = selection?.kind === 'graphframe' && selection.scope?.coll === 'masterNodes' ? selection.id : null;
  const taskSelId = selection?.kind === 'graphnode' && selection.scope?.coll === 'storyboardNodes' ? selection.id : null;
  const selectedRuleIds = Array.isArray(s.meta.gmRuleIds) ? s.meta.gmRuleIds : [];
  const selectedRules = selectedRuleIds.map((id) => lib.gmRules?.[id]).filter(Boolean);
  const availableRules = Object.values(lib.gmRules || {}).filter((r) => !selectedRuleIds.includes(r.id));
  const stepIndex = TIMELINE_STEPS.indexOf(timelineStep);
  const setTimelineStep = (step) => dispatch({ type: 'SET_META', patch: { timelineStep: normalizeTimelineStep(step) } });
  const zoomIn = () => setTimelineStep(TIMELINE_STEPS[Math.max(0, stepIndex - 1)] ?? 5);
  const zoomOut = () => setTimelineStep(TIMELINE_STEPS[Math.min(TIMELINE_STEPS.length - 1, stepIndex + 1)] ?? 120);
  const setRuleIds = (gmRuleIds) => dispatch({ type: 'SET_META', patch: { gmRuleIds } });

  useLayoutEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const cr = c.getBoundingClientRect();
    const next = {};
    c.querySelector('.wpanel.left')?.querySelectorAll('[data-node]').forEach((el) => {
      const r = el.getBoundingClientRect();
      next[`story:${el.dataset.node}`] = { x: r.right - cr.left, y: r.top - cr.top + r.height / 2 };
    });
    c.querySelectorAll('[data-task]').forEach((el) => {
      const r = el.getBoundingClientRect();
      next[`task:${el.dataset.task}`] = { x: r.left - cr.left, y: r.top - cr.top + r.height / 2 };
    });
    const prev = anchorsRef.current;
    const keys = Object.keys(next);
    const changed = keys.length !== Object.keys(prev).length
      || keys.some((k) => !prev[k] || Math.abs(prev[k].x - next[k].x) > 0.5 || Math.abs(prev[k].y - next[k].y) > 0.5);
    if (changed) { anchorsRef.current = next; setTick((t) => t + 1); }
  });

  useEffect(() => {
    const onWin = () => setTick((t) => t + 1);
    window.addEventListener('resize', onWin);
    const ro = new ResizeObserver(onWin);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => { window.removeEventListener('resize', onWin); ro.disconnect(); };
  }, []);

  const toggleAlign = (taskId) => {
    if (!armed) return;
    const exists = aligns.some((a) => a.story === armed && a.task === taskId);
    dispatch({ type: exists ? 'REMOVE_ALIGN' : 'ADD_ALIGN', story: armed, task: taskId });
  };

  const addAct = () => {
    const id = genId(masterNodes, 'ACT-');
    const nodePos = visibleCanvasPlacement({ x: 80, y: 80 });
    const node = {
      id, kind: 'masterAct', title: 'New master act',
      x: nodePos.x, y: nodePos.y,
      body: 'Macro-level story beat.', phaseNotes: '', color: null,
    };
    dispatch({ type: 'GRAPH_ADD_NODE', scope: { coll: 'masterNodes' }, node });
    setArmed(id);
    onSelect({ kind: 'graphnode', scope: { coll: 'masterNodes' }, id });
  };

  const addFrame = () => {
    const id = genId(masterFrames, 'MFR-');
    const size = { w: 420, h: 240 };
    const pos = visibleCanvasPlacement({ x: 70, y: 70 }, size);
    const frame = { id, label: 'Frame', ...pos, ...size, color: '#8B92A6' };
    dispatch({ type: 'GRAPH_ADD_FRAME', scope: { coll: 'masterNodes' }, frame });
    onSelect({ kind: 'graphframe', scope: { coll: 'masterNodes' }, id });
  };
  const addCircle = () => {
    const id = genId(masterFrames, 'MCIR-');
    const size = { w: 160, h: 160 };
    const pos = visibleCanvasPlacement({ x: 90, y: 90 }, size);
    const frame = { id, label: 'Circle', shape: 'circle', ...pos, ...size, color: '#5CA8F5' };
    dispatch({ type: 'GRAPH_ADD_FRAME', scope: { coll: 'masterNodes' }, frame });
    onSelect({ kind: 'graphframe', scope: { coll: 'masterNodes' }, id });
  };
  const addArrow = () => {
    const id = genId(masterFrames, 'MARR-');
    const pos = visibleCanvasPlacement({ x: 110, y: 110 }, { w: 200, h: 80 });
    const frame = { id, label: 'Arrow', shape: 'arrow', ...pos, w: 200, h: 80, color: '#5CA8F5' };
    dispatch({ type: 'GRAPH_ADD_FRAME', scope: { coll: 'masterNodes' }, frame });
    onSelect({ kind: 'graphframe', scope: { coll: 'masterNodes' }, id });
  };
  const addNumberMarker = () => {
    const id = genId(masterNumberMarkers, 'MNUM-');
    const values = Object.values(masterNumberMarkers).map((m) => Number(m.value)).filter(Number.isFinite);
    const marker = { id, value: values.length ? Math.max(...values) + 1 : 1, ...visibleCanvasPlacement({ x: 120, y: 120 }, { w: 34, h: 34 }), color: '#E8D25C' };
    dispatch({ type: 'GRAPH_ADD_NUMBER_MARKER', scope: { coll: 'masterNodes' }, marker });
    onSelect({ kind: 'graphnumber', scope: { coll: 'masterNodes' }, id });
  };
  const addTitleMarker = () => {
    const id = genId(masterTitleMarkers, 'MTTL-');
    const marker = { id, text: 'Title', ...visibleCanvasPlacement({ x: 140, y: 120 }, { w: 120, h: 42 }), fontSize: 28, color: '#E9EBF3' };
    dispatch({ type: 'GRAPH_ADD_TITLE_MARKER', scope: { coll: 'masterNodes' }, marker });
    onSelect({ kind: 'graphtitle', scope: { coll: 'masterNodes' }, id });
  };

  const addTask = () => {
    const id = genId(s.storyboardNodes || {}, 'STK-');
    const last = timelineItems[timelineItems.length - 1];
    const startMin = last ? Math.min(win.endMin - 15, (last.startMin ?? win.startMin) + (last.durationMin ?? 30) + 10) : win.startMin + 30;
    const node = {
      id, kind: 'task', title: 'Storyboard task',
      x: 80 + Object.keys(s.storyboardNodes || {}).length * 80, y: 220,
      startMin, durationMin: 30, marginBeforeMin: 10, marginAfterMin: 10,
      body: 'Stable master-story activity. This is not connected to the mechanics schematic graph.',
      color: null,
    };
    dispatch({ type: 'GRAPH_ADD_NODE', scope: { coll: 'storyboardNodes' }, node });
    onSelect({ kind: 'graphnode', scope: { coll: 'storyboardNodes' }, id });
  };

  const addTravel = () => {
    const id = genId(s.storyboardNodes || {}, 'TRV-');
    const last = timelineItems[timelineItems.length - 1];
    const startMin = last ? Math.min(win.endMin - 10, (last.startMin ?? win.startMin) + (last.durationMin ?? 30) + 10) : win.startMin + 30;
    const node = {
      id, kind: 'travel', title: 'Travel time',
      x: 80 + Object.keys(s.storyboardNodes || {}).length * 80, y: 260,
      startMin, durationMin: 20, marginAfterMin: 15,
      body: 'Movement between game locations. Adjust for walking, bikes, taxis, delays, or getting lost.',
      color: null,
    };
    dispatch({ type: 'GRAPH_ADD_NODE', scope: { coll: 'storyboardNodes' }, node });
    onSelect({ kind: 'graphnode', scope: { coll: 'storyboardNodes' }, id });
  };

  const addRule = (id) => {
    if (!id || selectedRuleIds.includes(id)) return;
    setRuleIds([...selectedRuleIds, id]);
  };
  const removeRule = (id) => setRuleIds(selectedRuleIds.filter((ruleId) => ruleId !== id));

  const xOf = (min, innerW) => 8 + ((min - win.startMin) / span) * innerW;

  const startTaskDrag = (e, mode, t, i) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    barDrag.current = {
      id: t.id, mode, startX: e.clientX, orig: effStart(t, i), dur: effDur(t),
      before: itemBefore(t), after: itemAfter(t), first: isFirstTaskItem(t), last: isLastTaskItem(t), isTravel: t.kind === 'travel', moved: false,
    };
  };

  const onBarMove = (e) => {
    const d = barDrag.current;
    if (!d) return;
    const visibleInnerW = (trackRef.current?.clientWidth ?? 600) - 16;
    const innerW = Math.max(visibleInnerW, Math.ceil(span / timelineStep) * SEGMENT_PX);
    const deltaMin = ((e.clientX - d.startX) / innerW) * span;
    if (Math.abs(e.clientX - d.startX) > 3) d.moved = true;
    const patch = {};
    if (d.mode === 'move') {
      patch.startMin = clamp(round5(d.orig + deltaMin), win.startMin + d.before, win.endMin - d.dur - d.after);
      patch.durationMin = d.dur;
    } else if (d.mode === 'resize-start') {
      const nextStart = clamp(round5(d.orig + deltaMin), win.startMin + d.before, d.orig + d.dur - 5);
      patch.startMin = nextStart;
      patch.durationMin = d.orig + d.dur - nextStart;
    } else if (d.mode === 'resize-end') {
      patch.durationMin = clamp(round5(d.dur + deltaMin), 5, win.endMin - d.after - d.orig);
    } else if (d.mode === 'margin-start' && !d.first && !d.isTravel) {
      patch.marginBeforeMin = clamp(round5(d.before - deltaMin), 0, Math.max(0, d.orig - win.startMin));
    } else if (d.mode === 'margin-end' && (!d.last || d.isTravel)) {
      patch.marginAfterMin = clamp(round5(d.after + deltaMin), 0, Math.max(0, win.endMin - d.orig - d.dur));
    }
    if (Object.keys(patch).length) {
      dispatch({ type: 'GRAPH_UPDATE_NODE', scope: { coll: 'storyboardNodes' }, id: d.id, patch });
    }
  };

  const onBarUp = (t) => {
    const d = barDrag.current;
    barDrag.current = null;
    if (!d || d.moved) return;
    if (armed) toggleAlign(t.id);
    else onSelect({ kind: 'graphnode', scope: { coll: 'storyboardNodes' }, id: t.id });
  };

  const saveTemplate = () => {
    const name = window.prompt('Save this Master Story to the Library as a Story Structure named:', `${s.meta.name} - master story`);
    if (!name?.trim()) return;
    const id = genId(lib.stories, LIB_PREFIX.stories);
    libDispatch({ type: 'ADD_ENTITY', coll: 'stories', entity: storyTrackToStructure(s, id, name.trim()) });
    window.alert(`Saved "${name.trim()}" to Library -> Story & Narrative -> Story Structures.`);
  };

  const editWindow = () => {
    const v = window.prompt('Day window as HH:MM-HH:MM', `${toLabel(win.startMin)}-${toLabel(win.endMin)}`);
    if (!v) return;
    const [a, b] = v.split('-');
    const startMin = parseHM(a || ''); const endMin = parseHM(b || '');
    if (startMin != null && endMin != null && endMin > startMin) dispatch({ type: 'SET_META', patch: { timeline: { startMin, endMin } } });
  };

  const visibleInnerW = (trackRef.current?.clientWidth ?? 600) - 16;
  const innerW = Math.max(visibleInnerW, Math.ceil(span / timelineStep) * SEGMENT_PX);
  const timelineW = innerW + 16;
  const minBarW = timelineStep >= 120 ? 34 : timelineStep >= 60 ? 46 : 72;
  const ticks = [];
  for (let m = Math.ceil(win.startMin / timelineStep) * timelineStep; m <= win.endMin; m += timelineStep) ticks.push(m);
  const rowH = 54; const headH = 30;

  return (
    <div className="main masterstory">
      <div className="mhead">
        <div>
          <div className="crumb">{s.meta.name} / <b>Master Story</b></div>
          <h2>Master Story of {s.meta.name}</h2>
        </div>
        <div className="right"><span className="dim" style={{ fontSize: 12 }}>
          {armed ? 'Now click a task on the timeline to link it; click the act again to cancel' : 'Click an act, then a task, to align them'}
        </span></div>
      </div>

      <div className="weaver2" ref={containerRef} onScroll={() => setTick((t) => t + 1)}>
        <svg className="align-overlay" width="100%" height="100%" aria-hidden="true">
          {aligns.map((a, i) => {
            const p = anchors[`story:${a.story}`]; const q = anchors[`task:${a.task}`];
            if (!p || !q) return null;
            const mx = (p.x + q.x) / 2;
            return (
              <g key={i}>
                <path d={`M ${p.x} ${p.y} C ${mx} ${p.y}, ${mx} ${q.y}, ${q.x} ${q.y}`} className="wline" style={{ stroke: TASK_COLOR }} />
                <path d={`M ${p.x} ${p.y} C ${mx} ${p.y}, ${mx} ${q.y}, ${q.x} ${q.y}`} className="whit"
                  onClick={() => dispatch({ type: 'REMOVE_ALIGN', story: a.story, task: a.task })} />
              </g>
            );
          })}
        </svg>

        <div className="wpanel left">
          <div className="wphead">
            <span>Macro Story Track - <b>{Object.keys(masterNodes).length} acts</b></span>
            <div className="canvas-add-groups">
              <div className="canvas-tool-cluster node-tool-group"><span className="tool-kind-label">Nodes</span><button className="btn ghost small" onClick={addAct}>+ Add act</button></div>
              <div className="canvas-tool-cluster support-tool-group"><span className="tool-kind-label">Support</span>
              <button className="btn ghost small" onClick={addFrame}>+ Frame</button>
              <button className="btn ghost small" onClick={addCircle}>+ Circle</button>
              <button className="btn ghost small" onClick={addNumberMarker}>+ Number</button>
              <button className="btn ghost small" onClick={addTitleMarker}>+ Title</button>
              <button className="btn ghost small" onClick={addArrow}>+ Arrow</button>
              </div>
              <button className="btn ghost small" onClick={saveTemplate}>Save as Template</button>
            </div>
          </div>
          <FlowCanvas
            nodes={masterNodes} edges={masterEdges} selId={armed || masterSelId} colorOf={(n) => n.color || MASTER_COLOR}
            onSelect={(id) => { setArmed((cur) => (cur === id ? null : id)); onSelect({ kind: 'graphnode', scope: { coll: 'masterNodes' }, id }); }}
            onMove={(id, x, y) => dispatch({ type: 'GRAPH_UPDATE_NODE', scope: { coll: 'masterNodes' }, id, patch: { x, y } })}
            onMoveNodes={(positions, meta) => dispatch({
              type: 'BATCH',
              undoGroup: meta?.undoGroup,
              actions: Object.entries(positions).map(([id, patch]) => ({ type: 'GRAPH_UPDATE_NODE', scope: { coll: 'masterNodes' }, id, patch })),
            })}
            onResizeNode={(id, patch) => dispatch({ type: 'GRAPH_UPDATE_NODE', scope: { coll: 'masterNodes' }, id, patch })}
            onConnect={(from, to, edgePatch = {}) => dispatch({ type: 'GRAPH_ADD_EDGE', scope: { coll: 'masterNodes' }, from, to, color: MASTER_COLOR, ...edgePatch })}
            onRemoveEdge={(e) => dispatch({ type: 'GRAPH_REMOVE_EDGE', scope: { coll: 'masterNodes' }, from: e.from, to: e.to })}
            onSetColor={(id, color) => dispatch({ type: 'GRAPH_UPDATE_NODE', scope: { coll: 'masterNodes' }, id, patch: { color } })}
            onDeleteNode={(id) => { dispatch({ type: 'GRAPH_DELETE_NODE', scope: { coll: 'masterNodes' }, id }); setArmed(null); onSelect(null); }}
            onDeleteNodes={(ids) => {
              dispatch({ type: 'BATCH', actions: ids.map((id) => ({ type: 'GRAPH_DELETE_NODE', scope: { coll: 'masterNodes' }, id })) });
              setArmed(null);
              onSelect(null);
            }}
            onClearCanvas={() => {
              dispatch({ type: 'GRAPH_CLEAR', scope: { coll: 'masterNodes' } });
              setArmed(null);
              onSelect(null);
            }}
            onEditEdge={(e, patch) => dispatch({ type: 'GRAPH_UPDATE_EDGE', scope: { coll: 'masterNodes' }, from: e.from, to: e.to, patch })}
            frames={masterFrames}
            selFrame={masterFrameSelId}
            onFrameSelect={(id) => onSelect({ kind: 'graphframe', scope: { coll: 'masterNodes' }, id })}
            onFrameMove={(id, dx, dy) => dispatch({ type: 'GRAPH_MOVE_FRAME', scope: { coll: 'masterNodes' }, id, dx, dy })}
            onFrameResize={(id, w, h) => dispatch({ type: 'GRAPH_UPDATE_FRAME', scope: { coll: 'masterNodes' }, id, patch: { w, h } })}
            numberMarkers={masterNumberMarkers}
            selNumberMarker={selection?.kind === 'graphnumber' && selection.scope?.coll === 'masterNodes' ? selection.id : null}
            onNumberMarkerSelect={(id) => onSelect({ kind: 'graphnumber', scope: { coll: 'masterNodes' }, id })}
            onNumberMarkerMove={(id, dx, dy) => {
              const marker = masterNumberMarkers[id];
              if (marker) dispatch({ type: 'GRAPH_UPDATE_NUMBER_MARKER', scope: { coll: 'masterNodes' }, id, patch: { x: marker.x + dx, y: marker.y + dy } });
            }}
            onNumberMarkerDelete={(id) => { dispatch({ type: 'GRAPH_DELETE_NUMBER_MARKER', scope: { coll: 'masterNodes' }, id }); onSelect(null); }}
            titleMarkers={masterTitleMarkers}
            selTitleMarker={selection?.kind === 'graphtitle' && selection.scope?.coll === 'masterNodes' ? selection.id : null}
            onTitleMarkerSelect={(id) => onSelect({ kind: 'graphtitle', scope: { coll: 'masterNodes' }, id })}
            onTitleMarkerMove={(id, dx, dy) => {
              const marker = masterTitleMarkers[id];
              if (marker) dispatch({ type: 'GRAPH_UPDATE_TITLE_MARKER', scope: { coll: 'masterNodes' }, id, patch: { x: marker.x + dx, y: marker.y + dy } });
            }}
            onTitleMarkerDelete={(id) => { dispatch({ type: 'GRAPH_DELETE_TITLE_MARKER', scope: { coll: 'masterNodes' }, id }); onSelect(null); }}
            onPasteNode={(p) => {
              const id = genId(masterNodes, 'ACT-');
              dispatch({ type: 'GRAPH_ADD_NODE', scope: { coll: 'masterNodes' }, node: { id, kind: 'masterAct', title: p.title, body: p.body ?? '', phaseNotes: p.phaseNotes ?? '', color: p.color ?? null, x: p.x, y: p.y, w: p.w ?? undefined, h: p.h ?? undefined } });
              onSelect({ kind: 'graphnode', scope: { coll: 'masterNodes' }, id });
            }}
          />
        </div>

        <div className="wpanel right">
          <div className="wphead">
            <span>Mechanical Timeline - <b>{toLabel(win.startMin)}-{toLabel(win.endMin)}</b></span>
            <div>
              <div className="tlzoom" title="Timeline zoom">
                <button className="btn ghost small" onClick={zoomOut} disabled={stepIndex === TIMELINE_STEPS.length - 1}>-</button>
                <span>{timelineStep < 60 ? `${timelineStep} min` : `${timelineStep / 60} hr`}/section</span>
                <button className="btn ghost small" onClick={zoomIn} disabled={stepIndex === 0}>+</button>
              </div>
              <button className="btn ghost small" onClick={addTask}>+ Task</button>
              <button className="btn ghost small" onClick={addTravel}>+ Travel time</button>
              <button className="btn ghost small" onClick={editWindow}>Edit window</button>
            </div>
          </div>
          <div className="timeline" ref={trackRef} onPointerMove={onBarMove} onPointerUp={() => (barDrag.current = null)}>
            <div className="timeline-world" style={{ width: timelineW, height: headH + timelineItems.length * rowH + 24 }}>
              <div className="tlaxis" style={{ height: headH, width: timelineW }}>
                {ticks.map((m) => (
                  <span key={m} className="tltick" style={{ left: xOf(m, innerW) }}>{toLabel(m)}</span>
                ))}
              </div>
              <div className="tlgrid">
                {ticks.map((m) => <i key={m} style={{ left: xOf(m, innerW) }} />)}
              </div>
              {timelineItems.map((t, i) => {
                const start = effStart(t, i); const dur = effDur(t);
                const before = itemBefore(t); const after = itemAfter(t);
                const left = xOf(start, innerW);
                const width = Math.max(minBarW, (dur / span) * innerW);
                const marginLeft = xOf(start - before, innerW);
                const marginWidth = Math.max(width, ((before + dur + after) / span) * innerW);
                const top = headH + 8 + i * rowH;
                const linkedToArmed = armed && aligns.some((a) => a.story === armed && a.task === t.id);
                const color = itemColor(t);
                return (
                  <React.Fragment key={t.id}>
                    {(before > 0 || after > 0) && (
                      <div className={`tlmargin${t.kind === 'travel' ? ' travel' : ''}`} style={{ left: marginLeft, width: marginWidth, top: top + 4 }}>
                        {before > 0 && <span className="tlmhandle left" onPointerDown={(e) => startTaskDrag(e, 'margin-start', t, i)} title="Drag earliest expected start" />}
                        {after > 0 && <span className="tlmhandle right" onPointerDown={(e) => startTaskDrag(e, 'margin-end', t, i)} title={t.kind === 'travel' ? 'Drag possible travel delay' : 'Drag latest expected finish'} />}
                      </div>
                    )}
                    <div data-task={t.id} className={`tlbar${t.kind === 'travel' ? ' travel' : ''}${linkedToArmed ? ' linked' : ''}${armed ? ' arming' : ''}${taskSelId === t.id ? ' selected' : ''}`}
                      style={{ left, width, top, borderLeftColor: color }}
                      onPointerDown={(e) => startTaskDrag(e, 'move', t, i)}
                      onPointerUp={() => onBarUp(t)}
                      onClick={(e) => { e.stopPropagation(); if (!armed) onSelect({ kind: 'graphnode', scope: { coll: 'storyboardNodes' }, id: t.id }); }}
                      title={`${t.title} - ${toLabel(start)}-${toLabel(start + dur)}`}>
                      <span className="tlresize left" onPointerDown={(e) => startTaskDrag(e, 'resize-start', t, i)} title="Drag to change start/duration" />
                      <span className="tlresize right" onPointerDown={(e) => startTaskDrag(e, 'resize-end', t, i)} title="Drag to change duration" />
                      <span className="tlkind" style={{ color }}>{itemKindLabel(t)}</span>
                      <b>{t.title}</b>
                      <span className="tltime mono">{toLabel(start)}-{toLabel(start + dur)}{t.kind === 'travel' && after ? ` | +${after}m possible delay` : (before || after) ? ` | ${before}/${after}m margin` : ''}</span>
                    </div>
                  </React.Fragment>
                );
              })}
              {timelineItems.length === 0 && <div className="empty" style={{ padding: 24 }}>No storyboard tasks yet - add stable tasks or travel time here.</div>}
            </div>
          </div>
        </div>
      </div>

      <section className="masterrules">
        <div className="masterrules-head">
          <div>
            <b>Game Master Rules for {s.meta.name}</b>
            <span>{selectedRules.length} selected</span>
          </div>
          {availableRules.length > 0 && (
            <select className="field-input compact" value="" onChange={(e) => addRule(e.target.value)}>
              <option value="">+ Add rule</option>
              {availableRules.map((rule) => <option key={rule.id} value={rule.id}>{rule.title}</option>)}
            </select>
          )}
        </div>
        <div className="masterrules-list">
          {selectedRules.map((rule) => (
            <article key={rule.id} className="masterrule-card">
              <div>
                <b>{rule.title}</b>
                <button className="linkbtn danger" onClick={() => removeRule(rule.id)}>Remove</button>
              </div>
              <p>{rule.principle || 'No principle written yet.'}</p>
            </article>
          ))}
          {selectedRules.length === 0 && (
            <div className="masterrule-empty">
              No rules selected for this game yet. Add one from the Library rules above.
            </div>
          )}
        </div>
      </section>

      <div className="statusbar">
        <span><b>{aligns.length}</b> alignments | click a task or travel bar to inspect | drag a bar to reschedule | drag bar edges to resize | pale bands show estimated minimum/maximum timing.</span>
      </div>
    </div>
  );
}
