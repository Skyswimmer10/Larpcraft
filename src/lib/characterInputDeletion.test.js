import { describe, expect, it } from 'vitest';
import { FRAMEWORK_TYPES, makeEmptyProject } from '../data/seed.js';
import { createWizardNode, appendWizardResult } from './narrativeWizard.js';
import { characterSources, characterWizardRecords, characterProfilePatch, removeCharacterInput, characterInputSnapshot, characterExport, syncCharacterProfile, CHARACTER_INPUT_LABEL } from './characterProfile.js';
import { undoableReducer } from '../state/store.jsx';
import { reducer } from '../state/reducer.js';

const make = (id, text, source = FRAMEWORK_TYPES.fate) => createWizardNode({ id, title: 'Moro', source, type: 'framework', focus: 'character', questions: [{ key: 'trait', prompt: 'What do they notice?' }], answers: { trait: text } });
const graph = node => ({ ...makeEmptyProject(), nodes: { C: node } });

describe('deleting character inputs', () => {
  it('deletes only the selected session, its questions and tree, and restores everything with one undo', () => {
    const first = make('C', 'They notice bells.'), second = make('SECOND', 'They notice footsteps.');
    let node = appendWizardResult(appendWizardResult(first, second), make('NLP', 'They compare details.', FRAMEWORK_TYPES.nlpMetaModel));
    const record = characterWizardRecords(node).find(record => record.sessionId === 'SECOND:wizard');
    const childId = record.attachedChildId;
    node = { ...node, sub: { ...node.sub, nodes: { ...node.sub.nodes, CUSTOM: { id: 'CUSTOM', kind: 'comment', body: 'An independent note.' } }, edges: [{ from: childId, to: 'CUSTOM' }] } };
    const original = graph(node), initial = { present: original, past: [] };
    const changed = undoableReducer(initial, { type: 'REMOVE_CHARACTER_INPUT', scope: { coll: 'nodes' }, id: 'C', key: 'wizard:SECOND:wizard' });
    const after = changed.present.nodes.C;
    expect(characterWizardRecords(after).map(record => record.sessionId)).toEqual(['C:wizard', 'NLP:wizard']);
    expect(after.questions.some(question => Object.values(record.questionIds).includes(question.id))).toBe(false);
    expect(after.sub.nodes[childId]).toBeUndefined(); expect(after.sub.edges).toEqual([]);
    expect(after.sub.nodes.CUSTOM.body).toBe('An independent note.');
    expect(after.body).toContain('bells'); expect(after.body).toContain('compare details'); expect(after.body).not.toContain('footsteps');
    expect(characterExport(after, changed.present, 'ai', { includeQuestions: true })).not.toContain('footsteps');
    expect(syncCharacterProfile(after, changed.present)).toEqual(after);
    expect(undoableReducer(changed, { type: 'UNDO' }).present).toEqual(original);
  });

  it('removes an excluded source and its protected passage while retaining independent facts, images and writing', () => {
    let node = make('C', 'They notice bells.');
    const key = characterSources(node)[0].key, block = node.characterProfile.blocks.find(block => block.key === key);
    node = characterProfilePatch(node, {}, { excluded: [key], blocks: [{ ...block, text: 'A hand-edited source passage.' }], baseline: 'Independent background.' });
    node = { ...node, image: { dataUrl: 'data:image/png;base64,picture' }, characterFacts: { age: '41' } };
    const after = removeCharacterInput(node, {}, key);
    expect(characterWizardRecords(after)).toEqual([]); expect(after.narrativeWizard).toBeUndefined();
    expect(after.characterProfile.blocks.some(block => block.key === key)).toBe(false);
    expect(after.body).toBe('Independent background.'); expect(after.characterProfile.excluded).toEqual([]);
    expect(after.image).toEqual(node.image); expect(after.characterFacts).toEqual(node.characterFacts);
    const manual = characterProfilePatch(make('C', 'They notice bells.'), {}, { manualDescription: 'An introduction.\n\nThey notice bells.\n\nAn independent ending.' });
    expect(removeCharacterInput(manual, {}, 'wizard:C:wizard').body).toBe('An introduction.\n\nAn independent ending.');
  });

  it('removes a linked contribution and edge without deleting the original source or another character using it', () => {
    const source = { id: 'S', kind: 'concept', title: 'Promise', body: 'They protect travellers.' };
    const node = characterProfilePatch({ id: 'C', kind: 'character', body: '' }, { nodes: { S: source } }, { links: [{ nodeId: 'S', snapshot: characterInputSnapshot(source) }] });
    const other = { ...node, id: 'OTHER' };
    const state = { ...graph(node), nodes: { C: node, OTHER: other, S: source }, edges: [{ from: 'S', to: 'C', label: CHARACTER_INPUT_LABEL }, { from: 'S', to: 'OTHER', label: CHARACTER_INPUT_LABEL }] };
    const after = reducer(state, { type: 'REMOVE_CHARACTER_INPUT', scope: { coll: 'nodes' }, id: 'C', key: 'node:S' });
    expect(after.nodes.S).toEqual(source); expect(after.nodes.OTHER).toEqual(other);
    expect(after.nodes.C.body).toBe(''); expect(characterSources(after.nodes.C, after)).toEqual([]);
    expect(after.edges).toEqual([{ from: 'S', to: 'OTHER', label: CHARACTER_INPUT_LABEL }]);
  });

  it('uses nested graph scope and clears only drafts tied to the removed session', () => {
    const node = make('C', 'They notice bells.');
    const state = { ...graph(node), masterNodes: { ACT: { id: 'ACT', kind: 'masterAct', sub: { nodes: { C: node }, edges: [] } } }, fateWizardDrafts: {
      nested: { workspace: { targetId: 'C', sessionId: 'C:wizard', scopeKey: JSON.stringify({ coll: 'masterNodes', path: ['ACT'] }) } },
      top: { workspace: { targetId: 'C', sessionId: 'C:wizard', scopeKey: JSON.stringify({ coll: 'nodes', path: [] }) } },
    } };
    const after = reducer(state, { type: 'REMOVE_CHARACTER_INPUT', scope: { coll: 'masterNodes', parentPath: ['ACT'] }, id: 'C', key: 'wizard:C:wizard' });
    expect(after.masterNodes.ACT.sub.nodes.C.narrativeWizard).toBeUndefined();
    expect(after.nodes.C).toEqual(node); expect(Object.keys(after.fateWizardDrafts)).toEqual(['top']);
    expect(reducer(after, { type: 'GRAPH_UPDATE_NODE', scope: { coll: 'masterNodes', parentPath: ['ACT'] }, id: 'C', patch: { title: 'Renamed' } }).masterNodes.ACT.sub.nodes.C.body).not.toContain('bells');
  });

  it('cleans up older questionnaires without saved question ID maps', () => {
    const node = make('C', 'They notice bells.');
    node.narrativeWizard = { ...node.narrativeWizard, questionIds: {} };
    const after = removeCharacterInput(node, {}, 'wizard:C:wizard');
    expect(after.questions.some(question => question.answer === 'They notice bells.')).toBe(false);
    expect(after.body).not.toContain('bells');
  });
});
