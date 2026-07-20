import { describe, expect, it } from 'vitest';
import { makeProjectSeed } from '../data/seed.js';
import { undoableReducer } from './store.jsx';

const init = () => ({ present: makeProjectSeed(), past: [], undoGroup: null });

describe('complete graph undo', () => {
  it('reverses a complete node drag in one undo step', () => {
    let state = init();
    const node = state.present.nodes['N-BRIEF'];
    const start = { x: node.x, y: node.y };

    state = undoableReducer(state, { type: 'UPDATE_ENTITY', coll: 'nodes', id: node.id, patch: { x: start.x + 10, y: start.y + 5 } });
    state = undoableReducer(state, { type: 'UPDATE_ENTITY', coll: 'nodes', id: node.id, patch: { x: start.x + 80, y: start.y + 40 } });

    expect(state.past).toHaveLength(1);
    expect(state.present.nodes[node.id]).toMatchObject({ x: start.x + 80, y: start.y + 40 });
    state = undoableReducer(state, { type: 'UNDO' });
    expect(state.present.nodes[node.id]).toMatchObject(start);
  });

  it('keeps separate drags as separate undo steps', () => {
    let state = init();
    const node = state.present.nodes['N-BRIEF'];
    const startX = node.x;
    state = undoableReducer(state, { type: 'UPDATE_ENTITY', coll: 'nodes', id: node.id, patch: { x: startX + 20 } });
    state = undoableReducer(state, { type: 'END_UNDO_GROUP' });
    state = undoableReducer(state, { type: 'UPDATE_ENTITY', coll: 'nodes', id: node.id, patch: { x: startX + 60 } });
    state = undoableReducer(state, { type: 'UNDO' });
    expect(state.present.nodes[node.id].x).toBe(startX + 20);
  });

  it('moves and restores a selected node group as one action', () => {
    let state = init();
    const ids = ['N-BRIEF', 'N-S7'];
    const starts = Object.fromEntries(ids.map((id) => [id, { x: state.present.nodes[id].x, y: state.present.nodes[id].y }]));
    const move = (offset, undoGroup) => ({
      type: 'BATCH',
      undoGroup,
      actions: ids.map((id) => ({
        type: 'UPDATE_ENTITY',
        coll: 'nodes',
        id,
        patch: { x: starts[id].x + offset, y: starts[id].y + offset },
      })),
    });

    state = undoableReducer(state, move(10, 'group-drag-1'));
    state = undoableReducer(state, move(60, 'group-drag-1'));
    expect(state.past).toHaveLength(1);
    ids.forEach((id) => expect(state.present.nodes[id]).toMatchObject({ x: starts[id].x + 60, y: starts[id].y + 60 }));

    state = undoableReducer(state, { type: 'UNDO' });
    ids.forEach((id) => expect(state.present.nodes[id]).toMatchObject(starts[id]));
  });

  it('restores Story Dynamics curves and tags', () => {
    let state = init();
    const original = state.present.storyDynamicsGraph;
    const changed = { ...original, curves: [], tags: [] };
    state = undoableReducer(state, { type: 'SET_STORY_DYNAMICS_GRAPH', graph: changed });
    expect(state.present.storyDynamicsGraph).toEqual(changed);
    state = undoableReducer(state, { type: 'UNDO' });
    expect(state.present.storyDynamicsGraph).toEqual(original);
  });
});
