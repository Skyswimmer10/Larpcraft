import { describe, it, expect } from 'vitest';
import { prepareMasterAct } from './masterAct.js';
import { reducer, locateGraph } from '../state/reducer.js';

describe('master act lanes', () => {
  it('preserves existing act contents and reuses lanes when reopened', () => {
    const original = { id: 'A', sub: { nodes: { old: { id: 'old' } }, edges: [] } };
    const patch = prepareMasterAct(original);
    expect(patch.sub.nodes.old).toEqual(original.sub.nodes.old);
    expect(original.sub.nodes).toEqual({ old: { id: 'old' } });
    expect(prepareMasterAct({ ...original, ...patch })).toEqual(patch);
  });
  it('keeps nested story and mechanics edits isolated and survives a file round trip', () => {
    const act = { id: 'A', ...prepareMasterAct({ id: 'A' }) };
    let state = { masterNodes: { A: act }, masterEdges: [] };
    const story = { coll: 'masterNodes', parentPath: ['A', act.actLanes.story] };
    const mechanics = { coll: 'masterNodes', parentPath: ['A', act.actLanes.mechanics] };
    state = reducer(state, { type: 'GRAPH_ADD_NODE', scope: story, node: { id: 'C', kind: 'concept', sub: { nodes: {}, edges: [] } } });
    state = reducer(state, { type: 'GRAPH_ADD_NODE', scope: mechanics, node: { id: 'M', kind: 'mechanicSubnode' } });
    const inner = { ...story, parentPath: [...story.parentPath, 'C'] };
    state = reducer(state, { type: 'GRAPH_ADD_NODE', scope: inner, node: { id: 'E', kind: 'event' } });
    state = JSON.parse(JSON.stringify(state));
    expect(Object.keys(locateGraph(state, story).nodes)).toEqual(['C']);
    expect(Object.keys(locateGraph(state, mechanics).nodes)).toEqual(['M']);
    expect(Object.keys(locateGraph(state, inner).nodes)).toEqual(['E']);
  });
});
