import { describe, expect, it } from 'vitest';
import { PLOT_STRUCTURES, storyDirection, storyPlanningPreview, storyPlanningTargets, storyPlanningRefKey, updateStoryPlanning } from './storyPlanning.js';
import { makeEmptyProject, migrateProject } from '../data/seed.js';
import { reducer } from '../state/reducer.js';
import { undoableReducer } from '../state/store.jsx';
import { storyBeatDetails, storyBeatPatch, storyBeatReviewText, detachStoryBeatLinks } from './storyBeat.js';
import { CSV_SCHEMAS } from '../data/csvSchemas.js';
import { parseCsv, toCsv } from './csv.js';
import { storyTrackToStructure, importStory } from '../state/bridge.js';

describe('optional story direction and guided plot boards', () => {
  it('offers complete 12-stage and compact 6/5-stage structures with focused original questions', () => {
    expect(PLOT_STRUCTURES.map(row => row.stages.length)).toEqual([12, 6, 5]);
    for (const structure of PLOT_STRUCTURES) {
      expect(new Set(structure.stages.map(row => row.id)).size).toBe(structure.stages.length);
      for (const stage of structure.stages) expect(stage.questions.length).toBeGreaterThan(1);
    }
  });
  it('inherits direction per field and distinguishes an intentional blank override from inheritance', () => {
    const story = { themes: ['Loyalty vs truth'], tones: ['Winter night'] };
    expect(storyDirection({}, story)).toEqual(story);
    expect(storyDirection({ themes: [], tones: ['Festival', 'Festival', ' Custom '], extra: 'keep' }, story)).toEqual({ themes: [], tones: ['Festival', 'Custom'] });
    expect(storyDirection({ themes: undefined }, story).themes).toEqual(story.themes);
    const game = { ...makeEmptyProject('Original'), masterNodes: { A: { id: 'A', kind: 'masterAct', title: 'An Act', storyDirection: { themes: ['A custom idea'], tones: [] } } } };
    const saved = storyTrackToStructure(game, 'LIB-PLAN', 'Reusable Acts');
    expect(saved.nodes.S1.storyDirection).toEqual(game.masterNodes.A.storyDirection);
    const imported = importStory({ stories: { 'LIB-PLAN': saved } }, makeEmptyProject('New game'), 'LIB-PLAN');
    expect(imported.nodes[imported.createdId].storyDirection).toEqual(game.masterNodes.A.storyDirection);
  });
  it('retains each template’s answers and links across switches without moving acts or rewriting other prose', () => {
    const game = { ...makeEmptyProject('Plan'), masterNodes: { A: { id: 'A', kind: 'masterAct', title: 'Opening', x: 70, body: 'Keep this writing.' } } };
    let next = reducer(game, { type: 'PATCH_STORY_PLANNING', change: { structure: 'journey12', stage: 'ordinary', question: 'life', value: 'A winter market.' } });
    next = reducer(next, { type: 'PATCH_STORY_PLANNING', change: { activeStructure: 'event6' } });
    next = reducer(next, { type: 'PATCH_STORY_PLANNING', change: { structure: 'event6', stage: 'ground', question: 'normal', value: 'A festival.' } });
    next = reducer(next, { type: 'PATCH_STORY_PLANNING', change: { activeStructure: 'journey12' } });
    next = reducer(next, { type: 'PATCH_STORY_PLANNING', change: { structure: 'journey12', stage: 'ordinary', link: { coll: 'masterNodes', parentPath: [], nodeId: 'A', title: 'Opening' } } });
    expect(storyPlanningPreview(next.meta.storyPlanning)[0].passages[0].answer).toBe('A winter market.');
    expect(next.meta.storyPlanning.plans.event6.answers.ground.normal).toBe('A festival.');
    expect(next.masterNodes).toEqual(game.masterNodes);
    expect(migrateProject(JSON.parse(JSON.stringify(next))).meta.storyPlanning).toEqual(next.meta.storyPlanning);
    expect(game.meta.storyPlanning).toBeUndefined();
  });
  it('groups typing for Undo and keeps separate answers and template switches undoable', () => {
    const before = makeEmptyProject('Undo');
    let history = { present: before, past: [] };
    for (const value of ['A', 'A market']) history = undoableReducer(history, { type: 'PATCH_STORY_PLANNING', change: { structure: 'journey12', stage: 'ordinary', question: 'life', value } });
    expect(history.past).toHaveLength(1);
    history = undoableReducer(history, { type: 'PATCH_STORY_PLANNING', change: { activeStructure: 'event6' } });
    history = undoableReducer(history, { type: 'UNDO' });
    expect(history.present.meta.storyPlanning.activeStructure).toBe('journey12');
    expect(history.present.meta.storyPlanning.plans.journey12.answers.ordinary.life).toBe('A market');
    expect(undoableReducer(history, { type: 'UNDO' }).present).toEqual(before);
  });
  it('finds nested beats and acts with unique references while excluding mechanics and other node kinds', () => {
    const game = { masterNodes: { A: { id: 'A', kind: 'masterAct', title: 'Opening', sub: { nodes: { B: { id: 'B', kind: 'storyBeat', title: 'Nested' }, M: { id: 'M', kind: 'event', mechKind: 'action' } } } } }, nodes: { B: { id: 'B', kind: 'quest', title: 'Root' }, C: { id: 'C', kind: 'character' } } };
    const targets = storyPlanningTargets(game);
    expect(targets).toHaveLength(3);
    expect(new Set(targets.map(storyPlanningRefKey)).size).toBe(3);
    expect(targets.find(row => row.title === 'Nested').parentPath).toEqual(['A']);
    expect(updateStoryPlanning({}, { structure: 'unknown', stage: 'x', question: 'x', value: 'bad' }).plans).toEqual({});
  });
});

describe('Story Beat impact and threads', () => {
  it('retains custom tags, player threads, authoring issues and payoff notes through template copying and CSV', () => {
    const node = { id: 'B', kind: 'storyBeat', title: 'The warning', body: 'Original prose.', storyBeat: { sections: [], impacts: ['Foreshadows a later event', ' Custom impact ', 'Custom impact'], threads: [{ id: 'T', title: 'Who sent it?', kind: 'story', status: 'revealed', notes: 'Players find the seal.', resolution: 'The missing courier.' }, { id: 'I', title: 'Two incompatible dates', kind: 'inconsistency', status: 'open' }] } };
    expect(storyBeatDetails(node).impacts).toEqual(['Foreshadows a later event', 'Custom impact']);
    const patched = { ...node, ...storyBeatPatch(node, { objective: 'Find the sender.' }) };
    expect(patched.storyBeat.threads).toEqual(node.storyBeat.threads);
    expect(detachStoryBeatLinks(patched).storyBeat.threads).toEqual(node.storyBeat.threads);
    expect(storyBeatReviewText(patched)).toContain('Authoring issue · open: Two incompatible dates');
    const rows = CSV_SCHEMAS.nodes.toRows({ ...makeEmptyProject('CSV'), nodes: { B: patched } });
    const parsed = parseCsv(toCsv(CSV_SCHEMAS.nodes.headers, rows)).rows[0];
    expect(CSV_SCHEMAS.nodes.fromRow(parsed, makeEmptyProject('Reload'), () => {}).storyBeat).toEqual(patched.storyBeat);
    expect(node.body).toBe('Original prose.');
  });
});
