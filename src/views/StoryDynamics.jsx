import React, { useMemo, useRef, useState } from 'react';
import { useGame, useDispatch } from '../state/store.jsx';
import {
  cloneDefaultStoryDynamicsGraph,
  normalizeStoryDynamicsGraph,
  STORY_DYNAMICS_COLORS,
  STORY_DYNAMICS_TAG_TYPES,
} from '../data/storyDynamics.js';
import { genId } from '../data/csvSchemas.js';

const VIEWBOX = { w: 1120, h: 620 };
const CHART = { x: 78, y: 36, w: 970, h: 490 };
const MIN_POINT_DISTANCE = 1.2;

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

function pointToSvg(point) {
  return {
    x: CHART.x + (point.x / 100) * CHART.w,
    y: CHART.y + ((100 - point.y) / 100) * CHART.h,
  };
}

function pointsToPath(points = []) {
  if (points.length === 0) return '';
  return points.map((point, index) => {
    const p = pointToSvg(point);
    return `${index === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(' ');
}

function tagWidth(label) {
  return clamp(String(label || '').length * 7.2 + 28, 86, 260);
}

function makeTagId(tags) {
  return genId(Object.fromEntries((tags || []).map((tag) => [tag.id, tag])), 'TAG-');
}

function makeCurveId(curves) {
  return genId(Object.fromEntries((curves || []).map((curve) => [curve.id, curve])), 'CURVE-');
}

export default function StoryDynamics() {
  const s = useGame();
  const dispatch = useDispatch();
  const svgRef = useRef(null);
  const draftRef = useRef([]);
  const dragTagRef = useRef(null);
  const dragCurvePointRef = useRef(null);
  const [mode, setMode] = useState('draw');
  const [tagType, setTagType] = useState('memorable');
  const [selected, setSelected] = useState(null);
  const [draftPoints, setDraftPointsState] = useState([]);
  const [drawing, setDrawing] = useState(false);

  const graph = useMemo(() => normalizeStoryDynamicsGraph(s.storyDynamicsGraph), [s.storyDynamicsGraph]);
  const selectedTag = selected?.kind === 'tag' ? graph.tags.find((tag) => tag.id === selected.id) : null;
  const selectedCurve = selected?.kind === 'curve' ? graph.curves.find((curve) => curve.id === selected.id) : null;

  const commit = (next, undoGroup = null) => {
    dispatch({ type: 'SET_STORY_DYNAMICS_GRAPH', graph: normalizeStoryDynamicsGraph(next), undoGroup });
  };

  const setDraftPoints = (points) => {
    draftRef.current = points;
    setDraftPointsState(points);
  };

  const eventToNorm = (event) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const sx = ((event.clientX - rect.left) / rect.width) * VIEWBOX.w;
    const sy = ((event.clientY - rect.top) / rect.height) * VIEWBOX.h;
    return {
      x: clamp(((sx - CHART.x) / CHART.w) * 100),
      y: clamp(100 - ((sy - CHART.y) / CHART.h) * 100),
    };
  };

  const addTagAt = (point) => {
    const type = STORY_DYNAMICS_TAG_TYPES.find((item) => item.id === tagType) || STORY_DYNAMICS_TAG_TYPES[0];
    const label = window.prompt('Tag label:', type.label);
    if (!label?.trim()) return;
    const tag = {
      id: makeTagId(graph.tags),
      type: type.id,
      label: label.trim(),
      x: point.x,
      y: point.y,
      color: type.color,
    };
    commit({ ...graph, tags: [...graph.tags, tag] });
    setSelected({ kind: 'tag', id: tag.id });
  };

  const onChartPointerDown = (event) => {
    if (event.button !== 0) return;
    const point = eventToNorm(event);
    if (mode === 'tag') {
      addTagAt(point);
      return;
    }
    setSelected(null);
    setDrawing(true);
    setDraftPoints([point]);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onChartPointerMove = (event) => {
    if (dragCurvePointRef.current) {
      const point = eventToNorm(event);
      const { curveId, pointIndex } = dragCurvePointRef.current;
      commit({
        ...graph,
        curves: graph.curves.map((curve) => {
          if (curve.id !== curveId) return curve;
          const points = curve.points.map((existing, idx) => (idx === pointIndex ? point : existing));
          return { ...curve, points };
        }),
      }, `story-dynamics:curve:${curveId}:${pointIndex}`);
      return;
    }
    if (dragTagRef.current) {
      const point = eventToNorm(event);
      commit({
        ...graph,
        tags: graph.tags.map((tag) => (tag.id === dragTagRef.current ? { ...tag, x: point.x, y: point.y } : tag)),
      }, `story-dynamics:tag:${dragTagRef.current}`);
      return;
    }
    if (!drawing) return;
    const point = eventToNorm(event);
    const prev = draftRef.current[draftRef.current.length - 1];
    if (!prev || Math.hypot(point.x - prev.x, point.y - prev.y) >= MIN_POINT_DISTANCE) {
      setDraftPoints([...draftRef.current, point]);
    }
  };

  const onChartPointerUp = (event) => {
    if (dragCurvePointRef.current) {
      dragCurvePointRef.current = null;
      return;
    }
    if (dragTagRef.current) {
      dragTagRef.current = null;
      return;
    }
    if (!drawing) return;
    setDrawing(false);
    const points = draftRef.current;
    setDraftPoints([]);
    if (points.length < 2) return;
    const curve = {
      id: makeCurveId(graph.curves),
      label: `Curve ${graph.curves.length + 1}`,
      color: STORY_DYNAMICS_COLORS[graph.curves.length % STORY_DYNAMICS_COLORS.length],
      points,
    };
    commit({ ...graph, curves: [...graph.curves, curve] });
    setSelected({ kind: 'curve', id: curve.id });
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const beginCurvePointDrag = (event, curve, pointIndex) => {
    event.stopPropagation();
    setSelected({ kind: 'curve', id: curve.id });
    dragCurvePointRef.current = { curveId: curve.id, pointIndex };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const addPointToCurve = (event, curve) => {
    event.stopPropagation();
    const point = eventToNorm(event);
    const insertAt = curve.points.findIndex((existing) => existing.x > point.x);
    const points = [...curve.points];
    points.splice(insertAt === -1 ? points.length : insertAt, 0, point);
    commit({
      ...graph,
      curves: graph.curves.map((item) => (item.id === curve.id ? { ...item, points } : item)),
    });
    setSelected({ kind: 'curve', id: curve.id });
  };

  const beginTagDrag = (event, tag) => {
    event.stopPropagation();
    setSelected({ kind: 'tag', id: tag.id });
    dragTagRef.current = tag.id;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const editTag = (tag) => {
    const label = window.prompt('Tag label:', tag.label);
    if (!label?.trim()) return;
    commit({ ...graph, tags: graph.tags.map((item) => (item.id === tag.id ? { ...item, label: label.trim() } : item)) });
  };

  const deleteSelected = () => {
    if (!selected) return;
    if (selected.kind === 'tag') commit({ ...graph, tags: graph.tags.filter((tag) => tag.id !== selected.id) });
    if (selected.kind === 'curve') commit({ ...graph, curves: graph.curves.filter((curve) => curve.id !== selected.id) });
    setSelected(null);
  };

  const grid = Array.from({ length: 11 }, (_, i) => i * 10);

  return (
    <div className="main storydynamics">
      <div className="mhead">
        <div>
          <div className="crumb">{s.meta.name} / <b>Story Dynamics Graph</b></div>
          <h2>Story Dynamics Graph</h2>
        </div>
        <div className="right">
          <span className="mono dim">{graph.curves.length} curves · {graph.tags.length} tags</span>
        </div>
      </div>

      <div className="dynamics-toolbar">
        <div className="seg compact">
          <button className={mode === 'draw' ? 'on' : ''} onClick={() => setMode('draw')}>Draw curve</button>
          <button className={mode === 'tag' ? 'on' : ''} onClick={() => setMode('tag')}>Add tag</button>
        </div>
        <select className="field-input compact" value={tagType} onChange={(e) => setTagType(e.target.value)} disabled={mode !== 'tag'}>
          {STORY_DYNAMICS_TAG_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
        </select>
        <input className="field-input compact axis-input" value={graph.xLabel} onChange={(e) => commit({ ...graph, xLabel: e.target.value }, 'story-dynamics:x-label')} aria-label="X axis label" />
        <input className="field-input compact axis-input" value={graph.yLabel} onChange={(e) => commit({ ...graph, yLabel: e.target.value }, 'story-dynamics:y-label')} aria-label="Y axis label" />
        <button className="ghost" onClick={deleteSelected} disabled={!selected}>Delete selected</button>
        <button className="ghost" onClick={() => commit({ ...graph, curves: [] })}>Clear curves</button>
        <button className="ghost" onClick={() => { commit(cloneDefaultStoryDynamicsGraph()); setSelected(null); }}>Reset graph</button>
      </div>

      <div className="dynamics-stage">
        <svg
          ref={svgRef}
          className={`dynamics-chart ${mode === 'tag' ? 'tag-mode' : 'draw-mode'}`}
          viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
          role="img"
          aria-label="Story dynamics chart with emotional intensity on the Y axis and player journey on the X axis"
          onPointerDown={onChartPointerDown}
          onPointerMove={onChartPointerMove}
          onPointerUp={onChartPointerUp}
          onPointerCancel={onChartPointerUp}
        >
          <rect className="dynamics-plot-bg" x={CHART.x} y={CHART.y} width={CHART.w} height={CHART.h} rx="6" />
          {grid.map((tick) => {
            const x = CHART.x + (tick / 100) * CHART.w;
            const y = CHART.y + (tick / 100) * CHART.h;
            return (
              <g key={tick}>
                <line className="dynamics-grid" x1={x} y1={CHART.y} x2={x} y2={CHART.y + CHART.h} />
                <line className="dynamics-grid" x1={CHART.x} y1={y} x2={CHART.x + CHART.w} y2={y} />
              </g>
            );
          })}
          <line className="dynamics-axis" x1={CHART.x} y1={CHART.y + CHART.h} x2={CHART.x + CHART.w} y2={CHART.y + CHART.h} />
          <line className="dynamics-axis" x1={CHART.x} y1={CHART.y} x2={CHART.x} y2={CHART.y + CHART.h} />
          <text className="dynamics-axis-label" x={CHART.x + CHART.w / 2} y={CHART.y + CHART.h + 48}>{graph.xLabel}</text>
          <text className="dynamics-axis-label" transform={`translate(${CHART.x - 48} ${CHART.y + CHART.h / 2}) rotate(-90)`}>{graph.yLabel}</text>
          <text className="dynamics-tick" x={CHART.x - 16} y={CHART.y + 4}>High</text>
          <text className="dynamics-tick" x={CHART.x - 16} y={CHART.y + CHART.h + 4}>Low</text>

          {graph.curves.map((curve) => (
            <path
              key={curve.id}
              className={`dynamics-curve${selected?.kind === 'curve' && selected.id === curve.id ? ' selected' : ''}`}
              d={pointsToPath(curve.points)}
              stroke={curve.color}
              onPointerDown={(event) => { event.stopPropagation(); setSelected({ kind: 'curve', id: curve.id }); }}
              onDoubleClick={(event) => addPointToCurve(event, curve)}
            />
          ))}
          {selectedCurve && selectedCurve.points.map((point, idx) => {
            const p = pointToSvg(point);
            const isEnd = idx === 0 || idx === selectedCurve.points.length - 1;
            return (
              <circle
                key={`${selectedCurve.id}-${idx}`}
                className={`dynamics-handle${isEnd ? ' end' : ''}`}
                cx={p.x}
                cy={p.y}
                r={isEnd ? 8 : 6}
                fill={selectedCurve.color}
                onPointerDown={(event) => beginCurvePointDrag(event, selectedCurve, idx)}
              >
                <title>{isEnd ? 'Drag curve end' : 'Drag curve point'}</title>
              </circle>
            );
          })}
          {draftPoints.length > 1 && (
            <path className="dynamics-draft" d={pointsToPath(draftPoints)} />
          )}

          {graph.tags.map((tag) => {
            const p = pointToSvg(tag);
            const w = tagWidth(tag.label);
            return (
              <g
                key={tag.id}
                className={`dynamics-tag${selected?.kind === 'tag' && selected.id === tag.id ? ' selected' : ''}`}
                transform={`translate(${p.x} ${p.y})`}
                onPointerDown={(event) => beginTagDrag(event, tag)}
                onDoubleClick={(event) => { event.stopPropagation(); editTag(tag); }}
              >
                <rect x={-w / 2} y="-17" width={w} height="34" rx="17" fill={tag.color} />
                <text x="0" y="4" textAnchor="middle">{tag.label}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="statusbar">
        <span>{mode === 'draw' ? 'Click a curve to show draggable handles; drag handles to reshape it. Double-click a curve to add a new point.' : 'Click the graph to place a tag; drag tags to reposition them.'}</span>
        {selectedTag && <span>Selected tag: {selectedTag.label}</span>}
        {selectedCurve && <span>Selected curve: {selectedCurve.label}</span>}
      </div>
    </div>
  );
}
