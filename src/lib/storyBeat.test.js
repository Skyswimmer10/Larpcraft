import { describe, expect, it, vi } from 'vitest';
import { BASE_NODE_TYPES, BASE_KINDS, NARRATIVE_KINDS, makeEmptyProject, migrateProject } from '../data/seed.js';
import { isStoryBeat, storyBeatDetails, storyBeatPatch, storyBeatSectionPatch, storyBeatCanvasText, storyBeatMechanics, storyBeatMechanicKey } from './storyBeat.js';
import { importNarrative, importStory, narrativeToStructNode } from '../state/bridge.js';
import { buildNarrativeLinkInsertion } from './narrativeLinks.js';
import { CSV_SCHEMAS } from '../data/csvSchemas.js';
import { parseCsv, toCsv } from './csv.js';

const beat = { id: 'B', kind: 'storyBeat', title: 'Water crisis', body: 'The well is poisoned.', storyBeat: {
  sections: ['situation', 'objective', 'dialogue', 'gameplay'], situation: 'Villagers fall ill.', consequences: 'The village needs help.', objective: 'Restore clean water.', completion: 'Safe water flows again.', dialogue: 'Please help us.\nWe are running out of time.', gameplay: 'Compare samples and operate the purifier.',
  conversationIds: ['TALK'], mechanicRefs: [{ coll: 'taskNodes', parentPath: ['TASK'], nodeId: 'M', title: 'Purifier' }],
} };

describe('flexible Story Beat', () => {
  it('offers one Story Beat in base palettes and retains legacy lookup support', () => {
    const choices = Object.values(BASE_NODE_TYPES).map(type => type.id);
    expect(choices).toContain('storyBeat'); expect(choices).not.toContain('event'); expect(choices).not.toContain('quest');
    expect(BASE_NODE_TYPES.event.label).toBe('Story Beat'); expect(BASE_NODE_TYPES.quest.label).toBe('Story Beat');
    expect(BASE_KINDS).toEqual(expect.arrayContaining(['storyBeat', 'event', 'quest']));
    expect(NARRATIVE_KINDS).toContain('storyBeat');
  });

  it('works with no sections and adds both situation and objective inside the same record', () => {
    let node = { id: 'B', kind: 'storyBeat', title: 'Water crisis', body: 'The well is poisoned.' };
    expect(storyBeatDetails(node).sections).toEqual([]);
    node = { ...node, ...storyBeatSectionPatch(node, 'situation', true) };
    node = { ...node, ...storyBeatPatch(node, { situation: 'The water turns green.' }) };
    node = { ...node, ...storyBeatSectionPatch(node, 'objective', true) };
    node = { ...node, ...storyBeatPatch(node, { objective: 'Restore the supply.' }) };
    expect(node.kind).toBe('storyBeat'); expect(node.sub).toBeUndefined();
    expect(storyBeatDetails(node).sections).toEqual(['situation', 'objective']);
    expect(storyBeatCanvasText(node)).toContain('Situation / change: The water turns green.');
    expect(storyBeatCanvasText(node)).toContain('Objective: Restore the supply.');
    expect(node.body).toBe('The well is poisoned.');
  });

  it('hides and restores sections without deleting writing, links or other information', () => {
    const before = JSON.stringify(beat);
    const hidden = { ...beat, ...storyBeatSectionPatch(beat, 'objective', false) };
    expect(storyBeatCanvasText(hidden)).not.toContain('Restore clean water.');
    expect(hidden.storyBeat.objective).toBe('Restore clean water.');
    const restored = { ...hidden, ...storyBeatSectionPatch(hidden, 'objective', true) };
    expect(storyBeatCanvasText(restored)).toContain('Restore clean water.');
    expect(restored.storyBeat.mechanicRefs).toEqual(beat.storyBeat.mechanicRefs);
    expect(JSON.stringify(beat)).toBe(before);
  });

  it.each(['event', 'quest'])('adapts a saved %s without rewriting its identity, connections or text', kind => {
    const node = { id: 'OLD', kind, title: 'Existing moment', body: 'Keep this prose.', conceptId: 'C', conceptAnswers: { detail: 'An existing answer' }, itemId: 'PROP', x: 50, y: 60 };
    const game = { ...makeEmptyProject('Legacy'), nodes: { OLD: node }, edges: [{ from: 'OLD', to: 'OTHER' }] };
    const reopened = migrateProject(game);
    expect(reopened.nodes.OLD).toEqual(node);
    expect(reopened.edges).toEqual(game.edges);
    expect(isStoryBeat(node)).toBe(true);
    expect(storyBeatDetails(node).sections).toEqual(kind === 'event' ? ['situation'] : ['objective']);
  });

  it('round-trips all sections through node and structure library imports, detaching game links', () => {
    const record = { id: 'LIB-B', name: beat.title, nodeKind: 'storyBeat', template: beat };
    const lib = { narrative: { 'LIB-B': record }, stories: { S: { nodes: { B: { ...beat, x: 10, y: 20 } }, edges: [] } } };
    const game = makeEmptyProject('Another game');
    const single = importNarrative(lib, game, 'LIB-B');
    const structure = importStory(lib, game, 'S');
    const linked = buildNarrativeLinkInsertion(lib, { type: 'narrative', id: 'LIB-B' }, {});
    for (const node of [single.nodes[single.createdId], structure.nodes[structure.createdId], narrativeToStructNode(record, {}, 0, 0), linked]) {
      expect(node.storyBeat).toEqual({ ...beat.storyBeat, conversationIds: [], mechanicRefs: [] });
      expect(node.body).toBe(beat.body);
    }
    expect(record.template.storyBeat.conversationIds).toEqual(['TALK']);
  });

  it('distinguishes nested mechanics with matching IDs without creating or moving them', () => {
    const project = { taskNodes: { A: { id: 'A', kind: 'task', title: 'Investigation', sub: { nodes: { M: { id: 'M', mechKind: 'action', title: 'Take a sample' } } } }, M: { id: 'M', mechKind: 'rule', title: 'Purifier rule' } } };
    const records = storyBeatMechanics(project);
    expect(new Set(records.map(storyBeatMechanicKey)).size).toBe(3);
    expect(records.find(ref => ref.title === 'Take a sample').parentPath).toEqual(['A']);
  });

  it('preserves all optional writing in CSV, including quotes and multiline readouts', () => {
    const game = { ...makeEmptyProject('CSV'), nodes: { B: beat } };
    const rows = CSV_SCHEMAS.nodes.toRows(game);
    const parsed = parseCsv(toCsv(CSV_SCHEMAS.nodes.headers, rows)).rows[0];
    const warn = vi.fn();
    expect(CSV_SCHEMAS.nodes.fromRow(parsed, game, warn)).toMatchObject({ kind: 'storyBeat', storyBeat: beat.storyBeat });
    expect(warn).not.toHaveBeenCalled();
    expect(CSV_SCHEMAS.nodes.fromRow({ ...parsed, storyBeat: '{broken' }, game, warn).storyBeat).toBeUndefined();
    expect(warn).toHaveBeenCalled();
    expect(CSV_SCHEMAS.nodes.fromRow({ ...parsed, storyBeat: '' }, game, warn).storyBeat).toBeUndefined();
  });
});
