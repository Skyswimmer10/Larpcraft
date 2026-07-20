import { describe, it, expect } from 'vitest';
import { reducer, locateGraph } from './reducer.js';
import { makeProjectSeed, makeEmptyProject, migrateProject } from '../data/seed.js';
import { cloneDefaultStoryDynamicsGraph } from '../data/storyDynamics.js';

const seed = () => makeProjectSeed();

describe('located graphs', () => {
  it('locateGraph reaches the surface task flow and a task sub-graph', () => {
    const s = seed();
    const top = locateGraph(s, { coll: 'taskNodes' });
    expect(Object.keys(top.nodes).length).toBeGreaterThan(0);
    const sub = locateGraph(s, { coll: 'taskNodes', parentId: 'TSK-4' });
    expect(Object.keys(sub.nodes).length).toBeGreaterThan(0); // ball-in-net detail
  });

  it('locateGraph reaches a narrative node sub-graph', () => {
    const sub = locateGraph(seed(), { coll: 'nodes', parentId: 'N-BRIEF' });
    expect(Object.keys(sub.nodes).length).toBe(3);
  });
});

describe('GRAPH_* editing on the surface task flow', () => {
  const scope = { coll: 'taskNodes' };
  it('adds, moves, connects and deletes task nodes', () => {
    let s = reducer(seed(), { type: 'GRAPH_ADD_NODE', scope, node: { id: 'TSK-X', kind: 'task', title: 'New', x: 5, y: 5 } });
    expect(s.taskNodes['TSK-X']).toBeTruthy();
    s = reducer(s, { type: 'GRAPH_UPDATE_NODE', scope, id: 'TSK-X', patch: { x: 99, y: 40 } });
    expect(s.taskNodes['TSK-X'].x).toBe(99);
    s = reducer(s, { type: 'GRAPH_ADD_EDGE', scope, from: 'TSK-1', to: 'TSK-X', label: 'go' });
    expect(s.taskEdges.some((e) => e.from === 'TSK-1' && e.to === 'TSK-X')).toBe(true);
    s = reducer(s, { type: 'GRAPH_DELETE_NODE', scope, id: 'TSK-X' });
    expect(s.taskNodes['TSK-X']).toBeUndefined();
    // deleting a node removes its edges
    expect(s.taskEdges.some((e) => e.to === 'TSK-X')).toBe(false);
  });

  it('rejects self-loops and duplicate edges', () => {
    let s = reducer(seed(), { type: 'GRAPH_ADD_EDGE', scope, from: 'TSK-1', to: 'TSK-1' });
    const before = s.taskEdges.length;
    s = reducer(s, { type: 'GRAPH_ADD_EDGE', scope, from: 'TSK-1', to: 'TSK-2' }); // already exists in seed
    expect(s.taskEdges.length).toBe(before);
  });

  it('rewires an existing located-graph relationship without duplicating it', () => {
    let s = reducer(seed(), { type: 'GRAPH_ADD_EDGE', scope, from: 'TSK-1', to: 'TSK-2', fromSide: 'top', toSide: 'bottom' });
    expect(s.taskEdges.find((e) => e.from === 'TSK-1' && e.to === 'TSK-2')).toMatchObject({ fromSide: 'top', toSide: 'bottom' });
    expect(s.taskEdges.filter((e) => e.from === 'TSK-1' && e.to === 'TSK-2')).toHaveLength(1);
  });

  it('allows located graph nodes to connect to title markers', () => {
    let s = reducer(seed(), { type: 'GRAPH_ADD_TITLE_MARKER', scope, marker: { id: 'TTL-X', text: 'Task group', x: 500, y: 80, fontSize: 28 } });
    s = reducer(s, { type: 'GRAPH_ADD_EDGE', scope, from: 'TSK-1', to: 'TTL-X', fromSide: 'bottom', toSide: 'top' });
    expect(s.taskEdges.find((e) => e.from === 'TSK-1' && e.to === 'TTL-X')).toMatchObject({ fromSide: 'bottom', toSide: 'top' });
    s = reducer(s, { type: 'GRAPH_DELETE_TITLE_MARKER', scope, id: 'TTL-X' });
    expect(s.taskEdges.some((e) => e.to === 'TTL-X')).toBe(false);
  });

  it('clears the current located graph nodes, edges, frames, and alignments', () => {
    const s = reducer(seed(), { type: 'GRAPH_CLEAR', scope });
    expect(s.taskNodes).toEqual({});
    expect(s.taskEdges).toEqual([]);
    expect(s.taskFrames).toEqual({});
    expect(s.taskNumberMarkers).toEqual({});
    expect(s.taskTitleMarkers).toEqual({});
    expect(s.alignments).toEqual([]);
  });

  it('adds, moves, and deletes visual number markers without creating nodes', () => {
    let s = reducer(seed(), { type: 'GRAPH_ADD_NUMBER_MARKER', scope, marker: { id: 'NUM-1', value: 1, x: 20, y: 30, color: '#E8D25C' } });
    expect(s.taskNumberMarkers['NUM-1']).toMatchObject({ value: 1, x: 20, y: 30 });
    expect(s.taskNodes['NUM-1']).toBeUndefined();
    s = reducer(s, { type: 'GRAPH_UPDATE_NUMBER_MARKER', scope, id: 'NUM-1', patch: { x: 55, value: 2 } });
    expect(s.taskNumberMarkers['NUM-1']).toMatchObject({ value: 2, x: 55 });
    s = reducer(s, { type: 'GRAPH_DELETE_NUMBER_MARKER', scope, id: 'NUM-1' });
    expect(s.taskNumberMarkers['NUM-1']).toBeUndefined();
  });

  it('adds, moves, and deletes visual title markers without creating nodes', () => {
    let s = reducer(seed(), { type: 'GRAPH_ADD_TITLE_MARKER', scope, marker: { id: 'TTL-1', text: 'Phase One', x: 25, y: 35, fontSize: 30, color: '#E9EBF3' } });
    expect(s.taskTitleMarkers['TTL-1']).toMatchObject({ text: 'Phase One', x: 25, y: 35, fontSize: 30 });
    expect(s.taskNodes['TTL-1']).toBeUndefined();
    s = reducer(s, { type: 'GRAPH_UPDATE_TITLE_MARKER', scope, id: 'TTL-1', patch: { x: 60, text: 'Phase Two' } });
    expect(s.taskTitleMarkers['TTL-1']).toMatchObject({ text: 'Phase Two', x: 60 });
    s = reducer(s, { type: 'GRAPH_DELETE_TITLE_MARKER', scope, id: 'TTL-1' });
    expect(s.taskTitleMarkers['TTL-1']).toBeUndefined();
  });
});

describe('story dynamics chart editing', () => {
  it('stores curves and tags as an independent chart, not a node graph', () => {
    const chart = cloneDefaultStoryDynamicsGraph();
    chart.tags = [...chart.tags, { id: 'TAG-X', type: 'note', label: 'Afterglow', x: 94, y: 24, color: '#8B92A6' }];
    const s = reducer(seed(), { type: 'SET_STORY_DYNAMICS_GRAPH', graph: chart });
    expect(s.storyDynamicsGraph.tags.some((tag) => tag.id === 'TAG-X')).toBe(true);
    expect(s.storyDynamicsGraph.curves.length).toBeGreaterThan(0);
    expect(s.storyDynamicsNodes).toBeUndefined();
  });
});

describe('GRAPH_* editing inside a nested sub-graph', () => {
  const scope = { coll: 'taskNodes', parentId: 'TSK-2' };
  it('writes into the parent task .sub without touching the surface', () => {
    let s = reducer(seed(), { type: 'GRAPH_ADD_NODE', scope, node: { id: 'D9', kind: 'effect', title: 'Smoke', x: 8, y: 8 } });
    expect(s.taskNodes['TSK-2'].sub.nodes['D9']).toBeTruthy();
    // surface graph untouched
    expect(s.taskNodes['TSK-2'].kind).toBe('task');
    s = reducer(s, { type: 'GRAPH_UPDATE_EDGE', scope, from: 'D1', to: 'D2', patch: { label: 'changed' } });
    expect(s.taskNodes['TSK-2'].sub.edges.find((e) => e.from === 'D1' && e.to === 'D2').label).toBe('changed');
    s = reducer(s, { type: 'GRAPH_UPDATE_EDGE', scope, from: 'D1', to: 'D2', patch: { fromSide: 'top', toSide: 'bottom' } });
    expect(s.taskNodes['TSK-2'].sub.edges.find((e) => e.from === 'D1' && e.to === 'D2')).toMatchObject({ fromSide: 'top', toSide: 'bottom' });
  });

  it('creates .sub on a node that had none', () => {
    const s0 = makeEmptyProject('g');
    let s = reducer(s0, { type: 'GRAPH_ADD_NODE', scope: { coll: 'taskNodes' }, node: { id: 'T1', kind: 'task', title: 'T', x: 0, y: 0 } });
    s = reducer(s, { type: 'GRAPH_ADD_NODE', scope: { coll: 'taskNodes', parentId: 'T1' }, node: { id: 'D1', kind: 'rule', title: 'r', x: 0, y: 0 } });
    expect(s.taskNodes['T1'].sub.nodes['D1']).toBeTruthy();
  });

  it('clears only the nested graph at the current path', () => {
    const s = reducer(seed(), { type: 'GRAPH_CLEAR', scope });
    expect(s.taskNodes['TSK-2']).toBeTruthy();
    expect(s.taskNodes['TSK-2'].sub.nodes).toEqual({});
    expect(s.taskNodes['TSK-2'].sub.edges).toEqual([]);
    expect(s.taskNodes['TSK-1']).toBeTruthy();
  });
});

describe('migrateProject backfills the task graph', () => {
  it('older saves gain empty taskNodes/taskEdges', () => {
    const old = makeProjectSeed();
    delete old.taskNodes; delete old.taskEdges;
    const m = migrateProject(old);
    expect(m.taskNodes).toEqual({});
    expect(m.taskEdges).toEqual([]);
    expect(m.nodes['N-BRIEF']).toBeTruthy(); // content preserved
  });

  it('removes the legacy node-based story dynamics graph during migration', () => {
    const old = makeProjectSeed();
    old.storyDynamicsNodes = { DYN: { id: 'DYN', kind: 'dynamicsMoment' } };
    old.storyDynamicsEdges = [{ from: 'DYN', to: 'DYN2' }];
    const m = migrateProject(old);
    expect(m.storyDynamicsNodes).toBeUndefined();
    expect(m.storyDynamicsEdges).toBeUndefined();
    expect(m.storyDynamicsGraph.curves.length).toBeGreaterThan(0);
  });
});
