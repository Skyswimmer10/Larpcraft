import { describe, expect, it } from 'vitest';
import { narrativeSubnodeSummary } from './narrativeSubnodes.js';
import { narrativeTeamIds, narrativeTeamLabel } from './teamLane.js';
import { makeEmptyProject, SUBNODE_BLANK, SUBNODE_TYPES } from '../data/seed.js';
import { reducer } from '../state/reducer.js';
import { undoableReducer } from '../state/store.jsx';

describe('narrative support card values and assignments', () => {
  it('shows edited values, including zero, on the canvas without treating a blank current value as zero', () => {
    const card = { ...SUBNODE_BLANK('V', 'value'), initialValue: '3', currentValue: 0, maxValue: '10' };
    expect(narrativeSubnodeSummary(card)).toBe('Initial: 3 · Current: 0 · Max: 10');
    expect(narrativeSubnodeSummary({ ...card, currentValue: '', maxValue: '' })).toBe('Initial: 3');
    expect(narrativeSubnodeSummary({ kind: 'value' })).toBe('No values set');
  });

  it('uses optional attached Team Lane cards, supports Shared, and preserves older direct assignments when detached', () => {
    const beat = { id: 'B', kind: 'storyBeat', teamId: 'OLD' }, teams = { OLD: { name: 'Old team', color: 'red' }, A: { name: 'Steamraven', color: 'blue' } };
    const lane = { ...SUBNODE_BLANK('L', 'teamLane'), teamId: 'A', parentRef: { nodeId: 'B' } };
    expect(SUBNODE_TYPES.teamLane.category).toBe('supporting');
    expect(SUBNODE_TYPES.teamLane.attachesTo).toContain('storyBeat');
    expect(narrativeTeamIds(beat, {})).toEqual(['OLD']);
    expect(narrativeTeamLabel(beat, teams, { L: lane })).toEqual({ name: 'Steamraven', color: 'blue' });
    expect(narrativeTeamLabel(beat, teams, { L: { ...lane, teamId: null } })).toBeNull();
    expect(narrativeTeamIds(beat, { L: { ...lane, parentRef: null } })).toEqual(['OLD']);
    expect(narrativeSubnodeSummary(lane, teams)).toBe('Steamraven');
    expect(narrativeSubnodeSummary({ ...lane, teamId: null }, teams)).toBe('Shared · all teams');
  });

  it('retains assignments and value edits through save-shaped JSON and Undo without rewriting the parent beat', () => {
    const game = { ...makeEmptyProject('Support cards'), nodes: { B: { id: 'B', kind: 'storyBeat', title: 'Crisis' } }, subnodes: { V: SUBNODE_BLANK('V', 'value'), L: { ...SUBNODE_BLANK('L', 'teamLane'), parentRef: { nodeId: 'B' } } } };
    const changed = reducer(game, { type: 'BATCH', actions: [
      { type: 'UPDATE_ENTITY', coll: 'subnodes', id: 'V', patch: { initialValue: '3', currentValue: '2' } },
      { type: 'UPDATE_ENTITY', coll: 'subnodes', id: 'L', patch: { teamId: 'A' } },
    ] });
    const reopened = JSON.parse(JSON.stringify(changed));
    expect(narrativeTeamIds(reopened.nodes.B, reopened.subnodes)).toEqual(['A']);
    expect(narrativeSubnodeSummary(reopened.subnodes.V)).toContain('Current: 2');
    expect(reopened.nodes.B).toEqual(game.nodes.B);
    let history = { present: reopened, past: [], undoGroup: null };
    history = undoableReducer(history, { type: 'UPDATE_ENTITY', coll: 'subnodes', id: 'L', patch: { parentRef: null } });
    expect(narrativeTeamIds(history.present.nodes.B, history.present.subnodes)).toEqual([]);
    history = undoableReducer(history, { type: 'UNDO' });
    expect(narrativeTeamIds(history.present.nodes.B, history.present.subnodes)).toEqual(['A']);
  });
});
